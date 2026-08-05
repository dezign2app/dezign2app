import { ChatGroq } from "@langchain/groq";
import { RunnableConfig } from "@langchain/core/runnables";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  SystemMessage,
  AIMessage,
  BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import {
  GraphAnnotation,
  DEFAULT_REQUIREMENTS,
  DEFAULT_PLAN,
  ImplementationPlanState,
} from "../state";
import { tools } from "../tools";
import { systemPromptTemplate } from "../prompts";
import { getConvexClient, formatCanvasState } from "../utils";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { sanitizeMessages } from "./utils";

export function createAgentNodes(llm: ChatGroq) {
  const modelWithTools = llm.bindTools(tools);

  const customToolNode = async (state: typeof GraphAnnotation.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (
      !lastMessage ||
      !("tool_calls" in lastMessage) ||
      !Array.isArray((lastMessage as AIMessage).tool_calls) ||
      (lastMessage as AIMessage).tool_calls!.length === 0
    ) {
      return { messages: [] };
    }

    const numCalls = (lastMessage as AIMessage).tool_calls!.length;
    const toolNode = new ToolNode(tools);
    const result = await toolNode.invoke(
      { messages: [lastMessage] },
      { configurable: { state } },
    );
    return { ...result, toolCallCount: numCalls };
  };

  const intentIdentifier = async (
    state: typeof GraphAnnotation.State,
    config: RunnableConfig,
  ) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || lastMessage.type !== "human") return {};

    const conversationContext = state.messages
      .slice(-6)
      .map(
        (m: BaseMessage) =>
          `${m.type.toUpperCase()}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`,
      )
      .join("\n\n");

    const existing = state.requirements ?? DEFAULT_REQUIREMENTS;
    const plan = state.implementationPlan ?? DEFAULT_PLAN;

    const gateContext =
      existing.status !== "confirmed"
        ? `The assistant is currently gathering requirements and may have just asked clarifying
questions. Determine "readyForRequirementsSync": true if the user's latest message
sufficiently answers those questions, or explicitly says to proceed / use assumptions.
Otherwise false.`
        : plan.status === "proposed" ||
            plan.status === "schema_built" ||
            plan.status === "nodes_built"
          ? `The assistant just proposed an architecture stage (plan, schema, or nodes) and is awaiting approval.
Determine "planDecision": "approve" if the user accepts it (e.g. "looks good", "proceed",
"build it"), "revise" if they want changes to the plan, or "not_applicable" if their message
doesn't address the approval at all.`
          : "";

    const intentPrompt = new SystemMessage(
      `Analyze the user's latest message in the context of the recent conversation and determine the intent.
Available Intents:
- CREATE_SYSTEM: The user wants to build a new system architecture from scratch.
- EDIT_SYSTEM: The user wants to modify the existing system (add nodes, delete nodes, connect nodes, update schema, add services, add Kafka topics, add edges, or describes any system changes in any format including diagrams, tables, or specs).
- CHAT: The user is ONLY asking a pure question or making a trivial comment that does NOT involve any system change whatsoever.

Also determine "affectsRequirements": true only if the message introduces a NEW capability,
feature, scale target, or constraint that is NOT already covered by the confirmed requirements
below. Cosmetic/structural canvas edits (renames, repositioning, styling) are always false.
Answers to clarifying questions or plan-approval replies are also false (handled separately).

${gateContext}

Confirmed Requirements So Far:
Functional: ${existing.functional.join("; ") || "none yet"}
Non-Functional: ${existing.nonFunctional.join("; ") || "none yet"}

Return ONLY JSON, no prose, no markdown fences:
{
  "intent": "CREATE_SYSTEM" | "EDIT_SYSTEM" | "CHAT",
  "affectsRequirements": boolean,
  "readyForRequirementsSync": boolean,
  "planDecision": "approve" | "revise" | "not_applicable"
}

Recent Conversation Context:
${conversationContext}`,
    );

    console.log("[DEBUG] Node: intentIdentifier invoking LLM");
    const response = await llm.invoke([intentPrompt], config);

    let intent = "CHAT";
    let affectsRequirements = false;
    let readyForRequirementsSync = false;
    let planDecision: "approve" | "revise" | "not_applicable" =
      "not_applicable";
    try {
      const cleaned = response.content
        .toString()
        .replace(/```json|```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      intent = parsed.intent ?? "CHAT";
      affectsRequirements = Boolean(parsed.affectsRequirements);
      readyForRequirementsSync = Boolean(parsed.readyForRequirementsSync);
      if (
        parsed.planDecision === "approve" ||
        parsed.planDecision === "revise"
      ) {
        planDecision = parsed.planDecision;
      }
    } catch {
      intent = response.content.toString().trim();
    }

    const update: Partial<typeof GraphAnnotation.State> = {
      intent,
      readyForRequirementsSync,
      planDecision,
    };

    if (affectsRequirements && existing.status === "confirmed") {
      update.requirements = { ...existing, status: "pending" };
      update.implementationPlan = { ...plan, status: "none" };
    }

    return update;
  };

  const chatAgent = async (
    state: typeof GraphAnnotation.State,
    config: RunnableConfig,
  ) => {
    const systemMsg = new SystemMessage(
      `You are a concise system architecture assistant. The user is asking a quick question — answer in 1-3 sentences max. Do NOT write essays, lists, bullet points, code snippets, or long explanations. Do NOT use tools. Base your answers on the current canvas state: ${state.canvasStateContext ?? "Canvas is empty."}`,
    );
    console.log("[DEBUG] Node: chatAgent invoking LLM");
    const response = await llm.invoke(
      [systemMsg, ...sanitizeMessages(state.messages)],
      config,
    );
    return { messages: [response] };
  };

  const canvasAgent = async (
    state: typeof GraphAnnotation.State,
    config: RunnableConfig,
  ) => {
    const systemMsg = new SystemMessage(
      systemPromptTemplate(
        state.canvasStateContext ?? "",
        state.requirements,
        state.implementationPlan,
      ),
    );
    console.log("[DEBUG] Node: canvasAgent invoking modelWithTools");
    const response = await modelWithTools.invoke(
      [systemMsg, ...state.messages],
      config,
    );
    return { messages: [response] };
  };

  const reflectAgent = async (
    state: typeof GraphAnnotation.State,
    config: RunnableConfig,
  ) => {
    const recentToolMsgs = state.messages
      .slice(-10)
      .filter((m) => m.type === "tool");
    const hasFailure = recentToolMsgs.some(
      (m) => typeof m.content === "string" && m.content.startsWith("Failed to"),
    );

    const plan = state.implementationPlan ?? DEFAULT_PLAN;
    const convex = getConvexClient(state);
    const currentElements = await convex.query(api.canvas.getBackendElements, {
      projectId: state.projectId as Id<"projects">,
    });
    const currentCanvasState = formatCanvasState(currentElements);

    const stageClosingInstruction =
      plan.status === "approved"
        ? `\n\nSTAGE CLOSING: If everything for the schema stage is complete (no more tool calls needed), end your response with a short, friendly question asking the user to approve the schema or request any changes before you proceed to building the service nodes and graph. Example: "Does the schema look good to you, or would you like any changes before I proceed to building the service nodes?"`
        : plan.status === "schema_approved"
          ? `\n\nSTAGE CLOSING: If everything for the nodes stage is complete (no more tool calls needed), end your response with a short, friendly question asking the user to approve the nodes or request any changes before you proceed to connecting them. Example: "Do the service nodes look correct, or would you like any adjustments before I proceed to wiring up the connections?"`
          : plan.status === "nodes_approved"
            ? `\n\nSTAGE CLOSING: If all edges have been added and everything looks connected, end your response with a short summary confirming the architecture is complete and ask if there is anything the user would like to adjust.`
            : "";

    const reflectionPrompt = new HumanMessage(
      hasFailure
        ? `Some of your last tool calls failed. Review the tool error messages below, correct the parameters, and retry ONLY the failed operations using your tools. If the error is DUPLICATE_EDGE, it means the connection already exists and you can ignore it and stop. If a database connection is missing, NEVER use update_node to create it: use add_edge with the existing service node ID, db_ref node ID, sourceHandle="endpoints-out-{endpointId}", targetHandle="database-target", and type="connection". If you cannot fix an error, explain briefly and stop. DO NOT hallucinate tools like 'add_entity' - use 'add_single_schema' instead. DO NOT hallucinate tools like 'add_external', 'add_sqs', or 'add_redis' - use the general 'add_node' tool for those.\n\nRecent tool results:\n${recentToolMsgs
            .map((m) => m.content)
            .join("\n")}`
        : `Review the tool results below against the user's original request AND the approved
implementation plan (technology choices, services, endpoints, messaging infra it called for).
Ensure you only evaluate what is required for the CURRENT STAGE (as defined in the system prompt).
If everything required for the current stage has been built or already exists on the canvas, respond with a brief confirmation summary and do NOT call any tools. 
If something required for the current stage is still missing from BOTH the recent tool results AND the current canvas state, call the appropriate tool(s) to add it.

CRITICAL: DO NOT hallucinate tools like 'add_entity'. If you need to add a schema/entity, use the 'add_single_schema' tool. For 'external', 'sqs', 'redis', nodes, you MUST use the general 'add_node' tool. DO NOT hallucinate 'add_external', 'add_sqs', etc.

CRITICAL: Make sure nodes are actually connected! If you just created nodes, you must now use their IDs from the tool results below to call the 'add_edge' tool and connect them together. 
- You MUST connect WebClient events to Service endpoints.
- You MUST connect Service endpoints to Database references (db_ref) if the service reads/writes data (use sourceHandle="endpoints-out-{id}" and targetHandle="database-target").
- You MUST connect database entities to establish foreign keys using the 'add_schema_edge' tool. Do NOT use 'add_edge' for foreign keys.
- When the user reports disconnected tables, treat that as a repair operation: inspect every service endpoint and existing connection, then issue one add_edge call for each missing endpoint→db_ref relationship. Do not call update_node just to create an edge.
Pay close attention to the generated IDs for endpoints and events to properly set sourceHandle and targetHandle.
When adding a database reference using 'add_db_ref_node', you MUST provide the 'tableRef' parameter containing the node ID of the target schema/entity it references.

Current Canvas State:
        ${currentCanvasState}

Approved Implementation Plan:
${plan.content || "none"}

Recent tool results:
${recentToolMsgs.map((m) => m.content).join("\n")}${stageClosingInstruction}`,
    );

    const systemMsg = new SystemMessage(
      systemPromptTemplate(
        state.canvasStateContext ?? "",
        state.requirements,
        state.implementationPlan,
      ),
    );

    console.log("[DEBUG] Node: reflectAgent invoking modelWithTools");
    const response = await modelWithTools.invoke(
      [systemMsg, ...state.messages, reflectionPrompt],
      config,
    );
    type AgentUpdate = {
      messages: BaseMessage[];
      implementationPlan?: ImplementationPlanState;
    };
    const update: AgentUpdate = { messages: [response] };

    const hasNewToolCalls =
      response.tool_calls && response.tool_calls.length > 0;
    if (!hasNewToolCalls) {
      type ValidStatus =
        | "proposed"
        | "approved"
        | "schema_built"
        | "schema_approved"
        | "nodes_built"
        | "nodes_approved"
        | "edges_built";
      let nextStatus: ValidStatus | "none" = plan.status;

      if (plan.status === "approved") {
        nextStatus = "schema_built";
      } else if (plan.status === "schema_approved") {
        nextStatus = "nodes_built";
      } else if (plan.status === "nodes_approved") {
        nextStatus = "edges_built";
      }

      if (nextStatus !== plan.status && nextStatus !== "none") {
        const nextPlan: ImplementationPlanState = {
          ...plan,
          status: nextStatus,
        };
        update.implementationPlan = nextPlan;

        if (state.projectId && state.convexUrl) {
          try {
            const convex = getConvexClient(state);
            await convex.mutation(api.requirements.upsertPlan, {
              projectId: state.projectId,
              content: nextPlan.content,
              status: nextStatus,
            });
          } catch (error) {
            console.error(
              `[DEBUG] Error upserting plan (${nextStatus}):`,
              error,
            );
          }
        }
      }
    }

    return update;
  };

  return {
    customToolNode,
    intentIdentifier,
    chatAgent,
    canvasAgent,
    reflectAgent,
  };
}

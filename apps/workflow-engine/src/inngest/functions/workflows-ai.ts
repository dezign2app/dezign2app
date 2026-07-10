import { inngest } from "../client";
import { getConvexClient } from "../../ai-agent/convex-client";
import { api } from "@workspace/backend/_generated/api";
import { redis } from "../../lib/redis";
import { getAIModel } from "../../lib/ai-model";
import { Id } from "@workspace/backend/_generated/dataModel";

const aiModel = getAIModel();

// ─── Shared types ────────────────────────────────────────────────────────────

interface WorkflowNodeProposal {
  id: string;
  type: string;
  label?: string;
  config?: Record<string, unknown>;
}

interface WorkflowEdgeProposal {
  source: string;
  target: string;
  kind?: "default" | "true" | "false";
}

interface ExistingWorkflowData {
  workflow: { name: string };
  nodes: Array<{
    nodeKey: string;
    type: string;
    label?: string;
    config: unknown;
    positionX: number;
    positionY: number;
  }>;
  edges: Array<{
    edgeKey: string;
    sourceNodeKey: string;
    targetNodeKey: string;
    kind?: string;
  }>;
}

// ─── Targeted action types ────────────────────────────────────────────────────

type TargetedAction =
  | { op: "update_node"; nodeKey: string; config?: Record<string, unknown>; label?: string; type?: string }
  | { op: "add_node"; nodeKey: string; type: string; label?: string; config?: Record<string, unknown>; positionX?: number; positionY?: number }
  | { op: "remove_node"; nodeKey: string }
  | { op: "upsert_edge"; edgeKey: string; source: string; target: string; kind?: "default" | "true" | "false"; sourceHandle?: string; targetHandle?: string }
  | { op: "remove_edge"; edgeKey: string };

interface TargetedEditResponse {
  editType: "targeted";
  actions: TargetedAction[];
  confirmationText?: string;
}

interface FullEditResponse {
  editType: "full";
  title: string;
  nodes: WorkflowNodeProposal[];
  edges: WorkflowEdgeProposal[];
  confirmationText?: string;
}

type AIEditResponse = TargetedEditResponse | FullEditResponse;

// ─── Helper: auto-position a new node relative to existing ones ───────────────

function computeNewNodePosition(
  existingNodes: ExistingWorkflowData["nodes"],
  index = 0,
): { positionX: number; positionY: number } {
  if (existingNodes.length === 0) {
    return { positionX: 300, positionY: 250 };
  }
  const maxX = Math.max(...existingNodes.map((n) => n.positionX));
  return { positionX: maxX + 280, positionY: 250 + (index % 2 === 0 ? 0 : -120) };
}

// ─── Inngest function ─────────────────────────────────────────────────────────

export const handleWorkflowAction = inngest.createFunction(
  { id: "handle-workflow-action", name: "Handle Workflow Action" },
  { event: "workflow/action.requested" },
  async ({ event, step }) => {
    const {
      userMessage,
      sessionToken,
      conversationId,
      streamKey,
      workflowId,
      isBuildMode,
      thinkingContent,
      clientMessageId,
    } = event.data as {
      userMessage: string;
      sessionToken: string;
      conversationId?: string;
      streamKey?: string;
      workflowId?: string;
      isBuildMode?: boolean;
      thinkingContent?: string;
      clientMessageId?: string;
    };

    const client = getConvexClient(sessionToken);

    // ── 1. Fetch existing workflow data ───────────────────────────────────────
    let existingWorkflowData: ExistingWorkflowData | null = null;
    if (workflowId) {
      existingWorkflowData = await step.run("get-existing-workflow", async () => {
        try {
          return await client.query(api.workflows.crud.getWorkflowEditorData, {
            workflowId: workflowId as Id<"workflows">,
          }) as unknown as ExistingWorkflowData;
        } catch (e) {
          console.error("Failed to fetch existing workflow:", e);
          return null;
        }
      });
    }

    // ── 2. Ask the LLM what kind of edit this is ─────────────────────────────
    const editPlan = await step.run("plan-workflow-edit", async (): Promise<AIEditResponse> => {
      const existingContext = existingWorkflowData
        ? `
CURRENT WORKFLOW STATE:
- Nodes: ${JSON.stringify(
            existingWorkflowData.nodes.map((n) => ({
              nodeKey: n.nodeKey,
              type: n.type,
              label: n.label,
              config: n.config,
            })),
          )}
- Edges: ${JSON.stringify(
            existingWorkflowData.edges.map((e) => ({
              edgeKey: e.edgeKey,
              source: e.sourceNodeKey,
              target: e.targetNodeKey,
              kind: e.kind,
            })),
          )}`
        : "";

      const prompt = `You are an expert workflow designer.

Available Node Types:
- start: Config: { triggerType: "manual" | "cron", cronExpression?, timezone? }
- llm: Config: { provider: "openai" | "gemini", model: "gpt-4" | "gemini-1.5-pro", systemPrompt, prompt, outputMode: "text" | "json", temperature: 0.0-1.0 }
- api: Config: { url, method: "GET" | "POST", headers, query, body, authType: "none" | "bearer" | "basic" }
- condition: Config: { leftOperand, operator: "equals" | "not_equals" | "contains" | "gt" | "lt", rightOperand }
- end: Config: { resultExpression }

Constraints:
- Always include exactly one "start" node and at least one "end" node.
- For "condition" nodes, provide exactly two outgoing edges: kind "true" and kind "false".
- For all other nodes use kind "default".
- Use "{{prev.output}}" to reference the previous node's output.
${existingContext}

User Request: "${userMessage}"

DECISION:
- If the user is making SIMPLE, TARGETED changes (edit config of 1-2 nodes, add or remove a single node/edge, rename a node) → use editType "targeted".
- If the user is making STRUCTURAL changes (redesign the whole flow, add multiple nodes, rewire everything) → use editType "full".

For "targeted" editType, produce a minimal list of actions. Do NOT recreate the entire workflow.
For "full" editType, produce the complete desired node and edge lists.

Return ONLY valid JSON in ONE of these two formats:

TARGETED FORMAT:
{
  "editType": "targeted",
  "actions": [
    { "op": "update_node", "nodeKey": "node_key_here", "config": { ...only changed fields... }, "label": "optional new label" },
    { "op": "add_node", "nodeKey": "new_unique_key", "type": "llm", "config": { ... } },
    { "op": "remove_node", "nodeKey": "node_key_here" },
    { "op": "upsert_edge", "edgeKey": "unique_edge_key", "source": "node_a", "target": "node_b", "kind": "default" },
    { "op": "remove_edge", "edgeKey": "edge_key_here" }
  ],
  "confirmationText": "Brief description of what changed"
}

FULL FORMAT:
{
  "editType": "full",
  "title": "Short descriptive title",
  "nodes": [
    { "id": "node_0", "type": "start" },
    { "id": "node_1", "type": "llm", "config": { "provider": "openai", "model": "gpt-4", "prompt": "..." } },
    { "id": "node_2", "type": "end" }
  ],
  "edges": [
    { "source": "node_0", "target": "node_1" },
    { "source": "node_1", "target": "node_2" }
  ],
  "confirmationText": "Brief description of the workflow"
}`;

      const response = await aiModel.invoke([{ role: "user", content: prompt }]);
      const text = response.content as string;
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned) as AIEditResponse;
    });

    // ── 3. Stream a thinking message ──────────────────────────────────────────
    const appendedThinking = await step.run("stream-thinking", async () => {
      let msg: string;
      if (editPlan.editType === "targeted") {
        const opSummary = editPlan.actions
          .map((a) => {
            if (a.op === "update_node") return `updating \`${a.nodeKey}\``;
            if (a.op === "add_node") return `adding \`${a.nodeKey}\` (${a.type})`;
            if (a.op === "remove_node") return `removing \`${a.nodeKey}\``;
            if (a.op === "upsert_edge") return `connecting \`${a.source}\` → \`${a.target}\``;
            return `removing edge \`${a.edgeKey}\``;

          })
          .join(", ");
        msg = `🎯 **Targeted edit:** ${opSummary}\n\n`;
      } else {
        const dynamicFlow = editPlan.nodes.map((n) => `\`${n.type}\``).join(" ➔ ");
        msg = `⚡ **Proposed Flow:** ${dynamicFlow}\n\n`;
      }

      if (streamKey) {
        await redis.rpush(streamKey, JSON.stringify({ type: "thinking", content: msg }));
      }
      return msg;
    });

    const finalThinkingContent = (thinkingContent ? thinkingContent + "\n\n" : "") + appendedThinking;

    // ── 4. Apply the changes ──────────────────────────────────────────────────
    const result = await step.run("apply-workflow-changes", async () => {
      try {
        if (editPlan.editType === "targeted") {
          // ── Targeted path: surgical per-document mutations ─────────────────
          if (!workflowId) {
            return { success: false as const, error: "Targeted edits require an existing workflow ID." };
          }

          let addNodeIndex = 0;
          for (const action of editPlan.actions) {
            if (action.op === "update_node") {
              await client.mutation(api.workflows.crud.updateNodeConfig, {
                workflowId: workflowId as Id<"workflows">,
                nodeKey: action.nodeKey,
                ...(action.config !== undefined && { config: action.config }),
                ...(action.label !== undefined && { label: action.label }),
                ...(action.type !== undefined && { type: action.type }),
              });
            } else if (action.op === "add_node") {
              const pos = computeNewNodePosition(
                existingWorkflowData?.nodes ?? [],
                addNodeIndex++,
              );
              await client.mutation(api.workflows.crud.addNode, {
                workflowId: workflowId as Id<"workflows">,
                nodeKey: action.nodeKey,
                type: action.type,
                label: action.label,
                positionX: action.positionX ?? pos.positionX,
                positionY: action.positionY ?? pos.positionY,
                config: action.config ?? {},
              });
            } else if (action.op === "remove_node") {
              await client.mutation(api.workflows.crud.removeNode, {
                workflowId: workflowId as Id<"workflows">,
                nodeKey: action.nodeKey,
              });
            } else if (action.op === "upsert_edge") {
              const kind = (action.kind ?? "default") as "default" | "true" | "false";
              const sourceHandle =
                action.sourceHandle ??
                (kind === "true" ? "true" : kind === "false" ? "false" : "out");
              await client.mutation(api.workflows.crud.upsertEdge, {
                workflowId: workflowId as Id<"workflows">,
                edgeKey: action.edgeKey,
                sourceNodeKey: action.source,
                targetNodeKey: action.target,
                kind,
                sourceHandle,
                targetHandle: action.targetHandle ?? "in",
              });
            } else if (action.op === "remove_edge") {
              await client.mutation(api.workflows.crud.removeEdge, {
                workflowId: workflowId as Id<"workflows">,
                edgeKey: action.edgeKey,
              });
            }
          }

          return { success: true as const, workflowId: workflowId as Id<"workflows"> };
        } else {
          // ── Full path: wipe-and-replace (existing behaviour) ───────────────
          let finalWorkflowId = workflowId as Id<"workflows">;

          if (!finalWorkflowId) {
            finalWorkflowId = await client.mutation(api.workflows.crud.createWorkflow, {
              name: editPlan.title || "AI Generated Workflow",
            });
          }

          const allNodes = editPlan.nodes.map((n, i) => ({
            nodeKey: n.id,
            type: n.type,
            label: n.label || (n.type.charAt(0).toUpperCase() + n.type.slice(1)),
            positionX: 50 + i * 280,
            positionY: 250 + (i % 2 === 0 ? 0 : -120),
            config: n.config || {},
          }));

          const allEdges = editPlan.edges.map((e, i) => {
            const sourceNode = editPlan.nodes.find((n) => n.id === e.source);
            const kind = (e.kind || "default") as "default" | "true" | "false";
            let sourceHandle = "out";
            if (sourceNode?.type === "condition") {
              sourceHandle = kind === "true" ? "true" : "false";
            }
            return {
              edgeKey: `edge_${i}_${Date.now()}`,
              sourceNodeKey: e.source,
              targetNodeKey: e.target,
              sourceHandle,
              targetHandle: "in",
              kind,
            };
          });

          if (isBuildMode) {
            for (let i = 0; i < allNodes.length; i++) {
              const currentNodes = allNodes.slice(0, i + 1);
              const currentNodeKeys = new Set(currentNodes.map((node) => node.nodeKey));
              const currentEdges = allEdges.filter(
                (edge) =>
                  currentNodeKeys.has(edge.sourceNodeKey) &&
                  currentNodeKeys.has(edge.targetNodeKey),
              );
              await client.mutation(api.workflows.crud.saveDraftGraph, {
                workflowId: finalWorkflowId,
                nodes: currentNodes,
                edges: currentEdges,
              });
              if (i < allNodes.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 400));
              }
            }
          } else {
            await client.mutation(api.workflows.crud.saveDraftGraph, {
              workflowId: finalWorkflowId,
              nodes: allNodes,
              edges: allEdges,
            });
          }

          return { success: true as const, workflowId: finalWorkflowId };
        }
      } catch (err) {
        console.error("Workflow edit failed:", err);
        return {
          success: false as const,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });

    // ── 5. Stream feedback and persist AI message ─────────────────────────────
    const isUpdate = !!workflowId;
    const feedbackContent = result.success
      ? `✅ **Workflow ${isUpdate ? "Updated" : "Created"}!**\n\n${
          editPlan.confirmationText ||
          (isUpdate ? "I've updated your workflow on the canvas." : "I've created a new workflow for you.")
        }`
      : `❌ Failed to ${isUpdate ? "update" : "create"} workflow: ${result.error || "Unknown error"}`;

    await step.run("send-feedback", async () => {
      if (streamKey) {
        await redis.rpush(streamKey, JSON.stringify({ type: "chat_token", content: `\n\n${feedbackContent}` }));
        await redis.rpush(streamKey, JSON.stringify({ type: "done" }));
      }

      if (conversationId) {
        await client.mutation(api.ai.messages.insertMessage, {
          conversationId: conversationId as Id<"conversations">,
          content: feedbackContent,
          role: "AI",
          thinking: finalThinkingContent || undefined,
          clientMessageId,
        });
      }
    });

    if (result.success) {
      return { success: true, workflowId: result.workflowId };
    } else {
      return { success: false, error: result.error };
    }
  },
);

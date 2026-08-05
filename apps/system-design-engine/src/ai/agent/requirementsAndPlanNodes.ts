import { ChatGroq } from "@langchain/groq";
import { RunnableConfig } from "@langchain/core/runnables";
import { SystemMessage, BaseMessage } from "@langchain/core/messages";
import {
  GraphAnnotation,
  DEFAULT_REQUIREMENTS,
  DEFAULT_PLAN,
  ImplementationPlanState,
} from "../state";
import { getConvexClient } from "../utils";
import { api } from "@workspace/backend/_generated/api";
import { sanitizeMessages, parseRequirementsWithRetry } from "./utils";

export function createRequirementsAndPlanNodes(llm: ChatGroq) {
  const syncRequirements = async (
    state: typeof GraphAnnotation.State,
    config: RunnableConfig,
  ) => {
    const existing = state.requirements ?? {
      functional: [],
      nonFunctional: [],
      assumptions: [],
      status: "pending" as const,
    };

    const conversation = state.messages
      .slice(-12)
      .map(
        (m: BaseMessage) =>
          `${m.type}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`,
      )
      .join("\n");

    const prompt = `Existing confirmed requirements (may be empty on a first-time build):
${JSON.stringify({
  functional: existing.functional,
  nonFunctional: existing.nonFunctional,
  assumptions: existing.assumptions,
})}

Recent conversation (may include a clarifying Q&A about a new addition):
${conversation}

Return the FULL updated requirements as JSON only:
{ "functional": string[], "nonFunctional": string[], "assumptions": string[] }
Keep everything from the existing requirements that is still valid — do not drop items the
user didn't contradict. Add whatever new functional/non-functional needs or assumptions the
user just confirmed. Only remove or modify an item if the user explicitly contradicted it.

IMPORTANT — EXCLUDE the following categories entirely; do NOT add them to any field:
- Deployment/hosting details (Docker containers, VM specs, CPU/RAM sizing, managed DB config)
- Operational concerns (health-check endpoints, auto-restart policies, HTTPS termination, load-balancer config, rate-limiting at the edge, backup schedules, read replicas, uptime SLA percentages)
These are ops concerns, not architecture requirements.`;

    const parsed = await parseRequirementsWithRetry(llm, prompt, config);

    const requirements = parsed
      ? { ...parsed, status: "confirmed" as const }
      : { ...existing, status: "confirmed" as const };

    if (state.projectId && state.convexUrl) {
      try {
        const convex = getConvexClient(state);
        await convex.mutation(api.requirements.upsert, {
          projectId: state.projectId,
          ...requirements,
        });
      } catch (error) {
        console.error("[DEBUG] Error upserting requirements:", error);
      }
    }

    return { requirements };
  };

  const requirementsAgent = async (
    state: typeof GraphAnnotation.State,
    config: RunnableConfig,
  ) => {
    const req = state.requirements ?? DEFAULT_REQUIREMENTS;
    const hasBaseline =
      req.functional.length > 0 ||
      req.nonFunctional.length > 0 ||
      req.assumptions.length > 0;

    const prompt = new SystemMessage(
      hasBaseline
        ? `The user just asked for something new on top of an already-built system.

Existing Confirmed Requirements (baseline — do not lose or contradict these):
Functional: ${req.functional.join("; ")}
Non-Functional: ${req.nonFunctional.join("; ") || "none"}
Assumptions: ${req.assumptions.join("; ") || "none"}

Ask 3-4 focused clarifying questions about ONLY the new addition — its scale, how it
interacts with the existing system, and any constraints. Do not re-ask about anything
already confirmed above. Do not propose an implementation plan yet; that happens after
this. Be concise.`
        : `The user wants to design a new system. Ask 2-3 short clarifying questions about ONLY:
- What core features/actions users can perform
- Approximate number of users or expected traffic scale
- Any hard constraints (e.g. must use a specific database, real-time updates needed)
Do NOT ask about read/write ratio, ops, deployment, or infrastructure. Do not propose an implementation plan yet; that happens after this. Be concise.`,
    );

    console.log("[DEBUG] Node: requirementsAgent invoking LLM");
    const response = await llm.invoke(
      [prompt, ...sanitizeMessages(state.messages)],
      config,
    );
    return { messages: [response] };
  };

  const planAgent = async (
    state: typeof GraphAnnotation.State,
    config: RunnableConfig,
  ) => {
    const req = state.requirements ?? DEFAULT_REQUIREMENTS;
    const priorPlan = state.implementationPlan ?? DEFAULT_PLAN;
    const isRevision =
      priorPlan.status === "proposed" && priorPlan.content.length > 0;

    const prompt = new SystemMessage(
      `You are a senior software architect. ${
        isRevision
          ? "Revise the previously proposed implementation plan based on the user's latest feedback, keeping everything they did not object to."
          : "Propose an implementation plan for review."
      } This is a chat message a user will skim on their phone before approving — do NOT
call any tools, just describe it.

Confirmed Requirements:
Functional: ${req.functional.join("; ") || "none"}
Non-Functional: ${req.nonFunctional.join("; ") || "none"}
Assumptions: ${req.assumptions.join("; ") || "none"}

${isRevision ? `Previously Proposed Plan:\n${priorPlan.content}` : ""}

SCALE THE ARCHITECTURE TO THE STATED REQUIREMENTS — this overrides any default instinct
toward a "textbook" or "impressive" design:
- Infer an approximate scale tier from the requirements (e.g. DAU/traffic figures, read/write
  ratio, number of features). If no scale is given, assume small/MVP scale rather than defaulting
  to enterprise-scale patterns.
- For small scale (roughly hundreds to low tens-of-thousands of users, or whenever the
  requirements don't call for independent scaling of separate concerns): prefer a single
  monolithic service over microservices. Only split into multiple services if the
  requirements name distinct domains that need to scale, deploy, or fail independently.
- Only introduce container orchestration (Kubernetes) if the stated scale or requirements
  explicitly justify it (e.g. multi-region, elastic autoscaling, many independently-scaled
  services). Otherwise prefer a single container/VM/managed platform deployment.
- Only introduce a caching layer (Redis, CDN edge cache, etc.) if the requirements name a
  latency target or read volume that a plain database query wouldn't satisfy. Do not add
  caching "just in case."
- Only introduce message brokers/queues if the requirements involve asynchronous processing,
  fan-out, or decoupled services. Do not add messaging infra for a simple synchronous CRUD flow.
- If you are unsure whether a piece of infrastructure is justified by the requirements, leave
  it out rather than including it for completeness.

FORMAT — this is as important as the content:
- Target 200-400 words total. Hard cap 500.
- Use bullet points. You may use sub-bullets (up to two levels deep) to detail schemas and fields.
- No "why not X / alternatives considered" discussion, no generic explanations of what a
  pattern or technology is. State the choice, not the reasoning essay behind it.
- Skip any section that isn't needed for these requirements entirely (e.g. no caching
  section if nothing warrants a cache).
- Name real, specific technologies (e.g. "PostgreSQL", "Kafka"), never vague terms like
  "a suitable database".

CONTENT — cover only what applies, each as terse bullets:
- **Architecture**: one line naming the pattern (monolith/microservices/serverless/event-driven).
- **Services**: one line per service — name, tech stack, one-clause responsibility, 2-4
  representative endpoints as "METHOD /path".
- **Data storage & Schemas**: one line per store — engine + what it holds. CRITICAL: Include sub-bullets detailing the specific schemas (tables/entities/collections) and their key fields needed to satisfy the functional requirements. These will be modeled as Entity nodes.
- **Messaging** (only if needed): one line — which broker + what flows through it. Mention key event schemas/payloads.
- **Caching** (only if needed): one line — what's cached.
- **Client**: one line — framework + how it talks to the backend.

CRITICAL: Do NOT include a deployment plan, hosting details, or infrastructure operations in the architecture plan. Focus strictly on software architecture (services, schemas, APIs, brokers).

End with a single short line asking the user to approve or say what to change. Do not
restate the requirements back to them.`,
    );

    console.log("[DEBUG] Node: planAgent invoking LLM");
    const response = await llm.invoke(
      [prompt, ...sanitizeMessages(state.messages.slice(-8))],
      config,
    );
    const content = response.content.toString();
    const implementationPlan: ImplementationPlanState = {
      content,
      status: "proposed",
    };

    if (state.projectId && state.convexUrl) {
      try {
        const convex = getConvexClient(state);
        await convex.mutation(api.requirements.upsertPlan, {
          projectId: state.projectId,
          content,
          status: "proposed",
        });
      } catch (error) {
        console.error("[DEBUG] Error upserting plan (proposed):", error);
      }
    }

    return { messages: [response], implementationPlan };
  };

  const approvePlan = async (state: typeof GraphAnnotation.State) => {
    const plan = state.implementationPlan ?? DEFAULT_PLAN;
    const approved: ImplementationPlanState = { ...plan, status: "approved" };

    if (state.projectId && state.convexUrl) {
      try {
        const convex = getConvexClient(state);
        await convex.mutation(api.requirements.upsertPlan, {
          projectId: state.projectId,
          content: approved.content,
          status: "approved",
        });
      } catch (error) {
        console.error("[DEBUG] Error upserting plan (approved):", error);
      }
    }

    return { implementationPlan: approved };
  };

  const approveSchema = async (state: typeof GraphAnnotation.State) => {
    const plan = state.implementationPlan ?? DEFAULT_PLAN;
    const approved: ImplementationPlanState = {
      ...plan,
      status: "schema_approved",
    };

    if (state.projectId && state.convexUrl) {
      try {
        const convex = getConvexClient(state);
        await convex.mutation(api.requirements.upsertPlan, {
          projectId: state.projectId,
          content: approved.content,
          status: "schema_approved",
        });
      } catch (error) {
        console.error("[DEBUG] Error upserting plan (schema_approved):", error);
      }
    }

    return { implementationPlan: approved };
  };

  const approveNodes = async (state: typeof GraphAnnotation.State) => {
    const plan = state.implementationPlan ?? DEFAULT_PLAN;
    const approved: ImplementationPlanState = {
      ...plan,
      status: "nodes_approved",
    };

    if (state.projectId && state.convexUrl) {
      try {
        const convex = getConvexClient(state);
        await convex.mutation(api.requirements.upsertPlan, {
          projectId: state.projectId,
          content: approved.content,
          status: "nodes_approved",
        });
      } catch (error) {
        console.error("[DEBUG] Error upserting plan (nodes_approved):", error);
      }
    }

    return { implementationPlan: approved };
  };

  return {
    syncRequirements,
    requirementsAgent,
    planAgent,
    approvePlan,
    approveSchema,
    approveNodes,
  };
}

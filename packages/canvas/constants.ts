import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphOutputPort,
  LangGraphStepConfig,
  LangGraphEdgeConfig,
  LangGraphMemoryConfig,
  LangGraphToolDefinition,
} from "./types";

export const RULES_VERSION = 1;

// ─── Backend Canvas Main Node Types ───────────────────────────────────────────
export const BACKEND_NODE_SERVICE           = "service" as const;
export const BACKEND_NODE_DATABASE          = "database" as const;
export const BACKEND_NODE_QUEUE             = "queue" as const;
export const BACKEND_NODE_PUBSUB            = "pubsub" as const;
export const BACKEND_NODE_EVENTSTREAM       = "eventstream" as const;
export const BACKEND_NODE_KAFKA             = "kafka" as const;
export const BACKEND_NODE_REDIS_STREAMS     = "redis-streams" as const;
export const BACKEND_NODE_SQS               = "sqs" as const;
export const BACKEND_NODE_REDIS_PUBSUB      = "redis-pubsub" as const;
export const BACKEND_NODE_REDIS_CACHE       = "redis-cache" as const;
export const BACKEND_NODE_ENTITY            = "entity" as const;
export const BACKEND_NODE_WEB_CLIENT        = "webClient" as const;
export const BACKEND_NODE_EXTERNAL          = "external" as const;
export const BACKEND_NODE_GROUP             = "group" as const;
export const BACKEND_NODE_DB_REF            = "db_ref" as const;
export const BACKEND_NODE_STORAGE          = "storage" as const;
export const BACKEND_NODE_WORKER           = "worker" as const;
export const BACKEND_NODE_SERVERLESS        = "serverless" as const;
export const BACKEND_NODE_SEARCH_INDEX      = "search_index" as const;
export const BACKEND_NODE_API_GATEWAY       = "api_gateway" as const;
export const BACKEND_NODE_LOAD_BALANCER     = "load_balancer" as const;
export const BACKEND_NODE_WEBHOOK           = "webhook" as const;
export const BACKEND_NODE_LLM               = "llm" as const;
export const BACKEND_NODE_MCP_SERVER        = "mcp_server" as const;
export const BACKEND_NODE_VECTOR_DB_REF     = "vector_db_ref" as const;
export const BACKEND_NODE_IDENTITY_PROVIDER = "identity_provider" as const;
export const BACKEND_NODE_LANGGRAPH         = "langgraph" as const;
export const BACKEND_NODE_LANGGRAPH_STEP    = "langgraph_step" as const;

// ─── LangGraph Step Execution Types ───────────────────────────────────────────
export const STEP_TYPE_LLM_CALL       = "llm_call" as const;
export const STEP_TYPE_TOOL_NODE      = "tool_node" as const;
export const STEP_TYPE_EVALUATOR      = "evaluator" as const;
export const STEP_TYPE_SUMMARIZER     = "summarizer" as const;
export const STEP_TYPE_CUSTOM_CODE    = "custom_code" as const;
export const STEP_TYPE_HUMAN_GATE     = "human_gate" as const;
export const STEP_TYPE_INTERRUPT      = "interrupt" as const;
export const STEP_TYPE_VECTOR_SEARCH  = "vector_search" as const;
export const STEP_TYPE_ROUTER         = "router" as const;

// ─── Edge Target & Connection Kinds ───────────────────────────────────────────
export const TARGET_KIND_STEP = "step" as const;
export const TARGET_KIND_PORT = "port" as const;
export const TARGET_KIND_END  = "end" as const;

// ─── LLM Providers ─────────────────────────────────────────────────────────────
export const LLM_PROVIDER_GROQ      = "groq" as const;
export const LLM_PROVIDER_OPENAI    = "openai" as const;
export const LLM_PROVIDER_ANTHROPIC = "anthropic" as const;
export const LLM_PROVIDER_GOOGLE    = "google" as const;
export const LLM_PROVIDER_OLLAMA    = "ollama" as const;
export const LLM_PROVIDER_CUSTOM    = "custom" as const;
export const LLM_PROVIDER_OTHER     = "other" as const;

export const LLM_PROVIDER_OPTIONS = [
  { value: LLM_PROVIDER_GROQ, label: "Groq" },
  { value: LLM_PROVIDER_OPENAI, label: "OpenAI" },
  { value: LLM_PROVIDER_ANTHROPIC, label: "Anthropic" },
  { value: LLM_PROVIDER_GOOGLE, label: "Google" },
  { value: LLM_PROVIDER_OTHER, label: "Other" },
] as const;



export const NODE_TYPE_TO_RESOURCE_KIND: Record<string, string | undefined> = {
  kafka: "kafka",
  sqs: "sqs",
  "redis-streams": "redis-stream",
  "redis-pubsub": "redis-pubsub",
  queue: "generic-queue",
  pubsub: "generic-pubsub",
  eventstream: "generic-eventstream",
  storage: "storage",
  // New node types
  worker: "worker",
  serverless: "serverless",
  search_index: "search_index",
  api_gateway: "api_gateway",
  load_balancer: "load_balancer",
  webhook: "webhook",
  llm: "llm",
  mcp_server: "mcp_server",
  langgraph: "langgraph",
  langgraph_step: "langgraph_step",
};

export const LANGGRAPH_STARTER_TEMPLATE: {
  version: number;
  recursionLimit: number;
  stepTimeoutMs: number;
  inputChannels: LangGraphInputChannel[];
  stateChannels: LangGraphStateChannel[];
  outputPorts: LangGraphOutputPort[];
  tools: LangGraphToolDefinition[];
  graphSteps: LangGraphStepConfig[];
  graphEdges: LangGraphEdgeConfig[];
  memoryConfig: LangGraphMemoryConfig;
} = {
  version: 2,
  recursionLimit: 25,
  stepTimeoutMs: 30000,
  inputChannels: [],
  stateChannels: [
    { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
    { key: "summary", type: "string", reducer: "replace", defaultValue: "" },
    { key: "intent", type: "string", reducer: "replace", defaultValue: "" },
  ],
  outputPorts: [
    { id: "tool_call", label: "Tool Output Port" },
    { id: "human_gate", label: "Human Approval Port" },
    { id: "completed", label: "Completed Output Port" },
    { id: "error", label: "Error Output Port" },
  ],
  tools: [],
  graphSteps: [
    {
      id: "classify",
      name: "Classify Intent",
      type: "evaluator",
      modelConfig: { provider: "groq", model: "llama-3.1-8b-instant", temperature: 0 },
    },
    {
      id: "agent_llm",
      name: "Agent LLM Reasoning",
      type: "llm_call",
      modelConfig: { provider: "groq", model: "llama-3.3-70b-versatile", temperature: 0.2 },
    },
    { id: "memory_sync", name: "Memory Summarizer", type: "summarizer" },
  ],
  graphEdges: [
    { id: "e1", source: "START", targets: [{ id: "classify", kind: "step" }] },
    { id: "e2", source: "classify", targets: [{ id: "agent_llm", kind: "step" }] },
    {
      id: "e3",
      source: "agent_llm",
      targets: [{ id: "tool_call", kind: "port" }],
      condition: { field: "messages", operator: "has_tool_calls" },
    },
    {
      id: "e4",
      source: "agent_llm",
      targets: [{ id: "memory_sync", kind: "step" }],
      isDefault: true,
    },
    {
      id: "e5",
      source: "memory_sync",
      targets: [{ id: "completed", kind: "port" }],
    },
  ],
  memoryConfig: {
    checkpointer: "convex",
    threadScope: "session",
    autoSummarize: true,
    maxWindowMessages: 10,
  },
};

export const MESSAGING_RESOURCE_TYPES = [
  "topics",
  "streams",
  "queues",
  "channels",
  "caches",
  "buckets",
  "collections",
  "indexes",
  "routes",
  "targetGroups",
  "events",
  "prompts",
  "tools",
  "tasks",
] as const;

export type MessagingResourceType = typeof MESSAGING_RESOURCE_TYPES[number];

export const MESSAGING_NODE_TYPES = [
  "queue",
  "eventstream",
  "pubsub",
  "kafka",
  "redis-streams",
  "sqs",
  "redis-pubsub",
  "cache",
  "storage",
  "redis-cache", // Added to make sure we cover all cache/storage nodes
] as const;

export type MessagingNodeType = typeof MESSAGING_NODE_TYPES[number];

export interface LangGraphDataInput {
  graphSteps?: LangGraphStepConfig[];
  graphEdges?: LangGraphEdgeConfig[];
  [key: string]: unknown;
}

export function ensureLangGraphDataReachability<T extends LangGraphDataInput>(data: T): T {
  if (!data || !Array.isArray(data.graphSteps) || data.graphSteps.length === 0) {
    return data;
  }

  const steps = data.graphSteps;
  const edges: LangGraphEdgeConfig[] = Array.isArray(data.graphEdges) ? data.graphEdges : [];
  const stepIds = new Set(steps.map((s) => s.id));

  const visited = new Set<string>();
  const queue: string[] = ["START"];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);

    const outgoing = edges.filter((e) => e.source === curr);
    outgoing.forEach((e) => {
      if (e.targets && Array.isArray(e.targets)) {
        e.targets.forEach((t) => {
          if (t.kind === "step" && stepIds.has(t.id)) {
            queue.push(t.id);
          }
        });
      }
    });
  }

  const nextEdges: LangGraphEdgeConfig[] = [...edges];
  let lastReachable = "START";

  steps.forEach((step) => {
    if (!visited.has(step.id)) {
      nextEdges.push({
        id: `auto_edge_${step.id}`,
        source: lastReachable,
        targets: [{ id: step.id, kind: "step" }],
      });
      visited.add(step.id);
      lastReachable = step.id;
    } else {
      lastReachable = step.id;
    }
  });

  return {
    ...data,
    graphSteps: steps,
    graphEdges: nextEdges,
  };
}


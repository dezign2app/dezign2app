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

// ─── Sub-Canvas Handle IDs ─────────────────────────────────────────────────────
export const HANDLE_LLM_IN  = "llm_in" as const;
export const HANDLE_LLM_OUT = "llm_out" as const;

// ─── LLM Providers ─────────────────────────────────────────────────────────────
export const LLM_PROVIDERS = {
  GROQ: "groq",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
  CUSTOM: "custom",
} as const;

export const ALL_LLM_PROVIDER_VALUES = Object.values(LLM_PROVIDERS) as [
  (typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS],
  ...(typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS][]
];

export const LLM_PROVIDER_MAP = {
  [LLM_PROVIDERS.GROQ]: { value: LLM_PROVIDERS.GROQ, label: "Groq" },
  [LLM_PROVIDERS.OPENAI]: { value: LLM_PROVIDERS.OPENAI, label: "OpenAI" },
  [LLM_PROVIDERS.ANTHROPIC]: { value: LLM_PROVIDERS.ANTHROPIC, label: "Anthropic" },
  [LLM_PROVIDERS.GOOGLE]: { value: LLM_PROVIDERS.GOOGLE, label: "Google" },
  [LLM_PROVIDERS.CUSTOM]: { value: LLM_PROVIDERS.CUSTOM, label: "Custom / Other" },
} as const;

export const LLM_PROVIDER_OPTIONS = Object.values(LLM_PROVIDER_MAP);

export const LLM_PROVIDER_GROQ      = LLM_PROVIDERS.GROQ;
export const LLM_PROVIDER_OPENAI    = LLM_PROVIDERS.OPENAI;
export const LLM_PROVIDER_ANTHROPIC = LLM_PROVIDERS.ANTHROPIC;
export const LLM_PROVIDER_GOOGLE    = LLM_PROVIDERS.GOOGLE;
export const LLM_PROVIDER_CUSTOM    = LLM_PROVIDERS.CUSTOM;
export const LLM_PROVIDER_OTHER     = LLM_PROVIDERS.CUSTOM;

// ─── Default LLM Configuration Constants ─────────────────────────────────────
export const DEFAULT_LLM_PROVIDER = LLM_PROVIDERS.GROQ;
export const DEFAULT_LLM_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_LLM_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_LLM_API_KEY_ENV = "GROQ_API_KEY";
export const DEFAULT_LLM_TEMPERATURE = 0.2;



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


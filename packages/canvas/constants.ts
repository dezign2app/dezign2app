import type {
  LangGraphStepConfig,
  LangGraphEdgeConfig,
} from "./types";

export const RULES_VERSION = 1;

// ─── Backend Canvas Main Node Types ───────────────────────────────────────────
export const BACKEND_NODE_SERVICE = "service" as const;
export const BACKEND_NODE_DATABASE = "database" as const;
export const BACKEND_NODE_QUEUE = "queue" as const;
export const BACKEND_NODE_PUBSUB = "pubsub" as const;
export const BACKEND_NODE_EVENTSTREAM = "eventstream" as const;
export const BACKEND_NODE_KAFKA = "kafka" as const;
export const BACKEND_NODE_REDIS_STREAMS = "redis-streams" as const;
export const BACKEND_NODE_SQS = "sqs" as const;
export const BACKEND_NODE_REDIS_PUBSUB = "redis-pubsub" as const;
export const BACKEND_NODE_REDIS_CACHE = "redis-cache" as const;
export const BACKEND_NODE_ENTITY = "entity" as const;
export const BACKEND_NODE_WEB_CLIENT = "webClient" as const;
export const BACKEND_NODE_EXTERNAL = "external" as const;
export const BACKEND_NODE_GROUP = "group" as const;
export const BACKEND_NODE_DB_REF = "db_ref" as const;
export const BACKEND_NODE_STORAGE = "storage" as const;
export const BACKEND_NODE_WORKER = "worker" as const;
export const BACKEND_NODE_SERVERLESS = "serverless" as const;
export const BACKEND_NODE_SEARCH_INDEX = "search_index" as const;
export const BACKEND_NODE_API_GATEWAY = "api_gateway" as const;
export const BACKEND_NODE_LOAD_BALANCER = "load_balancer" as const;
export const BACKEND_NODE_WEBHOOK = "webhook" as const;
export const BACKEND_NODE_LLM = "llm" as const;
export const BACKEND_NODE_MCP_SERVER = "mcp_server" as const;
export const BACKEND_NODE_VECTOR_DB_REF = "vector_db_ref" as const;
export const BACKEND_NODE_IDENTITY_PROVIDER = "identity_provider" as const;
export const BACKEND_NODE_AUTH = "auth" as const;
export const BACKEND_NODE_PAYMENTS = "payments" as const;
export const BACKEND_NODE_LANGGRAPH = "langgraph" as const;
export const BACKEND_NODE_LANGGRAPH_STEP = "langgraph_step" as const;

// ─── Auth Framework & Better Auth Options ───────────────────────────────────────
export const AUTH_FRAMEWORK_BETTER_AUTH = "better_auth" as const;
export const AUTH_FRAMEWORK_NEXT_AUTH = "next_auth" as const;
export const AUTH_FRAMEWORK_LUCIA = "lucia" as const;
export const AUTH_FRAMEWORK_CUSTOM = "custom" as const;

export const AUTH_FRAMEWORK_OPTIONS = [
  { value: "better_auth", label: "Better Auth" }
] as const;

export const BETTER_AUTH_VERSIONS = [
  { value: "v1.7", label: "v1.7" },
] as const;

export const DEFAULT_AUTH_FRAMEWORK = AUTH_FRAMEWORK_BETTER_AUTH;
export const DEFAULT_BETTER_AUTH_VERSION = "v1.7";

// ─── Access Conditions & Protection Rule Enums ──────────────────────────────
export const CONDITION_PRIMITIVE_TYPES = [
  "auth",
  "org",
  "orgRole",
  "access",
  "subscriptionStatus",
  "plan",
  "customClaim",
] as const;

export type ConditionPrimitiveType = (typeof CONDITION_PRIMITIVE_TYPES)[number];

export const FAILURE_REASONS = [
  "no-auth",
  "no-org",
  "wrong-role",
  "no-access",
  "wrong-plan",
  "custom-denied",
] as const;

export type FailureReasonType = (typeof FAILURE_REASONS)[number];

export const SESSION_DELIVERY_MODES = ["jwt", "cookie"] as const;
export type SessionDeliveryMode = (typeof SESSION_DELIVERY_MODES)[number];

export const DEFAULT_SESSION_CLAIM_SOURCE = "customField" as const;
export const DEFAULT_SESSION_CLAIM_DELIVERY_MODE = "jwt" as const;

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "expired",
] as const;

export type SubscriptionStatusType = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENTS_INTERVALS = ["monthly", "yearly"] as const;
export type PaymentsIntervalType = (typeof PAYMENTS_INTERVALS)[number];

// ─── LangGraph Step Execution Types ───────────────────────────────────────────
export const STEP_TYPE_LLM_CALL = "llm_call" as const;
export const STEP_TYPE_TOOL_NODE = "tool_node" as const;
export const STEP_TYPE_EVALUATOR = "evaluator" as const;
export const STEP_TYPE_SUMMARIZER = "summarizer" as const;
export const STEP_TYPE_CUSTOM_CODE = "custom_code" as const;
export const STEP_TYPE_HUMAN_GATE = "human_gate" as const;
export const STEP_TYPE_INTERRUPT = "interrupt" as const;
export const STEP_TYPE_VECTOR_SEARCH = "vector_search" as const;
export const STEP_TYPE_ROUTER = "router" as const;

// ─── LangGraph Middleware Types ───────────────────────────────────────────────
export const MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP = "human_in_the_loop" as const;
export const MIDDLEWARE_TYPE_RATE_LIMIT = "rate_limit" as const;
export const MIDDLEWARE_TYPE_LOGGING_TRACING = "logging_tracing" as const;
export const MIDDLEWARE_TYPE_SUMMARIZATION = "summarization" as const;
export const MIDDLEWARE_TYPE_MODEL_CALL_LIMIT = "model_call_limit" as const;
export const MIDDLEWARE_TYPE_TOOL_CALL_LIMIT = "tool_call_limit" as const;
export const MIDDLEWARE_TYPE_MODEL_FALLBACK = "model_fallback" as const;
export const MIDDLEWARE_TYPE_PII_DETECTION = "pii_detection" as const;
export const MIDDLEWARE_TYPE_TODO_LIST = "todo_list" as const;
export const MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR = "llm_tool_selector" as const;
export const MIDDLEWARE_TYPE_TOOL_RETRY = "tool_retry" as const;
export const MIDDLEWARE_TYPE_MODEL_RETRY = "model_retry" as const;
export const MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR = "llm_tool_emulator" as const;
export const MIDDLEWARE_TYPE_CONTEXT_EDITING = "context_editing" as const;
export const MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH =
  "provider_tool_search" as const;
export const MIDDLEWARE_TYPE_FILESYSTEM = "filesystem" as const;
export const MIDDLEWARE_TYPE_SUBAGENT = "subagent" as const;
export const MIDDLEWARE_TYPE_CUSTOM = "custom" as const;

export const DEFAULT_MIDDLEWARE_TYPE = MIDDLEWARE_TYPE_SUMMARIZATION;

// ─── Edge Target & Connection Kinds ───────────────────────────────────────────
export const TARGET_KIND_STEP = "step" as const;
export const TARGET_KIND_PORT = "port" as const;
export const TARGET_KIND_END = "end" as const;

// ─── Sub-Canvas Handle IDs ─────────────────────────────────────────────────────
export const HANDLE_LLM_IN = "llm_in" as const;
export const HANDLE_LLM_OUT = "llm_out" as const;
export const HANDLE_TOOL_IN = "tool_in" as const;
export const HANDLE_TOOL_OUT = "tool_out" as const;
export const HANDLE_MIDDLEWARE_IN = "middleware_in" as const;
export const HANDLE_MIDDLEWARE_OUT = "middleware_out" as const;
export const HANDLE_MEMORY_IN = "memory_in" as const;
export const HANDLE_MEMORY_OUT = "memory_out" as const;
export const HANDLE_OUTPUT_IN = "output_in" as const;
export const HANDLE_OUTPUT_OUT = "output_out" as const;

// ─── LangGraph Canvas React Flow Node Types ────────────────────────────────────
export const LANGGRAPH_CANVAS_NODE_STEP = "step" as const;
export const LANGGRAPH_CANVAS_NODE_START = "start" as const;
export const LANGGRAPH_CANVAS_NODE_END = "end" as const;
export const LANGGRAPH_CANVAS_NODE_PORT = "port" as const;
export const LANGGRAPH_CANVAS_NODE_STATE_GLOBAL = "state_global" as const;
export const LANGGRAPH_CANVAS_NODE_LLM = "langgraph_llm" as const;
export const LANGGRAPH_CANVAS_NODE_TOOL = "langgraph_tool" as const;
export const LANGGRAPH_CANVAS_NODE_MIDDLEWARE = "langgraph_middleware" as const;
export const LANGGRAPH_CANVAS_NODE_NODE = "langgraph_node" as const;
export const LANGGRAPH_CANVAS_NODE_AGENT = "langgraph_agent" as const;
export const LANGGRAPH_CANVAS_NODE_MEMORY = "langgraph_memory" as const;
export const LANGGRAPH_CANVAS_NODE_OUTPUT = "langgraph_output" as const;

// ─── Tool Sources ─────────────────────────────────────────────────────────────
export const TOOL_SOURCE_INLINE = "inline" as const;
export const TOOL_SOURCE_MCP_SERVER = "mcp_server" as const;
export const TOOL_SOURCE_API_ENDPOINT = "api_endpoint" as const;

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
  ...(typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS][],
];

export const LLM_PROVIDER_MAP = {
  [LLM_PROVIDERS.GROQ]: { value: LLM_PROVIDERS.GROQ, label: "Groq" },
  [LLM_PROVIDERS.OPENAI]: { value: LLM_PROVIDERS.OPENAI, label: "OpenAI" },
  [LLM_PROVIDERS.ANTHROPIC]: {
    value: LLM_PROVIDERS.ANTHROPIC,
    label: "Anthropic",
  },
  [LLM_PROVIDERS.GOOGLE]: { value: LLM_PROVIDERS.GOOGLE, label: "Google" },
  [LLM_PROVIDERS.CUSTOM]: {
    value: LLM_PROVIDERS.CUSTOM,
    label: "Custom / Other",
  },
} as const;

export const LLM_PROVIDER_OPTIONS = Object.values(LLM_PROVIDER_MAP);

export const LLM_PROVIDER_GROQ = LLM_PROVIDERS.GROQ;
export const LLM_PROVIDER_OPENAI = LLM_PROVIDERS.OPENAI;
export const LLM_PROVIDER_ANTHROPIC = LLM_PROVIDERS.ANTHROPIC;
export const LLM_PROVIDER_GOOGLE = LLM_PROVIDERS.GOOGLE;
export const LLM_PROVIDER_CUSTOM = LLM_PROVIDERS.CUSTOM;
export const LLM_PROVIDER_OTHER = LLM_PROVIDERS.CUSTOM;

// ─── Default LLM Configuration Constants ─────────────────────────────────────
export const DEFAULT_LLM_PROVIDER = LLM_PROVIDERS.GROQ;
export const DEFAULT_LLM_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_LLM_BASE_URL =
  "https://api.groq.com/openai/v1/chat/completions";
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

export type MessagingResourceType = (typeof MESSAGING_RESOURCE_TYPES)[number];

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

export type MessagingNodeType = (typeof MESSAGING_NODE_TYPES)[number];

export interface LangGraphDataInput {
  graphSteps?: LangGraphStepConfig[];
  graphEdges?: LangGraphEdgeConfig[];
  [key: string]: unknown;
}

export function ensureLangGraphDataReachability<T extends LangGraphDataInput>(
  data: T,
): T {
  return data;
}

export const DEFAULT_PUBLISH_TRIGGER_CONDITION = "after-processing" as const;

export const PUBLISH_TRIGGER_CONDITIONS = [
  { value: "after-processing", label: "On Request / Processing Success" },
  { value: "before-response", label: "Before Response Sent" },
  { value: "on-state-change", label: "On State / Database Change" },
  { value: "on-error", label: "On Processing Failure / Error" },
  { value: "async-background", label: "Asynchronous Background Dispatch" },
  { value: "manual", label: "Manual Code Invocation" },
] as const;

export type PublishTriggerCondition =
  (typeof PUBLISH_TRIGGER_CONDITIONS)[number]["value"];

export const DEFAULT_PUBLISHED_EVENT_DEFAULTS = {
  payloadSchema: { id: "dummy" },
  version: "v1" as const,
  category: "DOMAIN" as const,
  delivery: "AT_LEAST_ONCE" as const,
  ordering: "NONE" as const,
  deprecated: false,
} as const;

// ─── Inter-Service Protocol ────────────────────────────────────────────────────
export const INTER_SERVICE_PROTOCOL_HTTP = "http" as const;
export const INTER_SERVICE_PROTOCOL_GRPC = "grpc" as const;

export const INTER_SERVICE_PROTOCOLS = {
  HTTP: INTER_SERVICE_PROTOCOL_HTTP,
  GRPC: INTER_SERVICE_PROTOCOL_GRPC,
} as const;

export type InterServiceProtocol =
  (typeof INTER_SERVICE_PROTOCOLS)[keyof typeof INTER_SERVICE_PROTOCOLS];

export const INTER_SERVICE_PROTOCOL_OPTIONS = [
  { value: INTER_SERVICE_PROTOCOL_HTTP, label: "HTTP / REST" },
  { value: INTER_SERVICE_PROTOCOL_GRPC, label: "gRPC" },
] as const;

export const ALL_INTER_SERVICE_PROTOCOL_VALUES = Object.values(
  INTER_SERVICE_PROTOCOLS,
) as [InterServiceProtocol, ...InterServiceProtocol[]];

export const DEFAULT_INTER_SERVICE_PROTOCOL = INTER_SERVICE_PROTOCOL_HTTP;

export const GRPC_DEFAULT_PORT = 50051 as const;


import type {
  LangGraphStepConfig,
  LangGraphEdgeConfig,
} from "../types";

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

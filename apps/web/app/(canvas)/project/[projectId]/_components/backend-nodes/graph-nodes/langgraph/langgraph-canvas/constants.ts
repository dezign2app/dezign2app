import {
  STEP_TYPE_LLM_CALL,
  STEP_TYPE_TOOL_NODE,
  STEP_TYPE_EVALUATOR,
  STEP_TYPE_SUMMARIZER,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_HUMAN_GATE,
  STEP_TYPE_INTERRUPT,
  STEP_TYPE_VECTOR_SEARCH,
  STEP_TYPE_ROUTER,
  TARGET_KIND_STEP,
  TARGET_KIND_PORT,
  TARGET_KIND_END,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  TOOL_SOURCE_INLINE,
  TOOL_SOURCE_MCP_SERVER,
  TOOL_SOURCE_API_ENDPOINT,
  LLM_PROVIDERS,
  LLM_PROVIDER_MAP,
  LLM_PROVIDER_GROQ,
  LLM_PROVIDER_OPENAI,
  LLM_PROVIDER_ANTHROPIC,
  LLM_PROVIDER_GOOGLE,
  LLM_PROVIDER_CUSTOM,
  LLM_PROVIDER_OTHER,
  LLM_PROVIDER_OPTIONS,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_BASE_URL,
  DEFAULT_LLM_API_KEY_ENV,
  DEFAULT_LLM_TEMPERATURE,
  MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP,
  MIDDLEWARE_TYPE_RATE_LIMIT,
  MIDDLEWARE_TYPE_LOGGING_TRACING,
  MIDDLEWARE_TYPE_SUMMARIZATION,
  MIDDLEWARE_TYPE_MODEL_CALL_LIMIT,
  MIDDLEWARE_TYPE_TOOL_CALL_LIMIT,
  MIDDLEWARE_TYPE_MODEL_FALLBACK,
  MIDDLEWARE_TYPE_PII_DETECTION,
  MIDDLEWARE_TYPE_TODO_LIST,
  MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR,
  MIDDLEWARE_TYPE_TOOL_RETRY,
  MIDDLEWARE_TYPE_MODEL_RETRY,
  MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR,
  MIDDLEWARE_TYPE_CONTEXT_EDITING,
  MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH,
  MIDDLEWARE_TYPE_FILESYSTEM,
  MIDDLEWARE_TYPE_SUBAGENT,
  MIDDLEWARE_TYPE_CUSTOM,
  DEFAULT_MIDDLEWARE_TYPE,
} from "@workspace/canvas/constants";

import { LLM_PROVIDER_PRESETS } from "./components/inspector/constants";

// ─── LangGraph Canvas React Flow Node Types ──────────────────────────────────────────
export const LANGGRAPH_CANVAS_NODE_STEP         = "step" as const;
export const LANGGRAPH_CANVAS_NODE_START        = "start" as const;
export const LANGGRAPH_CANVAS_NODE_PORT         = "port" as const;
export const LANGGRAPH_CANVAS_NODE_STATE_GLOBAL = "state_global" as const;
export const LANGGRAPH_CANVAS_NODE_LLM          = "langgraph_llm" as const;
export const LANGGRAPH_CANVAS_NODE_TOOL         = "langgraph_tool" as const;
export const LANGGRAPH_CANVAS_NODE_MIDDLEWARE   = "langgraph_middleware" as const;
export const LANGGRAPH_CANVAS_NODE_AGENT        = "langgraph_agent" as const;

export const HANDLE_MIDDLEWARE_IN  = "middleware_in" as const;
export const HANDLE_MIDDLEWARE_OUT = "middleware_out" as const;

// ─── Reserved LangGraph Canvas Node IDs ─────────────────────────────────────────────
export const NODE_ID_START        = "START" as const;
export const NODE_ID_STATE_GLOBAL = "STATE_GLOBAL" as const;

// ─── ID Prefixes ──────────────────────────────────────────────────────────────
export const NODE_ID_PREFIX_PORT  = "port_" as const;

// ─── Helper Functions ─────────────────────────────────────────────────────────
export function isReservedNodeId(id: string | null | undefined): boolean {
  if (!id) return false;
  return (
    id === NODE_ID_START ||
    id === NODE_ID_STATE_GLOBAL ||
    id.startsWith(NODE_ID_PREFIX_PORT)
  );
}

export function makePortNodeId(portId: string): string {
  return `${NODE_ID_PREFIX_PORT}${portId}`;
}

export function stripPortPrefix(id: string): string {
  return id.startsWith(NODE_ID_PREFIX_PORT) ? id.replace(NODE_ID_PREFIX_PORT, "") : id;
}

export {
  STEP_TYPE_LLM_CALL,
  STEP_TYPE_TOOL_NODE,
  STEP_TYPE_EVALUATOR,
  STEP_TYPE_SUMMARIZER,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_HUMAN_GATE,
  STEP_TYPE_INTERRUPT,
  STEP_TYPE_VECTOR_SEARCH,
  STEP_TYPE_ROUTER,
  MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP,
  MIDDLEWARE_TYPE_RATE_LIMIT,
  MIDDLEWARE_TYPE_LOGGING_TRACING,
  MIDDLEWARE_TYPE_SUMMARIZATION,
  MIDDLEWARE_TYPE_MODEL_CALL_LIMIT,
  MIDDLEWARE_TYPE_TOOL_CALL_LIMIT,
  MIDDLEWARE_TYPE_MODEL_FALLBACK,
  MIDDLEWARE_TYPE_PII_DETECTION,
  MIDDLEWARE_TYPE_TODO_LIST,
  MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR,
  MIDDLEWARE_TYPE_TOOL_RETRY,
  MIDDLEWARE_TYPE_MODEL_RETRY,
  MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR,
  MIDDLEWARE_TYPE_CONTEXT_EDITING,
  MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH,
  MIDDLEWARE_TYPE_FILESYSTEM,
  MIDDLEWARE_TYPE_SUBAGENT,
  MIDDLEWARE_TYPE_CUSTOM,
  DEFAULT_MIDDLEWARE_TYPE,
  TARGET_KIND_STEP,
  TARGET_KIND_PORT,
  TARGET_KIND_END,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  TOOL_SOURCE_INLINE,
  TOOL_SOURCE_MCP_SERVER,
  TOOL_SOURCE_API_ENDPOINT,
  LLM_PROVIDERS,
  LLM_PROVIDER_MAP,
  LLM_PROVIDER_GROQ,
  LLM_PROVIDER_OPENAI,
  LLM_PROVIDER_ANTHROPIC,
  LLM_PROVIDER_GOOGLE,
  LLM_PROVIDER_CUSTOM,
  LLM_PROVIDER_OTHER,
  LLM_PROVIDER_OPTIONS,
  LLM_PROVIDER_PRESETS,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_BASE_URL,
  DEFAULT_LLM_API_KEY_ENV,
  DEFAULT_LLM_TEMPERATURE,
};

// ─── Event Stream Defaults & Constants ─────────────────────────────────────────
export const DEFAULT_EVENT_STREAM_SIGNATURE = JSON.stringify(
  {
    event: "{{event}}",
    agent: "{{agent_name}}",
    run_id: "{{run_id}}",
    timestamp: "{{timestamp}}",
    data: {
      delta: "{{delta}}",
      content: "{{content}}",
      tool: "{{tool_name}}",
      inputs: "{{inputs}}",
      output: "{{output}}",
      usage: "{{usage}}"
    }
  },
  null,
  2
);

export const DEFAULT_STREAM_TRANSFORMERS = `// LangChain streamEvents (version: "v3") transformer configuration
// Enables frontend-friendly SSE projections
export async function* customEventStreamTransformer(eventStream) {
  for await (const event of eventStream) {
    yield {
      event: event.event,
      timestamp: new Date().toISOString(),
      payload: event.data
    };
  }
}`;

export const STREAM_EVENT_TYPES = [
  {
    id: "stream.messages",
    label: "stream.messages",
    description: "LLM Model message streams (one stream per LLM call)",
    badge: "LLM Streams"
  },
  {
    id: "message.text",
    label: "message.text",
    description: "Text token deltas & final message text chunks",
    badge: "Text Deltas"
  },
  {
    id: "message.reasoning",
    label: "message.reasoning",
    description: "Reasoning / thinking deltas for CoT models",
    badge: "Reasoning"
  },
  {
    id: "message.toolCalls",
    label: "message.toolCalls",
    description: "Live tool-call argument deltas while model streams",
    badge: "Tool Call Chunks"
  },
  {
    id: "stream.toolCalls",
    label: "stream.toolCalls",
    description: "Tool execution lifecycle (start, inputs, outputs, errors)",
    badge: "Tool Execution"
  },
  {
    id: "stream.values",
    label: "stream.values",
    description: "Agent state snapshots emitted after graph node steps",
    badge: "State Snapshots"
  },
  {
    id: "stream.output",
    label: "stream.output",
    description: "Final agent state output once graph run completes",
    badge: "Final Output"
  },
  {
    id: "stream.subagents",
    label: "stream.subagents",
    description: "Nested sub-agent event streams & execution",
    badge: "Sub-Agents"
  },
  {
    id: "stream.extensions",
    label: "stream.extensions",
    description: "Custom stream transformer projections & custom updates",
    badge: "Custom Extensions"
  }
];

export const DEFAULT_SELECTED_STREAM_EVENTS = [
  "stream.messages",
  "message.text",
  "message.reasoning",
  "message.toolCalls",
  "stream.toolCalls",
  "stream.values",
  "stream.output"
];




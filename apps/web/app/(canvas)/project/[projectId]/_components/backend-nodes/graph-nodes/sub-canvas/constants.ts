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
} from "@workspace/canvas/constants";

import { LLM_PROVIDER_PRESETS } from "./components/inspector/constants";

// ─── Sub-Canvas React Flow Node Types ──────────────────────────────────────────
export const SUB_CANVAS_NODE_STEP         = "step" as const;
export const SUB_CANVAS_NODE_START        = "start" as const;
export const SUB_CANVAS_NODE_PORT         = "port" as const;
export const SUB_CANVAS_NODE_STATE_GLOBAL = "state_global" as const;
export const SUB_CANVAS_NODE_LLM          = "langgraph_llm" as const;
export const SUB_CANVAS_NODE_TOOL         = "langgraph_tool" as const;
export const SUB_CANVAS_NODE_MIDDLEWARE   = "langgraph_middleware" as const;
export const SUB_CANVAS_NODE_AGENT        = "langgraph_agent" as const;

export const HANDLE_MIDDLEWARE_IN  = "middleware_in" as const;
export const HANDLE_MIDDLEWARE_OUT = "middleware_out" as const;

// ─── Reserved Sub-Canvas Node IDs ─────────────────────────────────────────────
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



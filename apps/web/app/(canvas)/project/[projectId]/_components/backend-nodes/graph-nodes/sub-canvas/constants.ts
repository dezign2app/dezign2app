import {
  STEP_TYPE_LLM_CALL,
  STEP_TYPE_TOOL_NODE,
  STEP_TYPE_EVALUATOR,
  STEP_TYPE_SUMMARIZER,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_HUMAN_GATE,
  STEP_TYPE_INTERRUPT,
  STEP_TYPE_VECTOR_SEARCH,
  TARGET_KIND_STEP,
  TARGET_KIND_PORT,
  TARGET_KIND_END,
  LLM_PROVIDER_GROQ,
  LLM_PROVIDER_OPENAI,
  LLM_PROVIDER_ANTHROPIC,
  LLM_PROVIDER_GOOGLE,
  LLM_PROVIDER_OLLAMA,
  LLM_PROVIDER_CUSTOM,
  LLM_PROVIDER_OTHER,
} from "@workspace/canvas/constants";

// ─── Sub-Canvas React Flow Node Types ──────────────────────────────────────────
export const SUB_CANVAS_NODE_STEP         = "step" as const;
export const SUB_CANVAS_NODE_START        = "start" as const;
export const SUB_CANVAS_NODE_PORT         = "port" as const;
export const SUB_CANVAS_NODE_STATE_GLOBAL = "state_global" as const;
export const SUB_CANVAS_NODE_LLM          = "langgraph_llm" as const;

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
  TARGET_KIND_STEP,
  TARGET_KIND_PORT,
  TARGET_KIND_END,
  LLM_PROVIDER_GROQ,
  LLM_PROVIDER_OPENAI,
  LLM_PROVIDER_ANTHROPIC,
  LLM_PROVIDER_GOOGLE,
  LLM_PROVIDER_OLLAMA,
  LLM_PROVIDER_CUSTOM,
  LLM_PROVIDER_OTHER,
};

export type LangGraphStateChannel = {
  key: string;
  type:
    | "messages"
    | "string"
    | "json"
    | "number"
    | "boolean"
    | "array"
    | "object";
  reducer:
    | "add_messages"
    | "append"
    | "replace"
    | "merge_object"
    | "concat_array";
  defaultValue?:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[];
};

export type LangGraphInputChannel = {
  key: string;
  type:
    | "string"
    | "messages"
    | "json"
    | "number"
    | "boolean"
    | "object"
    | "array";
  required?: boolean;
  description?: string;
  defaultValue?:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[];
};

export type LangGraphOutputPort = {
  id: string;
  label: string;
  description?: string;
};

export interface OutputChannelConfig {
  id: string;
  name: string;
  type: "sse" | "websocket" | "event" | "webhook" | "rest";
  topicOrEventName?: string;
  targetStateChannel?: string;
  description?: string;
  streamContentMode?:
    | "ai_node_tokens"
    | "structured_output"
    | "step_output"
    | "full_state";
  sourceStepId?: string;
  boundRouteIds?: string[];
  schemaJson?: string;
  position?: { x: number; y: number };
}

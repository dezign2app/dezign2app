export type HandleKind =
  // --- Entity (schema view) ---
  | "entity-column-source"
  | "entity-column-target"
  | "entity-top-target"
  | "entity-bottom-source"

  // --- Service endpoints ---
  | "endpoint-in"
  | "endpoint-out"

  // --- WebClient events ---
  | "event-source"
  | "pageload-in"
  | "sse-in"
  | "websocket-in"

  // --- Service messaging ---
  | "published-event-out"
  | "consumed-event-in"
  | "consumed-event-out"

  // --- Messaging resource definitions ---
  | "resource-def-in"
  | "resource-def-out"

  // --- Database (Table Reference) ---
  | "database-target"
  | "database-source"

  // --- External API actions ---
  | "action-target"

  // --- Worker Tasks ---
  | "task-in"
  | "task-out"

  // --- Search Indexes ---
  | "index-in"
  | "index-out"

  // --- LangGraph / LLM Nodes ---
  | "llm-in"
  | "llm-out"
  | "step-in"
  | "step-out"

  // --- LangGraph Agent (main canvas) ---
  | "langgraph-in"
  | "langgraph-out"

  // --- Fallback ---
  | "unknown";

export type RejectionCode =
  | "UNKNOWN_SOURCE_KIND"
  | "UNKNOWN_TARGET_KIND"
  | "INVALID_KIND_PAIR"
  | "SELF_CONNECTION"
  | "DUPLICATE_EDGE"
  | "SOURCE_NODE_NOT_FOUND"
  | "TARGET_NODE_NOT_FOUND";

export type ValidationResult =
  | {
      valid: true;
      edgeType: string;
      rulesVersion: number;
      resourceKind?: string;
    }
  | {
      valid: false;
      code: RejectionCode;
      message: string;
      suggestion?: string;
      rulesVersion: number;
    };

export type BackendCanvasView = "graph" | "sequence" | "schema";

export type ArchitectureMetadata = {
  createdAt?: number;
  updatedAt?: number;
  createdByAI?: boolean;
};

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

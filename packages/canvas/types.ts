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

  // --- Service messaging ---
  | "published-event-out"
  | "consumed-event-in"

  // --- Messaging resource definitions ---
  | "resource-def-in"
  | "resource-def-out"

  // --- Database (Table Reference) ---
  | "database-target"
  | "database-source"

  // --- External API actions ---
  | "action-target"

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
  | { valid: true; edgeType: string; rulesVersion: number; resourceKind?: string }
  | { valid: false; code: RejectionCode; message: string; suggestion?: string; rulesVersion: number };

import type { HandleKind } from "./types";

export const CONNECTION_RULES: Record<HandleKind, HandleKind[]> = {
  "event-source": ["endpoint-in", "pageload-in", "sse-in", "websocket-in"],
  "endpoint-in": [],
  "pageload-in": [],
  "sse-in": [],
  "websocket-in": [],
  "endpoint-out": ["database-target", "action-target", "resource-def-in", "endpoint-in", "task-in", "index-in", "sse-in", "websocket-in", "pageload-in", "langgraph-in"],
  "published-event-out": ["resource-def-in", "task-in", "sse-in", "websocket-in"],
  "consumed-event-in": [],
  "consumed-event-out": ["endpoint-in", "resource-def-in", "task-in", "index-in", "sse-in", "websocket-in", "langgraph-in"],
  "resource-def-in": [],
  "resource-def-out": ["consumed-event-in", "task-in", "sse-in", "websocket-in"],
  "entity-column-source": ["entity-column-target"],
  "entity-column-target": [],
  "entity-top-target": [],
  "entity-bottom-source": ["entity-top-target"],
  "database-target": [],
  "database-source": ["endpoint-in", "task-in", "index-in"],
  "action-target": [],
  "task-in": [],
  "task-out": ["database-target", "action-target", "resource-def-in", "endpoint-in", "index-in", "langgraph-in"],
  "index-in": [],
  "index-out": ["endpoint-in", "task-in"],
  "llm-out": ["llm-in", "step-in"],
  "llm-in": [],
  "step-out": ["step-in", "endpoint-in", "database-target"],
  "step-in": [],
  // --- LangGraph Agent (main canvas) ---
  "langgraph-in": [],
  "langgraph-out": ["endpoint-in", "task-in", "consumed-event-in", "database-target", "resource-def-in", "sse-in", "websocket-in"],
  "unknown": [],
};

export const EDGE_TYPE_MAP: Record<string, string> = {
  "entity-column-source→entity-column-target": "foreign-key",
  "entity-bottom-source→entity-top-target": "foreign-key",
  "published-event-out→resource-def-in": "message",
  "consumed-event-out→resource-def-in": "message",
  "resource-def-out→consumed-event-in": "message",
  "published-event-out→task-in": "message",
  "consumed-event-out→task-in": "message",
  "resource-def-out→task-in": "message",
  "task-out→resource-def-in": "message",
  "endpoint-out→task-in": "connection",
  // LangGraph invocation edges
  "endpoint-out→langgraph-in": "connection",
  "consumed-event-out→langgraph-in": "message",
  "task-out→langgraph-in": "connection",
  "langgraph-out→endpoint-in": "connection",
  "langgraph-out→task-in": "connection",
  "langgraph-out→consumed-event-in": "message",
};

export const WEB_CLIENT_EVENTS = ["pageLoad", "click", "hover", "drag", "dblclick", "keydown", "keyup", "submit", "change", "focus", "blur", "mouseenter", "mouseleave", "sse", "websocket", "other"] as const;

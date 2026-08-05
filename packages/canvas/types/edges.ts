import type { MessagingResourceType } from "../constants";
import type { BackendNode } from "./nodes";

export type BackendEdgeType =
  | "connection"
  | "foreign-key"
  | "message"
  | "identity-connection";

export type BackendEdge = {
  id: string;
  source: string;
  target: string;
  type: BackendEdgeType;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  sourceResourceId?: string;
  targetResourceId?: string;
  resourceType?: MessagingResourceType;
  data?: {
    label?: string;
    sequenceOrder?: number;
    sourceCardinality?: "1" | "N";
    targetCardinality?: "1" | "N";
    // --- Identity Connection Fields ---
    protocol?: string;
    grantType?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUris?: string[];
    pkce?: boolean;
    scopes?: string[];
    responseType?: string;
    responseMode?: string;
    notes?: string;
    // --- LangGraph Route Invocation ---
    // Maps HTTP body / event payload fields → LangGraph state channel keys.
    // Lives on the edge so the graph itself stays immutable and reusable.
    // e.g. { "messages": "body.message", "userId": "headers.x-user-id" }
    payloadMapping?: Record<string, string>;
    // Pre-invoke business logic (supports natural_language or code mode)
    preInvokeLogicMode?: "natural_language" | "code";
    preInvokePrompt?: string;
    preInvokeCode?: string;
    // Response & Output configuration
    responseExecutionMode?: "sync" | "stream" | "async_ack";
    responseOutputMode?: "full" | "selected";
    responseFields?: string[];
    postInvokeLogicMode?: "natural_language" | "code";
    postInvokePrompt?: string;
    postInvokeCode?: string;
  };
  fractionalIndex: string; // For sequence diagram ordering
};

export type BackendDesignDoc = {
  schemaVersion?: number;
  nodes: BackendNode[];
  edges: BackendEdge[];
};

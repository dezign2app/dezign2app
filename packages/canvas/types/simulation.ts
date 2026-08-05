import type { JSONValue } from "./common";
import type { BackendNodeType, BackendNode } from "./nodes";
import type { BackendEdgeType, BackendEdge } from "./edges";

export type Parameter = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  key?: string;
  value?: string;
};

export type Schema = {
  id: string;
  rawJson?: string;
};

export type ProcessingOperation =
  | "passthrough"
  | "validate"
  | "pick"
  | "omit"
  | "rename"
  | "set"
  | "filter"
  | "map"
  | "db_get"
  | "db_get_many"
  | "db_insert"
  | "db_update"
  | "db_delete"
  | "return";

// UI Specific Types
export type UIEventItem = {
  id: string;
  name: string;
  event?: string;
  schema?: string;
  testCases?: SimulationTestCase[];
};

/** A global simulation scenario. */
export type SimulationTestCase = {
  id: string;
  name: string;
  targetNodeId: string;
  targetEventId?: string;
  /** Incoming route/edge that invokes a LangGraph node. */
  targetRouteId?: string;
  /** Initial values for LangGraph state channels before the graph starts. */
  initialState?: Record<string, JSONValue>;
  /** Explicit branch choice for each router step, keyed by router step id. */
  routerChoices?: Record<string, string>;
  /** Expected final LangGraph state values. */
  expectedState?: Record<string, JSONValue>;
  request?: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: JSONValue;
  };
  expectedStatus?: number;
  expectedBody?: JSONValue;
  enabled?: boolean;
  mocks?: Record<string, { returnData: JSONValue; status: number }>;
  expectedPath?: string[];
};

export interface TestCaseItem {
  id?: string;
  testCaseId?: string;
  name?: string;
  targetNodeId?: string;
  nodeId?: string;
  targetEventId?: string;
  request?: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: unknown;
  };
  expectedStatus?: number;
  expectedBody?: unknown;
}

// --- AI Adapter Types ---

export type CanvasOperation =
  | {
      op: "add_node";
      type: BackendNodeType;
      label: string;
      position?: { x: number; y: number };
      data?: Partial<BackendNode["data"]>;
    }
  | { op: "update_node"; id: string; changes: Partial<BackendNode> }
  | { op: "delete_node"; id: string }
  | {
      op: "add_edge";
      source: string;
      target: string;
      type: BackendEdgeType;
      data?: Partial<BackendEdge["data"]>;
    }
  | { op: "update_edge"; id: string; changes: Partial<BackendEdge> }
  | { op: "delete_edge"; id: string }
  | { op: "run_auto_layout" }
  | {
      op: "add_shape";
      type: string;
      x: number;
      y: number;
      props: Record<string, string | number | boolean | null>;
    }
  | {
      op: "update_shape";
      id: string;
      props: Record<string, string | number | boolean | null>;
    }
  | { op: "delete_shape"; id: string };

export interface CanvasAdapter<TDoc> {
  getState: () => TDoc;
  applyOperations: (ops: CanvasOperation[]) => void;
  serialize: () => string; // For AI context
}

// --- Input Types (for AI tools & Store operations) ---

export interface ParameterInputType {
  id?: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  key?: string;
  value?: string;
}

export interface PublishedEventInputType {
  id?: string;
  name: string;
  kind?: string;
  schema?: string;
  targetNodeId?: string;
  targetResourceId?: string;
}

export interface ConsumedEventInputType {
  id?: string;
  name: string;
  kind?: string;
  schema?: string;
  handlerLogic?: string;
  targetNodeId?: string;
  targetResourceId?: string;
}

export interface EndpointInputType {
  id?: string;
  name: string;
  type: string;
  headers?: ParameterInputType[];
  pathParams?: ParameterInputType[];
  queryParams?: ParameterInputType[];
  requestBody?: { fields: ParameterInputType[] };
  responseBody?: { fields: ParameterInputType[] };
  simulationOutput?: unknown;
  processingSteps?: {
    id?: string;
    text: string;
    operation?: string;
    config?: Record<string, string | number | boolean | null>;
  }[];
  output?: string;
  businessLogic?: string;
  summary?: string;
  requiredRoles?: string[];
  requiredScopes?: string[];
  audience?: string;
  databaseNodeIds?: string[];
  databaseNodeId?: string;
  publishedEvents?: PublishedEventInputType[];
}

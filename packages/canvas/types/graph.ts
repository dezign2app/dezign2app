import type { Endpoint } from "../schemas";
import type { BackendNode, BackendNodeType } from "./nodes";
import type { BackendEdge, BackendEdgeType } from "./edges";
import type { TestCaseItem } from "./simulation";

// ─── Core Identity ────────────────────────────────────────────────────────────

export type NodeId = string;

// ─── Graph Node & Engine Edge ──────────────────────────────────────────────────

export interface GraphNode {
  nodeId: NodeId;
  type: BackendNodeType;
  label: string;
  description: string;
  /** Full data blob from Convex — used for serialization */
  data: BackendNode["data"];
}

export interface EngineGraphEdge {
  id: string;
  source: NodeId;
  target: NodeId;
  type: BackendEdgeType;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  /** Human-readable label from edge data, or empty string */
  label: string;
}

export type CanvasEngineGraphEdge = EngineGraphEdge;

// ─── In-Memory Graph ──────────────────────────────────────────────────────────

export interface CanvasGraph {
  /** All nodes keyed by their nodeId */
  nodes: Map<NodeId, GraphNode>;
  /** All edges in the graph */
  edges: EngineGraphEdge[];
  /** Adjacency list: source nodeId → outgoing edges */
  outgoing: Map<NodeId, EngineGraphEdge[]>;
  /** Adjacency list: target nodeId → incoming edges */
  incoming: Map<NodeId, EngineGraphEdge[]>;
}

// ─── Traversal Result ─────────────────────────────────────────────────────────

export interface TraversalHit {
  node: GraphNode;
  depth: number;
}

export interface NeighbourHit {
  node: GraphNode;
  edge: EngineGraphEdge;
}

// ─── Summarised Endpoint & Test Case (for MCP / AI output) ───────────────────

export interface EndpointSummary {
  nodeId: NodeId;
  id: string;
  name: string;
  type: string;
  summary: string;
  businessLogic: string;
  requiredRoles: string[];
}

export interface TestCaseSummary {
  nodeId: NodeId;
  name: string;
  expectedStatus: number | undefined;
}

// ─── Raw Convex Elements ──────────────────────────────────────────────────────

export interface RawNodeRecord {
  id?: string;
  nodeId?: string;
  type?: BackendNodeType;
  data?: BackendNode["data"];
}

export interface RawEdgeRecord {
  id?: string;
  edgeId?: string;
  source: string;
  target: string;
  type?: BackendEdgeType;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: BackendEdge["data"];
}

export interface RawEndpointRecord extends Endpoint {
  nodeId: NodeId;
}

export interface RawEventRecord {
  id: string;
  nodeId: NodeId;
  name: string;
  variant: "publish" | "consume";
  brokerNodeId?: string;
  messagingResourceId?: string;
  payloadSchema?: { id?: string; rawJson?: string };
  publishedWhen?: string;
}

export interface RawTestCaseRecord extends TestCaseItem {
  id: string;
}

export interface CanvasElements {
  nodes: RawNodeRecord[];
  edges: RawEdgeRecord[];
  endpoints: RawEndpointRecord[];
  events?: RawEventRecord[];
  testCases: RawTestCaseRecord[];
}

// ─── Visual Canvas Node Types ─────────────────────────────────────────────────

export type GraphNodeType = Exclude<
  BackendNodeType,
  "group" | "entity" | "database" | "langgraph_step"
>;

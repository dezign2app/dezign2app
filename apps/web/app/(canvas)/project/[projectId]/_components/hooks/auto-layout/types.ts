import type { Node, Edge } from "@xyflow/react";
import type { BackendNode, BackendEdge } from "@/types/canvas";

export {
  HEAD_TARGET_HANDLES,
  HEAD_NODE_TYPES,
  TARGET_NODE_TYPES,
} from "@workspace/canvas";

export type LayoutNode = Node | BackendNode;
export type LayoutEdge = Edge | BackendEdge;

export type PositionNodeChange = {
  id: string;
  type: "position";
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
};

export interface UseAutoLayoutOptions {
  nodes?: LayoutNode[];
  edges?: LayoutEdge[];
  onNodesChange?: (changes: PositionNodeChange[]) => void;
}

export interface NodeHandleData {
  endpoints?: Array<{ id?: string; _id?: string }>;
  events?: Array<{ id?: string; _id?: string }>;
  topics?: Array<{ id?: string; _id?: string; name?: string }>;
  consumedEvents?: Array<string | { id?: string; _id?: string }>;
  publishedEvents?: Array<string | { id?: string; _id?: string }>;
}

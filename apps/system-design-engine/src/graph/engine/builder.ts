import type {
  BackendNodeType,
  BackendEdgeType,
  CanvasGraph,
  CanvasElements,
  GraphNode,
  EngineGraphEdge,
  NodeId,
  RawNodeRecord,
  RawEdgeRecord,
} from "@workspace/canvas";

/**
 * Builds an in-memory typed graph from raw Convex canvas elements.
 * Complexity: O(N + E).
 */
export function buildGraph(elements: CanvasElements): CanvasGraph {
  const nodes = new Map<NodeId, GraphNode>();
  const outgoing = new Map<NodeId, EngineGraphEdge[]>();
  const incoming = new Map<NodeId, EngineGraphEdge[]>();
  const edges: EngineGraphEdge[] = [];

  for (const raw of elements.nodes) {
    const node = rawNodeToGraphNode(raw);
    nodes.set(node.nodeId, node);
    outgoing.set(node.nodeId, []);
    incoming.set(node.nodeId, []);
  }

  for (const raw of elements.edges) {
    const edge = rawEdgeToGraphEdge(raw);
    edges.push(edge);

    const outList = outgoing.get(edge.source);
    if (outList) outList.push(edge);
    else outgoing.set(edge.source, [edge]);

    const incList = incoming.get(edge.target);
    if (incList) incList.push(edge);
    else incoming.set(edge.target, [edge]);
  }

  return { nodes, edges, outgoing, incoming };
}

export function rawNodeToGraphNode(raw: RawNodeRecord): GraphNode {
  const nodeId = raw.nodeId ?? raw.id ?? "unknown";
  const type = (raw.type ?? "service") as BackendNodeType;
  const label = raw.data?.label ?? nodeId;
  const description = raw.data?.description ?? "";

  return {
    nodeId,
    type,
    label,
    description,
    data: raw.data ?? { label },
  };
}

export function rawEdgeToGraphEdge(raw: RawEdgeRecord): EngineGraphEdge {
  const id = raw.edgeId ?? raw.id ?? `${raw.source}->${raw.target}`;
  const type = (raw.type ?? "connection") as BackendEdgeType;
  const label = raw.data?.label ?? "";

  return {
    id,
    source: raw.source,
    target: raw.target,
    type,
    sourceHandle: raw.sourceHandle ?? null,
    targetHandle: raw.targetHandle ?? null,
    label,
  };
}

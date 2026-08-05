import type {
  CanvasGraph,
  GraphNode,
  EngineGraphEdge,
  NodeId,
  TraversalHit,
  NeighbourHit,
} from "@workspace/canvas";

export function getAdjacentEdges(
  graph: CanvasGraph,
  nodeId: NodeId,
  direction: "outgoing" | "incoming" | "both",
): EngineGraphEdge[] {
  if (direction === "outgoing") return graph.outgoing.get(nodeId) ?? [];
  if (direction === "incoming") return graph.incoming.get(nodeId) ?? [];

  const seen = new Set<string>();
  const result: EngineGraphEdge[] = [];
  for (const edge of [
    ...(graph.outgoing.get(nodeId) ?? []),
    ...(graph.incoming.get(nodeId) ?? []),
  ]) {
    if (!seen.has(edge.id)) {
      seen.add(edge.id);
      result.push(edge);
    }
  }
  return result;
}

export function otherEnd(nodeId: NodeId, edge: EngineGraphEdge): NodeId {
  return edge.source === nodeId ? edge.target : edge.source;
}

/**
 * BFS traversal from `startId`, up to `maxDepth` hops.
 * The start node is included at depth 0.
 */
export function traverse(
  graph: CanvasGraph,
  startId: NodeId,
  direction: "outgoing" | "incoming" | "both",
  maxDepth: number,
): TraversalHit[] {
  const visited = new Set<NodeId>();
  const result: TraversalHit[] = [];
  const queue: Array<[NodeId, number]> = [[startId, 0]];

  while (queue.length > 0) {
    const entry = queue.shift();
    if (!entry) break;
    const [id, depth] = entry;

    if (visited.has(id)) continue;
    visited.add(id);

    const node = graph.nodes.get(id);
    if (!node) continue;

    result.push({ node, depth });
    if (depth >= maxDepth) continue;

    for (const edge of getAdjacentEdges(graph, id, direction)) {
      const neighbourId = otherEnd(id, edge);
      if (!visited.has(neighbourId)) {
        queue.push([neighbourId, depth + 1]);
      }
    }
  }

  return result;
}

/**
 * Returns all nodes whose label, description, or type contain `keyword`
 * (case-insensitive substring match). No LLM required.
 */
export function findNodesByKeyword(
  graph: CanvasGraph,
  keyword: string,
): GraphNode[] {
  const lower = keyword.toLowerCase();
  const results: GraphNode[] = [];

  for (const node of graph.nodes.values()) {
    if (
      node.label.toLowerCase().includes(lower) ||
      node.description.toLowerCase().includes(lower) ||
      node.type.toLowerCase().includes(lower)
    ) {
      results.push(node);
    }
  }

  return results;
}

/**
 * Returns direct (1-hop) connections of a node together with the connecting edge.
 * Returns an entry for EVERY connecting edge (allowing multiple connections per node pair).
 */
export function getNeighbours(
  graph: CanvasGraph,
  nodeId: NodeId,
  direction: "outgoing" | "incoming" | "both",
): NeighbourHit[] {
  const adjacentEdges = getAdjacentEdges(graph, nodeId, direction);
  const results: NeighbourHit[] = [];

  for (const edge of adjacentEdges) {
    const neighbourId = otherEnd(nodeId, edge);
    const node = graph.nodes.get(neighbourId);
    if (node) results.push({ node, edge });
  }

  return results;
}

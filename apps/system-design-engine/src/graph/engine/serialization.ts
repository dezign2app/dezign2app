import type {
  CanvasGraph,
  CanvasElements,
  GraphNode,
  NodeId,
  EndpointSummary,
  TestCaseSummary,
} from "../types";
import { getAdjacentEdges } from "./adjacencyAndTraversal";
import { formatEdgeLine, formatNodeDataLines } from "./formatters";

/**
 * Serialises a subgraph (relevant nodes + associated endpoints/test cases)
 * into a structured text block for MCP tool output.
 */
export function serializeSubgraph(
  graph: CanvasGraph,
  relevantNodes: GraphNode[],
  endpoints: EndpointSummary[],
  testCases: TestCaseSummary[],
  elements?: CanvasElements,
): string {
  if (relevantNodes.length === 0) {
    return "No matching nodes found in the architecture graph.";
  }

  const lines: string[] = [
    `# Architecture Subgraph (${relevantNodes.length} node${relevantNodes.length === 1 ? "" : "s"})`,
    "",
  ];

  for (const node of relevantNodes) {
    lines.push(...formatNodeDataLines(node));

    const allEdges = getAdjacentEdges(graph, node.nodeId, "both");
    if (allEdges.length > 0) {
      lines.push("Connections:");
      for (const edge of allEdges) {
        lines.push(formatEdgeLine(edge, graph, elements));
      }
    }

    const nodeEndpoints = endpoints.filter((e) => e.nodeId === node.nodeId);
    if (nodeEndpoints.length > 0) {
      lines.push("Endpoints:");
      for (const ep of nodeEndpoints) {
        const roleStr =
          ep.requiredRoles.length > 0
            ? ` [roles: ${ep.requiredRoles.join(", ")}]`
            : "";
        lines.push(`  ${ep.type} ${ep.name}${roleStr}`);
        if (ep.summary) lines.push(`    Summary: ${ep.summary}`);
        if (ep.businessLogic) lines.push(`    Logic: ${ep.businessLogic}`);
      }
    }

    const nodeTestCases = testCases.filter((tc) => tc.nodeId === node.nodeId);
    if (nodeTestCases.length > 0) {
      lines.push("Test Cases:");
      for (const tc of nodeTestCases) {
        const statusStr =
          tc.expectedStatus !== undefined ? ` → HTTP ${tc.expectedStatus}` : "";
        lines.push(`  - ${tc.name}${statusStr}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Maps raw Convex endpoint records to MCP-friendly summaries,
 * filtered to only nodes within `nodeIds`.
 */
export function extractEndpointSummaries(
  rawEndpoints: CanvasElements["endpoints"],
  nodeIds: Set<NodeId>,
): EndpointSummary[] {
  return rawEndpoints
    .filter((ep) => nodeIds.has(ep.nodeId))
    .map((ep) => ({
      nodeId: ep.nodeId,
      id: ep.id,
      name: ep.name,
      type: ep.type,
      summary: ep.summary ?? "",
      businessLogic: ep.businessLogic ?? "",
      requiredRoles: ep.requiredRoles ?? [],
    }));
}

/**
 * Maps raw Convex test case records to MCP-friendly summaries,
 * filtered to only nodes within `nodeIds`.
 */
export function extractTestCaseSummaries(
  rawTestCases: CanvasElements["testCases"],
  nodeIds: Set<NodeId>,
): TestCaseSummary[] {
  const results: TestCaseSummary[] = [];

  for (const tc of rawTestCases) {
    const targetNodeId = tc.targetNodeId;
    if (targetNodeId !== undefined && nodeIds.has(targetNodeId)) {
      results.push({
        nodeId: targetNodeId,
        name: tc.name ?? "Unnamed",
        expectedStatus: tc.expectedStatus,
      });
    }
  }

  return results;
}

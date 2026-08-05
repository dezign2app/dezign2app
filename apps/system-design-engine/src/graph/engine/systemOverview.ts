import type { CanvasElements } from "../types";
import { buildGraph } from "./builder";
import { formatEdgeLine } from "./formatters";
import {
  extractEndpointSummaries,
  extractTestCaseSummaries,
  serializeSubgraph,
} from "./serialization";

/**
 * Generates a full system overview directly from live database canvas elements.
 * 1. Shows DB Schema & Entity Relations (tables, columns, indexes, foreign keys).
 * 2. Shows Architecture Graph (services, brokers, endpoints, events, connections).
 * 3. Truncates graph nodes if exceeding maxGraphNodes and prompts user to query for details.
 */
export function generateSystemOverview(
  elements: CanvasElements,
  query?: string,
  maxGraphNodes: number = 15,
): string {
  const graph = buildGraph(elements);
  const lines: string[] = ["# System Overview", ""];

  // PART 1: Database Schema (Entity Relations)
  const entityNodes = Array.from(graph.nodes.values()).filter(
    (n) => n.type === "entity",
  );

  lines.push(
    `## 1. Database Schema & Entity Relations (${entityNodes.length} table${entityNodes.length === 1 ? "" : "s"})`,
  );
  lines.push("");

  if (entityNodes.length === 0) {
    lines.push("No database entity tables defined.");
    lines.push("");
  } else {
    for (const node of entityNodes) {
      lines.push(`### Table: \`${node.label}\``);
      if (node.description) lines.push(`Description: ${node.description}`);

      const data = node.data as {
        columns?: Array<{
          name: string;
          type: string;
          isPrimaryKey?: boolean;
          isForeignKey?: boolean;
          isNotNull?: boolean;
          isUnique?: boolean;
          references?: { table: string; column: string };
        }>;
        indexes?: Array<{ name: string; columns: string; isUnique?: boolean }>;
        dbType?: string;
      };

      if (data.dbType) lines.push(`Database Type: ${data.dbType}`);

      if (data.columns && data.columns.length > 0) {
        lines.push("Columns:");
        for (const col of data.columns) {
          const flags: string[] = [];
          if (col.isPrimaryKey) flags.push("PK");
          if (col.isForeignKey) flags.push("FK");
          if (col.isNotNull) flags.push("NOT NULL");
          if (col.isUnique) flags.push("UNIQUE");
          const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
          const refStr = col.references
            ? ` -> ${col.references.table}.${col.references.column}`
            : "";
          lines.push(`  - \`${col.name}\` (${col.type})${flagStr}${refStr}`);
        }
      }

      if (data.indexes && data.indexes.length > 0) {
        lines.push("Indexes:");
        for (const idx of data.indexes) {
          const uStr = idx.isUnique ? " (UNIQUE)" : "";
          lines.push(`  - ${idx.name} (${idx.columns})${uStr}`);
        }
      }

      const fkEdges = graph.edges.filter(
        (e) =>
          (e.source === node.nodeId || e.target === node.nodeId) &&
          e.type === "foreign-key",
      );
      if (fkEdges.length > 0) {
        lines.push("Relationships:");
        for (const edge of fkEdges) {
          lines.push(formatEdgeLine(edge, graph, elements));
        }
      }

      lines.push("");
    }
  }

  // PART 2: Architecture Graph (Services, Messaging & Infrastructure)
  let archNodes = Array.from(graph.nodes.values()).filter(
    (n) => n.type !== "entity",
  );

  if (query && query.trim()) {
    const lower = query.toLowerCase();
    const matched = archNodes.filter(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.description.toLowerCase().includes(lower) ||
        n.type.toLowerCase().includes(lower),
    );
    if (matched.length > 0) {
      archNodes = matched;
    }
  }

  const totalArchNodes = archNodes.length;
  const isTruncated = totalArchNodes > maxGraphNodes;
  const displayNodes = isTruncated
    ? archNodes.slice(0, maxGraphNodes)
    : archNodes;

  lines.push(
    `## 2. Architecture Graph (${displayNodes.length} of ${totalArchNodes} node${totalArchNodes === 1 ? "" : "s"})`,
  );
  lines.push("");

  if (displayNodes.length === 0) {
    lines.push("No architecture nodes found.");
    lines.push("");
  } else {
    const nodeIdSet = new Set<string>(displayNodes.map((n) => n.nodeId));
    const endpointSummaries = extractEndpointSummaries(
      elements.endpoints,
      nodeIdSet,
    );
    const testCaseSummaries = extractTestCaseSummaries(
      elements.testCases,
      nodeIdSet,
    );

    lines.push(
      serializeSubgraph(
        graph,
        displayNodes,
        endpointSummaries,
        testCaseSummaries,
        elements,
      ),
    );
  }

  if (isTruncated) {
    lines.push("");
    lines.push(
      `> [!WARNING]\n` +
        `> **Notice: Graph output truncated (${totalArchNodes} total nodes present).**\n` +
        `> Showing the first ${maxGraphNodes} nodes above. To inspect specific nodes or routes in detail, please call \`get_system_design_context\` or \`traverse_architecture_graph\` with a specific \`query\` / \`topic\` (e.g. \`query: "payment"\` or \`query: "kafka"\`).`,
    );
  }

  return lines.join("\n");
}

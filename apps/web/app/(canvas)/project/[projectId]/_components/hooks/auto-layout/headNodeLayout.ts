import type { LayoutNode, LayoutEdge } from "./types";
import { getNodeDimensions } from "./nodeDimensions";

export interface HeadNodeLayoutParams {
  targetNodeIds: Set<string>;
  nodes: LayoutNode[];
  positionsMap: Map<string, { x: number; y: number }>;
  headEdges: LayoutEdge[];
  attachedHeadNodes: LayoutNode[];
}

export function layoutHeadNodes({
  targetNodeIds,
  nodes,
  positionsMap,
  headEdges,
  attachedHeadNodes,
}: HeadNodeLayoutParams): void {
  targetNodeIds.forEach((targetId: string) => {
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!targetNode) return;

    const targetPos = positionsMap.get(targetId);
    if (!targetPos) return;

    const { width: targetW } = getNodeDimensions(targetNode);
    const targetCenterX = targetPos.x + targetW / 2;

    const edgesForTarget = headEdges.filter(
      (e: LayoutEdge) => e.target === targetId,
    );
    const headNodesForTarget = attachedHeadNodes.filter((hn: LayoutNode) =>
      edgesForTarget.some((e: LayoutEdge) => e.source === hn.id),
    );

    if (headNodesForTarget.length === 0) return;

    // Categorize each head node (0: LLM, 1: Tool, 2: Middleware, 3: Memory)
    const getHeadCategoryIdx = (hn: LayoutNode): number => {
      const edge = edgesForTarget.find((e: LayoutEdge) => e.source === hn.id);
      const handle = edge?.targetHandle ?? "";
      if (
        handle === "llm_in" ||
        handle === "HANDLE_LLM_IN" ||
        hn.type === "langgraph_llm"
      )
        return 0;
      if (
        handle === "tool_in" ||
        handle === "HANDLE_TOOL_IN" ||
        hn.type === "langgraph_tool"
      )
        return 1;
      if (
        handle === "middleware_in" ||
        handle === "HANDLE_MIDDLEWARE_IN" ||
        hn.type === "langgraph_middleware"
      )
        return 2;
      if (
        handle === "memory_in" ||
        handle === "HANDLE_MEMORY_IN" ||
        hn.type === "langgraph_memory" ||
        hn.type === "db_ref" ||
        hn.type === "vector_db_ref"
      )
        return 3;
      return 1;
    };

    // Group into 4 category columns
    const columns: LayoutNode[][] = [[], [], [], []];
    headNodesForTarget.forEach((hn: LayoutNode) => {
      const catIdx = getHeadCategoryIdx(hn);
      const col = columns[catIdx];
      if (col) {
        col.push(hn);
      }
    });

    // Filter out empty category columns while maintaining left-to-right order (LLM -> Tool -> Middleware -> Memory)
    const activeColumns = columns.filter((col) => col.length > 0);
    if (activeColumns.length === 0) return;

    const columnWidths = activeColumns.map((col) =>
      Math.max(...col.map((hn) => getNodeDimensions(hn).width)),
    );

    const columnGapX = 30;
    const initialGapY = 60;
    const verticalStackGapY = 30;

    const totalWidth =
      columnWidths.reduce((sum: number, w: number) => sum + w, 0) +
      (activeColumns.length - 1) * columnGapX;

    let currentX = targetCenterX - totalWidth / 2;

    activeColumns.forEach((colNodes: LayoutNode[], colIdx: number) => {
      const colW = columnWidths[colIdx] ?? 300;
      const colCenterX = currentX + colW / 2;

      // Stack nodes in this column vertically from bottom to top
      let currentBottomY = targetPos.y - initialGapY;

      colNodes.forEach((hn: LayoutNode) => {
        const { width, height } = getNodeDimensions(hn);
        const headX = colCenterX - width / 2;
        const headY = currentBottomY - height;

        positionsMap.set(hn.id, { x: headX, y: headY });

        // Move currentBottomY upwards for the next node stacked above this one
        currentBottomY = headY - verticalStackGapY;
      });

      currentX += colW + columnGapX;
    });
  });
}

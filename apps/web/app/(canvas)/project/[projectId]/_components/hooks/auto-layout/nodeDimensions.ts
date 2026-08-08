import type { LayoutNode, NodeHandleData } from "./types";

export function getLayoutNodeData(node: LayoutNode): NodeHandleData | undefined {
  if (!node.data || typeof node.data !== "object") {
    return undefined;
  }
  return node.data as NodeHandleData;
}

export function getNodeDimensions(node: LayoutNode): {
  width: number;
  height: number;
} {
  const measured =
    "measured" in node && node.measured
      ? (node.measured as { width?: number; height?: number })
      : undefined;

  const isMeasured = Boolean(
    measured &&
      typeof measured.width === "number" &&
      typeof measured.height === "number" &&
      measured.width > 0 &&
      measured.height > 0,
  );

  if (isMeasured && node.type !== "entity") {
    return {
      width: measured!.width!,
      height: measured!.height!,
    };
  }

  switch (node.type) {
    case "start":
    case "START":
      return { width: 180, height: 70 };
    case "state_global":
    case "STATE_GLOBAL":
      return { width: 260, height: 140 };
    case "langgraph_agent":
    case "langgraph_node":
    case "agent":
      return { width: 340, height: 180 };
    case "langgraph_llm":
      return { width: 320, height: 220 };
    case "langgraph_tool":
      return { width: 300, height: 260 };
    case "langgraph_middleware":
      return { width: 280, height: 160 };
    case "langgraph_memory":
    case "db_ref":
    case "vector_db_ref":
      return { width: 280, height: 180 };
    case "step":
      return { width: 300, height: 220 };
    case "end":
    case "END":
      return { width: 140, height: 60 };
    case "port":
      return { width: 140, height: 50 };
    case "service":
    case "api_gateway":
    case "express":
    case "fastapi":
    case "web_client_page":
    case "kafka":
    case "pubsub":
    case "queue": {
      const data = getLayoutNodeData(node);
      const count =
        (Array.isArray(data?.endpoints) ? data.endpoints.length : 0) +
        (Array.isArray(data?.events) ? data.events.length : 0) +
        (Array.isArray(data?.topics) ? data.topics.length : 0);
      const estHeight = Math.max(180, 140 + count * 40);
      return { width: 320, height: estHeight };
    }
    case "entity": {
      const data = node.data as
        | {
            columns?: any[];
            indexes?: any[];
            dbOperations?: any[];
            description?: string;
            dbType?: string;
          }
        | undefined;
      const isVector = data?.dbType === "vector";
      const colCount = data?.columns?.length ?? 1;
      const idxCount = data?.indexes?.length ?? 0;

      // Header: 68px (standard SQL with engine select) or 44px (vector)
      const headerH = isVector ? 44 : 68;
      // Description box is always rendered in EntityNode DOM (~44px)
      const descH = 44;
      // Vector config block (if vector db type): ~120px
      const vectorConfigH = isVector ? 120 : 0;
      // Column list: header 24px + 42px per column row
      const columnsH = 24 + colCount * 42;
      // Index list: header 24px + 44px per index row (if indexes present)
      const indexesH = idxCount > 0 ? 24 + idxCount * 44 : 0;
      // DbOperations list header: ~30px
      const dbOpsH = 30;
      // Card padding / bottom margin
      const paddingH = 16;

      const estHeight =
        headerH + descH + vectorConfigH + columnsH + indexesH + dbOpsH + paddingH;
      const estWidth = 320;

      if (isMeasured) {
        return {
          width: Math.max(measured!.width!, estWidth),
          height: Math.max(measured!.height!, estHeight),
        };
      }

      return { width: estWidth, height: Math.max(220, estHeight) };
    }
    default:
      if (isMeasured) {
        return {
          width: measured!.width!,
          height: measured!.height!,
        };
      }
      return { width: 300, height: 200 };
  }
}

export function getHandleYRatio(
  node: LayoutNode,
  handleId?: string | null,
): number {
  if (!handleId) return 0.5;

  if (node.type === "entity") {
    const colMatch = handleId.match(/^(?:source|target)-(\d+)$/);
    if (colMatch) {
      const colIndex = parseInt(colMatch[1]!, 10);
      const data = node.data as
        | { columns?: any[]; description?: string; dbType?: string }
        | undefined;
      const { height } = getNodeDimensions(node);

      const isVector = data?.dbType === "vector";
      const headerH = isVector ? 44 : 68;
      const descH = 44;
      const vectorConfigH = isVector ? 120 : 0;
      const columnHeaderH = 24;

      const topOffset = headerH + descH + vectorConfigH + columnHeaderH;
      const targetY = topOffset + colIndex * 42 + 21;

      return Math.min(0.95, Math.max(0.05, targetY / height));
    }
  }

  const data = getLayoutNodeData(node);
  if (!data) return 0.5;

  if (Array.isArray(data.endpoints) && data.endpoints.length > 0) {
    const idx = data.endpoints.findIndex((ep) => {
      const id = ep?.id || ep?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.endpoints.length;
    }
  }

  if (Array.isArray(data.events) && data.events.length > 0) {
    const idx = data.events.findIndex((ev) => {
      const id = ev?.id || ev?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.events.length;
    }
  }

  if (Array.isArray(data.topics) && data.topics.length > 0) {
    const idx = data.topics.findIndex((tp) => {
      const id = tp?.id || tp?._id || tp?.name;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.topics.length;
    }
  }

  if (Array.isArray(data.consumedEvents) && data.consumedEvents.length > 0) {
    const idx = data.consumedEvents.findIndex((ev) => {
      const id = typeof ev === "string" ? ev : ev?.id || ev?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.consumedEvents.length;
    }
  }

  if (Array.isArray(data.publishedEvents) && data.publishedEvents.length > 0) {
    const idx = data.publishedEvents.findIndex((ev) => {
      const id = typeof ev === "string" ? ev : ev?.id || ev?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.publishedEvents.length;
    }
  }

  const match = handleId.match(/(\d+)$/);
  if (match) {
    const parsedIdx = parseInt(match[1]!, 10);
    if (!isNaN(parsedIdx) && parsedIdx < 10) {
      return (parsedIdx + 0.5) / 5;
    }
  }

  return 0.5;
}

export function getIsPkNode(
  node?: LayoutNode,
  handleId?: string | null,
): boolean {
  if (!node || !handleId || !node.data || typeof node.data !== "object")
    return false;
  const columns = (node.data as { columns?: any[] }).columns;
  if (!Array.isArray(columns)) return false;
  const match = handleId.match(/^(?:source|target)-(\d+)$/);
  if (!match) return false;
  const idx = parseInt(match[1]!, 10);
  const col = columns[idx];
  return Boolean(col?.isPrimaryKey || col?.name === "_id");
}

export function getHandleYOffset(
  node: LayoutNode,
  handleId?: string | null,
): number {
  const { height } = getNodeDimensions(node);
  const ratio = getHandleYRatio(node, handleId);
  return height * ratio;
}

export function getHandleXOffset(
  node: LayoutNode,
  handleId?: string | null,
): number {
  const { width } = getNodeDimensions(node);
  const ratio = getHandleYRatio(node, handleId);
  return width * ratio;
}

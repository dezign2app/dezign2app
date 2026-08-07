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
  if (
    "measured" in node &&
    node.measured &&
    typeof node.measured === "object" &&
    "width" in node.measured &&
    "height" in node.measured &&
    typeof node.measured.width === "number" &&
    typeof node.measured.height === "number" &&
    node.measured.width > 0 &&
    node.measured.height > 0
  ) {
    return {
      width: node.measured.width,
      height: node.measured.height,
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
            entityFunctions?: any[];
            description?: string;
          }
        | undefined;
      const colCount = data?.columns?.length ?? 1;
      const idxCount = data?.indexes?.length ?? 0;
      const fnCount = data?.entityFunctions?.length ?? 0;
      const hasDesc = Boolean(data?.description);

      let estHeight = 44 + 28 + (hasDesc ? 36 : 0) + 24 + colCount * 36;
      if (idxCount > 0) estHeight += 24 + idxCount * 28;
      if (fnCount > 0) estHeight += 24 + fnCount * 28;
      estHeight += 16;

      return { width: 300, height: Math.max(200, estHeight) };
    }
    default:
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
        | { columns?: any[]; description?: string }
        | undefined;
      const { height } = getNodeDimensions(node);

      const topOffset = 44 + 28 + (data?.description ? 36 : 0) + 24;
      const targetY = topOffset + colIndex * 36 + 18;

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

import type { BackendNodeData } from "@workspace/canvas";
import type {
  CanvasGraph,
  CanvasElements,
  GraphNode,
  EngineGraphEdge,
} from "@workspace/canvas";

export function resolveHandleLabel(
  node: GraphNode | undefined,
  handleId: string | null | undefined,
  elements?: CanvasElements,
): string | null {
  if (!node || !handleId) return null;

  const data = node.data;

  // 1. Endpoint handles
  if (
    handleId.startsWith("endpoint-in-") ||
    handleId.startsWith("endpoint-out-") ||
    handleId.startsWith("endpoints-in-") ||
    handleId.startsWith("endpoints-out-") ||
    handleId.startsWith("routeEndpoints-in-") ||
    handleId.startsWith("routeEndpoints-out-")
  ) {
    const epId = handleId.replace(
      /^(endpoint|endpoints|routeEndpoints)-(in|out)-/,
      "",
    );
    const nodeDataEndpoints = data?.endpoints ?? [];
    let ep: { id?: string; type?: string; name?: string } | undefined =
      nodeDataEndpoints.find((e) => e.id === epId);

    if (!ep && elements?.endpoints) {
      const rawEp = elements.endpoints.find(
        (e) => e.id === epId || (e.nodeId === node.nodeId && e.id === epId),
      );
      if (rawEp) ep = rawEp;
    }

    if (ep && ep.name) {
      return ep.type ? `${ep.type} ${ep.name}` : ep.name;
    }
  }

  // 2. Published Event handles
  if (
    handleId.startsWith("publishedEvents-out-") ||
    handleId.startsWith("publishedEvents-in-")
  ) {
    const evId = handleId.replace(/^publishedEvents-(out|in)-/, "");

    let evName: string | undefined = undefined;
    if (elements?.events) {
      const rawEv = elements.events.find((e) => e.id === evId);
      if (rawEv) evName = rawEv.name;
    }
    if (!evName && data) {
      const publishedEvents = data.publishedEvents ?? [];
      const ev = publishedEvents.find((e) => e.id === evId);
      if (ev) evName = ev.name;
    }

    let allEndpoints: Array<{
      id?: string;
      type?: string;
      name?: string;
      publishedEvents?: Array<{ id?: string; name?: string }>;
    }> = [];
    if (data?.endpoints) {
      allEndpoints = data.endpoints;
    }
    if (elements?.endpoints) {
      const rawEps = elements.endpoints.filter((e) => e.nodeId === node.nodeId);
      allEndpoints = [...allEndpoints, ...rawEps];
    }

    let parentEp = allEndpoints.find((ep) =>
      ep.publishedEvents?.some(
        (pe) => pe.id === evId || (evName && pe.name === evName),
      ),
    );

    if (!parentEp && allEndpoints.length > 0) {
      parentEp =
        allEndpoints.find((ep) => ep.type && ep.type.toUpperCase() !== "GET") ??
        allEndpoints[0];
    }

    if (parentEp && parentEp.name) {
      const epStr = parentEp.type
        ? `${parentEp.type} ${parentEp.name}`
        : parentEp.name;
      return evName ? `${epStr} (${evName})` : epStr;
    }

    if (evName) return `pub ${evName}`;
  }

  // 3. Consumed Event handles
  if (
    handleId.startsWith("consumedEvents-in-") ||
    handleId.startsWith("consumedEvents-out-")
  ) {
    const evId = handleId.replace(/^consumedEvents-(in|out)-/, "");
    let evName: string | undefined = undefined;
    if (elements?.events) {
      const rawEv = elements.events.find((e) => e.id === evId);
      if (rawEv) evName = rawEv.name;
    }
    if (!evName && data) {
      const consumedEvents = data.consumedEvents ?? [];
      const ev = consumedEvents.find((e) => e.id === evId);
      if (ev) evName = ev.name;
    }
    if (evName) {
      return `listener: ${evName}`;
    }
  }

  // 4. Messaging Resource handles
  const resourceMatch = handleId.match(
    /^(topic|topics|stream|streams|queue|queues|channel|channels|cache|caches|bucket|buckets):(in|out):(.+)$/,
  );
  if (resourceMatch) {
    const [, resType, , resId] = resourceMatch;
    if (resType && resId && data) {
      if (resType.startsWith("topic")) {
        const topics = data.topics ?? [];
        const topic = topics.find((t) => t.id === resId);
        if (topic && topic.name) return `topic: ${topic.name}`;
        if (elements?.events) {
          const rawEv = elements.events.find(
            (e) => e.id === resId || e.messagingResourceId === resId,
          );
          if (rawEv) return `topic: ${rawEv.name}`;
        }
      } else if (resType.startsWith("stream")) {
        const streams = data.streams ?? [];
        const stream = streams.find((s) => s.id === resId);
        if (stream && stream.name) return `stream: ${stream.name}`;
      } else if (resType.startsWith("queue")) {
        const queues = data.queues ?? [];
        const queue = queues.find((q) => q.id === resId);
        if (queue && queue.name) return `queue: ${queue.name}`;
      } else if (resType.startsWith("channel")) {
        const channels = data.channels ?? [];
        const channel = channels.find((c) => c.id === resId);
        if (channel && channel.name) return `channel: ${channel.name}`;
      } else if (resType.startsWith("cache")) {
        const caches = data.caches ?? [];
        const cache = caches.find((c) => c.id === resId);
        if (cache && cache.name) return `cache: ${cache.name}`;
      } else if (resType.startsWith("bucket")) {
        const buckets = data.buckets ?? [];
        const bucket = buckets.find((b) => b.id === resId);
        if (bucket && bucket.name) return `bucket: ${bucket.name}`;
      }
    }
  }

  // 5. UI Events
  if (handleId.startsWith("events-")) {
    const evId = handleId.replace("events-", "");
    if (elements?.events) {
      const rawEv = elements.events.find((e) => e.id === evId);
      if (rawEv) return `event: ${rawEv.name}`;
    }
    if (data) {
      const events = data.events ?? [];
      const ev = events.find((e) => e.id === evId);
      if (ev && ev.name) return `event: ${ev.name}`;
    }
  }

  // 6. Worker Tasks
  if (handleId.startsWith("task-in-") || handleId.startsWith("task-out-")) {
    const taskId = handleId.replace(/^task-(in|out)-/, "");
    const tasks = data?.tasks ?? [];
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.name) return `task: ${task.name}`;
  }

  // 7. Search Indexes
  if (handleId.startsWith("index-in-") || handleId.startsWith("index-out-")) {
    const idxId = handleId.replace(/^index-(in|out)-/, "");
    const sources = data?.searchSources ?? [];
    const allIndexes = sources.flatMap((s) => s.indexes ?? []);
    const idx = allIndexes.find((i) => i.id === idxId);
    if (idx && idx.name) return `index: ${idx.name}`;

    const src = sources.find((s) => s.id === idxId);
    if (src && src.dbTable) return `index: ${src.dbTable}`;
  }

  // 8. External Actions
  if (handleId.startsWith("actions-")) {
    const actId = handleId.replace("actions-", "");
    const actions = data?.actions ?? [];
    const act = actions.find((a) => a.id === actId);
    if (act && act.name) return `action: ${act.name}`;
  }

  // 9. Columns on entity node
  if (handleId.startsWith("source-") || handleId.startsWith("target-")) {
    const colName = handleId.replace(/^(source|target)-/, "");
    const columns = data?.columns ?? [];
    const col = columns.find((c) => c.name === colName);
    if (col) return `col: ${col.name}`;
  }

  return null;
}

export function formatEdgeLine(
  edge: EngineGraphEdge,
  graph: CanvasGraph,
  elements?: CanvasElements,
): string {
  const srcNode = graph.nodes.get(edge.source);
  const tgtNode = graph.nodes.get(edge.target);

  const srcLabel = srcNode?.label ?? edge.source;
  const tgtLabel = tgtNode?.label ?? edge.target;

  const srcHandle = resolveHandleLabel(srcNode, edge.sourceHandle, elements);
  const tgtHandle = resolveHandleLabel(tgtNode, edge.targetHandle, elements);

  const srcDetail = srcHandle ? ` (${srcHandle})` : "";
  const tgtDetail = tgtHandle ? ` (${tgtHandle})` : "";
  const edgeLabel = edge.label ? ` "${edge.label}"` : "";

  return `  ${srcLabel}${srcDetail} --[${edge.type}${edgeLabel}]--> ${tgtLabel}${tgtDetail}`;
}

const STRIPPED_KEYS = new Set<string>([
  "id",
  "nodeId",
  "targetNodeId",
  "brokerNodeId",
  "messagingResourceId",
  "sourceResourceId",
  "targetResourceId",
  "parentId",
  "tableRef",
  "position",
  "graphPosition",
  "fractionalIndex",
]);

export function cleanNodeData(
  data: BackendNodeData | Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!data) return null;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "label" || key === "description" || STRIPPED_KEYS.has(key)) {
      continue;
    }
    if (value !== undefined && value !== null) {
      if (Array.isArray(value) && value.length === 0) continue;
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : null;
}

export function formatNodeDataLines(node: GraphNode): string[] {
  const lines: string[] = [`## [${node.type}] ${node.label}`];
  if (node.description) lines.push(`Description: ${node.description}`);

  const dataClean = cleanNodeData(node.data);
  if (dataClean) {
    lines.push("Data:");
    lines.push("```json");
    lines.push(JSON.stringify(dataClean, null, 2));
    lines.push("```");
  }
  return lines;
}

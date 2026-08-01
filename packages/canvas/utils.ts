import type { HandleKind, BackendNodeType } from "./types";
import { CONNECTION_RULES, EDGE_TYPE_MAP } from "./graph-rules";
import { MESSAGING_RESOURCE_TYPES, MESSAGING_NODE_TYPES } from "./constants";

const ALL_BACKEND_NODE_TYPES = [
  "service",
  "database",
  "queue",
  "pubsub",
  "eventstream",
  "kafka",
  "redis-streams",
  "sqs",
  "redis-pubsub",
  "redis-cache",
  "entity",
  "webClient",
  "external",
  "group",
  "db_ref",
  "storage",
  "worker",
  "serverless",
  "search_index",
  "api_gateway",
  "load_balancer",
  "webhook",
  "llm",
  "mcp_server",
  "vector_db_ref",
  "langgraph",
  "langgraph_step",
] as const;

export function isBackendNode(type: string): type is BackendNodeType {
  return ALL_BACKEND_NODE_TYPES.some((t) => t === type);
}

export function getSuggestion(
  sourceKind: HandleKind,
  targetKind: HandleKind,
): string | undefined {
  const validTargets = CONNECTION_RULES[sourceKind];
  if (validTargets && validTargets.length > 0) {
    return (
      `"${sourceKind}" can connect to: ${validTargets.map((k: HandleKind) => `"${k}"`).join(", ")}. ` +
      `You attempted to connect to "${targetKind}" which is not in that list.`
    );
  }

  const validSources = (
    Object.entries(CONNECTION_RULES) as [HandleKind, HandleKind[]][]
  )
    .filter(([, targets]) => targets.includes(targetKind))
    .map(([src]) => src);

  if (validSources.length > 0) {
    return (
      `"${targetKind}" accepts connections from: ${validSources.map((k: HandleKind) => `"${k}"`).join(", ")}. ` +
      `You attempted to connect from "${sourceKind}" which is not in that list.`
    );
  }

  return undefined;
}

export function classifyHandle(
  nodeType: BackendNodeType,
  handleId: string | null | undefined,
  handleDirection: "source" | "target",
): HandleKind {
  const id = handleId ?? "";

  if (id === "llm_out" || id.startsWith("llm_out")) return "llm-out";
  if (id === "llm_in" || id.startsWith("llm_in")) return "llm-in";

  if (nodeType === "llm") {
    if (handleDirection === "source") return "llm-out";
    if (handleDirection === "target") return "llm-in";
  }

  if (nodeType === "langgraph_step") {
    if (id === "llm_in") return "llm-in";
    if (handleDirection === "target") return "step-in";
    if (handleDirection === "source") return "step-out";
  }

  if (nodeType === "langgraph") {
    if (
      id === "input-start" ||
      id.startsWith("langgraph-in-") ||
      id.startsWith("route-in-")
    )
      return "langgraph-in";
    if (
      id === "output-end" ||
      id.startsWith("langgraph-out-") ||
      id.startsWith("route-out-") ||
      id.startsWith("channel-out-")
    )
      return "langgraph-out";
    if (handleDirection === "target") return "langgraph-in";
    if (handleDirection === "source") return "langgraph-out";
  }

  if (id.startsWith("route-in-")) return "langgraph-in";
  if (id.startsWith("route-out-") || id.startsWith("channel-out-"))
    return "langgraph-out";

  if (nodeType === "entity") {
    if (id.startsWith("source-")) return "entity-column-source";
    if (id.startsWith("target-")) return "entity-column-target";
    if (handleDirection === "target") return "entity-top-target";
    if (handleDirection === "source") return "entity-bottom-source";
  }

  if (
    id.startsWith("endpoint-in-") ||
    id.startsWith("endpoints-in-") ||
    id.startsWith("routeEndpoints-in-")
  )
    return "endpoint-in";
  if (
    id.startsWith("endpoint-out-") ||
    id.startsWith("endpoints-out-") ||
    id.startsWith("routeEndpoints-out-")
  )
    return "endpoint-out";
  if (id.startsWith("events-")) return "event-source";
  if (id.startsWith("pageload-in-")) return "pageload-in";
  if (id.startsWith("sse-in-")) return "sse-in";
  if (id.startsWith("websocket-in-") || id.startsWith("ws-in-"))
    return "websocket-in";
  if (id.startsWith("publishedEvents-out-")) return "published-event-out";
  if (id.startsWith("consumedEvents-in-")) return "consumed-event-in";
  if (id.startsWith("consumedEvents-out-")) return "consumed-event-out";

  const resourceMatchRegex = new RegExp(
    `^(${MESSAGING_RESOURCE_TYPES.join("|")}):(in|out):(.+)$`,
  );
  const resourceMatch = id.match(resourceMatchRegex);
  if (resourceMatch) {
    const direction = resourceMatch[2];
    return direction === "in" ? "resource-def-in" : "resource-def-out";
  }

  if (id.startsWith("actions-")) return "action-target";
  if (id.startsWith("task-in-")) return "task-in";
  if (id.startsWith("task-out-")) return "task-out";
  if (id.startsWith("index-in-")) return "index-in";
  if (id.startsWith("index-out-")) return "index-out";

  if (
    nodeType === "database" ||
    nodeType === "db_ref" ||
    nodeType === "vector_db_ref"
  ) {
    if (id.startsWith("database-target") || handleDirection === "target")
      return "database-target";
    if (id.startsWith("database-source") || handleDirection === "source")
      return "database-source";
  }

  if (MESSAGING_NODE_TYPES.some((t) => t === nodeType)) {
    if (handleDirection === "target") return "resource-def-in";
    if (handleDirection === "source") return "resource-def-out";
  }

  return "unknown";
}

export function getEdgeType(
  sourceKind: HandleKind,
  targetKind: HandleKind,
): string {
  const key = `${sourceKind}→${targetKind}`;
  return EDGE_TYPE_MAP[key] ?? "connection";
}

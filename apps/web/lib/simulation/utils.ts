import type {
  BackendEdge,
  BackendNode,
  BackendNodeType,
  Endpoint,
  Schema,
} from "@/types/canvas";
import type { RuntimeContext } from "./types";

export function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return (
    statusTexts[status] ??
    (status >= 200 && status < 300
      ? "OK"
      : status >= 400 && status < 500
        ? "Client Error"
        : "Server Error")
  );
}

export function is2xxStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export const clone = <T>(value: T): T => {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
};

export function getPath(root: unknown, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((value, key) => {
      if (value === null || value === undefined) return undefined;
      return (value as Record<string, unknown>)[key];
    }, root);
}

export function setPath(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const parts = path.split(".").filter(Boolean);
  const last = parts.pop();
  if (!last) return;
  let cursor = root;
  for (const part of parts) {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[last] = clone(value);
}

export function resolveValue(value: unknown, context: RuntimeContext): unknown {
  if (typeof value !== "string") return clone(value);
  if (!value.startsWith("$")) return value;
  if (value === "$data") return context.data;
  if (value.startsWith("$request."))
    return getPath(context.request, value.slice(9));
  if (value.startsWith("$variables."))
    return getPath(context.variables, value.slice(11));
  if (value.startsWith("$response."))
    return getPath(context.response, value.slice(10));
  return value;
}

export function resolveObject(
  value: unknown,
  context: RuntimeContext,
): unknown {
  if (Array.isArray(value))
    return value.map((item) => resolveObject(item, context));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveObject(item, context),
      ]),
    );
  }
  return resolveValue(value, context);
}

export function validateSchema(value: unknown, schema?: Schema): string[] {
  return [];
}

export function findEventName(
  id: string,
  serviceNode: BackendNode,
  allNodes: BackendNode[],
): string | undefined {
  const pe = serviceNode.data.publishedEvents?.find((e) => e.id === id);
  if (pe?.name) return pe.name;
  const ce = serviceNode.data.consumedEvents?.find((e) => e.id === id);
  if (ce?.name) return ce.name;
  const top = serviceNode.data.topics?.find((e) => e.id === id);
  if (top?.name) return top.name;
  const q = serviceNode.data.queues?.find((e) => e.id === id);
  if (q?.name) return q.name;
  const str = serviceNode.data.streams?.find((e) => e.id === id);
  if (str?.name) return str.name;
  const ch = serviceNode.data.channels?.find((e) => e.id === id);
  if (ch?.name) return ch.name;

  for (const ep of serviceNode.data.endpoints ?? []) {
    const epe = ep.publishedEvents?.find((e) => e.id === id);
    if (epe?.name) return epe.name;
  }

  for (const n of allNodes) {
    const pe2 = n.data.publishedEvents?.find((e) => e.id === id);
    if (pe2?.name) return pe2.name;
    const ce2 = n.data.consumedEvents?.find((e) => e.id === id);
    if (ce2?.name) return ce2.name;
    const top2 = n.data.topics?.find((e) => e.id === id);
    if (top2?.name) return top2.name;
    const q2 = n.data.queues?.find((e) => e.id === id);
    if (q2?.name) return q2.name;
    const str2 = n.data.streams?.find((e) => e.id === id);
    if (str2?.name) return str2.name;
    const ch2 = n.data.channels?.find((e) => e.id === id);
    if (ch2?.name) return ch2.name;

    for (const ep of n.data.endpoints ?? []) {
      const epe2 = ep.publishedEvents?.find((e) => e.id === id);
      if (epe2?.name) return epe2.name;
    }
  }

  return undefined;
}

export function findEndpointDatabaseRefs(
  serviceId: string,
  endpoint: Endpoint,
  nodes: BackendNode[],
  edges: BackendEdge[],
) {
  const declared = new Set([
    ...(endpoint.databaseNodeIds ?? []),
    ...(endpoint.databaseNodeId ? [endpoint.databaseNodeId] : []),
  ]);
  const connected = edges
    .filter(
      (edge) =>
        edge.source === serviceId &&
        (edge.sourceHandle === `endpoint-out-${endpoint.id}` ||
          edge.sourceHandle === `endpoints-out-${endpoint.id}`) &&
        (edge.targetHandle === "database-target" ||
          edge.targetHandle === "database-source"),
    )
    .map((edge) => edge.target);
  const ids = declared.size > 0 ? [...declared] : connected;
  return ids
    .map((id) =>
      nodes.find(
        (node) =>
          node.id === id &&
          (node.type === "database" ||
            node.type === "db_ref" ||
            node.type === "vector_db_ref"),
      ),
    )
    .filter((node): node is BackendNode => Boolean(node));
}

export function findEndpoint(
  nodes: BackendNode[],
  nodeId: string,
  endpointId: string,
  endpoints: Array<Endpoint & { nodeId: string }> = [],
): { service: BackendNode; endpoint: Endpoint } | undefined {
  const service = nodes.find((node) => node.id === nodeId);
  if (!service) return undefined;
  let endpoint =
    endpoints.find(
      (item) => item.nodeId === nodeId && item.id === endpointId,
    ) ??
    service.data.endpoints?.find((item) => item.id === endpointId) ??
    service.data.routeGroups
      ?.flatMap((group) => group.endpoints)
      .find((item) => item.id === endpointId);

  if (!endpoint) {
    const messagingTypes: BackendNodeType[] = [
      "kafka",
      "sqs",
      "redis-streams",
      "redis-pubsub",
      "pubsub",
      "eventstream",
      "queue",
    ];
    if (messagingTypes.includes(service.type)) {
      const resourceId = endpointId.includes(":")
        ? endpointId.split(":").pop()
        : endpointId.split("-in-").pop();
      const resourceList =
        service.data.topics ||
        service.data.queues ||
        service.data.streams ||
        service.data.channels ||
        [];
      const resource =
        resourceList.find((r: any) => r.id === resourceId) || resourceList[0];
      const name = resource?.name || service.data.label || "Topic";
      endpoint = {
        id: resource?.id || endpointId,
        name: name,
        type: service.type.toUpperCase(),
      };
    } else {
      const consumedEv = service.data.consumedEvents?.find(
        (e: any) => e.id === endpointId,
      );
      const publishedEv = service.data.publishedEvents?.find(
        (e: any) => e.id === endpointId,
      );
      const ev = consumedEv || publishedEv;
      if (ev) {
        endpoint = {
          id: ev.id,
          name: ev.name || "Event Handler",
          type: "EVENT",
        };
      }
    }
  }

  return endpoint ? { service, endpoint } : undefined;
}

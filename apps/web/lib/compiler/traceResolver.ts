import { BackendNode, BackendEdge } from "@/types/canvas";
import {
  Endpoint,
  AnyMessagingResource,
  UIEventItem,
} from "@workspace/canvas/types";

export interface NodeConnectionDetail {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  detail: string;
  dataContext?: string;
}

export interface EndpointTraceResult {
  incoming: NodeConnectionDetail[];
  outgoing: NodeConnectionDetail[];
}

export interface EventTraceResult {
  incoming: NodeConnectionDetail[];
  outgoing: NodeConnectionDetail[];
}

/**
 * Deduplicates trace items based on nodeId, nodeName, and detail
 */
function deduplicateTraces(
  traces: NodeConnectionDetail[],
): NodeConnectionDetail[] {
  const seen = new Set<string>();
  return traces.filter((item) => {
    const key = `${item.nodeId}:${item.nodeName}:${item.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Clean path parameters for representation (e.g., /users/:id -> /users/1)
 */
function cleanPath(pathStr: string): string {
  const p = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
  return p.replace(/:\w+|\{\w+\}/g, "1");
}

/**
 * Formats configured database columns into a human-readable dataContext string
 */
export function formatDatabaseColumnsContext(
  node: BackendNode,
  allNodes: BackendNode[] = [],
): string {
  let targetNode = node;

  // If this is a Table Ref node, resolve the target Entity node
  if (node.type === "db_ref" && (node.data as any)?.tableRef) {
    const refEntity = allNodes.find(
      (n) => n.id === (node.data as any).tableRef,
    );
    if (refEntity) {
      targetNode = refEntity;
    }
  }

  const columns = (targetNode.data as any)?.columns as
    | Array<{
        name: string;
        type?: string;
        isPrimaryKey?: boolean;
        isNotNull?: boolean;
        isUnique?: boolean;
        isForeignKey?: boolean;
      }>
    | undefined;

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return "Schema Fields: (No columns configured)";
  }

  const fieldDefs = columns
    .filter((col) => col && col.name && col.name.trim() !== "")
    .map((col) => {
      const typeStr = col.type ? `: ${col.type}` : "";
      const flags: string[] = [];
      if (col.isPrimaryKey) flags.push("PK");
      if (col.isForeignKey) flags.push("FK");
      if (col.isNotNull) flags.push("REQUIRED");
      if (col.isUnique) flags.push("UNIQUE");
      const flagsStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
      return `${col.name}${typeStr}${flagsStr}`;
    });

  if (fieldDefs.length === 0) {
    return "Schema Fields: (No columns configured)";
  }

  return `Schema Fields: { ${fieldDefs.join(", ")} }`;
}

/**
 * Formats endpoint request payload/query/path params into a human-readable dataContext string
 */
export function formatEndpointPayloadContext(endpoint: Endpoint): string {
  const parts: string[] = [];

  // Headers
  if (Array.isArray(endpoint.headers) && endpoint.headers.length > 0) {
    const headersStr = endpoint.headers
      .filter((h: any) => h && h.name)
      .map(
        (h: any) =>
          `${h.name}${h.required === false ? "?" : ""}: ${h.type || "string"}`,
      )
      .join(", ");
    if (headersStr) parts.push(`Headers: { ${headersStr} }`);
  }

  // Path params
  if (Array.isArray(endpoint.pathParams) && endpoint.pathParams.length > 0) {
    const pathStr = endpoint.pathParams
      .filter((p: any) => p && p.name)
      .map(
        (p: any) =>
          `${p.name}${p.required === false ? "?" : ""}: ${p.type || "string"}`,
      )
      .join(", ");
    if (pathStr) parts.push(`Path Params: { ${pathStr} }`);
  }

  // Query params
  if (Array.isArray(endpoint.queryParams) && endpoint.queryParams.length > 0) {
    const queryStr = endpoint.queryParams
      .filter((q: any) => q && q.name)
      .map(
        (q: any) =>
          `${q.name}${q.required === false ? "?" : ""}: ${q.type || "string"}`,
      )
      .join(", ");
    if (queryStr) parts.push(`Query Params: { ${queryStr} }`);
  }

  // Request body fields or rawJson
  const reqBody = endpoint.requestBody as any;
  if (reqBody) {
    if (Array.isArray(reqBody.fields) && reqBody.fields.length > 0) {
      const fieldsStr = reqBody.fields
        .filter((f: any) => f && f.name)
        .map(
          (f: any) =>
            `${f.name}${f.required === false ? "?" : ""}: ${f.type || "string"}`,
        )
        .join(", ");
      if (fieldsStr) parts.push(`Body: { ${fieldsStr} }`);
    } else if (
      reqBody.rawJson &&
      typeof reqBody.rawJson === "string" &&
      reqBody.rawJson.trim()
    ) {
      parts.push(`Body: ${reqBody.rawJson.replace(/\s+/g, " ").trim()}`);
    }
  }

  // Response body fields or rawJson
  const resBody = endpoint.responseBody as any;
  if (resBody) {
    if (Array.isArray(resBody.fields) && resBody.fields.length > 0) {
      const resFieldsStr = resBody.fields
        .filter((f: any) => f && f.name)
        .map((f: any) => `${f.name}: ${f.type || "string"}`)
        .join(", ");
      if (resFieldsStr) parts.push(`Response: { ${resFieldsStr} }`);
    } else if (
      resBody.rawJson &&
      typeof resBody.rawJson === "string" &&
      resBody.rawJson.trim()
    ) {
      parts.push(`Response: ${resBody.rawJson.replace(/\s+/g, " ").trim()}`);
    }
  }

  // Legacy body string fallback (only if JSON format, not TypeScript code)
  if (parts.length === 0 && endpoint.body && endpoint.body.trim()) {
    const text = endpoint.body.trim();
    if (text.startsWith("{") && text.endsWith("}") && !text.includes("return ") && !text.includes("await ") && !text.includes("const ")) {
      parts.push(`Payload: ${text}`);
    }
  }

  if (parts.length > 0) {
    return parts.join(" | ");
  }

  return "Payload: Request params/body (No specific fields defined)";
}

/**
 * Traverses incoming edges to an Endpoint on a Service Node
 */
export function resolveEndpointTrace(
  serviceNode: BackendNode,
  endpoint: Endpoint,
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  allEndpoints: (Endpoint & { nodeId: string })[] = [],
): EndpointTraceResult {
  const incoming: NodeConnectionDetail[] = [];
  const outgoing: NodeConnectionDetail[] = [];

  const epId = endpoint.id;
  const epName = endpoint.name || "";
  const epMethod = (endpoint.type || "GET").toUpperCase();
  const epPath = cleanPath(epName);

  // 1. Resolve INCOMING Connections (edges into serviceNode matching this endpoint)
  const incomingEdges = allEdges.filter((e) => {
    if (e.target !== serviceNode.id) return false;
    if (!e.targetHandle) return true;
    const th = e.targetHandle;

    if (th.includes("-in-")) {
      const parts = th.split("-in-");
      const handleEpId = parts[parts.length - 1];
      if (handleEpId && handleEpId !== epId && handleEpId !== epName) {
        return false;
      }
    }

    return (
      th.includes(epId) ||
      (epName && th.includes(epName)) ||
      th.startsWith("endpoint-in") ||
      th.startsWith("endpoints-in") ||
      th.startsWith("events-in")
    );
  });

  incomingEdges.forEach((edge) => {
    const srcNode = allNodes.find((n) => n.id === edge.source);
    if (!srcNode) return;

    const srcName = srcNode.data?.label || srcNode.id;
    const srcTypeStr = srcNode.type as string;

    // A. WebClient Node
    if (srcNode.type === "webClient" || (srcNode.data as any)?.isWebClient) {
      let eventDetail = "UI Action / Link";
      const srcEvents: UIEventItem[] =
        (srcNode.data?.events as UIEventItem[]) || [];
      const sh = edge.sourceHandle || "";
      const matchedEvt = srcEvents.find(
        (evt) => sh.includes(evt.id) || (evt.name && sh.includes(evt.name)),
      );
      if (matchedEvt) {
        eventDetail = `Trigger Event "${matchedEvt.name || "Action"}" (${matchedEvt.event || "click"})`;
      }

      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "WebClient Page",
        detail: eventDetail,
        dataContext: formatEndpointPayloadContext(endpoint),
      });
    }
    // B. Database / Entity Node
    else if (
      srcNode.type === "entity" ||
      srcNode.type === "db_ref" ||
      srcTypeStr === "db" ||
      srcTypeStr === "database"
    ) {
      const tableName =
        (srcNode.data as any)?.tableName ||
        srcName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "Database Table",
        detail: `Table "${tableName}"`,
        dataContext: formatDatabaseColumnsContext(srcNode, allNodes),
      });
    }
    // C. Service Node
    else if (srcNode.type === "service") {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "Microservice",
        detail: `HTTP Client call to ${epMethod} ${epPath}`,
        dataContext: formatEndpointPayloadContext(endpoint),
      });
    }
    // D. API Gateway / Load Balancer
    else if (
      srcNode.type === "api_gateway" ||
      srcNode.type === "load_balancer"
    ) {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType:
          srcNode.type === "api_gateway" ? "API Gateway" : "Load Balancer",
        detail: `Routed through gateway endpoint (Port ${(srcNode.data as any)?.port || "8000"})`,
        dataContext: `Routes to ${epMethod} ${epPath}`,
      });
    }
    // E. External API / Webhook / Other
    else {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: srcNode.type,
        detail: `Incoming connection from ${srcName}`,
        dataContext: formatEndpointPayloadContext(endpoint),
      });
    }
  });

  // 2. Resolve OUTGOING Connections (edges from serviceNode matching this endpoint)
  const outgoingEdges = allEdges.filter((e) => {
    if (e.source !== serviceNode.id) return false;
    if (!e.sourceHandle) return true;
    const sh = e.sourceHandle;

    if (sh.includes("-out-")) {
      const parts = sh.split("-out-");
      const handleEpId = parts[parts.length - 1];
      if (handleEpId && handleEpId !== epId && handleEpId !== epName) {
        return false;
      }
    }

    return (
      sh.includes(epId) ||
      (epName && sh.includes(epName)) ||
      sh.startsWith("endpoint-out") ||
      sh.startsWith("endpoints-out") ||
      sh.startsWith("database-source") ||
      sh.startsWith("published-events")
    );
  });

  outgoingEdges.forEach((edge) => {
    const tgtNode = allNodes.find((n) => n.id === edge.target);
    if (!tgtNode) return;

    const tgtName = tgtNode.data?.label || tgtNode.id;
    const nodeData = tgtNode.data as any;
    const nodeTypeStr = tgtNode.type as string;

    // A. Database / Entity Node
    if (
      tgtNode.type === "entity" ||
      tgtNode.type === "db_ref" ||
      nodeTypeStr === "db" ||
      nodeTypeStr === "database"
    ) {
      const tableName =
        nodeData?.tableName ||
        tgtName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Database Table",
        detail: `Table "${tableName}"`,
        dataContext: formatDatabaseColumnsContext(tgtNode, allNodes),
      });
    }
    // B. Service Node
    else if (tgtNode.type === "service") {
      let targetEpInfo = `HTTP Request to Service (Port ${nodeData?.port || "8080"})`;
      const tgtEndpoints = allEndpoints.filter((e) => e.nodeId === tgtNode.id);
      let targetDataContext = `Base URL: http://localhost:${nodeData?.port || "8080"}`;

      if (tgtEndpoints.length > 0) {
        const firstEp = tgtEndpoints[0]!;
        targetEpInfo = `Calls ${(firstEp.type || "GET").toUpperCase()} ${firstEp.name || "/"} on ${tgtName}`;
        targetDataContext = formatEndpointPayloadContext(firstEp);
      }

      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Microservice",
        detail: targetEpInfo,
        dataContext: targetDataContext,
      });
    }
    // C. Messaging Broker Node
    else if (
      [
        "kafka",
        "sqs",
        "redis-streams",
        "redis-pubsub",
        "pubsub",
        "eventstream",
        "queue",
      ].includes(nodeTypeStr)
    ) {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Message Broker",
        detail: `Publish event / message to ${tgtName} (${tgtNode.type})`,
        dataContext: `Broker topic/queue event stream`,
      });
    }
    // D. Other
    else {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: tgtNode.type,
        detail: `Outgoing connection to ${tgtName}`,
      });
    }
  });

  return {
    incoming: deduplicateTraces(incoming),
    outgoing: deduplicateTraces(outgoing),
  };
}

/**
 * Traverses incoming & outgoing connections for an Event Consumer
 */
export function resolveConsumerTrace(
  serviceNode: BackendNode,
  consumedEvent: AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  },
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
): EventTraceResult {
  const incoming: NodeConnectionDetail[] = [];
  const outgoing: NodeConnectionDetail[] = [];

  const evtName = consumedEvent.name || "event";
  const evtId = consumedEvent.id;

  // 1. Incoming: Who publishes or sends this event?
  const incomingEdges = allEdges.filter((e) => {
    if (e.target !== serviceNode.id) return false;
    const th = e.targetHandle || "";
    return (
      th.includes(evtId) ||
      th.includes(evtName) ||
      th.startsWith("consumed-events") ||
      th.startsWith("events-in")
    );
  });

  incomingEdges.forEach((edge) => {
    const srcNode = allNodes.find((n) => n.id === edge.source);
    if (!srcNode) return;
    const srcName = srcNode.data?.label || srcNode.id;
    const srcTypeStr = srcNode.type as string;

    if (srcNode.type === "service") {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "Publisher Service",
        detail: `Published by ${srcName}`,
        dataContext: consumedEvent.payloadSchema?.rawJson
          ? `Payload: ${consumedEvent.payloadSchema.rawJson.replace(/\s+/g, " ")}`
          : "Event Payload object",
      });
    } else if (
      [
        "kafka",
        "sqs",
        "redis-streams",
        "redis-pubsub",
        "pubsub",
        "eventstream",
        "queue",
      ].includes(srcTypeStr)
    ) {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "Message Broker",
        detail: `Consumes topic/channel "${evtName}" from ${srcName}`,
        dataContext: consumedEvent.payloadSchema?.rawJson
          ? `Payload: ${consumedEvent.payloadSchema.rawJson.replace(/\s+/g, " ")}`
          : "Event Payload object",
      });
    } else {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: srcNode.type,
        detail: `Event source from ${srcName}`,
      });
    }
  });

  if (incoming.length === 0) {
    incoming.push({
      nodeId: "event-bus",
      nodeName: "Event Bus / Message Queue",
      nodeType: "Message Broker",
      detail: `Consumes topic/event "${evtName}"`,
      dataContext: consumedEvent.payloadSchema?.rawJson
        ? `Payload Schema: ${consumedEvent.payloadSchema.rawJson.replace(/\s+/g, " ")}`
        : "Event Payload",
    });
  }

  // 2. Outgoing: Where does consumer output go? (DB mutation, downstream service)
  const outgoingEdges = allEdges.filter((e) => e.source === serviceNode.id);
  outgoingEdges.forEach((edge) => {
    const tgtNode = allNodes.find((n) => n.id === edge.target);
    if (!tgtNode) return;
    const tgtName = tgtNode.data?.label || tgtNode.id;
    const nodeData = tgtNode.data as any;
    const tgtTypeStr = tgtNode.type as string;

    if (
      tgtNode.type === "entity" ||
      tgtNode.type === "db_ref" ||
      tgtTypeStr === "db" ||
      tgtTypeStr === "database"
    ) {
      const tableName =
        nodeData?.tableName ||
        tgtName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Database Table",
        detail: `Mutates/Saves to Table "${tableName}"`,
      });
    } else if (tgtNode.type === "service") {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Microservice",
        detail: `Triggers downstream call to ${tgtName}`,
      });
    }
  });

  return {
    incoming: deduplicateTraces(incoming),
    outgoing: deduplicateTraces(outgoing),
  };
}

/**
 * Traverses incoming & outgoing connections for an Event Producer
 */
export function resolveProducerTrace(
  serviceNode: BackendNode,
  publishedEvent: AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  },
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
): EventTraceResult {
  const incoming: NodeConnectionDetail[] = [];
  const outgoing: NodeConnectionDetail[] = [];

  const evtName = publishedEvent.name || "event";
  const evtId = publishedEvent.id;

  // 1. Incoming: Triggered by internal route/logic
  incoming.push({
    nodeId: serviceNode.id,
    nodeName: serviceNode.data?.label || "Current Service",
    nodeType: "Internal Service Handler",
    detail: `Invoked by route handler or domain logic within ${serviceNode.data?.label || "Service"}`,
  });

  // 2. Outgoing: Which broker or downstream service consumes this?
  const outgoingEdges = allEdges.filter((e) => {
    if (e.source !== serviceNode.id) return false;
    const sh = e.sourceHandle || "";
    return (
      sh.includes(evtId) ||
      sh.includes(evtName) ||
      sh.startsWith("published-events") ||
      sh.startsWith("events-out")
    );
  });

  outgoingEdges.forEach((edge) => {
    const tgtNode = allNodes.find((n) => n.id === edge.target);
    if (!tgtNode) return;
    const tgtName = tgtNode.data?.label || tgtNode.id;
    const tgtTypeStr = tgtNode.type as string;

    if (
      [
        "kafka",
        "sqs",
        "redis-streams",
        "redis-pubsub",
        "pubsub",
        "eventstream",
        "queue",
      ].includes(tgtTypeStr)
    ) {
      // Find downstream consumers of this broker
      const brokerEdges = allEdges.filter((be) => be.source === tgtNode.id);
      const downstreamConsumers = brokerEdges
        .map((be) => allNodes.find((n) => n.id === be.target)?.data?.label)
        .filter(Boolean);

      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Message Broker",
        detail: `Publishes topic/channel "${evtName}" to ${tgtName}`,
        dataContext:
          downstreamConsumers.length > 0
            ? `Subscribed Consumers: [${downstreamConsumers.join(", ")}]`
            : "Pushes event to broker queue",
      });
    } else if (tgtNode.type === "service") {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Consumer Service",
        detail: `Consumed directly by ${tgtName}`,
      });
    } else {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: tgtNode.type,
        detail: `Target destination ${tgtName}`,
      });
    }
  });

  if (outgoing.length === 0) {
    outgoing.push({
      nodeId: "event-broker",
      nodeName: "Messaging Broker / Queue",
      nodeType: "Message Broker",
      detail: `Publishes event topic "${evtName}"`,
      dataContext: `Event payload structure: ${publishedEvent.payloadSchema?.rawJson || "Object"}`,
    });
  }

  return {
    incoming: deduplicateTraces(incoming),
    outgoing: deduplicateTraces(outgoing),
  };
}

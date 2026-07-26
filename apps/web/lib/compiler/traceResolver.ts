import { BackendNode, BackendEdge } from "@/types/canvas";
import { Endpoint, AnyMessagingResource, UIEventItem } from "@workspace/canvas/types";

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
function deduplicateTraces(traces: NodeConnectionDetail[]): NodeConnectionDetail[] {
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
 * Traverses incoming edges to an Endpoint on a Service Node
 */
export function resolveEndpointTrace(
  serviceNode: BackendNode,
  endpoint: Endpoint,
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  allEndpoints: (Endpoint & { nodeId: string })[] = []
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

    // A. WebClient Node
    if (srcNode.type === "webClient" || (srcNode.data as any)?.isWebClient) {
      let eventDetail = "UI Action / Link";
      const srcEvents: UIEventItem[] = (srcNode.data?.events as UIEventItem[]) || [];
      const sh = edge.sourceHandle || "";
      const matchedEvt = srcEvents.find((evt) => sh.includes(evt.id) || (evt.name && sh.includes(evt.name)));
      if (matchedEvt) {
        eventDetail = `Trigger Event "${matchedEvt.name || "Action"}" (${matchedEvt.event || "click"})`;
      }

      let payloadContext = "Sends request params/query/body payload";
      if (endpoint.requestBody?.rawJson) {
        payloadContext = `Request Body: ${endpoint.requestBody.rawJson.replace(/\s+/g, " ")}`;
      }

      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "WebClient Page Node",
        detail: eventDetail,
        dataContext: payloadContext,
      });
    }
    // B. Service Node
    else if (srcNode.type === "service") {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "Microservice Node",
        detail: `HTTP Client call to ${epMethod} ${epPath}`,
        dataContext: `Calls Port ${(serviceNode.data as any)?.port || "8080"}`,
      });
    }
    // C. API Gateway / Load Balancer
    else if (srcNode.type === "api_gateway" || srcNode.type === "load_balancer") {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: srcNode.type === "api_gateway" ? "API Gateway" : "Load Balancer",
        detail: `Routed through gateway endpoint (Port ${(srcNode.data as any)?.port || "8000"})`,
        dataContext: `Routes to ${epMethod} ${epPath}`,
      });
    }
    // D. External API / Webhook / Other
    else {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: `${srcNode.type} Node`,
        detail: `Incoming connection from ${srcName}`,
        dataContext: `Data payload to ${epMethod} ${epPath}`,
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
    if (tgtNode.type === "entity" || tgtNode.type === "db_ref" || nodeTypeStr === "db" || nodeTypeStr === "database") {
      const tableName = nodeData?.tableName || tgtName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Database Entity Node",
        detail: `Database Table "${tableName}"`,
        dataContext: `Executes SQL query/mutation on ${tableName}`,
      });
    }
    // B. Service Node
    else if (tgtNode.type === "service") {
      let targetEpInfo = `HTTP Request to Service (Port ${nodeData?.port || "8080"})`;
      const tgtEndpoints = allEndpoints.filter((e) => e.nodeId === tgtNode.id);
      if (tgtEndpoints.length > 0) {
        const firstEp = tgtEndpoints[0]!;
        targetEpInfo = `Calls ${(firstEp.type || "GET").toUpperCase()} ${firstEp.name || "/"} on ${tgtName}`;
      }

      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Microservice Node",
        detail: targetEpInfo,
        dataContext: `Base URL: http://localhost:${nodeData?.port || "8080"}`,
      });
    }
    // C. Messaging Broker Node
    else if (
      ["kafka", "sqs", "redis-streams", "redis-pubsub", "pubsub", "eventstream", "queue"].includes(nodeTypeStr)
    ) {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Message Broker Node",
        detail: `Publish event / message to ${tgtName} (${tgtNode.type})`,
        dataContext: `Broker topic/queue event stream`,
      });
    }
    // D. Other
    else {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: `${tgtNode.type} Node`,
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
  consumedEvent: AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" },
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = []
): EventTraceResult {
  const incoming: NodeConnectionDetail[] = [];
  const outgoing: NodeConnectionDetail[] = [];

  const evtName = consumedEvent.name || "event";
  const evtId = consumedEvent.id;

  // 1. Incoming: Who publishes or sends this event?
  const incomingEdges = allEdges.filter((e) => {
    if (e.target !== serviceNode.id) return false;
    const th = e.targetHandle || "";
    return th.includes(evtId) || th.includes(evtName) || th.startsWith("consumed-events") || th.startsWith("events-in");
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
        nodeType: "Publisher Microservice Node",
        detail: `Published by ${srcName}`,
        dataContext: consumedEvent.payloadSchema?.rawJson
          ? `Payload: ${consumedEvent.payloadSchema.rawJson.replace(/\s+/g, " ")}`
          : "Event Payload object",
      });
    } else if (
      ["kafka", "sqs", "redis-streams", "redis-pubsub", "pubsub", "eventstream", "queue"].includes(srcTypeStr)
    ) {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: "Message Broker Node",
        detail: `Consumes topic/channel "${evtName}" from ${srcName}`,
        dataContext: consumedEvent.payloadSchema?.rawJson
          ? `Payload: ${consumedEvent.payloadSchema.rawJson.replace(/\s+/g, " ")}`
          : "Event Payload object",
      });
    } else {
      incoming.push({
        nodeId: srcNode.id,
        nodeName: srcName,
        nodeType: `${srcNode.type} Node`,
        detail: `Event source from ${srcName}`,
      });
    }
  });

  if (incoming.length === 0) {
    incoming.push({
      nodeId: "event-bus",
      nodeName: "Event Bus / Message Queue",
      nodeType: "Messaging Broker",
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

    if (tgtNode.type === "entity" || tgtNode.type === "db_ref" || tgtTypeStr === "db" || tgtTypeStr === "database") {
      const tableName = nodeData?.tableName || tgtName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Database Entity Node",
        detail: `Mutates/Saves to Table "${tableName}"`,
      });
    } else if (tgtNode.type === "service") {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Microservice Node",
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
  publishedEvent: AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" },
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = []
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
    return sh.includes(evtId) || sh.includes(evtName) || sh.startsWith("published-events") || sh.startsWith("events-out");
  });

  outgoingEdges.forEach((edge) => {
    const tgtNode = allNodes.find((n) => n.id === edge.target);
    if (!tgtNode) return;
    const tgtName = tgtNode.data?.label || tgtNode.id;
    const tgtTypeStr = tgtNode.type as string;

    if (
      ["kafka", "sqs", "redis-streams", "redis-pubsub", "pubsub", "eventstream", "queue"].includes(tgtTypeStr)
    ) {
      // Find downstream consumers of this broker
      const brokerEdges = allEdges.filter((be) => be.source === tgtNode.id);
      const downstreamConsumers = brokerEdges
        .map((be) => allNodes.find((n) => n.id === be.target)?.data?.label)
        .filter(Boolean);

      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: "Message Broker Node",
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
        nodeType: "Consumer Microservice Node",
        detail: `Consumed directly by ${tgtName}`,
      });
    } else {
      outgoing.push({
        nodeId: tgtNode.id,
        nodeName: tgtName,
        nodeType: `${tgtNode.type} Node`,
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

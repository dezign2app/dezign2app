import { BackendNode, BackendEdge } from "@/types/canvas";
import { Endpoint } from "@workspace/canvas/types";
import { LinkedEndpointInfo } from "./types";

export function getServicePort(targetNode: BackendNode): string {
  return targetNode.data?.port?.trim() || "8080";
}

export function resolveLinkedEndpoint(
  fromNodeId: string,
  eventId: string,
  allNodes: BackendNode[],
  allEdges: BackendEdge[],
  allEndpoints: (Endpoint & { nodeId: string })[] = [],
  depth: number = 0,
): LinkedEndpointInfo | null {
  if (depth > 5) return null;

  const edge = allEdges.find(
    (e) =>
      e.source === fromNodeId &&
      (e.sourceHandle === `events-${eventId}` ||
        e.sourceHandle === eventId ||
        e.sourceHandle?.endsWith(eventId)),
  );

  if (!edge || !edge.target) return null;

  const targetNode = allNodes.find((n) => n.id === edge.target);
  if (!targetNode) return null;

  const targetHandle = edge.targetHandle || "";

  if (
    targetHandle.startsWith("pageload-in-") ||
    targetHandle.startsWith("sse-in-") ||
    targetHandle.startsWith("websocket-in-") ||
    targetHandle.startsWith("ws-in-") ||
    targetHandle.startsWith("event-in-")
  ) {
    const nextEventId = targetHandle.replace(
      /^(pageload|sse|websocket|ws|event)-in-/,
      "",
    );
    return resolveLinkedEndpoint(
      edge.target,
      nextEventId,
      allNodes,
      allEdges,
      allEndpoints,
      depth + 1,
    );
  }

  if (targetNode.type === "service") {
    const targetPort = getServicePort(targetNode);
    const targetServiceName = targetNode.data?.label || "Service";

    let endpointId = targetHandle
      ? targetHandle.replace(
          /^(endpoint-in-|endpoint-out-|endpoints-in-|endpoints-out-|events-in-|events-out-)/,
          "",
        )
      : undefined;

    if (endpointId && endpointId.includes("-in-")) {
      const parts = endpointId.split("-in-");
      endpointId = parts[parts.length - 1];
    }

    let ep: Endpoint | undefined;

    if (endpointId) {
      ep = allEndpoints.find(
        (e) =>
          e.nodeId === targetNode.id &&
          (e.id === endpointId || e.name === endpointId),
      );

      if (!ep && targetNode.data?.endpoints) {
        ep = (targetNode.data.endpoints as Endpoint[]).find(
          (e) => e.id === endpointId || e.name === endpointId,
        );
      }

      if (!ep && targetNode.data?.routeGroups) {
        for (const group of targetNode.data.routeGroups) {
          if (group.endpoints) {
            ep = group.endpoints.find(
              (e: Endpoint) => e.id === endpointId || e.name === endpointId,
            );
            if (ep) break;
          }
        }
      }
    }

    if (!ep && endpointId) {
      const consumed = targetNode.data?.consumedEvents?.find(
        (e: any) => e.id === endpointId || e.name === endpointId,
      );
      const published = targetNode.data?.publishedEvents?.find(
        (e: any) => e.id === endpointId || e.name === endpointId,
      );
      const eventMatch = consumed || published;
      if (eventMatch) {
        ep = {
          id: eventMatch.id,
          name: eventMatch.name
            ? eventMatch.name.startsWith("/")
              ? eventMatch.name
              : `/events/${eventMatch.name}`
            : "/events",
          type: "POST",
        };
      }
    }

    if (!ep) {
      const srvEndpoints = allEndpoints.filter(
        (e) => e.nodeId === targetNode.id,
      );
      if (srvEndpoints.length > 0) {
        ep = srvEndpoints[0];
      } else if (
        targetNode.data?.endpoints &&
        (targetNode.data.endpoints as Endpoint[]).length > 0
      ) {
        ep = (targetNode.data.endpoints as Endpoint[])[0];
      }
    }

    const method = (ep?.type || "GET").toUpperCase();
    const rawPath = ep?.name || "data";
    let path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

    path = path.replace(/:\w+|\{\w+\}/g, "1");

    const fullUrl = `http://localhost:${targetPort}${path}`;

    return {
      targetNodeId: targetNode.id,
      targetNodeName: targetServiceName,
      targetNodePort: targetPort,
      endpointId: ep?.id,
      endpointName: ep?.name || "Endpoint",
      method,
      path,
      fullUrl,
    };
  }

  if (
    targetNode.type === "api_gateway" ||
    targetNode.type === "load_balancer"
  ) {
    const gatewayPort = targetNode.data?.port || "8000";
    const outgoingEdge = allEdges.find((e) => e.source === targetNode.id);
    if (outgoingEdge) {
      const downstreamNode = allNodes.find((n) => n.id === outgoingEdge.target);
      if (downstreamNode && downstreamNode.type === "service") {
        const downstreamPort = getServicePort(downstreamNode);
        const resolved = resolveLinkedEndpoint(
          targetNode.id,
          eventId,
          allNodes,
          allEdges,
          allEndpoints,
          depth + 1,
        );
        if (resolved) {
          return resolved;
        }
        return {
          targetNodeId: downstreamNode.id,
          targetNodeName: downstreamNode.data?.label || "Service",
          targetNodePort: downstreamPort,
          endpointName: "Gateway Route",
          method: "GET",
          path: "/api/v1",
          fullUrl: `http://localhost:${downstreamPort}/api/v1`,
        };
      }
    }

    return {
      targetNodeId: targetNode.id,
      targetNodeName: targetNode.data?.label || "API Gateway",
      targetNodePort: gatewayPort,
      endpointName: "Gateway Endpoint",
      method: "GET",
      path: "/api/gateway",
      fullUrl: `http://localhost:${gatewayPort}/api/gateway`,
    };
  }

  const messagingTypes = [
    "kafka",
    "sqs",
    "redis-streams",
    "redis-pubsub",
    "pubsub",
    "eventstream",
    "queue",
  ];
  if (messagingTypes.includes(targetNode.type)) {
    const resourceList =
      targetNode.data?.topics ||
      targetNode.data?.queues ||
      targetNode.data?.streams ||
      targetNode.data?.channels ||
      [];
    const resource = resourceList[0];
    const resourceName = resource?.name || targetNode.data?.label || "topic";
    const path = `/api/messages/${resourceName}`;
    const fullUrl = `http://localhost:8080${path}`;

    return {
      targetNodeId: targetNode.id,
      targetNodeName: targetNode.data?.label || "Broker",
      targetNodePort: "8080",
      endpointName: resourceName,
      method: "POST",
      path,
      fullUrl,
    };
  }

  return null;
}

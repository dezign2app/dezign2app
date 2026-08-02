import type {
  BackendNode,
  BackendEdge,
  Endpoint,
  AnyMessagingResource,
} from "@/types/canvas";

export interface MockableItem {
  id: string;
  label: string;
  type: string;
  description: string;
  isInitial?: boolean;
}

export function resolveEndpoint(
  targetNode: BackendNode | undefined,
  endpointId: string,
  endpoints: Array<Endpoint & { nodeId?: string }>,
): Endpoint | undefined {
  const messagingTypes: readonly string[] = [
    "kafka",
    "sqs",
    "redis-streams",
    "redis-pubsub",
    "pubsub",
    "eventstream",
    "queue",
  ];

  const foundInStore = endpoints.find((e) => e.id === endpointId);
  if (foundInStore) return foundInStore;

  const foundInNode = targetNode?.data?.endpoints?.find((e) => e.id === endpointId);
  if (foundInNode) return foundInNode;

  const routeGroups = targetNode?.data?.routeGroups ?? [];
  for (const group of routeGroups) {
    const foundInGroup = group.endpoints?.find((e) => e.id === endpointId);
    if (foundInGroup) return foundInGroup;
  }

  if (targetNode) {
    if (messagingTypes.includes(targetNode.type)) {
      const resourceList: AnyMessagingResource[] =
        targetNode.data?.topics ||
        targetNode.data?.queues ||
        targetNode.data?.streams ||
        targetNode.data?.channels ||
        [];
      const resource =
        resourceList.find((r) => r.id === endpointId) || resourceList[0];
      const name = resource?.name || targetNode.data?.label || "Topic";
      return {
        id: resource?.id || endpointId,
        name,
        type: targetNode.type.toUpperCase(),
        summary: `Messaging Topic on ${targetNode.data?.label || "Kafka"}`,
      };
    }

    const consumedEv = targetNode.data?.consumedEvents?.find(
      (e) => e.id === endpointId,
    );
    const publishedEv = targetNode.data?.publishedEvents?.find(
      (e) => e.id === endpointId,
    );
    const ev = consumedEv || publishedEv;
    if (ev) {
      return {
        id: ev.id,
        name: ev.name || "Event Handler",
        type: "EVENT",
      };
    }
  }

  return undefined;
}

export function getDownstreamMocks(
  endpoint: Endpoint | undefined,
  targetNode: BackendNode | undefined,
  nodes: BackendNode[],
  edges: BackendEdge[],
  endpoints: Array<Endpoint & { nodeId?: string }>,
): MockableItem[] {
  if (!endpoint || !targetNode) return [];

  const mockables: MockableItem[] = [];

  const isMessagingTarget = [
    "KAFKA",
    "SQS",
    "REDIS-STREAMS",
    "REDIS-PUBSUB",
    "PUBSUB",
    "EVENTSTREAM",
    "QUEUE",
  ].includes(endpoint.type || "");

  mockables.push({
    id: endpoint.id,
    label: isMessagingTarget
      ? `${targetNode.data?.label || "Broker"}: ${endpoint.name}`
      : `${targetNode.data?.label || "Service"}: ${endpoint.type || "GET"} ${endpoint.name}`,
    type: isMessagingTarget ? "messaging" : "endpoint",
    description: isMessagingTarget
      ? "Target Broker / Topic"
      : "Target Endpoint",
    isInitial: true,
  });

  const isEdgeFromCurrentEndpoint = (
    edge: BackendEdge,
    service: BackendNode,
    currentEp?: Endpoint,
  ): boolean => {
    if (!currentEp) return true;

    const epId = currentEp.id;
    const messagingTypes: readonly string[] = [
      "kafka",
      "sqs",
      "redis-streams",
      "redis-pubsub",
      "pubsub",
      "eventstream",
      "queue",
    ];

    if (messagingTypes.includes(service.type)) {
      const pubTopicId = edge.sourceHandle?.split(":").pop();
      if (pubTopicId && pubTopicId !== epId) return false;
      return true;
    }

    if (
      edge.sourceHandle === `endpoint-out-${epId}` ||
      edge.sourceHandle === `endpoints-out-${epId}` ||
      edge.sourceHandle === "database-target" ||
      edge.targetHandle === "database-target" ||
      edge.targetHandle === "database-source"
    ) {
      return true;
    }

    if (edge.sourceHandle?.startsWith("publishedEvents-out-")) {
      const pubEventId = edge.sourceHandle.replace(
        "publishedEvents-out-",
        "",
      );
      if (pubEventId === epId) return true;
      const epPubEvents = currentEp.publishedEvents || [];
      if (epPubEvents.some((pe) => pe.id === pubEventId)) return true;
    }

    return false;
  };

  const visitedKeys = new Set<string>();
  const queue: { service: BackendNode; endpoint?: Endpoint }[] = [
    { service: targetNode, endpoint },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const serviceId = current.service.id;
    const epId = current.endpoint?.id;

    const key = `${serviceId}:${epId || "node"}`;
    if (visitedKeys.has(key)) continue;
    visitedKeys.add(key);

    if (current.endpoint && current.endpoint.id !== endpoint.id) {
      if (!mockables.some((m) => m.id === current.endpoint?.id)) {
        mockables.push({
          id: current.endpoint.id,
          label: `${current.service.data?.label || "Service"} / ${current.endpoint.type || "EVENT"} ${current.endpoint.name}`,
          type: current.endpoint.type === "EVENT" ? "event" : "endpoint",
          description:
            current.endpoint.type === "EVENT"
              ? "Event Consumer"
              : "Service Endpoint",
        });
      }
    }

    const declaredDbIds = [
      ...(current.endpoint?.databaseNodeIds ?? []),
      ...(current.endpoint?.databaseNodeId
        ? [current.endpoint.databaseNodeId]
        : []),
    ];
    for (const dbId of declaredDbIds) {
      const dbNode = nodes.find((n) => n.id === dbId);
      if (dbNode && !mockables.some((m) => m.id === dbNode.id)) {
        const isVector = dbNode.type === "vector_db_ref";
        mockables.push({
          id: dbNode.id,
          label: `${isVector ? "Vector DB" : "Database"} / ${dbNode.data?.label || "Table"}`,
          type: isVector ? "vectordb" : "database",
          description: isVector ? "Vector DB Table" : "Database Table",
        });
      }
    }

    const outgoingEdges = edges.filter(
      (e) =>
        e.source === serviceId &&
        isEdgeFromCurrentEndpoint(e, current.service, current.endpoint),
    );

    for (const edge of outgoingEdges) {
      const target = nodes.find((n) => n.id === edge.target);
      if (!target) continue;
      const isDbOrRef = [
        "database",
        "db_ref",
        "vector_db_ref",
        "redis-cache",
        "storage",
        "search_index",
      ].includes(target.type);
      if (isDbOrRef && !mockables.some((m) => m.id === target.id)) {
        let typeKey = "database";
        let desc = "Database Table";
        let prefix = "Database";

        if (target.type === "vector_db_ref") {
          typeKey = "vectordb";
          desc = "Vector DB Table";
          prefix = "Vector DB";
        } else if (target.type === "redis-cache") {
          typeKey = "cache";
          desc = "Redis Cache";
          prefix = "Cache";
        } else if (target.type === "storage") {
          typeKey = "storage";
          desc = "Object Storage";
          prefix = "Storage";
        } else if (target.type === "search_index") {
          typeKey = "search";
          desc = "Search Index";
          prefix = "Search Index";
        }

        mockables.push({
          id: target.id,
          label: `${prefix} / ${target.data?.label || "Table"}`,
          type: typeKey,
          description: desc,
        });
      }
    }

    for (const edge of outgoingEdges) {
      const target = nodes.find((n) => n.id === edge.target);
      if (!target) continue;

      if (target.type === "external") {
        if (!mockables.some((m) => m.id === target.id)) {
          const apiName = target.data?.label || "External API";
          mockables.push({
            id: target.id,
            label: `External / ${apiName}`,
            type: target.type,
            description: "External API",
          });
        }
      } else if (target.type === "service") {
        const isEndpointEdge = edge.targetHandle?.startsWith("endpoint-in-");
        const isEventEdge =
          edge.targetHandle?.startsWith("consumedEvents-in-");

        if (isEndpointEdge || isEventEdge) {
          const nextId = edge.targetHandle?.replace(
            /^(endpoint|consumedEvents)-in-/,
            "",
          );
          if (nextId) {
            let nextEndpoint: Endpoint | undefined = endpoints.find(
              (ep) => ep.nodeId === target.id && ep.id === nextId,
            );
            if (!nextEndpoint) {
              nextEndpoint = target.data?.endpoints?.find(
                (ep) => ep.id === nextId,
              );
            }
            if (!nextEndpoint && target.data?.routeGroups) {
              for (const group of target.data.routeGroups) {
                nextEndpoint = group.endpoints?.find(
                  (ep) => ep.id === nextId,
                );
                if (nextEndpoint) break;
              }
            }

            if (nextEndpoint) {
              if (!mockables.some((m) => m.id === nextEndpoint?.id)) {
                mockables.push({
                  id: nextEndpoint.id,
                  label: `${target.data?.label || "Service"} / ${nextEndpoint.type || "GET"} ${nextEndpoint.name}`,
                  type: isEventEdge ? "event" : "endpoint",
                  description: isEventEdge
                    ? "Event Consumer"
                    : "Service Endpoint",
                });
              }
              queue.push({ service: target, endpoint: nextEndpoint });
            }
          }
        }
      }
    }

    for (const edge of outgoingEdges) {
      const target = nodes.find((n) => n.id === edge.target);
      if (!target) continue;

      const isMessaging = [
        "kafka",
        "sqs",
        "redis-streams",
        "redis-pubsub",
        "pubsub",
        "eventstream",
        "queue",
      ].includes(target.type);
      if (isMessaging) {
        const resourceId = edge.targetHandle?.includes(":")
          ? edge.targetHandle.split(":").pop()
          : edge.targetHandle?.split("-in-").pop();
        const resourceList: AnyMessagingResource[] =
          target.data?.topics ||
          target.data?.queues ||
          target.data?.streams ||
          target.data?.channels ||
          [];
        const resource =
          resourceList.find((r) => r.id === resourceId) ||
          resourceList[0];
        const topicName = resource?.name || target.data?.label || "Topic";
        const mockId = resource?.id || target.id;

        if (!mockables.some((m) => m.id === mockId)) {
          mockables.push({
            id: mockId,
            label: `${target.data?.label || "Kafka"} / ${topicName}`,
            type: "messaging",
            description: "Message Broker",
          });
        }

        const consumerEdges = edges.filter((ce) => {
          if (ce.source !== target.id) return false;
          const subTopicId = ce.sourceHandle?.split(":").pop();
          if (subTopicId && resourceId && subTopicId !== resourceId)
            return false;
          return true;
        });

        for (const cEdge of consumerEdges) {
          const consumerNode = nodes.find((n) => n.id === cEdge.target);
          if (consumerNode && consumerNode.type === "service") {
            const consumedEventId = cEdge.targetHandle?.replace(
              "consumedEvents-in-",
              "",
            );
            let consumerEp: Endpoint | undefined = endpoints.find(
              (ep) =>
                ep.nodeId === consumerNode.id && ep.id === consumedEventId,
            );
            if (!consumerEp) {
              consumerEp = consumerNode.data?.endpoints?.find(
                (ep) => ep.id === consumedEventId,
              );
            }

            if (consumerEp) {
              queue.push({ service: consumerNode, endpoint: consumerEp });
            } else {
              const consumerEpId = consumedEventId || consumerNode.id;
              if (!mockables.some((m) => m.id === consumerEpId)) {
                mockables.push({
                  id: consumerEpId,
                  label: `${consumerNode.data?.label || "Service"} / ${consumedEventId || "Consumer"}`,
                  type: "event",
                  description: "Event Consumer",
                });
              }
            }
          }
        }
      }
    }
  }

  return mockables;
}

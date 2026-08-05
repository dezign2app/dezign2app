import type {
  BackendEdge,
  BackendNode,
  Endpoint,
  SimulationTestCase,
} from "@/types/canvas";
import type {
  SimulationTestCaseResult,
  SimulationTraceEntry,
} from "../types";
import { MESSAGING_TYPES } from "./types";
import { clone, findEventName } from "../utils";
import { simulateEndpoint } from "../endpoint";
import { buildInitialTrace } from "./chain";

export async function simulateMessagingBrokerTestCase(args: {
  client: BackendNode;
  testCase: SimulationTestCase;
  first: { service: BackendNode; endpoint: Endpoint };
  connectedEdge: BackendEdge;
  chainEdges: BackendEdge[];
  chainNodes: BackendNode[];
  nodes: BackendNode[];
  edges: BackendEdge[];
  endpoints?: Array<Endpoint & { nodeId: string }>;
}): Promise<SimulationTestCaseResult> {
  const targetNode = args.first.service;
  const trace: SimulationTraceEntry[] = buildInitialTrace({
    testCaseId: args.testCase.id,
    testCaseName: args.testCase.name,
    clientNode: args.client,
    requestBody: args.testCase.request?.body,
    chainEdges: args.chainEdges,
    chainNodes: args.chainNodes,
  });

  const eventLabel =
    args.first.endpoint.name || targetNode.data.label || "Kafka Topic";

  trace.push({
    id: `msg-${args.connectedEdge.id}`,
    kind: "messaging",
    label: `${targetNode.data.label ?? targetNode.type} ← ${eventLabel}`,
    status: "completed",
    nodeId: targetNode.id,
    edgeId: args.connectedEdge.id,
    output: clone(args.testCase.request?.body),
  });

  const consumeEdges = args.edges.filter(
    (edge) =>
      edge.source === targetNode.id &&
      (edge.targetHandle?.startsWith("consumedEvents-in-") ||
        edge.targetHandle?.includes(":")),
  );

  for (const consumeEdge of consumeEdges) {
    const consumerService = args.nodes.find(
      (n) => n.id === consumeEdge.target && n.type === "service",
    );
    if (!consumerService) continue;

    const consumedEventId = consumeEdge.targetHandle?.replace(
      "consumedEvents-in-",
      "",
    );
    const consumedEventName = consumedEventId
      ? findEventName(consumedEventId, consumerService, args.nodes)
      : undefined;

    const pubTopicId = args.connectedEdge.targetHandle?.split(":").pop();
    const subTopicId = consumeEdge.sourceHandle?.split(":").pop();
    if (pubTopicId && subTopicId && pubTopicId !== subTopicId) continue;
    if (
      consumedEventName &&
      eventLabel &&
      consumedEventName.trim().toLowerCase() !==
        eventLabel.trim().toLowerCase()
    )
      continue;

    const consumerEndpoint: Endpoint | undefined =
      (args.endpoints ?? []).find(
        (ep) => ep.nodeId === consumerService.id && ep.id === consumedEventId,
      ) ??
      consumerService.data.endpoints?.find(
        (ep: Endpoint) => ep.id === consumedEventId,
      ) ??
      (
        consumerService.data.routeGroups?.flatMap(
          (g: any) => g.endpoints,
        ) as Endpoint[]
      )?.find((ep: Endpoint) => ep.id === consumedEventId);

    let consumerBody: unknown = clone(args.testCase.request?.body);

    if (consumerEndpoint) {
      const consumerResult = await simulateEndpoint({
        service: consumerService,
        endpoint: consumerEndpoint,
        nodes: args.nodes,
        edges: args.edges,
        request: {
          method: consumerEndpoint.type || "EVENT",
          path: consumerEndpoint.name || eventLabel,
          headers: {},
          params: {},
          body: consumerBody,
        },
        resolvedIngressEdge: consumeEdge,
        mocks: args.testCase.mocks,
      });
      trace.push(...consumerResult.trace);
      consumerBody = clone(consumerResult.body);
    } else {
      trace.push({
        id: `msg-consume-${consumeEdge.id}`,
        kind: "messaging",
        label: `${consumerService.data.label ?? "Service"} ← ${eventLabel}`,
        status: "completed",
        nodeId: consumerService.id,
        edgeId: consumeEdge.id,
        output: clone(consumerBody),
      });
    }

    const pushEdges = args.edges.filter((edge) => {
      if (edge.source !== consumerService.id) return false;
      return args.nodes.some(
        (n) => n.id === edge.target && n.type === "webClient",
      );
    });

    for (const pushEdge of pushEdges) {
      const clientNode = args.nodes.find(
        (n) => n.id === pushEdge.target && n.type === "webClient",
      );
      if (!clientNode) continue;

      const th = pushEdge.targetHandle ?? "";
      let pushKind = "SSE";
      if (th.startsWith("websocket-in-") || th.startsWith("ws-in-"))
        pushKind = "WebSocket";
      else if (th.startsWith("webrtc-in-")) pushKind = "WebRTC";

      const targetEventId = th.replace(
        /^(sse|websocket|ws|webrtc|events)-in-/,
        "",
      );
      const clientEvent = clientNode.data.events?.find(
        (ev: any) => ev.id === targetEventId,
      );
      const eventSuffix = clientEvent?.name ? ` (${clientEvent.name})` : "";

      trace.push({
        id: `push-${pushEdge.id}`,
        kind: "push",
        label: `${pushKind} → ${clientNode.data.label ?? "Client"}${eventSuffix}`,
        status: "completed",
        nodeId: clientNode.id,
        edgeId: pushEdge.id,
        output: clone(consumerBody),
      });
    }
  }

  return {
    status: 200,
    statusText: "OK",
    headers: { "x-simulated": "true" },
    body: clone(
      args.testCase.request?.body ?? { status: "Message Published to Kafka" },
    ),
    trace,
    testCaseId: args.testCase.id,
    testCaseName: args.testCase.name,
    assertions: [
      {
        name: "message published to messaging broker",
        passed: true,
        detail: `Published to ${targetNode.data?.label || "Kafka"}`,
      },
    ],
  };
}

export async function simulateMessagingPush(args: {
  step: { service: BackendNode; endpoint: Endpoint };
  nodes: BackendNode[];
  edges: BackendEdge[];
  endpoints?: Array<Endpoint & { nodeId: string }>;
  body: unknown;
  testCase: SimulationTestCase;
  trace: SimulationTraceEntry[];
}): Promise<void> {
  const { step, nodes, edges, endpoints, body, testCase, trace } = args;

  const endpointPublishedEvents = step.endpoint.publishedEvents ?? [];
  const allowedEventIds = new Set(endpointPublishedEvents.map((e) => e.id));

  const publishEdges = edges.filter((edge) => {
    if (edge.source !== step.service.id) return false;

    if (edge.sourceHandle?.startsWith("publishedEvents-out-")) {
      const eventId = edge.sourceHandle.replace("publishedEvents-out-", "");
      return allowedEventIds.has(eventId);
    }

    if (
      edge.sourceHandle === `endpoint-out-${step.endpoint.id}` ||
      edge.sourceHandle === `endpoints-out-${step.endpoint.id}`
    ) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      return targetNode && MESSAGING_TYPES.includes(targetNode.type);
    }

    return false;
  });

  for (const pubEdge of publishEdges) {
    const brokerNode = nodes.find((n) => n.id === pubEdge.target);
    if (!brokerNode) continue;
    if (!MESSAGING_TYPES.includes(brokerNode.type)) continue;

    let eventLabel: string;
    if (pubEdge.sourceHandle?.startsWith("publishedEvents-out-")) {
      const publishedEventId = pubEdge.sourceHandle.replace(
        "publishedEvents-out-",
        "",
      );
      const publishedEventName = publishedEventId
        ? findEventName(publishedEventId, step.service, nodes)
        : undefined;
      eventLabel = publishedEventName ?? publishedEventId ?? "event";
    } else {
      const resourceId = pubEdge.targetHandle?.includes(":")
        ? pubEdge.targetHandle.split(":").pop()
        : pubEdge.targetHandle?.split("-in-").pop();
      const resourceList = (brokerNode.data.topics ||
        brokerNode.data.queues ||
        brokerNode.data.streams ||
        brokerNode.data.channels ||
        []) as any[];
      const resource =
        resourceList.find((r: any) => r.id === resourceId) || resourceList[0];
      eventLabel =
        resource?.name ||
        step.endpoint.name ||
        brokerNode.data.label ||
        "event";
    }

    if (!trace.some((t) => t.id === `msg-${pubEdge.id}` || t.edgeId === pubEdge.id)) {
      trace.push({
        id: `msg-${pubEdge.id}`,
        kind: "messaging",
        label: `${brokerNode.data.label ?? brokerNode.type} ← ${eventLabel}`,
        status: "completed",
        nodeId: brokerNode.id,
        edgeId: pubEdge.id,
        output: clone(body),
      });
    }

    const consumeEdges = edges.filter(
      (edge) =>
        edge.source === brokerNode.id &&
        (edge.targetHandle?.startsWith("consumedEvents-in-") ||
          edge.targetHandle?.includes(":") ||
          edge.targetHandle?.startsWith("endpoint-in-")),
    );

    for (const consumeEdge of consumeEdges) {
      const consumerService = nodes.find(
        (n) => n.id === consumeEdge.target && n.type === "service",
      );
      if (!consumerService) continue;

      const consumedEventId = consumeEdge.targetHandle?.replace(
        "consumedEvents-in-",
        "",
      );
      const consumedEventName = consumedEventId
        ? findEventName(consumedEventId, consumerService, nodes)
        : undefined;

      const pubTopicId = pubEdge.targetHandle?.split(":").pop();
      const subTopicId = consumeEdge.sourceHandle?.split(":").pop();
      if (pubTopicId && subTopicId && pubTopicId !== subTopicId) {
        continue;
      }

      if (consumedEventName && eventLabel) {
        if (
          consumedEventName.trim().toLowerCase() !==
          eventLabel.trim().toLowerCase()
        ) {
          continue;
        }
      }

      const consumerEndpoint: Endpoint | undefined =
        (endpoints ?? []).find(
          (ep) => ep.nodeId === consumerService.id && ep.id === consumedEventId,
        ) ??
        consumerService.data.endpoints?.find(
          (ep) => ep.id === consumedEventId,
        ) ??
        consumerService.data.routeGroups
          ?.flatMap((g) => g.endpoints)
          .find((ep) => ep.id === consumedEventId);

      let consumerBody = clone(body);

      if (consumerEndpoint) {
        const consumerResult = await simulateEndpoint({
          service: consumerService,
          endpoint: consumerEndpoint,
          nodes,
          edges,
          request: {
            method: consumerEndpoint.type || "EVENT",
            path: consumerEndpoint.name || eventLabel,
            headers: {},
            params: {},
            body,
          },
          resolvedIngressEdge: consumeEdge,
          mocks: testCase.mocks,
        });
        trace.push(...consumerResult.trace);
        consumerBody = clone(consumerResult.body);
      } else {
        trace.push({
          id: `msg-consume-${consumeEdge.id}`,
          kind: "messaging",
          label: `${consumerService.data.label ?? "Service"} ← ${eventLabel}`,
          status: "completed",
          nodeId: consumerService.id,
          edgeId: consumeEdge.id,
          output: clone(body),
        });
      }

      const pushEdges = edges.filter((edge) => {
        if (edge.source !== consumerService.id) return false;
        const isWebClientTarget = nodes.some(
          (n) => n.id === edge.target && n.type === "webClient",
        );
        if (!isWebClientTarget) return false;

        if (edge.sourceHandle) {
          const sh = edge.sourceHandle;
          const matchesConsumed = Boolean(
            consumedEventId && sh.includes(consumedEventId),
          );
          const matchesEndpoint = Boolean(
            consumerEndpoint && sh.includes(consumerEndpoint.id),
          );
          if (!matchesConsumed && !matchesEndpoint) {
            return false;
          }
        }

        return true;
      });

      for (const pushEdge of pushEdges) {
        const clientNode = nodes.find(
          (n) => n.id === pushEdge.target && n.type === "webClient",
        );
        if (!clientNode) continue;

        const th = pushEdge.targetHandle ?? "";
        let pushKind = "SSE";
        if (th.startsWith("websocket-in-") || th.startsWith("ws-in-"))
          pushKind = "WebSocket";
        else if (th.startsWith("webrtc-in-")) pushKind = "WebRTC";

        const targetEventId = th.replace(
          /^(sse|websocket|ws|webrtc|events)-in-/,
          "",
        );
        const clientEvents = clientNode.data.events ?? [];
        const clientEvent = clientEvents.find(
          (ev) => ev.id === targetEventId,
        );
        const eventSuffix = clientEvent?.name ? ` (${clientEvent.name})` : "";

        trace.push({
          id: `push-${pushEdge.id}`,
          kind: "push",
          label: `${pushKind} → ${clientNode.data.label ?? "Client"}${eventSuffix}`,
          status: "completed",
          nodeId: clientNode.id,
          edgeId: pushEdge.id,
          output: clone(consumerBody),
        });
      }
    }
  }
}

import type {
  BackendEdge,
  BackendNode,
  Endpoint,
  JSONValue,
  SimulationTestCase,
  UIEventItem,
} from "@/types/canvas";
import type {
  SimulationResult,
  SimulationTestCaseResult,
  SimulationTraceEntry,
} from "../types";
import { MESSAGING_TYPES } from "./types";
import { clone, findEndpoint, is2xxStatus } from "../utils";
import { simulateEndpoint } from "../endpoint";
import { buildInitialTrace, resolveClientChain } from "./chain";
import {
  simulateMessagingBrokerTestCase,
  simulateMessagingPush,
} from "./messaging";
import { evaluateTestCaseAssertions } from "./assertions";

export { resolveClientChain, buildInitialTrace } from "./chain";
export { evaluateTestCaseAssertions } from "./assertions";
export {
  simulateMessagingBrokerTestCase,
  simulateMessagingPush,
} from "./messaging";
export { MESSAGING_TYPES } from "./types";

/** Execute a named client test case through every endpoint connected by endpoint-out -> endpoint-in edges. */
export async function simulateTestCase(args: {
  client: BackendNode;
  event: UIEventItem;
  testCase: SimulationTestCase;
  nodes: BackendNode[];
  edges: BackendEdge[];
  endpoints?: Array<Endpoint & { nodeId: string }>;
}): Promise<SimulationTestCaseResult> {
  const { chainEdges, chainNodes, finalEdge, firstEndpoint } =
    resolveClientChain({
      client: args.client,
      event: args.event,
      nodes: args.nodes,
      edges: args.edges,
      endpoints: args.endpoints,
    });

  if (!firstEndpoint) {
    return {
      testCaseId: args.testCase.id,
      testCaseName: args.testCase.name,
      status: 422,
      statusText: "Simulation Failed",
      headers: { "x-simulated": "true" },
      body: { error: "Client event is not connected to an endpoint." },
      trace: [
        {
          id: `${args.testCase.id}-error`,
          kind: "response",
          label: "Simulation failed",
          status: "failed",
          detail: "Client event is not connected to an endpoint.",
        },
      ],
      assertions: [
        { name: "client event has a connected endpoint", passed: false },
      ],
    };
  }

  const connectedEdge = finalEdge!;

  // Check if target is a Kafka / messaging broker node
  if (MESSAGING_TYPES.includes(firstEndpoint.service.type)) {
    return simulateMessagingBrokerTestCase({
      client: args.client,
      testCase: args.testCase,
      first: firstEndpoint,
      connectedEdge,
      chainEdges,
      chainNodes,
      nodes: args.nodes,
      edges: args.edges,
      endpoints: args.endpoints,
    });
  }

  // Build trace steps for client navigation chain
  const trace: SimulationTraceEntry[] = buildInitialTrace({
    testCaseId: args.testCase.id,
    testCaseName: args.testCase.name,
    clientNode: args.client,
    requestBody: args.testCase.request?.body,
    chainEdges,
    chainNodes,
  });

  let current: { service: BackendNode; endpoint: Endpoint } | undefined =
    firstEndpoint;
  let body: unknown = clone(args.testCase.request?.body ?? null);
  let result: SimulationResult | undefined;
  const visited = new Set<string>();

  // Build the effective mocks map: merge test case mocks with the expectedBody/expectedStatus
  // for the initial (target) endpoint so the simulation uses the configured output directly.
  const buildMocks = (
    endpointId: string,
  ): Record<string, { returnData?: JSONValue; status?: number }> | undefined => {
    const base = args.testCase.mocks ?? {};
    if (args.testCase.expectedBody !== undefined && !(endpointId in base)) {
      return {
        ...base,
        [endpointId]: {
          returnData: args.testCase.expectedBody,
          status: args.testCase.expectedStatus ?? 200,
        },
      };
    }
    return Object.keys(base).length > 0 ? base : undefined;
  };

  // Track the outgoing edge from the previous hop so it can be passed as the
  // ingress edge when simulateEndpoint runs for the next chained service.
  let ingressEdgeForNext: BackendEdge | undefined = connectedEdge;

  while (
    current &&
    !visited.has(`${current.service.id}:${current.endpoint.id}`)
  ) {
    const step: { service: BackendNode; endpoint: Endpoint } = current;
    visited.add(`${step.service.id}:${step.endpoint.id}`);
    const isFirst = visited.size === 1;

    result = await simulateEndpoint({
      service: step.service,
      endpoint: step.endpoint,
      nodes: args.nodes,
      edges: args.edges,
      request: {
        method: step.endpoint.type || "GET",
        path: step.endpoint.name || "/",
        headers: args.testCase.request?.headers ?? {},
        params: args.testCase.request?.params ?? {},
        body,
      },
      // First hop: use sourceNodeId/sourceEventId so simulateEndpoint derives the
      // client→service edge via the `events-{id}` handle pattern.
      // Subsequent hops: pass the already-resolved service→service edge directly
      // so the trace entry carries the correct edgeId and the arrow animates.
      sourceNodeId: isFirst ? args.client.id : undefined,
      sourceEventId: isFirst ? args.event.id : undefined,
      resolvedIngressEdge: isFirst ? undefined : ingressEdgeForNext,
      mocks: isFirst ? buildMocks(step.endpoint.id) : args.testCase.mocks,
    });
    trace.push(...result.trace);
    body = clone(result.body);
    if (!is2xxStatus(result.status)) break;

    // ── Direct service-to-service hop (HTTP) ──────────────────────────────
    const outgoing: BackendEdge | undefined = args.edges.find(
      (edge) =>
        edge.source === step.service.id &&
        edge.sourceHandle === `endpoint-out-${step.endpoint.id}` &&
        edge.targetHandle?.startsWith("endpoint-in-"),
    );
    const nextEndpointId = outgoing?.targetHandle?.split("-in-").pop();

    // Carry this outgoing edge forward so the next iteration can reference it
    // as its own ingress edge (the arrow that flows into the next service node)
    ingressEdgeForNext = outgoing;

    current =
      outgoing && nextEndpointId
        ? findEndpoint(
            args.nodes,
            outgoing.target,
            nextEndpointId,
            args.endpoints,
          )
        : undefined;

    // ── Messaging path: publishedEvents-out-* → broker → consumedEvents-in-* ──
    await simulateMessagingPush({
      step,
      nodes: args.nodes,
      edges: args.edges,
      endpoints: args.endpoints,
      body,
      testCase: args.testCase,
      trace,
    });
  } // end while

  if (!result) {
    throw new Error("Simulation did not execute an endpoint.");
  }

  const { assertions, passed } = evaluateTestCaseAssertions({
    testCase: args.testCase,
    result,
    trace,
  });

  return {
    ...result,
    trace,
    testCaseId: args.testCase.id,
    testCaseName: args.testCase.name,
    assertions,
    status: passed ? result.status : 422,
    statusText: passed ? result.statusText : "Assertion Failed",
  };
}

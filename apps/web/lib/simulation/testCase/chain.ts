import type {
  BackendEdge,
  BackendNode,
  Endpoint,
  UIEventItem,
} from "@/types/canvas";
import type { SimulationTraceEntry } from "../types";
import { clone, findEndpoint } from "../utils";

export interface ClientChainResult {
  chainEdges: BackendEdge[];
  chainNodes: BackendNode[];
  finalEdge?: BackendEdge;
  firstEndpoint?: { service: BackendNode; endpoint: Endpoint };
}

/** Resolve incoming pageload / sse / websocket handles to locate the target endpoint. */
export function resolveClientChain(args: {
  client: BackendNode;
  event: UIEventItem;
  nodes: BackendNode[];
  edges: BackendEdge[];
  endpoints?: Array<Endpoint & { nodeId: string }>;
}): ClientChainResult {
  const chainEdges: BackendEdge[] = [];
  const chainNodes: BackendNode[] = [args.client];

  let currentEdge = args.edges.find(
    (edge) =>
      edge.source === args.client.id &&
      edge.sourceHandle === `events-${args.event.id}`,
  );
  let depth = 0;

  const isIncomingHandle = (handle?: string | null) =>
    handle?.startsWith("pageload-in-") ||
    handle?.startsWith("sse-in-") ||
    handle?.startsWith("websocket-in-") ||
    handle?.startsWith("ws-in-");

  while (
    currentEdge &&
    isIncomingHandle(currentEdge.targetHandle) &&
    depth < 10
  ) {
    chainEdges.push(currentEdge);
    const targetNode = args.nodes.find((n) => n.id === currentEdge!.target);
    if (targetNode) chainNodes.push(targetNode);

    const linkedEventId = currentEdge.targetHandle!.replace(
      /^(pageload|sse|websocket|ws)-in-/,
      "",
    );
    const nextEdge = args.edges.find(
      (edge) =>
        edge.source === currentEdge!.target &&
        edge.sourceHandle === `events-${linkedEventId}`,
    );
    if (!nextEdge) break;
    currentEdge = nextEdge;
    depth++;
  }

  if (currentEdge) {
    chainEdges.push(currentEdge);
  }

  const finalEdge = currentEdge;
  const firstEndpointId = finalEdge?.targetHandle?.includes(":")
    ? finalEdge.targetHandle.split(":").pop()
    : finalEdge?.targetHandle?.split("-in-").pop();

  const firstEndpoint =
    finalEdge && firstEndpointId
      ? findEndpoint(
          args.nodes,
          finalEdge.target,
          firstEndpointId,
          args.endpoints,
        )
      : undefined;

  return {
    chainEdges,
    chainNodes,
    finalEdge,
    firstEndpoint,
  };
}

/** Build trace entries for client trigger and intermediate page navigation steps. */
export function buildInitialTrace(args: {
  testCaseId: string;
  testCaseName: string;
  clientNode: BackendNode;
  requestBody: unknown;
  chainEdges: BackendEdge[];
  chainNodes: BackendNode[];
}): SimulationTraceEntry[] {
  const trace: SimulationTraceEntry[] = [
    {
      id: `${args.testCaseId}-client`,
      kind: "client",
      label: `Test case: ${args.testCaseName}`,
      status: "completed",
      nodeId: args.clientNode.id,
      edgeId: args.chainEdges[0]?.id,
      input: clone(args.requestBody),
    },
  ];

  for (let i = 0; i < args.chainEdges.length - 1; i++) {
    const navNode = args.chainNodes[i + 1];
    const nextEdge = args.chainEdges[i + 1];
    trace.push({
      id: `${args.testCaseId}-nav-${i}`,
      kind: "client",
      label: `Page Load: ${navNode?.data?.label || "Web Client"}`,
      status: "completed",
      nodeId: navNode?.id,
      edgeId: nextEdge?.id,
    });
  }

  return trace;
}

import { BackendEdge, BackendNode, Endpoint } from "@/types/canvas";
import { RouteEndpoint } from "../langgraph/typescript/v1";

/** Resolve which canvas edges connect to this LangGraph node and what they represent. */
export function resolveRouteEndpoints(
  nodeId: string,
  edges: BackendEdge[],
  allNodes: BackendNode[],
  endpoints: Endpoint[],
  events: Array<{ id: string; name?: string; variant?: string }>,
): RouteEndpoint[] {
  const incoming = edges.filter((e) => e.target === nodeId);

  return incoming.map((edge): RouteEndpoint => {
    const sourceNode = allNodes.find((n) => n.id === edge.source);
    const sourceNodeLabel = sourceNode?.data?.label || edge.source;
    const payloadMapping = edge.data?.payloadMapping;
    const preInvokeLogicMode = edge.data?.preInvokeLogicMode;
    const preInvokePrompt = edge.data?.preInvokePrompt;
    const preInvokeCode = edge.data?.preInvokeCode;
    const responseExecutionMode = edge.data?.responseExecutionMode;
    const responseOutputMode = edge.data?.responseOutputMode;
    const responseFields = edge.data?.responseFields;
    const postInvokeLogicMode = edge.data?.postInvokeLogicMode;
    const postInvokePrompt = edge.data?.postInvokePrompt;
    const postInvokeCode = edge.data?.postInvokeCode;

    if (edge.sourceHandle?.startsWith("endpoint-out-")) {
      const endpointId = edge.sourceHandle.replace("endpoint-out-", "");
      const ep = endpoints.find((e) => e.id === endpointId);
      if (ep) {
        let epMethod: RouteEndpoint["method"] = "POST";
        const rawType = ep.type;
        if (
          rawType === "GET" ||
          rawType === "POST" ||
          rawType === "PUT" ||
          rawType === "PATCH" ||
          rawType === "DELETE"
        ) {
          epMethod = rawType;
        }
        const epRoute: RouteEndpoint = {
          kind: "endpoint",
          path: ep.name || "/invoke",
          method: epMethod,
          sourceNodeLabel,
          payloadMapping,
          preInvokeLogicMode,
          preInvokePrompt,
          preInvokeCode,
          responseExecutionMode,
          responseOutputMode,
          responseFields,
          postInvokeLogicMode,
          postInvokePrompt,
          postInvokeCode,
        };
        return epRoute;
      }
    }

    if (edge.sourceHandle?.startsWith("consumedEvents-out-")) {
      const eventId = edge.sourceHandle.replace("consumedEvents-out-", "");
      const ev = events.find((e) => e.id === eventId);
      return {
        kind: "event",
        path: `/${(ev?.name || eventId).toLowerCase().replace(/\s+/g, "-")}`,
        method: "POST",
        eventName: ev?.name || eventId,
        sourceNodeLabel,
        payloadMapping,
        preInvokeLogicMode,
        preInvokePrompt,
        preInvokeCode,
        responseExecutionMode,
        responseOutputMode,
        responseFields,
        postInvokeLogicMode,
        postInvokePrompt,
        postInvokeCode,
      };
    }

    // Fallback — task or plain connection
    return {
      kind: "task",
      path: "/invoke",
      method: "POST",
      sourceNodeLabel,
      payloadMapping,
      preInvokeLogicMode,
      preInvokePrompt,
      preInvokeCode,
      responseExecutionMode,
      responseOutputMode,
      responseFields,
      postInvokeLogicMode,
      postInvokePrompt,
      postInvokeCode,
    };
  });
}

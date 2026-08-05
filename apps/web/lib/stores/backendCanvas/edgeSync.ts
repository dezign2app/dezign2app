import { BackendNode, BackendEdge } from "@/types/canvas";
import { AnyMessagingResource } from "@workspace/canvas/types";
import { generateKeyBetween } from "fractional-indexing";
import { getLastIndex, getMessagingResourceType } from "./utils";

export function syncConfiguredEventEdge(
  event: AnyMessagingResource,
  ownerNodeId: string,
  variant: "publish" | "consume",
  nodes: BackendNode[],
  edges: BackendEdge[],
): { edges: BackendEdge[]; added: BackendEdge[]; removed: string[] } {
  const handlePrefix =
    variant === "publish" ? "publishedEvents-out-" : "consumedEvents-in-";
  const eventHandle = `${handlePrefix}${event.id}`;
  const existing = edges.filter(
    (edge) =>
      edge &&
      (variant === "publish"
        ? edge.source === ownerNodeId && edge.sourceHandle === eventHandle
        : edge.target === ownerNodeId && edge.targetHandle === eventHandle),
  );

  const broker = nodes.find((node) => node && node.id === event.brokerNodeId);
  const resourceType = broker ? getMessagingResourceType(broker) : null;
  const hasSelection = Boolean(
    broker &&
    resourceType &&
    event.messagingResourceId &&
    event.messagingResourceId !== "none",
  );

  let nextEdges = edges;
  const removed = existing
    .filter((edge) => {
      if (!hasSelection) return true;
      const expectedSource = variant === "publish" ? ownerNodeId : broker!.id;
      const expectedTarget = variant === "publish" ? broker!.id : ownerNodeId;
      const expectedSourceHandle =
        variant === "publish"
          ? eventHandle
          : `${resourceType}:out:${event.messagingResourceId}`;
      const expectedTargetHandle =
        variant === "publish"
          ? `${resourceType}:in:${event.messagingResourceId}`
          : eventHandle;
      return (
        edge.source !== expectedSource ||
        edge.target !== expectedTarget ||
        edge.sourceHandle !== expectedSourceHandle ||
        edge.targetHandle !== expectedTargetHandle
      );
    })
    .map((edge) => edge.id);

  if (removed.length > 0) {
    nextEdges = nextEdges.filter((edge) => !removed.includes(edge.id));
  }

  const hasExpectedEdge =
    hasSelection &&
    nextEdges.some((edge) => {
      if (variant === "publish") {
        return (
          edge.source === ownerNodeId &&
          edge.target === broker!.id &&
          edge.sourceHandle === eventHandle &&
          edge.targetHandle ===
            `${resourceType}:in:${event.messagingResourceId}`
        );
      }
      return (
        edge.source === broker!.id &&
        edge.target === ownerNodeId &&
        edge.sourceHandle ===
          `${resourceType}:out:${event.messagingResourceId}` &&
        edge.targetHandle === eventHandle
      );
    });

  if (!hasExpectedEdge && hasSelection) {
    const source = variant === "publish" ? ownerNodeId : broker!.id;
    const target = variant === "publish" ? broker!.id : ownerNodeId;
    const sourceHandle =
      variant === "publish"
        ? eventHandle
        : `${resourceType}:out:${event.messagingResourceId}`;
    const targetHandle =
      variant === "publish"
        ? `${resourceType}:in:${event.messagingResourceId}`
        : eventHandle;
    const edge: BackendEdge = {
      id: `edge-${Date.now()}-${event.id}`,
      source,
      target,
      type: "message",
      sourceHandle,
      targetHandle,
      sourceResourceId:
        variant === "publish" ? undefined : event.messagingResourceId,
      targetResourceId:
        variant === "publish" ? event.messagingResourceId : undefined,
      resourceType: resourceType ?? undefined,
      fractionalIndex:
        getLastIndex(nextEdges) === null
          ? generateKeyBetween(null, null)
          : generateKeyBetween(getLastIndex(nextEdges), null),
    };
    nextEdges = [...nextEdges, edge];
    return { edges: nextEdges, added: [edge], removed };
  }

  return { edges: nextEdges, added: [], removed };
}

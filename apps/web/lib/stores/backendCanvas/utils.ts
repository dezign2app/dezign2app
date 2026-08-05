import { BackendNode } from "@/types/canvas";
import { MessagingResourceType } from "@workspace/canvas/types";

// Helper: get the last fractional index from a sorted list
export function getLastIndex(items: { fractionalIndex?: string }[]): string | null {
  if (items.length === 0) return null;
  return items[items.length - 1]?.fractionalIndex ?? null;
}

export function getMessagingResourceType(
  node: BackendNode,
): MessagingResourceType | null {
  if (!node || !node.type) return null;
  switch (node.type) {
    case "kafka":
      return "topics";
    case "eventstream":
    case "redis-streams":
      return "streams";
    case "queue":
    case "sqs":
      return "queues";
    case "pubsub":
    case "redis-pubsub":
      return "channels";
    case "redis-cache":
      return "caches";
    case "storage":
      return "buckets";
    default:
      return null;
  }
}

export function parseResourceHandle(handleId: string | null | undefined): {
  resourceType: MessagingResourceType;
  direction: "in" | "out";
  resourceId: string;
} | null {
  if (!handleId) return null;
  const parts = handleId.split(":");
  if (parts.length === 3) {
    const [resourceType, direction, resourceId] = parts;
    if (
      (resourceType === "topics" ||
        resourceType === "streams" ||
        resourceType === "queues" ||
        resourceType === "channels" ||
        resourceType === "caches" ||
        resourceType === "buckets") &&
      (direction === "in" || direction === "out")
    ) {
      return {
        resourceType: resourceType,
        direction: direction,
        resourceId: resourceId!,
      };
    }
  }
  return null;
}

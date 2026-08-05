import type { BackendNodeType } from "@/types/canvas";

export const MESSAGING_TYPES: BackendNodeType[] = [
  "kafka",
  "sqs",
  "redis-streams",
  "redis-pubsub",
  "pubsub",
  "eventstream",
  "queue",
];

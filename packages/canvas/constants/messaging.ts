export const MESSAGING_RESOURCE_TYPES = [
  "topics",
  "streams",
  "queues",
  "channels",
  "caches",
  "buckets",
  "collections",
  "indexes",
  "routes",
  "targetGroups",
  "events",
  "prompts",
  "tools",
  "tasks",
] as const;

export type MessagingResourceType = (typeof MESSAGING_RESOURCE_TYPES)[number];

export const MESSAGING_NODE_TYPES = [
  "queue",
  "eventstream",
  "pubsub",
  "kafka",
  "redis-streams",
  "sqs",
  "redis-pubsub",
  "cache",
  "storage",
  "redis-cache",
] as const;

export type MessagingNodeType = (typeof MESSAGING_NODE_TYPES)[number];

export const DEFAULT_PUBLISH_TRIGGER_CONDITION = "after-processing" as const;

export const PUBLISH_TRIGGER_CONDITIONS = [
  { value: "after-processing", label: "On Request / Processing Success" },
  { value: "before-response", label: "Before Response Sent" },
  { value: "on-state-change", label: "On State / Database Change" },
  { value: "on-error", label: "On Processing Failure / Error" },
  { value: "async-background", label: "Asynchronous Background Dispatch" },
  { value: "manual", label: "Manual Code Invocation" },
] as const;

export type PublishTriggerCondition =
  (typeof PUBLISH_TRIGGER_CONDITIONS)[number]["value"];

export const DEFAULT_PUBLISHED_EVENT_DEFAULTS = {
  payloadSchema: { id: "dummy" },
  version: "v1" as const,
  category: "DOMAIN" as const,
  delivery: "AT_LEAST_ONCE" as const,
  ordering: "NONE" as const,
  deprecated: false,
} as const;

// ─── Inter-Service Protocol ────────────────────────────────────────────────────
export const INTER_SERVICE_PROTOCOL_HTTP = "http" as const;
export const INTER_SERVICE_PROTOCOL_GRPC = "grpc" as const;

export const INTER_SERVICE_PROTOCOLS = {
  HTTP: INTER_SERVICE_PROTOCOL_HTTP,
  GRPC: INTER_SERVICE_PROTOCOL_GRPC,
} as const;

export type InterServiceProtocol =
  (typeof INTER_SERVICE_PROTOCOLS)[keyof typeof INTER_SERVICE_PROTOCOLS];

export const INTER_SERVICE_PROTOCOL_OPTIONS = [
  { value: INTER_SERVICE_PROTOCOL_HTTP, label: "HTTP / REST" },
  { value: INTER_SERVICE_PROTOCOL_GRPC, label: "gRPC" },
] as const;

export const ALL_INTER_SERVICE_PROTOCOL_VALUES = Object.values(
  INTER_SERVICE_PROTOCOLS,
) as [InterServiceProtocol, ...InterServiceProtocol[]];

export const DEFAULT_INTER_SERVICE_PROTOCOL = INTER_SERVICE_PROTOCOL_HTTP;

export const GRPC_DEFAULT_PORT = 50051 as const;

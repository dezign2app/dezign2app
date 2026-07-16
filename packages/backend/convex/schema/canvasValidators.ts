import { v } from "convex/values";

// Edge Data Validator
export const backendEdgeDataValidator = v.object({
  label: v.optional(v.string()),
  sequenceOrder: v.optional(v.number()),
  sourceCardinality: v.optional(v.union(v.literal("1"), v.literal("N"))),
  targetCardinality: v.optional(v.union(v.literal("1"), v.literal("N"))),
});

// Node Data Validator
// To avoid a 500-line schema definition that needs constant syncing,
// we define the structural "shape" of each node type for the database layer,
// and rely on Zod during the mutation handler for deep field-level validation.
export const backendNodeDataValidator = v.union(
  // Service
  v.object({
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    endpoints: v.optional(v.array(v.any())),
    publishedEvents: v.optional(v.array(v.any())),
    consumedEvents: v.optional(v.array(v.any())),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // DB Ref
  v.object({
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    tableRef: v.optional(v.string()),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // Web Client
  v.object({
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    events: v.optional(v.array(v.any())),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // External
  v.object({
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    actions: v.optional(v.array(v.any())),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // Group / Simple
  v.object({
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // Entity
  v.object({
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    columns: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      isPrimaryKey: v.optional(v.boolean()),
      isForeignKey: v.optional(v.boolean()),
      isNotNull: v.optional(v.boolean()),
      isUnique: v.optional(v.boolean()),
    }))),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // Kafka
  v.object({
    label: v.optional(v.string()),
    topics: v.optional(v.array(v.any())),
    kafkaBroker: v.optional(v.any()),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // SQS
  v.object({
    label: v.optional(v.string()),
    queues: v.optional(v.array(v.any())),
    sqsBroker: v.optional(v.any()),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // Redis PubSub
  v.object({
    label: v.optional(v.string()),
    channels: v.optional(v.array(v.any())),
    redisPubSubBroker: v.optional(v.any()),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // Redis Streams
  v.object({
    label: v.optional(v.string()),
    streams: v.optional(v.array(v.any())),
    redisBroker: v.optional(v.any()),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  }),
  // Fallback for completely empty data (allowable in some updates)
  v.object({
    label: v.optional(v.string()),
    parentId: v.optional(v.string()),
    graphPosition: v.optional(v.any()),
  })
);

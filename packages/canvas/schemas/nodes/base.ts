import { z } from "zod";
import { schemaModelSchema } from "../shared";
import {
  ALL_TECH_STACK_VALUES,
  ALL_TECH_VERSION_VALUES,
  ALL_DATABASE_ENGINE_VALUES,
  ALL_DATABASE_ENGINE_VERSION_VALUES,
  ALL_DATABASE_ORM_VALUES,
  ALL_DATABASE_ORM_VERSION_VALUES,
} from "../../techStack";

export const baseNodeDataSchema = z.object({
  label: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  parentId: z.string().optional(),
  style: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  techStack: z.enum(ALL_TECH_STACK_VALUES).optional(),
  techVersion: z.enum(ALL_TECH_VERSION_VALUES).optional(),
  dbEngine: z.enum(ALL_DATABASE_ENGINE_VALUES).optional(),
  dbEngineVersion: z.enum(ALL_DATABASE_ENGINE_VERSION_VALUES).optional(),
  orm: z.enum(ALL_DATABASE_ORM_VALUES).optional(),
  ormVersion: z.enum(ALL_DATABASE_ORM_VERSION_VALUES).optional(),
});

export const resourceItemSchema = z.object({
  id: z.string().default(""),
  name: z.string(),
  payloadSchema: schemaModelSchema.optional(),
  kind: z.string().optional(),
  storageType: z.string().optional(),
  storageTypeOther: z.string().optional(),
  storedDataTypes: z.array(z.string()).optional(),
  storedDataTypesOther: z.string().optional(),
  ttl: z.string().optional(),
  cacheEviction: z.string().optional(),
  cacheDataType: z.string().optional(),
  keyPrefix: z.string().optional(),
  description: z.string().optional(),
  namespace: z.string().optional(),
  keyPattern: z.string().optional(),
  cacheStrategy: z.string().optional(),
  sourceOfTruth: z.string().optional(),
  invalidationRules: z.string().optional(),
  compression: z.string().optional(),
  serialization: z.string().optional(),
  maxObjectSize: z.string().optional(),
  persistence: z.string().optional(),
  replication: z.string().optional(),
  publishedWhen: z.string().optional(),
  handlerLogic: z.string().optional(),
  retryPolicy: z.string().optional(),
  maxRetries: z.number().optional(),
  deadLetterQueue: z.string().optional(),
  isIdempotent: z.boolean().optional(),
  version: z.string().optional(),
  category: z.string().optional(),
  delivery: z.string().optional(),
  brokerNodeId: z.string().optional(),
  messagingResourceId: z.string().optional(),
  schema: z.string().optional(),
  _legacyName: z.string().optional(),
});

export const simpleDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
}).strict();

export const dbRefDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  tableRef: z.string().optional(),
  graphPosition: z.object({ x: z.number(), y: z.number() }).optional(),
}).strict();

export const dbRefDataInputSchema = dbRefDataSchema;

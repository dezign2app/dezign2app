import { z } from "zod";
import { simpleDataSchema, dbRefDataSchema } from "./base";
import { entityDataSchema } from "./entity";
import {
  kafkaDataSchema,
  sqsDataSchema,
  redisPubSubDataSchema,
  redisStreamsDataSchema,
  redisCacheDataSchema,
} from "./messaging";
import { storageDataSchema } from "./storage";
import {
  externalDataSchema,
  webClientDataSchema,
  serviceDataSchema,
  workerDataSchema,
  serverlessDataSchema,
} from "./services";
import {
  identityProviderDataSchema,
  authDataSchema,
  apiGatewayDataSchema,
  loadBalancerDataSchema,
  webhookDataSchema,
} from "./gateway";
import {
  llmDataSchema,
  mcpServerDataSchema,
  vectorDbRefDataSchema,
  searchIndexDataSchema,
} from "./ai";
import { langgraphDataSchema, langgraphStepDataSchema } from "./langgraph";

export const nodeDataSchemas: Record<string, z.ZodSchema> = {
  queue: simpleDataSchema,
  pubsub: simpleDataSchema,
  eventstream: simpleDataSchema,
  kafka: kafkaDataSchema,
  sqs: sqsDataSchema,
  "redis-pubsub": redisPubSubDataSchema,
  "redis-streams": redisStreamsDataSchema,
  "redis-cache": redisCacheDataSchema,
  entity: entityDataSchema,
  service: serviceDataSchema,
  db_ref: dbRefDataSchema,
  webClient: webClientDataSchema,
  external: externalDataSchema,
  group: simpleDataSchema,
  storage: storageDataSchema,
  // New nodes
  worker: workerDataSchema,
  serverless: serverlessDataSchema,
  search_index: searchIndexDataSchema,
  api_gateway: apiGatewayDataSchema,
  load_balancer: loadBalancerDataSchema,
  webhook: webhookDataSchema,
  llm: llmDataSchema,
  mcp_server: mcpServerDataSchema,
  vector_db_ref: vectorDbRefDataSchema,
  identity_provider: identityProviderDataSchema,
  auth: authDataSchema,
  langgraph: langgraphDataSchema,
  langgraph_step: langgraphStepDataSchema,
};

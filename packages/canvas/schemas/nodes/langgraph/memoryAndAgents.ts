import { z } from "zod";

export const streamConfigSchema = z
  .object({
    enabled: z.boolean().optional().default(false),
    version: z.string().optional().default("v3"),
    selectedEvents: z.array(z.string()).optional(),
    eventSignature: z.string().optional(),
    customTransformers: z.string().optional(),
  })
  .optional();

export const memoryDefinitionSchema = z.object({
  id: z.string().optional(),
  memoryId: z.string().optional(),
  name: z.string().default("Memory Saver"),
  checkpointer: z.string().default("memory"),
  threadIdKey: z.string().optional().default("thread_id"),
  threadScope: z
    .enum(["session", "user", "global"])
    .optional()
    .default("session"),
  autoSummarize: z.boolean().optional().default(true),
  maxWindowMessages: z.number().optional().default(10),
  saveMessages: z.boolean().optional().default(true),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type MemoryDefinition = z.infer<typeof memoryDefinitionSchema>;

export const agentMemoryConfigSchema = z
  .object({
    enabled: z.boolean().optional().default(true),
    checkpointer: z.string().optional().default("memory"),
    threadIdKey: z.string().optional().default("thread_id"),
    threadScope: z
      .enum(["session", "user", "global"])
      .optional()
      .default("session"),
    autoSummarize: z.boolean().optional().default(true),
    maxWindowMessages: z.number().optional().default(10),
    saveMessages: z.boolean().optional().default(true),
  })
  .optional();
export type AgentMemoryConfig = z.infer<typeof agentMemoryConfigSchema>;

export const agentDefinitionSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().optional(),
  name: z.string(),
  systemPrompt: z.string().optional(),
  modelConfig: z.record(z.unknown()).optional(),
  llmNodeId: z.string().optional(),
  streamConfig: streamConfigSchema,
  memoryConfig: agentMemoryConfigSchema,
  tools: z.array(z.string()).optional().default([]),
  middleware: z.array(z.string()).optional().default([]),
  memory: z.array(z.string()).optional().default([]),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;

export const vectorStoreConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z
    .enum(["convex", "pinecone", "pgvector", "qdrant"])
    .default("convex"),
  embeddingModel: z.string().default("text-embedding-3-small"),
  collection: z.string().default("agent_memories"),
  topK: z.number().default(5),
  similarityThreshold: z.number().default(0.75),
});
export type VectorStoreConfig = z.infer<typeof vectorStoreConfigSchema>;

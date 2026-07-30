import { z } from "zod";
import { schemaModelSchema } from "../shared";
import { ALL_LLM_PROVIDER_VALUES } from "../../constants";
import { baseNodeDataSchema, resourceItemSchema } from "./base";

// --- Vector DB Ref Node (Graph View) ---
export const vectorDbRefDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  collectionRef: z.string().optional(),
  dbRef: z.string().optional(),
}).strict();
export type VectorDbRefNodeData = z.infer<typeof vectorDbRefDataSchema>;

// --- Search Index Node ---
export const searchIndexDataSchema = baseNodeDataSchema.extend({
  description:    z.string().optional(),
  // Core Resources
  searchSources: z.array(z.object({
    id: z.string(),
    sourceType: z.literal("Database"),
    dbTable: z.string(),
    dbPrimaryKey: z.string().optional(),
    dbSyncMode: z.string().optional(),
    indexes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      analyzer: z.string().optional(),
      schema: schemaModelSchema.optional(),
    })),
  })).optional(),
  // Implementation
  implementation: z.enum(["Elasticsearch", "OpenSearch", "Algolia", "Meilisearch", "Typesense", "Other"]).optional(),
  // Configuration (Advanced)
  analyzer:       z.string().optional(),                  // "standard", "english", "icu_analyzer"
  // Tags
  tags:           z.array(z.string()).optional(),
}).strict();
export type SearchIndexNodeData = z.infer<typeof searchIndexDataSchema>;
export type SearchSource = NonNullable<z.infer<typeof searchIndexDataSchema>["searchSources"]>[number];
export type SearchIndexItem = SearchSource["indexes"][number];

// --- LLM Node ---
export const llmDataSchema = baseNodeDataSchema.extend({
  description:     z.string().optional(),
  // Core Resources (Basic)
  prompts:         z.array(resourceItemSchema).optional(),
  // Implementation (Basic)
  implementation:  z.enum(ALL_LLM_PROVIDER_VALUES).optional(),
  model:           z.string().optional(),                 // "gpt-4o", "claude-3-5-sonnet", etc.
  // Configuration (Advanced)
  temperature:     z.number().optional(),
  maxTokens:       z.number().optional(),
  structuredOutput: z.boolean().optional(),
  toolCalling:     z.boolean().optional(),
  tools:           z.array(resourceItemSchema).optional(),
  // Tags
  tags:            z.array(z.string()).optional(),
}).strict();
export type LlmNodeData = z.infer<typeof llmDataSchema>;

// --- MCP Server Node ---
export const mcpServerDataSchema = baseNodeDataSchema.extend({
  description:    z.string().optional(),
  // Core Resources (Basic)
  tools:          z.array(resourceItemSchema).optional(),
  resources:      z.array(resourceItemSchema).optional(),
  prompts:        z.array(resourceItemSchema).optional(),
  // Implementation (Advanced)
  connectionType: z.enum(["stdio", "SSE", "HTTP"]).optional(),
  // Security (Advanced)
  authentication: z.enum(["None", "Bearer", "API Key", "OAuth2"]).optional(),
  // Tags
  tags:           z.array(z.string()).optional(),
}).strict();
export type McpServerNodeData = z.infer<typeof mcpServerDataSchema>;

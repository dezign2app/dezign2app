import { z } from "zod";
import { baseNodeDataSchema } from "../base";
import { graphEdgeSchema } from "./conditionsAndEdges";
import {
  toolDefinitionSchema,
  middlewareDefinitionSchema,
} from "./toolsAndMiddleware";
import {
  memoryDefinitionSchema,
  agentDefinitionSchema,
  vectorStoreConfigSchema,
} from "./memoryAndAgents";
import {
  inputChannelSchema,
  outputChannelSchema,
  outputPortSchema,
  graphStepSchema,
} from "./stepsAndChannels";
import { validateLangGraphTopology } from "./topologyValidator";

export const langgraphDataSchema = baseNodeDataSchema
  .extend({
    version: z.number().default(2),
    recursionLimit: z.number().default(25),
    stepTimeoutMs: z.number().default(30000),

    inputChannels: z.array(inputChannelSchema).default([]),
    outputChannels: z.array(outputChannelSchema).optional().default([]),

    stateChannels: z
      .array(
        z.object({
          key: z.string(),
          type: z.enum(["messages", "string", "json", "number", "boolean"]),
          reducer: z.enum([
            "add_messages",
            "append",
            "replace",
            "merge_object",
            "concat_array",
          ]),
          defaultValue: z
            .union([
              z.string(),
              z.number(),
              z.boolean(),
              z.null(),
              z.array(z.unknown()),
              z.record(z.unknown()),
            ])
            .optional(),
        }),
      )
      .default([
        {
          key: "messages",
          type: "messages",
          reducer: "add_messages",
          defaultValue: [],
        },
        {
          key: "summary",
          type: "string",
          reducer: "replace",
          defaultValue: "",
        },
        { key: "intent", type: "string", reducer: "replace", defaultValue: "" },
      ]),

    outputPorts: z.array(outputPortSchema).default([
      { id: "tool_call", label: "Tool Output Port" },
      { id: "human_gate", label: "Human Approval Port" },
      { id: "completed", label: "Completed Output Port" },
      { id: "error", label: "Error Output Port" },
    ]),

    toolDefinitions: z.array(toolDefinitionSchema).default([]),
    middlewareDefinitions: z.array(middlewareDefinitionSchema).default([]),
    agentDefinitions: z.array(agentDefinitionSchema).default([]),
    memoryDefinitions: z.array(memoryDefinitionSchema).default([]),
    tools: z.array(z.union([z.string(), toolDefinitionSchema])).default([]),
    graphSteps: z.array(graphStepSchema).default([]),
    graphEdges: z.array(graphEdgeSchema).default([]),
    memoryConfig: z
      .object({
        checkpointer: z.string().default("memory"),
        checkpointerConnectionId: z.string().optional(),
        threadScope: z.enum(["session", "user", "global"]).default("session"),
        autoSummarize: z.boolean().default(true),
        maxWindowMessages: z.number().default(10),
        vectorStore: vectorStoreConfigSchema.optional(),
      })
      .default({}),
    customLlmNodes: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          provider: z.string().optional(),
          url: z.string().optional(),
          baseUrl: z.string().optional(),
          method: z.string().optional(),
          headersJson: z.string().optional(),
          bodyJson: z.string().optional(),
          model: z.string().optional(),
          apiKeyHeader: z.string().optional(),
          temperature: z.number().optional(),
          maxTokens: z.number().optional(),
          position: z.object({ x: z.number(), y: z.number() }).optional(),
        }),
      )
      .optional()
      .default([]),
    startNodePosition: z.object({ x: z.number(), y: z.number() }).optional(),
    stateNodePosition: z.object({ x: z.number(), y: z.number() }).optional(),
    endNodePosition: z.object({ x: z.number(), y: z.number() }).optional(),
    endNodes: z
      .array(
        z.object({
          id: z.string(),
          label: z.string().optional(),
          position: z.object({ x: z.number(), y: z.number() }).optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine(validateLangGraphTopology);

export type LangGraphNodeData = z.infer<typeof langgraphDataSchema>;

export const langgraphStepDataSchema = baseNodeDataSchema.extend({
  stepId: z.string().optional(),
  stepType: z.string().optional(),
  modelConfig: z.record(z.unknown()).optional(),
  humanGateConfig: z.record(z.unknown()).optional(),
  interruptConfig: z.record(z.unknown()).optional(),
  customCode: z.record(z.unknown()).optional(),
});

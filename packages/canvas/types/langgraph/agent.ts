import type {
  LangGraphInputChannel,
  LangGraphStateChannel,
  LangGraphOutputPort,
  OutputChannelConfig,
} from "./channels";
import type {
  McpServerConnection,
  StateUpdateMode,
  LangGraphToolDefinition,
} from "./tools";
import type { LangGraphStepConfig, LangGraphEdgeConfig } from "./steps";
import type {
  LangGraphMemoryConfig,
  LangGraphMemoryDefinition,
} from "./memory";
import type { LangGraphMiddlewareDefinition } from "./middleware";

export type LangGraphEventStreamType =
  | "stream.messages"
  | "message.text"
  | "message.reasoning"
  | "message.toolCalls"
  | "stream.toolCalls"
  | "stream.values"
  | "stream.output"
  | "stream.subagents"
  | "stream.extensions";

export interface LangGraphAgentStreamConfig {
  enabled?: boolean;
  version?: "v3" | "v2" | string;
  selectedEvents?: string[];
  eventSignature?: string;
  customTransformers?: string;
}

export interface LangGraphAgentResponseFormatConfig {
  enabled?: boolean;
  strategy?: "auto" | "provider" | "tool";
  schemaType?: "json_schema" | "zod" | "standard_schema";
  schemaName?: string;
  schemaJson?: string;
  toolMessageContent?: string;
  handleErrorMode?: "default" | "custom_message" | "disabled";
  customErrorMessage?: string;
}

export interface LangGraphAgentMemoryConfig {
  enabled?: boolean;
  checkpointer?: string;
  threadIdKey?: string;
  threadScope?: "session" | "user" | "global";
  autoSummarize?: boolean;
  maxWindowMessages?: number;
  saveMessages?: boolean;
}

export interface LangGraphAgentDefinition {
  id?: string;
  agentId?: string;
  name: string;
  systemPrompt?: string;
  llmNodeId?: string;
  modelConfig?: LangGraphStepConfig["modelConfig"];
  llmConfig?: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
  };
  stateUpdatesConfig?: {
    enabled?: boolean;
  };
  streamConfig?: LangGraphAgentStreamConfig;
  responseFormat?: LangGraphAgentResponseFormatConfig;
  memoryConfig?: LangGraphAgentMemoryConfig;
  stateUpdates?: {
    channelKey: string;
    mode?: StateUpdateMode;
    value?: string;
  }[];
  tools?: string[]; // Bound tool IDs
  middleware?: string[]; // Bound middleware IDs
  memory?: string[]; // Bound memory / checkpointer / db_ref IDs
  position?: { x: number; y: number };
}

/** LangGraph Agent node fields — the parent graph node (canvas type). */
export interface CanvasLangGraphNodeData {
  label?: string;
  description?: string;
  inputChannels?: LangGraphInputChannel[];
  stateChannels?: LangGraphStateChannel[];
  graphSteps?: LangGraphStepConfig[];
  graphEdges?: LangGraphEdgeConfig[];
  outputPorts?: LangGraphOutputPort[];
  outputChannels?: OutputChannelConfig[];
  memoryConfig?: LangGraphMemoryConfig;
  customLlmNodes?: {
    id: string;
    label: string;
    provider?: string;
    url?: string;
    baseUrl?: string;
    method?: string;
    headersJson?: string;
    bodyJson?: string;
    model?: string;
    apiKeyHeader?: string;
    temperature?: number;
    maxTokens?: number;
    position?: { x: number; y: number };
  }[];
  toolDefinitions?: LangGraphToolDefinition[];
  middlewareDefinitions?: LangGraphMiddlewareDefinition[];
  agentDefinitions?: LangGraphAgentDefinition[];
  memoryDefinitions?: LangGraphMemoryDefinition[];
  mcpServerConnections?: McpServerConnection[];
  startNodePosition?: { x: number; y: number };
  stateNodePosition?: { x: number; y: number };
  endNodePosition?: { x: number; y: number };
  endNodes?: {
    id: string;
    label?: string;
    position?: { x: number; y: number };
  }[];
}

import type { Edge } from "@xyflow/react";
import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  OutputChannelConfig,
} from "./channels";
import type { StateUpdateMode } from "./tools";
import type { LangGraphStepConfig } from "./steps";
import type { LangGraphMemoryDefinition } from "./memory";
import type { LangGraphMiddlewareDefinition } from "./middleware";
import type {
  LangGraphAgentDefinition,
  LangGraphAgentStreamConfig,
  LangGraphAgentResponseFormatConfig,
  LangGraphAgentMemoryConfig,
} from "./agent";

/** AI / LLM / MCP Server node fields (canvas type). */
export interface CanvasAINodeData {
  // LLM Node
  model?: string;
  temperature?: number;
  maxTokens?: number;
  structuredOutput?: boolean;
  toolCalling?: boolean;
  prompts?: { id: string; name: string }[];
  tools?: { id: string; name: string }[];
  // MCP Server Node
  resources?: { id: string; name: string }[];
  connectionType?: "stdio" | "SSE" | "HTTP";
}

/** LangGraph Step node fields — child step nodes inside a graph (canvas type). */
export interface CanvasLangGraphStepNodeData {
  stepId?: string;
  stepType?:
    | "llm_call"
    | "tool_node"
    | "evaluator"
    | "summarizer"
    | "custom_code"
    | "human_gate"
    | "interrupt"
    | "vector_search"
    | "router";
  modelConfig?: LangGraphStepConfig["modelConfig"];
  humanGateConfig?: {
    approvalPrompt: string;
    timeoutMs?: number;
    requiredRole?: string;
  };
  interruptConfig?: {
    callbackKey: string;
    timeoutMs?: number;
  };
  customCode?: {
    body: string;
    timeoutMs?: number;
    memoryLimitMb?: number;
  };
  routerConfig?: LangGraphStepConfig["routerConfig"];
}

export interface LLMConfigState {
  enabled: boolean;
  provider: string;
  model: string;
  temperature: number;
}

export interface StateUpdatesConfigState {
  enabled: boolean;
}

export interface MiddlewareNodeData
  extends LangGraphMiddlewareDefinition,
    Record<string, unknown> {
  label: string;
  onDeleteMiddleware?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export interface MemoryNodeData
  extends LangGraphMemoryDefinition,
    Record<string, unknown> {
  label: string;
  onDeleteMemory?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export interface CanvasNodeData
  extends LangGraphAgentDefinition,
    Record<string, unknown> {
  label: string;
  isExpanded?: boolean;
  llmConfig?: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
  };
  stateUpdatesConfig?: {
    enabled?: boolean;
  };
  stateUpdates?: {
    channelKey: string;
    mode?: StateUpdateMode;
    value?: string;
  }[];
  availableStateChannels?: LangGraphStateChannel[];
  onDeleteAgent?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export type AgentNodeData = CanvasNodeData;

export interface UseLangGraphCanvasNodeReturn {
  isEditingName: boolean;
  setIsEditingName: (editing: boolean) => void;
  nameValue: string;
  setNameValue: (val: string) => void;
  isExpanded: boolean;
  toggleExpand: () => void;
  handleDelete: () => void;
  handleNameSave: () => void;
  boundLLMs: Edge[];
  boundTools: Edge[];
  boundMiddlewares: Edge[];
  boundMemories: Edge[];
  llmConfig: LLMConfigState;
  stateUpdatesConfig: StateUpdatesConfigState;
  streamConfig: LangGraphAgentStreamConfig;
  responseFormat: LangGraphAgentResponseFormatConfig;
  memoryConfig: LangGraphAgentMemoryConfig;
  stateUpdates: Array<{ channelKey: string; mode?: string; value?: string }>;
  availableFields: string[];
  updateAgentData: (changes: Partial<CanvasNodeData>) => void;
  handleToggleLLMConfig: (enabled: boolean) => void;
  handleToggleStateUpdates: (enabled: boolean) => void;
  handleToggleStreaming: (enabled: boolean) => void;
  handleToggleResponseFormat: (enabled: boolean) => void;
  handleToggleMemory: (enabled: boolean) => void;
  handleToggleEvent: (eventId: string) => void;
}

export interface LangGraphLLMNodeData extends Record<string, unknown> {
  label: string;
  llmId: string;
  provider?:
    | "openai"
    | "anthropic"
    | "google"
    | "groq"
    | "ollama"
    | "custom"
    | (string & {});
  url?: string;
  baseUrl?: string;
  method?: "POST" | "GET" | "PUT" | string;
  headersJson?: string;
  apiKeyHeader?: string;
  model?: string;
  systemPrompt?: string;
  bodyJson?: string;
  temperature?: number;
  maxTokens?: number;
  onDeleteLLM?: () => void;
}

export type CustomLLMNodeData = LangGraphLLMNodeData;

export interface ToolNodeData extends Record<string, unknown> {
  label: string;
  toolId: string;
  name: string;
  description: string;
  inputSchema?: string;

  source: "inline" | "mcp_server" | "api_endpoint";
  endpointUrl?: string;
  mcpConnectionId?: string;
  remoteToolName?: string;

  returnDirect?: boolean;
  returnType?: "string" | "object" | "content_blocks" | "command";
  outputSchema?: string;
  commandConfig?: {
    stateUpdates: {
      channelKey: string;
      mode?: "set" | "append" | "expression";
      value?: string;
    }[];
  };

  functionBody?: string;
  implementationMode?: "natural_language" | "code";
  prompt?: string;
  executionMode?: "sandboxed_vm" | "disabled";
  headless?: boolean;

  contextAccess?: { enabled?: boolean; fields?: string[] };
  storeAccess?: {
    enabled?: boolean;
    namespace?: string;
    operations?: ("get" | "put" | "delete" | "list")[];
  };
  streamWriter?: boolean;

  errorHandling?: {
    enabled?: boolean;
    retryCount?: number;
    customErrorMessage?: string;
  };

  onDeleteTool?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export interface StepNodeData extends Record<string, unknown> {
  label: string;
  stepId: string;
  stepType: LangGraphStepConfig["type"];
  modelConfig?: LangGraphStepConfig["modelConfig"];
  humanGateConfig?: LangGraphStepConfig["humanGateConfig"];
  customCode?: LangGraphStepConfig["customCode"];
  routerConfig?: LangGraphStepConfig["routerConfig"];
  stateUpdates?: LangGraphStepConfig["stateUpdates"];
  availableStateChannels?: LangGraphStateChannel[];
  activeBranchId?: string;
  onDeleteStep?: () => void;
  onOpenInspector?: () => void;
  onOpenInspectorRoute?: (branchId: string) => void;
  onSelectNode?: () => void;
}

export interface StartNodeData extends Record<string, unknown> {
  label: string;
  inputChannels?: LangGraphInputChannel[];
}

export interface EndNodeData extends Record<string, unknown> {
  label: string;
}

export interface PortNodeData extends Record<string, unknown> {
  label: string;
  portId: string;
}

export interface StateGlobalNodeData extends Record<string, unknown> {
  label: string;
  stateChannels: LangGraphStateChannel[];
  onOpenStateTab?: () => void;
  onAddChannel?: () => void;
}

export interface OutputNodeData
  extends OutputChannelConfig,
    Record<string, unknown> {
  label: string;
  onDeleteOutput?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

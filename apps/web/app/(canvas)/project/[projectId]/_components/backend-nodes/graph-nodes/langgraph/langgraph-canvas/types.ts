import { Node, Edge } from "@xyflow/react";
import { Brain, Code2, Cpu, GitBranch, Wrench, Shield, Bot, Database, CheckCircle2 } from "lucide-react";
import type {
  LangGraphStepConfig,
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMiddlewareDefinition,
  LangGraphAgentDefinition,
  LangGraphMemoryDefinition,
  LangGraphAgentStreamConfig,
  LangGraphAgentResponseFormatConfig,
  LangGraphEventStreamType,
  ToolSource,
  ToolReturnType,
  StateUpdateMode,
  StoreOperation,
} from "@/types/canvas";

export type {
  ToolSource,
  ToolReturnType,
  StateUpdateMode,
  StoreOperation,
  LangGraphAgentStreamConfig,
  LangGraphAgentResponseFormatConfig,
  LangGraphEventStreamType,
  LangGraphMemoryDefinition,
};

export type MiddlewareNodeData = LangGraphMiddlewareDefinition & {
  label: string;
  onDeleteMiddleware?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
};

export type MemoryNodeData = LangGraphMemoryDefinition & {
  label: string;
  onDeleteMemory?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
};

export type CanvasNodeData = LangGraphAgentDefinition & {
  label: string;
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
};

export type AgentNodeData = CanvasNodeData; // Backwards compatible alias

export type LangGraphLLMNodeData = {
  label: string;
  llmId: string;
  provider?: "openai" | "anthropic" | "google" | "groq" | "ollama" | "custom" | (string & {});
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
};

export type ToolNodeData = {
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
};

export type StepNodeData = {
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
};

export type StartNodeData = {
  label: string;
  inputChannels?: LangGraphInputChannel[];
};

export type EndNodeData = {
  label: string;
};

export type PortNodeData = {
  label: string;
  portId: string;
};

export type StateGlobalNodeData = {
  label: string;
  stateChannels: LangGraphStateChannel[];
  onOpenStateTab?: () => void;
  onAddChannel?: () => void;
};

import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_END,
  LANGGRAPH_CANVAS_NODE_PORT,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  STEP_TYPE_ROUTER,
} from "./constants";

export type LangGraphLLMNode = Node<LangGraphLLMNodeData, typeof LANGGRAPH_CANVAS_NODE_LLM>;
export type CustomLLMNode = LangGraphLLMNode; // Backwards compatible alias
export type CustomLLMNodeData = LangGraphLLMNodeData; // Backwards compatible alias
export type StepNode = Node<StepNodeData, typeof LANGGRAPH_CANVAS_NODE_STEP>;
export type StartNode = Node<StartNodeData, typeof LANGGRAPH_CANVAS_NODE_START>;
export type EndNode = Node<EndNodeData, typeof LANGGRAPH_CANVAS_NODE_END>;
export type PortNode = Node<PortNodeData, typeof LANGGRAPH_CANVAS_NODE_PORT>;
export type StateGlobalNode = Node<StateGlobalNodeData, typeof LANGGRAPH_CANVAS_NODE_STATE_GLOBAL>;

export type ToolNode = Node<ToolNodeData, typeof LANGGRAPH_CANVAS_NODE_TOOL>;
export type MiddlewareNode = Node<MiddlewareNodeData, typeof LANGGRAPH_CANVAS_NODE_MIDDLEWARE>;
export type CanvasNode = Node<CanvasNodeData, typeof LANGGRAPH_CANVAS_NODE_NODE | typeof LANGGRAPH_CANVAS_NODE_AGENT>;
export type AgentNode = CanvasNode; // Backwards compatible alias
export type MemoryNode = Node<MemoryNodeData, typeof LANGGRAPH_CANVAS_NODE_MEMORY>;

export type LangGraphCanvasEdge = Edge & {
  selected?: boolean;
};

export type LangGraphCanvasNodeUnion = StepNode | StartNode | EndNode | PortNode | StateGlobalNode | LangGraphLLMNode | ToolNode | MiddlewareNode | CanvasNode | MemoryNode;
export type LangGraphCanvasNode = LangGraphCanvasNodeUnion;

export function getStepData(node: LangGraphCanvasNode): StepNodeData | null {
  if (node.type === LANGGRAPH_CANVAS_NODE_STEP) return node.data;
  return null;
}

export type LangGraphCanvasNodeAddType = LangGraphStepConfig["type"] | typeof LANGGRAPH_CANVAS_NODE_LLM | typeof LANGGRAPH_CANVAS_NODE_TOOL | typeof LANGGRAPH_CANVAS_NODE_MIDDLEWARE | typeof LANGGRAPH_CANVAS_NODE_NODE | typeof LANGGRAPH_CANVAS_NODE_AGENT | typeof LANGGRAPH_CANVAS_NODE_MEMORY | typeof LANGGRAPH_CANVAS_NODE_END;

export type ToolPaletteItem = {
  type: LangGraphCanvasNodeAddType;
  label: string;
  desc: string;
  icon: typeof Brain;
};

export const TOOL_PALETTE_ITEMS: ToolPaletteItem[] = [
  { type: LANGGRAPH_CANVAS_NODE_NODE, label: "Node", desc: "LangGraph node with optional LLM, tools, middleware & memory", icon: Bot },
  { type: STEP_TYPE_ROUTER, label: "Conditional Router", desc: "Routes execution dynamically based on comparison rules", icon: GitBranch },
  { type: LANGGRAPH_CANVAS_NODE_END, label: "END Node", desc: "Terminal graph node representing __end__ execution", icon: CheckCircle2 },
  { type: LANGGRAPH_CANVAS_NODE_LLM, label: "LLM config", desc: "Configure an LLM provider or raw API endpoint", icon: Cpu },
  { type: LANGGRAPH_CANVAS_NODE_TOOL, label: "Tool", desc: "Configure an executable tool for LLMs", icon: Wrench },
  { type: LANGGRAPH_CANVAS_NODE_MIDDLEWARE, label: "Middleware", desc: "Interceptors for Human-in-the-loop, rate limit & tracing", icon: Shield },
  { type: LANGGRAPH_CANVAS_NODE_MEMORY, label: "Memory / DB Ref", desc: "Save chat history & state checkpoints per session", icon: Database },
];

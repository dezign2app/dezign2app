import { Node } from "@xyflow/react";
import { Brain, Code2, Cpu, GitBranch, Wrench } from "lucide-react";
import type {
  LangGraphStepConfig,
  LangGraphStateChannel,
  LangGraphInputChannel,
} from "@/types/canvas";
import { Edge } from "@xyflow/react";

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
  SUB_CANVAS_NODE_STEP,
  SUB_CANVAS_NODE_START,
  SUB_CANVAS_NODE_PORT,
  SUB_CANVAS_NODE_STATE_GLOBAL,
  SUB_CANVAS_NODE_LLM,
  SUB_CANVAS_NODE_TOOL,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_ROUTER,
} from "./constants";

export type LangGraphLLMNode = Node<LangGraphLLMNodeData, typeof SUB_CANVAS_NODE_LLM>;
export type CustomLLMNode = LangGraphLLMNode; // Backwards compatible alias
export type CustomLLMNodeData = LangGraphLLMNodeData; // Backwards compatible alias
export type StepNode = Node<StepNodeData, typeof SUB_CANVAS_NODE_STEP>;
export type StartNode = Node<StartNodeData, typeof SUB_CANVAS_NODE_START>;
export type PortNode = Node<PortNodeData, typeof SUB_CANVAS_NODE_PORT>;
export type StateGlobalNode = Node<StateGlobalNodeData, typeof SUB_CANVAS_NODE_STATE_GLOBAL>;

export type ToolNode = Node<ToolNodeData, typeof SUB_CANVAS_NODE_TOOL>;

export type LangGraphCanvasEdge = Edge & {
  selected?: boolean;
};

export type LangGraphCanvasNode = StepNode | StartNode | PortNode | StateGlobalNode | LangGraphLLMNode | ToolNode;

export function getStepData(node: LangGraphCanvasNode): StepNodeData | null {
  if (node.type === SUB_CANVAS_NODE_STEP) return node.data;
  return null;
}

export type ToolPaletteItem = {
  type: LangGraphStepConfig["type"] | typeof SUB_CANVAS_NODE_LLM | typeof SUB_CANVAS_NODE_TOOL;
  label: string;
  desc: string;
  icon: typeof Brain;
};

export const TOOL_PALETTE_ITEMS: ToolPaletteItem[] = [
  { type: STEP_TYPE_CUSTOM_CODE, label: "Node", desc: "LangGraph node function that processes state", icon: Code2 },
  { type: STEP_TYPE_ROUTER, label: "Conditional Router", desc: "Routes execution dynamically based on comparison rules", icon: GitBranch },
  { type: SUB_CANVAS_NODE_LLM, label: "LLM Node", desc: "Configure an LLM provider or raw API endpoint", icon: Cpu },
  { type: SUB_CANVAS_NODE_TOOL, label: "Tool Node", desc: "Configure an executable tool for LLMs", icon: Wrench },
];



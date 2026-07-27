import { Node } from "@xyflow/react";
import { Brain, Code2, Cpu } from "lucide-react";
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

export type StepNodeData = {
  label: string;
  stepId: string;
  stepType: LangGraphStepConfig["type"];
  modelConfig?: LangGraphStepConfig["modelConfig"];
  humanGateConfig?: LangGraphStepConfig["humanGateConfig"];
  customCode?: LangGraphStepConfig["customCode"];
  stateUpdates?: LangGraphStepConfig["stateUpdates"];
  availableStateChannels?: LangGraphStateChannel[];
  onDeleteStep?: () => void;
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
  STEP_TYPE_CUSTOM_CODE,
} from "./constants";

export type LangGraphLLMNode = Node<LangGraphLLMNodeData, typeof SUB_CANVAS_NODE_LLM>;
export type CustomLLMNode = LangGraphLLMNode; // Backwards compatible alias
export type CustomLLMNodeData = LangGraphLLMNodeData; // Backwards compatible alias
export type StepNode = Node<StepNodeData, typeof SUB_CANVAS_NODE_STEP>;
export type StartNode = Node<StartNodeData, typeof SUB_CANVAS_NODE_START>;
export type PortNode = Node<PortNodeData, typeof SUB_CANVAS_NODE_PORT>;
export type StateGlobalNode = Node<StateGlobalNodeData, typeof SUB_CANVAS_NODE_STATE_GLOBAL>;

export type LangGraphCanvasEdge = Edge & {
  selected?: boolean;
};

export type LangGraphCanvasNode = StepNode | StartNode | PortNode | StateGlobalNode | LangGraphLLMNode;

export function getStepData(node: LangGraphCanvasNode): StepNodeData | null {
  if (node.type === SUB_CANVAS_NODE_STEP) return node.data;
  return null;
}

export type ToolPaletteItem = {
  type: LangGraphStepConfig["type"] | typeof SUB_CANVAS_NODE_LLM;
  label: string;
  desc: string;
  icon: typeof Brain;
};

export const TOOL_PALETTE_ITEMS: ToolPaletteItem[] = [
  { type: STEP_TYPE_CUSTOM_CODE, label: "Node", desc: "LangGraph node function that processes state", icon: Code2 },
  { type: SUB_CANVAS_NODE_LLM, label: "LLM Node", desc: "Configure an LLM provider or raw API endpoint", icon: Cpu },
];



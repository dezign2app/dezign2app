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

export type LangGraphLLMNode = Node<LangGraphLLMNodeData, "langgraph_llm">;
export type CustomLLMNode = LangGraphLLMNode; // Backwards compatible alias
export type CustomLLMNodeData = LangGraphLLMNodeData; // Backwards compatible alias
export type StepNode = Node<StepNodeData, "step">;
export type StartNode = Node<StartNodeData, "start">;
export type PortNode = Node<PortNodeData, "port">;
export type StateGlobalNode = Node<StateGlobalNodeData, "state_global">;

export type LangGraphCanvasEdge = Edge & {
  selected?: boolean;
};

export type LangGraphCanvasNode = StepNode | StartNode | PortNode | StateGlobalNode | LangGraphLLMNode;

export function getStepData(node: LangGraphCanvasNode): StepNodeData | null {
  if (node.type === "step") return node.data;
  return null;
}

export type ToolPaletteItem = {
  type: LangGraphStepConfig["type"] | "langgraph_llm";
  label: string;
  desc: string;
  icon: typeof Brain;
};

export const TOOL_PALETTE_ITEMS: ToolPaletteItem[] = [
  { type: "custom_code", label: "Node", desc: "LangGraph node function that processes state", icon: Code2 },
  { type: "langgraph_llm", label: "LLM Node", desc: "Configure an LLM provider or raw API endpoint", icon: Cpu },
];


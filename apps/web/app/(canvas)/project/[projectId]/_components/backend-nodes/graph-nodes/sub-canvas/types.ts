import { Node } from "@xyflow/react";
import { Brain, Wrench, Search, ShieldCheck, Code2, Sparkles, Database } from "lucide-react";
import type {
  LangGraphStepConfig,
  LangGraphStateChannel,
  LangGraphInputChannel,
} from "@/types/canvas";

export type StepNodeData = {
  label: string;
  stepId: string;
  stepType: LangGraphStepConfig["type"];
  modelConfig?: LangGraphStepConfig["modelConfig"];
  humanGateConfig?: LangGraphStepConfig["humanGateConfig"];
  customCode?: LangGraphStepConfig["customCode"];
  stateUpdates?: LangGraphStepConfig["stateUpdates"];
  availableStateChannels?: LangGraphStateChannel[];
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

export type StepNode = Node<StepNodeData, "step">;
export type StartNode = Node<StartNodeData, "start">;
export type PortNode = Node<PortNodeData, "port">;
export type StateGlobalNode = Node<StateGlobalNodeData, "state_global">;

export type SubCanvasNode = StepNode | StartNode | PortNode | StateGlobalNode;

export function getStepData(node: SubCanvasNode): StepNodeData | null {
  if (node.type === "step") return node.data;
  return null;
}

export type ToolPaletteItem = {
  type: LangGraphStepConfig["type"];
  label: string;
  desc: string;
  icon: typeof Brain;
};

export const TOOL_PALETTE_ITEMS: ToolPaletteItem[] = [
  { type: "llm_call", label: "LLM Reasoner", desc: "AI decision & generation node", icon: Brain },
  { type: "tool_node", label: "Tool Executor", desc: "Execute custom tools & APIs", icon: Wrench },
  { type: "evaluator", label: "Evaluator", desc: "Route based on quality checks", icon: Search },
  { type: "human_gate", label: "Human Gate", desc: "Pause for human approval", icon: ShieldCheck },
  { type: "custom_code", label: "Custom Code", desc: "Execute sandboxed logic", icon: Code2 },
  { type: "summarizer", label: "Summarizer", desc: "Compress message history", icon: Sparkles },
  { type: "vector_search", label: "Vector Search", desc: "RAG & vector index search", icon: Database },
];

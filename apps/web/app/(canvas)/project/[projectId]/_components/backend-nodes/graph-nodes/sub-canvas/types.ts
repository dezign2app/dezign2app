import { Node } from "@xyflow/react";
import { Brain, Code2 } from "lucide-react";
import type {
  LangGraphStepConfig,
  LangGraphStateChannel,
  LangGraphInputChannel,
} from "@/types/canvas";
import { Edge } from "@xyflow/react";

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

export type StepNode = Node<StepNodeData, "step">;
export type StartNode = Node<StartNodeData, "start">;
export type PortNode = Node<PortNodeData, "port">;
export type StateGlobalNode = Node<StateGlobalNodeData, "state_global">;

export type SubCanvasEdge = Edge & {
  selected?: boolean;
};

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
  { type: "custom_code", label: "Node", desc: "LangGraph node function that processes state", icon: Code2 },
];

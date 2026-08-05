import type { Node, Edge } from "@xyflow/react";
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
  LANGGRAPH_CANVAS_NODE_OUTPUT,
} from "../../constants";
import type {
  LangGraphLLMNodeData,
  StepNodeData,
  StartNodeData,
  EndNodeData,
  PortNodeData,
  StateGlobalNodeData,
  ToolNodeData,
  MiddlewareNodeData,
  CanvasNodeData,
  MemoryNodeData,
  OutputNodeData,
} from "./node-data";
import type { LangGraphStepConfig } from "./steps";

export type BaseCanvasNodeProps = {
  className?: string;
  style?: React.CSSProperties;
};

export type LangGraphLLMNode = Node<
  LangGraphLLMNodeData,
  typeof LANGGRAPH_CANVAS_NODE_LLM
> &
  BaseCanvasNodeProps;
export type CustomLLMNode = LangGraphLLMNode;

export type StepNode = Node<StepNodeData, typeof LANGGRAPH_CANVAS_NODE_STEP> &
  BaseCanvasNodeProps;

export type StartNode = Node<
  StartNodeData,
  typeof LANGGRAPH_CANVAS_NODE_START
> &
  BaseCanvasNodeProps;

export type EndNode = Node<EndNodeData, typeof LANGGRAPH_CANVAS_NODE_END> &
  BaseCanvasNodeProps;

export type PortNode = Node<PortNodeData, typeof LANGGRAPH_CANVAS_NODE_PORT> &
  BaseCanvasNodeProps;

export type StateGlobalNode = Node<
  StateGlobalNodeData,
  typeof LANGGRAPH_CANVAS_NODE_STATE_GLOBAL
> &
  BaseCanvasNodeProps;

export type ToolNode = Node<ToolNodeData, typeof LANGGRAPH_CANVAS_NODE_TOOL> &
  BaseCanvasNodeProps;

export type MiddlewareNode = Node<
  MiddlewareNodeData,
  typeof LANGGRAPH_CANVAS_NODE_MIDDLEWARE
> &
  BaseCanvasNodeProps;

export type CanvasNode = Node<
  CanvasNodeData,
  typeof LANGGRAPH_CANVAS_NODE_NODE | typeof LANGGRAPH_CANVAS_NODE_AGENT
> &
  BaseCanvasNodeProps;

export type AgentNode = CanvasNode;

export type MemoryNode = Node<
  MemoryNodeData,
  typeof LANGGRAPH_CANVAS_NODE_MEMORY
> &
  BaseCanvasNodeProps;

export type OutputNode = Node<
  OutputNodeData,
  typeof LANGGRAPH_CANVAS_NODE_OUTPUT
> &
  BaseCanvasNodeProps;

export type LangGraphCanvasEdge = Edge & {
  selected?: boolean;
};

export type LangGraphCanvasNodeUnion =
  | StepNode
  | StartNode
  | EndNode
  | PortNode
  | StateGlobalNode
  | LangGraphLLMNode
  | ToolNode
  | MiddlewareNode
  | CanvasNode
  | MemoryNode
  | OutputNode;

export type LangGraphCanvasNode = LangGraphCanvasNodeUnion;

export function getStepData(node: LangGraphCanvasNode): StepNodeData | null {
  if (node.type === LANGGRAPH_CANVAS_NODE_STEP) return node.data;
  return null;
}

export type LangGraphCanvasNodeAddType =
  | LangGraphStepConfig["type"]
  | typeof LANGGRAPH_CANVAS_NODE_LLM
  | typeof LANGGRAPH_CANVAS_NODE_TOOL
  | typeof LANGGRAPH_CANVAS_NODE_MIDDLEWARE
  | typeof LANGGRAPH_CANVAS_NODE_NODE
  | typeof LANGGRAPH_CANVAS_NODE_AGENT
  | typeof LANGGRAPH_CANVAS_NODE_MEMORY
  | typeof LANGGRAPH_CANVAS_NODE_END
  | typeof LANGGRAPH_CANVAS_NODE_OUTPUT;

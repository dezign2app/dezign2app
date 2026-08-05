import {
  BackendNode,
  CanvasLangGraphNodeData,
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
} from "@/types/canvas";
import { CompileLangGraphInput } from "../langgraph/typescript/v1";
import type {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/types";
import { reconstructNodes, reconstructEdges } from "./reconstructCanvas";

export function extractLangGraphInput(
  node: BackendNode,
): CompileLangGraphInput {
  const data: CanvasLangGraphNodeData = node.data || {};
  const graphLabel = data.label || "LangGraph Agent";

  const stateChannels: LangGraphStateChannel[] = data.stateChannels || [
    {
      key: "messages",
      type: "messages",
      reducer: "add_messages",
      defaultValue: [],
    },
  ];
  const inputChannels: LangGraphInputChannel[] = data.inputChannels || [];
  const memoryConfig: LangGraphMemoryConfig | undefined = data.memoryConfig;

  // 1. If full canvas nodes & edges are stored directly on node.data
  const canvasNodes = (data as { nodes?: LangGraphCanvasNode[] }).nodes;
  const canvasEdges = (data as { edges?: LangGraphCanvasEdge[] }).edges;

  if (
    Array.isArray(canvasNodes) &&
    Array.isArray(canvasEdges) &&
    canvasNodes.length > 0
  ) {
    return {
      graphLabel,
      stateChannels,
      inputChannels,
      nodes: canvasNodes,
      edges: canvasEdges,
      memoryConfig,
    };
  }

  // 2. Reconstruct nodes & edges from node.data properties
  const reconstructedNodes = reconstructNodes(
    data,
    stateChannels,
    inputChannels,
  );
  const reconstructedEdges = reconstructEdges(data, reconstructedNodes);

  return {
    graphLabel,
    stateChannels,
    inputChannels,
    nodes: reconstructedNodes,
    edges: reconstructedEdges,
    memoryConfig,
  };
}

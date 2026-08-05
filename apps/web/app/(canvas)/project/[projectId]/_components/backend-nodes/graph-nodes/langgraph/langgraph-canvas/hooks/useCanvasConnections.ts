import { useCallback } from "react";
import {
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
} from "@xyflow/react";
import {
  type LangGraphCanvasNode,
  type LangGraphCanvasEdge,
  type StepNode,
  type LangGraphRouterBranch,
} from "@workspace/canvas";
import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MIDDLEWARE_OUT,
  HANDLE_MEMORY_IN,
  HANDLE_MEMORY_OUT,
} from "../constants";

interface UseCanvasConnectionsProps {
  nodes: LangGraphCanvasNode[];
  setNodes: React.Dispatch<React.SetStateAction<LangGraphCanvasNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<LangGraphCanvasEdge[]>>;
}

export function useCanvasConnections({
  nodes,
  setNodes,
  setEdges,
}: UseCanvasConnectionsProps) {
  const onNodesChange = useCallback(
    (changes: NodeChange<LangGraphCanvasNode>[]) =>
      setNodes((nds) => applyNodeChanges<LangGraphCanvasNode>(changes, nds)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const isLLMSource =
        connection.sourceHandle === HANDLE_LLM_OUT ||
        sourceNode?.type === LANGGRAPH_CANVAS_NODE_LLM ||
        connection.source?.startsWith("llm_");
      const isLLMTarget = connection.targetHandle === HANDLE_LLM_IN;

      const isToolSource =
        connection.sourceHandle === HANDLE_TOOL_OUT ||
        sourceNode?.type === LANGGRAPH_CANVAS_NODE_TOOL ||
        connection.source?.startsWith("tool_");
      const isToolTarget = connection.targetHandle === HANDLE_TOOL_IN;

      const isMiddlewareSource =
        connection.sourceHandle === HANDLE_MIDDLEWARE_OUT ||
        sourceNode?.type === LANGGRAPH_CANVAS_NODE_MIDDLEWARE ||
        connection.source?.startsWith("mw_");
      const isMiddlewareTarget =
        connection.targetHandle === HANDLE_MIDDLEWARE_IN;

      const isMemorySource =
        connection.sourceHandle === HANDLE_MEMORY_OUT ||
        sourceNode?.type === LANGGRAPH_CANVAS_NODE_MEMORY ||
        connection.source?.startsWith("mem_") ||
        connection.source?.startsWith("db_");
      const isMemoryTarget = connection.targetHandle === HANDLE_MEMORY_IN;

      if (isLLMSource && !isLLMTarget) return false;
      if (isLLMTarget && !isLLMSource) return false;

      if (isToolSource && !isToolTarget) return false;
      if (isToolTarget && !isToolSource) return false;

      if (isMiddlewareSource && !isMiddlewareTarget) return false;
      if (isMiddlewareTarget && !isMiddlewareSource) return false;

      if (isMemorySource && !isMemoryTarget) return false;
      if (isMemoryTarget && !isMemorySource) return false;

      return true;
    },
    [nodes],
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => {
        if (!isValidConnection(params)) return eds;

        const isLLM =
          params.sourceHandle === HANDLE_LLM_OUT ||
          params.targetHandle === HANDLE_LLM_IN ||
          Boolean(params.source?.startsWith("llm_"));
        const isTool =
          params.sourceHandle === HANDLE_TOOL_OUT ||
          params.targetHandle === HANDLE_TOOL_IN ||
          Boolean(params.source?.startsWith("tool_"));
        const isMiddleware =
          params.sourceHandle === HANDLE_MIDDLEWARE_OUT ||
          params.targetHandle === HANDLE_MIDDLEWARE_IN ||
          Boolean(params.source?.startsWith("mw_"));
        const isMemory =
          params.sourceHandle === HANDLE_MEMORY_OUT ||
          params.targetHandle === HANDLE_MEMORY_IN ||
          Boolean(
            params.source?.startsWith("mem_") ||
            params.source?.startsWith("db_"),
          );

        const sourceNode = nodes.find(
          (n): n is StepNode =>
            n.id === params.source && n.type === LANGGRAPH_CANVAS_NODE_STEP,
        );
        const routerBranch = sourceNode?.data?.routerConfig?.branches?.find(
          (b: LangGraphRouterBranch) => b.id === params.sourceHandle,
        );

        const sourceHandle = isLLM
          ? HANDLE_LLM_OUT
          : isTool
            ? HANDLE_TOOL_OUT
            : isMiddleware
              ? HANDLE_MIDDLEWARE_OUT
              : isMemory
                ? HANDLE_MEMORY_OUT
                : params.sourceHandle;
        const targetHandle = isLLM
          ? HANDLE_LLM_IN
          : isTool
            ? HANDLE_TOOL_IN
            : isMiddleware
              ? HANDLE_MIDDLEWARE_IN
              : isMemory
                ? HANDLE_MEMORY_IN
                : params.targetHandle;

        const fieldStr = routerBranch?.field
          ? routerBranch.field.startsWith("state.")
            ? routerBranch.field
            : `state.${routerBranch.field}`
          : "state";
        const label = routerBranch
          ? routerBranch.label ||
            (routerBranch.isDefault
              ? "Default"
              : `${fieldStr} ${routerBranch.operator} '${routerBranch.value ?? ""}'`)
          : undefined;

        const style = isLLM
          ? { stroke: "#38bdf8", strokeWidth: 2, strokeDasharray: "4 4" }
          : isTool
            ? { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" }
            : isMiddleware
              ? { stroke: "#a855f7", strokeWidth: 2, strokeDasharray: "4 4" }
              : isMemory
                ? { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" }
                : routerBranch
                  ? { stroke: "#38bdf8", strokeWidth: 2 }
                  : { stroke: "#a1a1aa", strokeWidth: 2 };

        const labelStyle = routerBranch
          ? { fill: "#bae6fd", fontSize: 10, fontWeight: "bold" }
          : undefined;

        const labelBgStyle = routerBranch
          ? { fill: "#0c4a6e", rx: 4, ry: 4 }
          : undefined;

        return rfAddEdge(
          {
            ...params,
            sourceHandle,
            targetHandle,
            animated: true,
            ...(label ? { label, labelStyle, labelBgStyle } : {}),
            style,
          },
          eds,
        );
      }),
    [nodes, isValidConnection, setEdges],
  );

  return {
    onNodesChange,
    onEdgesChange,
    isValidConnection,
    onConnect,
  };
}

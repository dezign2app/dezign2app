import { useMemo, useCallback } from "react";
import type {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  LangGraphLLMNode,
  ToolNode,
  MiddlewareNode,
  MemoryNode,
} from "@workspace/canvas";
import {
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

interface UseAgentResourceConnectionsProps {
  nodes: LangGraphCanvasNode[];
  setEdges: React.Dispatch<React.SetStateAction<LangGraphCanvasEdge[]>>;
}

export function useAgentResourceConnections({
  nodes,
  setEdges,
}: UseAgentResourceConnectionsProps) {
  const availableLLMNodes = useMemo(() => {
    return nodes.filter(
      (n): n is LangGraphLLMNode => n.type === LANGGRAPH_CANVAS_NODE_LLM,
    );
  }, [nodes]);

  const availableToolNodes = useMemo(() => {
    return nodes.filter(
      (n): n is ToolNode => n.type === LANGGRAPH_CANVAS_NODE_TOOL,
    );
  }, [nodes]);

  const availableMiddlewareNodes = useMemo(() => {
    return nodes.filter(
      (n): n is MiddlewareNode => n.type === LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
    );
  }, [nodes]);

  const availableMemoryNodes = useMemo(() => {
    return nodes.filter(
      (n): n is MemoryNode => n.type === LANGGRAPH_CANVAS_NODE_MEMORY,
    );
  }, [nodes]);

  const handleSelectLLMForAgent = useCallback(
    (agentId: string, llmId: string | null) => {
      setEdges((eds) => {
        const filtered = eds.filter(
          (e) => !(e.target === agentId && e.targetHandle === HANDLE_LLM_IN),
        );
        if (!llmId) return filtered;
        const newEdge: LangGraphCanvasEdge = {
          id: `xy-edge__${llmId}${HANDLE_LLM_OUT}-${agentId}${HANDLE_LLM_IN}`,
          source: llmId,
          sourceHandle: HANDLE_LLM_OUT,
          target: agentId,
          targetHandle: HANDLE_LLM_IN,
          animated: true,
          style: { stroke: "#38bdf8", strokeWidth: 2, strokeDasharray: "5 5" },
        };
        return [...filtered, newEdge];
      });
    },
    [setEdges],
  );

  const handleToggleToolForAgent = useCallback(
    (agentId: string, toolId: string, connect: boolean) => {
      setEdges((eds) => {
        if (!connect) {
          return eds.filter(
            (e) =>
              !(
                e.source === toolId &&
                e.target === agentId &&
                e.targetHandle === HANDLE_TOOL_IN
              ),
          );
        }
        const existing = eds.find(
          (e) =>
            e.source === toolId &&
            e.target === agentId &&
            e.targetHandle === HANDLE_TOOL_IN,
        );
        if (existing) return eds;
        const newEdge: LangGraphCanvasEdge = {
          id: `xy-edge__${toolId}${HANDLE_TOOL_OUT}-${agentId}${HANDLE_TOOL_IN}`,
          source: toolId,
          sourceHandle: HANDLE_TOOL_OUT,
          target: agentId,
          targetHandle: HANDLE_TOOL_IN,
          animated: true,
          style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "5 5" },
        };
        return [...eds, newEdge];
      });
    },
    [setEdges],
  );

  const handleToggleMiddlewareForAgent = useCallback(
    (agentId: string, mwId: string, connect: boolean) => {
      setEdges((eds) => {
        if (!connect) {
          return eds.filter(
            (e) =>
              !(
                e.source === mwId &&
                e.target === agentId &&
                e.targetHandle === HANDLE_MIDDLEWARE_IN
              ),
          );
        }
        const existing = eds.find(
          (e) =>
            e.source === mwId &&
            e.target === agentId &&
            e.targetHandle === HANDLE_MIDDLEWARE_IN,
        );
        if (existing) return eds;
        const newEdge: LangGraphCanvasEdge = {
          id: `xy-edge__${mwId}${HANDLE_MIDDLEWARE_OUT}-${agentId}${HANDLE_MIDDLEWARE_IN}`,
          source: mwId,
          sourceHandle: HANDLE_MIDDLEWARE_OUT,
          target: agentId,
          targetHandle: HANDLE_MIDDLEWARE_IN,
          animated: true,
          style: { stroke: "#a855f7", strokeWidth: 2, strokeDasharray: "5 5" },
        };
        return [...eds, newEdge];
      });
    },
    [setEdges],
  );

  const handleToggleMemoryForAgent = useCallback(
    (agentId: string, memId: string, connect: boolean) => {
      setEdges((eds) => {
        if (!connect) {
          return eds.filter(
            (e) =>
              !(
                e.source === memId &&
                e.target === agentId &&
                e.targetHandle === HANDLE_MEMORY_IN
              ),
          );
        }
        const existing = eds.find(
          (e) =>
            e.source === memId &&
            e.target === agentId &&
            e.targetHandle === HANDLE_MEMORY_IN,
        );
        if (existing) return eds;
        const newEdge: LangGraphCanvasEdge = {
          id: `xy-edge__${memId}${HANDLE_MEMORY_OUT}-${agentId}${HANDLE_MEMORY_IN}`,
          source: memId,
          sourceHandle: HANDLE_MEMORY_OUT,
          target: agentId,
          targetHandle: HANDLE_MEMORY_IN,
          animated: true,
          style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "5 5" },
        };
        return [...eds, newEdge];
      });
    },
    [setEdges],
  );

  return {
    availableLLMNodes,
    availableToolNodes,
    availableMiddlewareNodes,
    availableMemoryNodes,
    handleSelectLLMForAgent,
    handleToggleToolForAgent,
    handleToggleMiddlewareForAgent,
    handleToggleMemoryForAgent,
  };
}

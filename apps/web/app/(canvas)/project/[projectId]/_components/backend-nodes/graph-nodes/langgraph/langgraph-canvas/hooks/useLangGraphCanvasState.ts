import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
  useReactFlow,
} from "@xyflow/react";
import { toast } from "sonner";
import type {
  BackendNode,
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
  LangGraphRouterBranch,
} from "@/types/canvas";
import { ensureLangGraphDataReachability } from "@workspace/canvas/constants";
import {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  StepNode,
  StateGlobalNode,
} from "../types";
import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_END,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MIDDLEWARE_OUT,
  HANDLE_MEMORY_IN,
  HANDLE_MEMORY_OUT,
  NODE_ID_START,
  NODE_ID_END,
  NODE_ID_STATE_GLOBAL,
  isReservedNodeId,
} from "../constants";

import { buildInitialNodes, buildInitialEdges } from "./utils/initializers";
import { buildGraphData as buildGraphDataUtil } from "./utils/serializer";
import { useAgentResourceConnections } from "./useAgentResourceConnections";
import { useSelectedNodeState } from "./useSelectedNodeState";
import { useNodeFactory } from "./useNodeFactory";

interface UseLangGraphCanvasStateProps {
  node: BackendNode;
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
  onClose: () => void;
}

export function useLangGraphCanvasState({
  node,
  updateNode,
  onClose,
}: UseLangGraphCanvasStateProps) {
  const data = node.data;

  const [inputChannels, setInputChannels] = useState<LangGraphInputChannel[]>(
    data.inputChannels || [],
  );
  const [stateChannels, setStateChannels] = useState<LangGraphStateChannel[]>(
    data.stateChannels || [
      {
        key: "messages",
        type: "messages",
        reducer: "add_messages",
        defaultValue: [],
      },
    ],
  );
  const [memoryConfig, setMemoryConfig] = useState<LangGraphMemoryConfig>(
    data.memoryConfig || {
      checkpointer: "convex",
      threadScope: "session",
      autoSummarize: true,
      maxWindowMessages: 10,
    },
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<
    "inspector" | "inputs" | "state" | "memory"
  >("inspector");
  const [showCompileModal, setShowCompileModal] = useState(false);

  const { fitView: triggerFitView } = useReactFlow();

  // ── Build initial nodes & edges ──
  const initialNodes = useMemo(() => buildInitialNodes(data), []);
  const initialEdges = useMemo(() => buildInitialEdges(data, initialNodes), []);

  const [nodes, setNodes] = useState<LangGraphCanvasNode[]>(initialNodes);
  const [edges, setEdges] = useState<LangGraphCanvasEdge[]>(initialEdges);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerFitView({ padding: 0.35, duration: 200 });
    }, 50);
    return () => clearTimeout(timer);
  }, [triggerFitView]);

  const handleAddChannel = useCallback(() => {
    const newChannel: LangGraphStateChannel = {
      key: "",
      type: "string",
      reducer: "replace",
      defaultValue: "",
    };
    setStateChannels((prev) => [...prev, newChannel]);
    setActiveSideTab("state");
  }, []);

  // ── Sync node callbacks and internal attributes ──
  useEffect(() => {
    setNodes((nds) => {
      const hasStateGlobal = nds.some((n) => n.id === NODE_ID_STATE_GLOBAL);

      let updated = nds.map((n): LangGraphCanvasNode => {
        if (n.id === NODE_ID_START && n.type === LANGGRAPH_CANVAS_NODE_START) {
          return { ...n, data: { ...n.data, inputChannels } };
        }
        if (
          n.id === NODE_ID_STATE_GLOBAL &&
          n.type === LANGGRAPH_CANVAS_NODE_STATE_GLOBAL
        ) {
          return {
            ...n,
            data: {
              ...n.data,
              stateChannels,
              onOpenStateTab: () => setActiveSideTab("state"),
              onAddChannel: handleAddChannel,
            },
          };
        }
        if (n.type === LANGGRAPH_CANVAS_NODE_LLM) {
          return {
            ...n,
            data: {
              ...n.data,
              onDeleteLLM: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) =>
                  edges.filter(
                    (edge) => edge.source !== n.id && edge.target !== n.id,
                  ),
                );
                setSelectedNodeId((curr) => (curr === n.id ? null : curr));
              },
            },
          };
        }
        if (n.type === LANGGRAPH_CANVAS_NODE_TOOL) {
          return {
            ...n,
            data: {
              ...n.data,
              onDeleteTool: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) =>
                  edges.filter(
                    (edge) => edge.source !== n.id && edge.target !== n.id,
                  ),
                );
                setSelectedNodeId((curr) => (curr === n.id ? null : curr));
              },
              onOpenInspector: () => {
                setSelectedNodeId(n.id);
                setActiveSideTab("inspector");
              },
              onSelectNode: () => {
                setSelectedNodeId(n.id);
              },
            },
          };
        }
        if (
          n.type === LANGGRAPH_CANVAS_NODE_NODE ||
          n.type === LANGGRAPH_CANVAS_NODE_AGENT
        ) {
          return {
            ...n,
            data: {
              ...n.data,
              availableStateChannels: stateChannels,
              onOpenInspector: () => {
                setSelectedNodeId(n.id);
                setActiveSideTab("inspector");
              },
              onSelectNode: () => {
                setSelectedNodeId(n.id);
              },
            },
          };
        }
        if (n.type === LANGGRAPH_CANVAS_NODE_STEP) {
          return {
            ...n,
            data: {
              ...n.data,
              availableStateChannels: stateChannels,
              onOpenInspector: () => {
                setSelectedNodeId(n.id);
                setActiveSideTab("inspector");
              },
              onOpenInspectorRoute: (branchId: string) => {
                setSelectedNodeId(n.id);
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === n.id && node.type === LANGGRAPH_CANVAS_NODE_STEP
                      ? {
                          ...node,
                          data: { ...node.data, activeBranchId: branchId },
                        }
                      : node,
                  ),
                );
                setActiveSideTab("inspector");
              },
              onSelectNode: () => {
                setSelectedNodeId(n.id);
              },
              onDeleteStep: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) =>
                  edges.filter(
                    (edge) => edge.source !== n.id && edge.target !== n.id,
                  ),
                );
                setSelectedNodeId((curr) => (curr === n.id ? null : curr));
              },
            },
          };
        }
        return n;
      });

      if (!hasStateGlobal) {
        const stateNode: StateGlobalNode = {
          id: NODE_ID_STATE_GLOBAL,
          type: LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
          position: { x: 100, y: 60 },
          data: {
            label: "Global Graph State",
            stateChannels,
            onOpenStateTab: () => setActiveSideTab("state"),
            onAddChannel: handleAddChannel,
          },
          deletable: false,
        };
        updated = [stateNode, ...updated];
      }

      return updated;
    });
  }, [inputChannels, stateChannels, handleAddChannel]);

  const onNodesChange = useCallback(
    (changes: NodeChange<LangGraphCanvasNode>[]) =>
      setNodes((nds) => applyNodeChanges<LangGraphCanvasNode>(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
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
    [nodes, isValidConnection],
  );

  // ── Sub-hooks for focused responsibility areas ──
  const {
    selectedStepData,
    selectedLLMData,
    selectedToolData,
    selectedMiddlewareData,
    selectedAgentData,
    selectedMemoryData,
    selectedOutputData,
    selectedStartData,
    updateSelectedStep,
    updateSelectedLLM,
    updateSelectedTool,
    updateSelectedMiddleware,
    updateSelectedAgent,
    updateSelectedMemory,
    updateSelectedOutput,
  } = useSelectedNodeState({ nodes, selectedNodeId, setNodes });

  const { handleAddStep } = useNodeFactory({
    setNodes,
    setEdges,
    setSelectedNodeId,
    setActiveSideTab,
    stateChannels,
  });

  const {
    availableLLMNodes,
    availableToolNodes,
    availableMiddlewareNodes,
    availableMemoryNodes,
    handleSelectLLMForAgent,
    handleToggleToolForAgent,
    handleToggleMiddlewareForAgent,
    handleToggleMemoryForAgent,
  } = useAgentResourceConnections({ nodes, setEdges });

  // ── Delete selected step ──
  const handleDeleteStep = () => {
    if (!selectedNodeId || isReservedNodeId(selectedNodeId)) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId && !isReservedNodeId(selectedNodeId)) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
        ),
      );
      setSelectedNodeId(null);
    }
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [selectedNodeId]);

  // ── Build sanitized graph data ──
  const buildGraphData = useCallback(() => {
    return buildGraphDataUtil({
      nodes,
      edges,
      inputChannels,
      stateChannels,
      memoryConfig,
      data,
    });
  }, [nodes, edges, inputChannels, stateChannels, memoryConfig, data]);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">(
    "idle",
  );
  const isFirstRenderRef = useRef(true);
  const lastSavedJsonRef = useRef<string>(
    JSON.stringify(
      ensureLangGraphDataReachability({
        ...data,
        graphSteps: data.graphSteps || [],
        graphEdges: data.graphEdges || [],
        inputChannels: data.inputChannels || [],
        stateChannels: data.stateChannels || [
          {
            key: "messages",
            type: "messages",
            reducer: "add_messages",
            defaultValue: [],
          },
        ],
        memoryConfig: data.memoryConfig || {
          checkpointer: "memory",
          threadScope: "session",
          autoSummarize: true,
          maxWindowMessages: 10,
        },
        customLlmNodes: data.customLlmNodes || [],
        toolDefinitions: data.toolDefinitions || [],
        middlewareDefinitions: data.middlewareDefinitions || [],
        memoryDefinitions: data.memoryDefinitions || [],
        agentDefinitions: data.agentDefinitions || [],
      }),
    ),
  );

  // ── Auto-save with 400ms debounce ──
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const currentData = buildGraphData();
    const currentJson = JSON.stringify(currentData);

    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    setSaveStatus("saving");

    const timer = setTimeout(() => {
      updateNode(node.id, { data: currentData });
      lastSavedJsonRef.current = currentJson;
      setSaveStatus("saved");
    }, 400);

    return () => clearTimeout(timer);
  }, [
    nodes,
    edges,
    inputChannels,
    stateChannels,
    memoryConfig,
    buildGraphData,
    node.id,
    updateNode,
  ]);

  // ── Flush auto-save on unmount if pending changes exist ──
  const buildGraphDataRef = useRef(buildGraphData);
  buildGraphDataRef.current = buildGraphData;

  useEffect(() => {
    return () => {
      const currentData = buildGraphDataRef.current();
      const currentJson = JSON.stringify(currentData);
      if (currentJson !== lastSavedJsonRef.current) {
        updateNode(node.id, { data: currentData });
        lastSavedJsonRef.current = currentJson;
      }
    };
  }, [node.id, updateNode]);

  // ── Manual Save & Close ──
  const handleSave = () => {
    const currentData = buildGraphData();
    updateNode(node.id, {
      data: currentData,
    });
    lastSavedJsonRef.current = JSON.stringify(currentData);
    setSaveStatus("saved");
    toast.success("LangGraph saved!");
    onClose();
  };

  return {
    nodes,
    edges,
    setEdges,
    inputChannels,
    setInputChannels,
    stateChannels,
    setStateChannels,
    memoryConfig,
    setMemoryConfig,
    selectedNodeId,
    setSelectedNodeId,
    activeSideTab,
    setActiveSideTab,
    selectedStepData,
    selectedLLMData,
    selectedToolData,
    selectedMiddlewareData,
    selectedAgentData,
    selectedMemoryData,
    selectedOutputData,
    selectedStartData,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    handleAddStep,
    updateSelectedStep,
    updateSelectedLLM,
    updateSelectedTool,
    updateSelectedMiddleware,
    updateSelectedAgent,
    updateSelectedMemory,
    updateSelectedOutput,
    handleDeleteStep,
    handleDeleteSelected,
    handleSave,
    saveStatus,
    availableLLMNodes,
    availableToolNodes,
    availableMiddlewareNodes,
    availableMemoryNodes,
    handleSelectLLMForAgent,
    handleToggleToolForAgent,
    handleToggleMiddlewareForAgent,
    handleToggleMemoryForAgent,
    showCompileModal,
    setShowCompileModal,
  };
}

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Edge,
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
  LangGraphStepConfig,
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
  LangGraphOutputPort,
  LangGraphEdgeConfig,
  LangGraphRouterBranch,
  LangGraphToolDefinition,
} from "@/types/canvas";
import { STEP_TYPE_ROUTER, ensureLangGraphDataReachability } from "@workspace/canvas/constants";
import {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  StepNode,
  PortNode,
  StateGlobalNode,
  LangGraphLLMNode,
  StepNodeData,
  LangGraphLLMNodeData,
  ToolNode,
  ToolNodeData,
  getStepData,
} from "../types";
import {
  SUB_CANVAS_NODE_STEP,
  SUB_CANVAS_NODE_START,
  SUB_CANVAS_NODE_PORT,
  SUB_CANVAS_NODE_STATE_GLOBAL,
  SUB_CANVAS_NODE_LLM,
  SUB_CANVAS_NODE_TOOL,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  NODE_ID_START,
  NODE_ID_STATE_GLOBAL,
  NODE_ID_PREFIX_PORT,
  isReservedNodeId,
  makePortNodeId,
  stripPortPrefix,
  STEP_TYPE_LLM_CALL,
  TARGET_KIND_STEP,
  TARGET_KIND_PORT,
  LLM_PROVIDERS,
  LLM_PROVIDER_PRESETS,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_BASE_URL,
  DEFAULT_LLM_API_KEY_ENV,
  DEFAULT_LLM_TEMPERATURE,
} from "../constants";

interface UseLangGraphCanvasStateProps {
  node: BackendNode;
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
  onClose: () => void;
}

export function useLangGraphCanvasState({ node, updateNode, onClose }: UseLangGraphCanvasStateProps) {
  const data = node.data;

  const [inputChannels, setInputChannels] = useState<LangGraphInputChannel[]>(
    data.inputChannels || []
  );
  const [stateChannels, setStateChannels] = useState<LangGraphStateChannel[]>(
    data.stateChannels || [
      { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
    ]
  );
  const [memoryConfig, setMemoryConfig] = useState<LangGraphMemoryConfig>(
    data.memoryConfig || {
      checkpointer: "convex",
      threadScope: "session",
      autoSummarize: true,
      maxWindowMessages: 10,
    }
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<"inspector" | "inputs" | "state" | "memory">("inspector");

  const { fitView: triggerFitView } = useReactFlow();

  // ── Build initial nodes from graphSteps & customLlmNodes ──
  const initialNodes = useMemo((): LangGraphCanvasNode[] => {
    const steps: LangGraphStepConfig[] = data.graphSteps || [];

    const result: LangGraphCanvasNode[] = [
      {
        id: NODE_ID_STATE_GLOBAL,
        type: SUB_CANVAS_NODE_STATE_GLOBAL,
        position: { x: 100, y: 60 },
        data: {
          label: "Global Graph State",
          stateChannels: data.stateChannels || [
            { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
          ],
        },
        deletable: false,
      },
      {
        id: NODE_ID_START,
        type: SUB_CANVAS_NODE_START,
        position: { x: 100, y: 320 },
        data: { label: "INPUT State", inputChannels: data.inputChannels || [] },
        deletable: false,
      },
    ];

    const savedCustomLLMs = data.customLlmNodes || [];
    savedCustomLLMs.forEach((cLLM) => {
      const customNode: LangGraphLLMNode = {
        id: cLLM.id,
        type: SUB_CANVAS_NODE_LLM,
        position: cLLM.position || { x: 340, y: 80 },
        data: {
          label: cLLM.label,
          llmId: cLLM.id,
          provider: cLLM.provider || "custom",
          url: cLLM.url || cLLM.baseUrl || "http://localhost:11434/v1/chat/completions",
          baseUrl: cLLM.baseUrl || cLLM.url || "http://localhost:11434/v1",
          method: cLLM.method || "POST",
          headersJson: cLLM.headersJson,
          bodyJson: cLLM.bodyJson,
          model: cLLM.model,
          apiKeyHeader: cLLM.apiKeyHeader,
          temperature: cLLM.temperature,
          maxTokens: cLLM.maxTokens,
        },
      };
      result.push(customNode);
    });

    const savedTools = data.toolDefinitions || [];
    savedTools.forEach((toolDef) => {
      const toolNode: ToolNode = {
        id: toolDef.id,
        type: SUB_CANVAS_NODE_TOOL,
        position: toolDef.position || { x: 340, y: 160 },
        data: {
          label: toolDef.name,
          toolId: toolDef.id,
          name: toolDef.name,
          description: toolDef.description,
          inputSchema: toolDef.inputSchema,
          source: toolDef.source,
          endpointUrl: toolDef.endpointUrl,
          mcpConnectionId: toolDef.mcpConnectionId,
          remoteToolName: toolDef.remoteToolName,
          returnDirect: toolDef.returnDirect,
          returnType: toolDef.returnType,
          outputSchema: toolDef.outputSchema,
          commandConfig: toolDef.commandConfig,
          functionBody: toolDef.functionBody,
          executionMode: toolDef.executionMode,
          headless: toolDef.headless,
          contextAccess: toolDef.contextAccess,
          storeAccess: toolDef.storeAccess,
          streamWriter: toolDef.streamWriter,
          errorHandling: toolDef.errorHandling,
        },
      };
      result.push(toolNode);
    });

    steps.forEach((step, idx) => {
      const stepNode: StepNode = {
        id: step.id,
        type: SUB_CANVAS_NODE_STEP,
        position: { x: 420 + idx * 280, y: 190 + (idx % 2 === 0 ? 0 : 60) },
        data: {
          label: step.name,
          stepId: step.id,
          stepType: step.type,
          modelConfig: step.modelConfig,
          humanGateConfig: step.humanGateConfig,
          customCode: step.customCode,
          stateUpdates: step.stateUpdates || [],
          availableStateChannels: data.stateChannels || [
            { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
          ],
        },
      };
      result.push(stepNode);
    });

    return result;
  }, []); // computed once on mount

  // ── Build initial edges from graphEdges ──
  const initialEdges: LangGraphCanvasEdge[] = useMemo(() => {
    const graphEdges: LangGraphEdgeConfig[] = data.graphEdges || [];
    return graphEdges
      .filter((e) => !e.targets?.some((t) => t.kind === TARGET_KIND_PORT))
      .flatMap(
        (e) => (e.targets || []).map((t) => {
          const isLLMSource = e.sourceHandle === HANDLE_LLM_OUT || e.source.startsWith("llm_") || (data.customLlmNodes || []).some((c) => c.id === e.source);
          const isToolSource = e.sourceHandle === HANDLE_TOOL_OUT || e.source.startsWith("tool_") || (data.toolDefinitions || []).some((t) => t.id === e.source);
          
          const sourceHandle = e.sourceHandle || (isLLMSource ? HANDLE_LLM_OUT : isToolSource ? HANDLE_TOOL_OUT : undefined);
          const targetHandle = e.targetHandle || (t as any).targetHandle || (isLLMSource ? HANDLE_LLM_IN : isToolSource ? HANDLE_TOOL_IN : undefined);
          
          const isLLM = isLLMSource || sourceHandle === HANDLE_LLM_OUT || targetHandle === HANDLE_LLM_IN;
          const isTool = isToolSource || sourceHandle === HANDLE_TOOL_OUT || targetHandle === HANDLE_TOOL_IN;

          return {
            id: `${e.id}_${t.id}`,
            source: e.source,
            target: t.id,
            ...(sourceHandle ? { sourceHandle } : {}),
            ...(targetHandle ? { targetHandle } : {}),
            animated: true,
            style: isLLM 
              ? { stroke: "#38bdf8", strokeWidth: 2, strokeDasharray: "4 4" } 
              : isTool
              ? { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" }
              : { stroke: "#a1a1aa", strokeWidth: 2 },
            ...(e.condition ? { label: `${e.condition.field ?? ""} ${e.condition.operator ?? ""}`, labelStyle: { fill: "#a1a1aa", fontSize: 10 } } : {}),
          };
        })
      );
  }, []);

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

  useEffect(() => {
    setNodes((nds) => {
      const hasStateGlobal = nds.some((n) => n.id === NODE_ID_STATE_GLOBAL);

      let updated = nds.map((n): LangGraphCanvasNode => {
        if (n.id === NODE_ID_START && n.type === SUB_CANVAS_NODE_START) {
          return { ...n, data: { ...n.data, inputChannels } };
        }
        if (n.id === NODE_ID_STATE_GLOBAL && n.type === SUB_CANVAS_NODE_STATE_GLOBAL) {
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
        if (n.type === SUB_CANVAS_NODE_LLM) {
          return {
            ...n,
            data: {
              ...n.data,
              onDeleteLLM: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) => edges.filter((edge) => edge.source !== n.id && edge.target !== n.id));
                setSelectedNodeId((curr) => (curr === n.id ? null : curr));
              },
            },
          };
        }
        if (n.type === SUB_CANVAS_NODE_TOOL) {
          return {
            ...n,
            data: {
              ...n.data,
              onDeleteTool: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) => edges.filter((edge) => edge.source !== n.id && edge.target !== n.id));
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
        if (n.type === SUB_CANVAS_NODE_STEP) {
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
                    node.id === n.id && node.type === SUB_CANVAS_NODE_STEP
                      ? { ...node, data: { ...node.data, activeBranchId: branchId } }
                      : node
                  )
                );
                setActiveSideTab("inspector");
              },
              onSelectNode: () => {
                setSelectedNodeId(n.id);
              },
              onDeleteStep: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) => edges.filter((edge) => edge.source !== n.id && edge.target !== n.id));
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
          type: SUB_CANVAS_NODE_STATE_GLOBAL,
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
    (changes: NodeChange<LangGraphCanvasNode>[]) => setNodes((nds) => applyNodeChanges<LangGraphCanvasNode>(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const isLLMSource = connection.sourceHandle === HANDLE_LLM_OUT || sourceNode?.type === SUB_CANVAS_NODE_LLM || connection.source?.startsWith("llm_");
      const isLLMTarget = connection.targetHandle === HANDLE_LLM_IN;
      
      const isToolSource = connection.sourceHandle === HANDLE_TOOL_OUT || sourceNode?.type === SUB_CANVAS_NODE_TOOL || connection.source?.startsWith("tool_");
      const isToolTarget = connection.targetHandle === HANDLE_TOOL_IN;

      if (isLLMSource && !isLLMTarget) return false;
      if (isLLMTarget && !isLLMSource) return false;
      
      if (isToolSource && !isToolTarget) return false;
      if (isToolTarget && !isToolSource) return false;

      return true;
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => {
        if (!isValidConnection(params)) return eds;

        const isLLM = params.sourceHandle === HANDLE_LLM_OUT || params.targetHandle === HANDLE_LLM_IN || Boolean(params.source?.startsWith("llm_"));
        const isTool = params.sourceHandle === HANDLE_TOOL_OUT || params.targetHandle === HANDLE_TOOL_IN || Boolean(params.source?.startsWith("tool_"));
        
        const sourceNode = nodes.find((n): n is StepNode => n.id === params.source && n.type === SUB_CANVAS_NODE_STEP);
        const routerBranch = sourceNode?.data?.routerConfig?.branches?.find((b: LangGraphRouterBranch) => b.id === params.sourceHandle);

        const sourceHandle = isLLM ? HANDLE_LLM_OUT : isTool ? HANDLE_TOOL_OUT : params.sourceHandle;
        const targetHandle = isLLM ? HANDLE_LLM_IN : isTool ? HANDLE_TOOL_IN : params.targetHandle;

        const label = routerBranch
          ? routerBranch.label || (routerBranch.isDefault ? "Default" : `${routerBranch.field || "state"} ${routerBranch.operator} '${routerBranch.value ?? ""}'`)
          : undefined;

        const style = isLLM
          ? { stroke: "#38bdf8", strokeWidth: 2, strokeDasharray: "4 4" }
          : isTool
          ? { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" }
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
          eds
        );
      }),
    [nodes, isValidConnection]
  );

  const selectedStepData = useMemo((): StepNodeData | null => {
    const found = nodes.find((n) => n.id === selectedNodeId && n.type === SUB_CANVAS_NODE_STEP);
    return found ? getStepData(found) : null;
  }, [nodes, selectedNodeId]);

  // ── Add step or custom_llm or tool ──
  const handleAddStep = (type: LangGraphStepConfig["type"] | typeof SUB_CANVAS_NODE_LLM | typeof SUB_CANVAS_NODE_TOOL, label: string) => {
    if (type === SUB_CANVAS_NODE_LLM) {
      const llmId = `llm_${Date.now().toString(36).slice(-4)}`;
      const defaultPreset = LLM_PROVIDER_PRESETS[DEFAULT_LLM_PROVIDER] ?? LLM_PROVIDER_PRESETS[LLM_PROVIDERS.CUSTOM];

      const newLLMNode: LangGraphLLMNode = {
        id: llmId,
        type: SUB_CANVAS_NODE_LLM,
        position: { x: 360 + Math.random() * 140, y: 100 + Math.random() * 80 },
        data: {
          label: label || "LLM Node",
          llmId,
          provider: DEFAULT_LLM_PROVIDER,
          baseUrl: defaultPreset?.defaultUrl ?? DEFAULT_LLM_BASE_URL,
          model: defaultPreset?.defaultModel ?? DEFAULT_LLM_MODEL,
          apiKeyHeader: defaultPreset?.defaultApiKeyEnv ?? DEFAULT_LLM_API_KEY_ENV,
          temperature: DEFAULT_LLM_TEMPERATURE,
          onDeleteLLM: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== llmId));
            setEdges((edges) => edges.filter((edge) => edge.source !== llmId && edge.target !== llmId));
            setSelectedNodeId((curr) => (curr === llmId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newLLMNode]);
      setSelectedNodeId(llmId);
      return;
    }

    if (type === SUB_CANVAS_NODE_TOOL) {
      const toolId = `tool_${Date.now().toString(36).slice(-4)}`;
      const newToolNode: ToolNode = {
        id: toolId,
        type: SUB_CANVAS_NODE_TOOL,
        position: { x: 360 + Math.random() * 140, y: 160 + Math.random() * 80 },
        data: {
          label: label || "Tool Node",
          toolId,
          name: "my_tool",
          description: "Description of the tool",
          source: "inline",
          executionMode: "sandboxed_vm",
          returnType: "string",
          onDeleteTool: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== toolId));
            setEdges((edges) => edges.filter((edge) => edge.source !== toolId && edge.target !== toolId));
            setSelectedNodeId((curr) => (curr === toolId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newToolNode]);
      setSelectedNodeId(toolId);
      setActiveSideTab("inspector");
      return;
    }

    const stepId = type === STEP_TYPE_ROUTER ? `router_${Date.now().toString(36).slice(-4)}` : `step_${Date.now().toString(36).slice(-4)}`;
    const newNode: StepNode = {
      id: stepId,
      type: SUB_CANVAS_NODE_STEP,
      position: { x: 360 + Math.random() * 180, y: 160 + Math.random() * 100 },
      data: {
        label: label || (type === STEP_TYPE_ROUTER ? "Conditional Router" : "Node"),
        stepId,
        stepType: type,
        ...(type === STEP_TYPE_ROUTER
          ? {
              routerConfig: {
                branches: [
                  { id: `b_${Date.now()}_1`, label: "Value == true", field: "messages", operator: "eq", value: "true" },
                  { id: `b_${Date.now()}_def`, label: "Default Branch", field: "", operator: "eq", value: "", isDefault: true },
                ],
              },
            }
          : {
              modelConfig: { provider: DEFAULT_LLM_PROVIDER, model: DEFAULT_LLM_MODEL, temperature: DEFAULT_LLM_TEMPERATURE },
            }),
        stateUpdates: [],
        availableStateChannels: stateChannels,
        onDeleteStep: () => {
          setNodes((nodes) => nodes.filter((node) => node.id !== stepId));
          setEdges((edges) => edges.filter((edge) => edge.source !== stepId && edge.target !== stepId));
          setSelectedNodeId((curr) => (curr === stepId ? null : curr));
        },
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(stepId);
    setActiveSideTab("inspector");
  };

  const selectedLLMData = useMemo((): LangGraphLLMNodeData | null => {
    const found = nodes.find((n): n is LangGraphLLMNode => n.id === selectedNodeId && n.type === SUB_CANVAS_NODE_LLM);
    return found ? found.data : null;
  }, [nodes, selectedNodeId]);
  
  const selectedToolData = useMemo((): ToolNodeData | null => {
    const found = nodes.find((n): n is ToolNode => n.id === selectedNodeId && n.type === SUB_CANVAS_NODE_TOOL);
    return found ? found.data : null;
  }, [nodes, selectedNodeId]);

  const updateSelectedStep = (changes: Partial<StepNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) =>
      n.id === selectedNodeId && n.type === SUB_CANVAS_NODE_STEP
        ? { ...n, data: { ...n.data, ...changes } }
        : n
    ));
  };

  const updateSelectedLLM = (changes: Partial<LangGraphLLMNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) =>
      n.id === selectedNodeId && n.type === SUB_CANVAS_NODE_LLM
        ? { ...n, data: { ...n.data, ...changes } }
        : n
    ));
  };
  
  const updateSelectedTool = (changes: Partial<ToolNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) =>
      n.id === selectedNodeId && n.type === SUB_CANVAS_NODE_TOOL
        ? { ...n, data: { ...n.data, ...changes } }
        : n
    ));
  };

  // ── Delete selected step ──
  const handleDeleteStep = () => {
    if (!selectedNodeId || isReservedNodeId(selectedNodeId)) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  // ── Build sanitized graph data ──
  const buildGraphData = useCallback(() => {
    const customLlmNodes = nodes
      .filter((n): n is LangGraphLLMNode => n.type === SUB_CANVAS_NODE_LLM)
      .map((n) => ({
        id: n.id,
        label: n.data.label,
        provider: n.data.provider,
        url: n.data.url,
        baseUrl: n.data.baseUrl,
        method: n.data.method,
        headersJson: n.data.headersJson,
        bodyJson: n.data.bodyJson,
        model: n.data.model,
        apiKeyHeader: n.data.apiKeyHeader,
        temperature: n.data.temperature,
        maxTokens: n.data.maxTokens,
        position: n.position,
      }));
      
    const toolDefinitions: LangGraphToolDefinition[] = nodes
      .filter((n): n is ToolNode => n.type === SUB_CANVAS_NODE_TOOL)
      .map((n) => ({
        id: n.data.toolId || n.id,
        toolId: n.data.toolId || n.id,
        label: n.data.label || n.data.name || "Tool",
        name: n.data.name || "my_tool",
        description: n.data.description || "",
        inputSchema: n.data.inputSchema,
        source: n.data.source || "inline",
        endpointUrl: n.data.endpointUrl,
        mcpConnectionId: n.data.mcpConnectionId,
        remoteToolName: n.data.remoteToolName,
        returnDirect: n.data.returnDirect,
        returnType: n.data.returnType,
        outputSchema: n.data.outputSchema,
        commandConfig: n.data.commandConfig,
        functionBody: n.data.functionBody,
        executionMode: n.data.executionMode,
        headless: n.data.headless,
        contextAccess: n.data.contextAccess,
        storeAccess: n.data.storeAccess,
        streamWriter: n.data.streamWriter,
        errorHandling: n.data.errorHandling,
        position: n.position,
      }));

    const graphSteps: LangGraphStepConfig[] = nodes
      .filter((n): n is StepNode => n.type === SUB_CANVAS_NODE_STEP)
      .map((n) => ({
        id: n.data.stepId || n.id,
        name: n.data.label || "Step",
        type: n.data.stepType || STEP_TYPE_LLM_CALL,
        ...(n.data.modelConfig ? { modelConfig: n.data.modelConfig } : {}),
        ...(n.data.humanGateConfig ? { humanGateConfig: n.data.humanGateConfig } : {}),
        ...(n.data.customCode ? { customCode: n.data.customCode } : {}),
        ...(n.data.routerConfig ? { routerConfig: n.data.routerConfig } : {}),
        ...(n.data.stateUpdates ? { stateUpdates: n.data.stateUpdates } : {}),
        tools: edges
          .filter((e) => e.target === n.id && e.targetHandle === HANDLE_TOOL_IN)
          .map((e) => e.source),
      }));

    const graphEdges: LangGraphEdgeConfig[] = edges
      .filter((e) => e.source !== NODE_ID_STATE_GLOBAL && e.target !== NODE_ID_STATE_GLOBAL)
      .map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
        targets: [{
          id: stripPortPrefix(e.target),
          kind: TARGET_KIND_STEP,
          targetHandle: e.targetHandle || undefined,
        }],
      }));

    return ensureLangGraphDataReachability({
      ...data,
      graphSteps,
      graphEdges,
      inputChannels,
      stateChannels,
      memoryConfig,
      customLlmNodes,
      toolDefinitions,
    });
  }, [nodes, edges, inputChannels, stateChannels, memoryConfig, data]);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const isFirstRenderRef = useRef(true);
  const lastSavedJsonRef = useRef<string>(
    JSON.stringify(
      ensureLangGraphDataReachability({
        ...data,
        graphSteps: data.graphSteps || [],
        graphEdges: data.graphEdges || [],
        inputChannels: data.inputChannels || [],
        stateChannels: data.stateChannels || [
          { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
        ],
        memoryConfig: data.memoryConfig || {
          checkpointer: "convex",
          threadScope: "session",
          autoSummarize: true,
          maxWindowMessages: 10,
        },
        customLlmNodes: data.customLlmNodes || [],
        toolDefinitions: data.toolDefinitions || [],
      })
    )
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
  }, [nodes, edges, inputChannels, stateChannels, memoryConfig, buildGraphData, node.id, updateNode]);

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

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId && !isReservedNodeId(selectedNodeId)) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    }
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [selectedNodeId]);

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
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    handleAddStep,
    updateSelectedStep,
    updateSelectedLLM,
    updateSelectedTool,
    handleDeleteStep,
    handleDeleteSelected,
    handleSave,
    saveStatus,
  };
}



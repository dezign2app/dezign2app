import { useState, useMemo, useCallback, useEffect } from "react";
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
} from "@/types/canvas";
import { LANGGRAPH_STARTER_TEMPLATE, ensureLangGraphDataReachability } from "@workspace/canvas/constants";
import {
  SubCanvasNode,
  SubCanvasEdge,
  StepNode,
  PortNode,
  StateGlobalNode,
  StepNodeData,
  getStepData,
} from "../types";

interface UseLangGraphCanvasStateProps {
  node: BackendNode;
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
  onClose: () => void;
}

export function useLangGraphCanvasState({ node, updateNode, onClose }: UseLangGraphCanvasStateProps) {
  const data = node.data;

  const [inputChannels, setInputChannels] = useState<LangGraphInputChannel[]>(
    data.inputChannels || LANGGRAPH_STARTER_TEMPLATE.inputChannels
  );
  const [stateChannels, setStateChannels] = useState<LangGraphStateChannel[]>(
    data.stateChannels || LANGGRAPH_STARTER_TEMPLATE.stateChannels
  );
  const [memoryConfig, setMemoryConfig] = useState<LangGraphMemoryConfig>(
    data.memoryConfig || LANGGRAPH_STARTER_TEMPLATE.memoryConfig
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<"inspector" | "inputs" | "state" | "memory">("inspector");

  const { fitView: triggerFitView } = useReactFlow();

  // ── Build initial nodes from graphSteps ──
  const initialNodes = useMemo((): SubCanvasNode[] => {
    const steps: LangGraphStepConfig[] = data.graphSteps || LANGGRAPH_STARTER_TEMPLATE.graphSteps;
    const ports: LangGraphOutputPort[] = data.outputPorts || LANGGRAPH_STARTER_TEMPLATE.outputPorts;

    const result: SubCanvasNode[] = [
      {
        id: "STATE_GLOBAL",
        type: "state_global",
        position: { x: 100, y: 60 },
        data: {
          label: "Global Graph State",
          stateChannels: data.stateChannels || LANGGRAPH_STARTER_TEMPLATE.stateChannels,
        },
        deletable: false,
      },
      {
        id: "START",
        type: "start",
        position: { x: 100, y: 320 },
        data: { label: "INPUT State", inputChannels: data.inputChannels || LANGGRAPH_STARTER_TEMPLATE.inputChannels },
        deletable: false,
      },
    ];

    steps.forEach((step, idx) => {
      const stepNode: StepNode = {
        id: step.id,
        type: "step",
        position: { x: 420 + idx * 280, y: 190 + (idx % 2 === 0 ? 0 : 60) },
        data: {
          label: step.name,
          stepId: step.id,
          stepType: step.type,
          modelConfig: step.modelConfig,
          humanGateConfig: step.humanGateConfig,
          customCode: step.customCode,
          stateUpdates: step.stateUpdates || [],
          availableStateChannels: data.stateChannels || LANGGRAPH_STARTER_TEMPLATE.stateChannels,
        },
      };
      result.push(stepNode);
    });

    ports.forEach((p, idx) => {
      const portNode: PortNode = {
        id: `port_${p.id}`,
        type: "port",
        position: { x: 420 + steps.length * 280 + 80, y: 100 + idx * 100 },
        data: { label: p.label, portId: p.id },
        deletable: false,
      };
      result.push(portNode);
    });

    return result;
  }, []); // computed once on mount

  // ── Build initial edges from graphEdges ──
  const initialEdges: SubCanvasEdge[] = useMemo(() => {
    const graphEdges: LangGraphEdgeConfig[] = data.graphEdges || LANGGRAPH_STARTER_TEMPLATE.graphEdges;
    return graphEdges.flatMap(
      (e) => (e.targets || []).map((t) => ({
        id: `${e.id}_${t.id}`,
        source: e.source,
        target: t.kind === "port" ? `port_${t.id}` : t.id,
        animated: true,
        style: { stroke: "#a1a1aa", strokeWidth: 2 },
        ...(e.condition ? { label: `${e.condition.field ?? ""} ${e.condition.operator ?? ""}`, labelStyle: { fill: "#a1a1aa", fontSize: 10 } } : {}),
      }))
    );
  }, []);

  const [nodes, setNodes] = useState<SubCanvasNode[]>(initialNodes);
  const [edges, setEdges] = useState<SubCanvasEdge[]>(initialEdges);

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
      const hasStateGlobal = nds.some((n) => n.id === "STATE_GLOBAL");

      let updated = nds.map((n): SubCanvasNode => {
        if (n.id === "START" && n.type === "start") {
          return { ...n, data: { ...n.data, inputChannels } };
        }
        if (n.id === "STATE_GLOBAL" && n.type === "state_global") {
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
        if (n.type === "step") {
          return {
            ...n,
            data: {
              ...n.data,
              availableStateChannels: stateChannels,
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
          id: "STATE_GLOBAL",
          type: "state_global",
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
    (changes: NodeChange<SubCanvasNode>[]) => setNodes((nds) => applyNodeChanges<SubCanvasNode>(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => rfAddEdge({ ...params, animated: true, style: { stroke: "#a1a1aa", strokeWidth: 2 } }, eds)),
    []
  );

  const selectedStepData = useMemo((): StepNodeData | null => {
    const found = nodes.find((n) => n.id === selectedNodeId && n.type === "step");
    return found ? getStepData(found) : null;
  }, [nodes, selectedNodeId]);

  // ── Add step ──
  const handleAddStep = (type: LangGraphStepConfig["type"], label: string) => {
    const stepId = `step_${Date.now().toString(36).slice(-4)}`;
    const newNode: StepNode = {
      id: stepId,
      type: "step",
      position: { x: 360 + Math.random() * 180, y: 160 + Math.random() * 100 },
      data: {
        label,
        stepId,
        stepType: type,
        modelConfig: { provider: "groq", model: "llama-3.3-70b-versatile", temperature: 0.2 },
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

  // ── Update selected step ──
  const updateSelectedStep = (changes: Partial<StepNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) =>
      n.id === selectedNodeId && n.type === "step"
        ? { ...n, data: { ...n.data, ...changes } }
        : n
    ));
  };

  // ── Delete selected step ──
  const handleDeleteStep = () => {
    if (!selectedNodeId || selectedNodeId === "START" || selectedNodeId === "STATE_GLOBAL" || selectedNodeId.startsWith("port_")) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  // ── Save ──
  const handleSave = () => {
    const graphSteps: LangGraphStepConfig[] = nodes
      .filter((n): n is StepNode => n.type === "step")
      .map((n) => ({
        id: n.data.stepId || n.id,
        name: n.data.label || "Step",
        type: n.data.stepType || "llm_call",
        ...(n.data.modelConfig ? { modelConfig: n.data.modelConfig } : {}),
        ...(n.data.humanGateConfig ? { humanGateConfig: n.data.humanGateConfig } : {}),
        ...(n.data.customCode ? { customCode: n.data.customCode } : {}),
        ...(n.data.stateUpdates ? { stateUpdates: n.data.stateUpdates } : {}),
      }));

    const graphEdges: LangGraphEdgeConfig[] = edges
      .filter((e) => e.source !== "STATE_GLOBAL" && e.target !== "STATE_GLOBAL")
      .map((e) => ({
        id: e.id,
        source: e.source,
        targets: [{
          id: e.target.startsWith("port_") ? e.target.replace("port_", "") : e.target,
          kind: (e.target.startsWith("port_") ? "port" : "step") as "port" | "step",
        }],
      }));

    const sanitizedData = ensureLangGraphDataReachability({
      ...data,
      graphSteps,
      graphEdges,
      inputChannels,
      stateChannels,
      memoryConfig,
    });

    updateNode(node.id, {
      data: sanitizedData,
    });

    toast.success("LangGraph saved!");
    onClose();
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId && selectedNodeId !== "START" && selectedNodeId !== "STATE_GLOBAL" && !selectedNodeId.startsWith("port_")) {
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
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddStep,
    updateSelectedStep,
    handleDeleteStep,
    handleDeleteSelected,
    handleSave,
  };
}


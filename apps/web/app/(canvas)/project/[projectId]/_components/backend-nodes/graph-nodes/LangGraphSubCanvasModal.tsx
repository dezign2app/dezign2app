import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  Connection,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import {
  Network, Plus, Brain, Wrench, ShieldCheck, Zap,
  Layers, Save, Trash2, Code2, Search, Sparkles, ArrowLeft,
  X, HelpCircle, Database,
} from "lucide-react";
import type { BackendNode, LangGraphStepConfig, LangGraphStateChannel, LangGraphMemoryConfig, LangGraphOutputPort, LangGraphEdgeConfig } from "@/types/canvas";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { LANGGRAPH_STARTER_TEMPLATE } from "@workspace/canvas/constants";
import { toast } from "sonner";

// ─── Typed Node Data Interfaces ────────────────────────
type StepNodeData = {
  label: string;
  stepId: string;
  stepType: LangGraphStepConfig["type"];
  modelConfig?: LangGraphStepConfig["modelConfig"];
  humanGateConfig?: LangGraphStepConfig["humanGateConfig"];
  customCode?: LangGraphStepConfig["customCode"];
};

type StartNodeData = {
  label: string;
};

type PortNodeData = {
  label: string;
  portId: string;
};

type StepNode = Node<StepNodeData, "step">;
type StartNode = Node<StartNodeData, "start">;
type PortNode = Node<PortNodeData, "port">;

type SubCanvasNode = StepNode | StartNode | PortNode;

// ─── Sub-Canvas Step Node ──────────────────────────────
const SubCanvasStepNode = ({ data, selected }: NodeProps<StepNode>) => {
  const stepType = data.stepType || "llm_call";
  const Icon = stepType === "human_gate" ? ShieldCheck
    : stepType === "custom_code" ? Code2
    : stepType === "vector_search" ? Search
    : stepType === "tool_node" ? Wrench
    : Brain;

  return (
    <div className={`rounded-xl bg-card/95 backdrop-blur-md border-2 min-w-[210px] max-w-[270px] p-3 flex flex-col gap-2 transition-all duration-200 shadow-xl relative ${
      selected ? "border-primary ring-4 ring-primary/20 shadow-primary/10" : "border-border hover:border-border/80"
    }`}>
      <Handle type="target" position={Position.Left} id="in"
        className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform" />

      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-secondary text-foreground">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-foreground truncate max-w-[140px]">{data.label || "Step"}</span>
            <span className="text-[9px] font-mono text-muted-foreground">{data.stepId}</span>
          </div>
        </div>
        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono border border-border/40 shrink-0">
          {stepType}
        </span>
      </div>

      {data.modelConfig && (
        <div className="text-[10px] font-mono text-muted-foreground/90 bg-secondary/40 px-2 py-1 rounded border border-border/40 truncate">
          {data.modelConfig.provider}:{data.modelConfig.model}
        </div>
      )}

      <Handle type="source" position={Position.Right} id="out"
        className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform" />
    </div>
  );
};

// ─── Sub-Canvas Start Node ─────────────────────────────
const SubCanvasStartNode = () => (
  <div className="px-4 py-2.5 rounded-xl bg-card border-2 border-primary text-primary font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/10">
    <Zap className="w-4 h-4 text-primary animate-pulse" />
    <span>START</span>
    <Handle type="source" position={Position.Right} id="out" className="!bg-primary !w-3.5 !h-3.5" />
  </div>
);

// ─── Sub-Canvas Port Node ──────────────────────────────
const SubCanvasPortNode = ({ data }: NodeProps<PortNode>) => (
  <div className="px-3 py-2 rounded-xl bg-card border-2 border-border text-foreground font-bold text-xs flex items-center gap-2 shadow-lg">
    <Handle type="target" position={Position.Left} id="in" className="!bg-primary !w-3.5 !h-3.5" />
    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
    <span>{data.label}</span>
  </div>
);

const subCanvasNodeTypes = {
  step: SubCanvasStepNode,
  start: SubCanvasStartNode,
  port: SubCanvasPortNode,
};

// ─── Props ─────────────────────────────────────────────
interface LangGraphSubCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
}

export function LangGraphSubCanvasModal({ open, onOpenChange, nodeId }: LangGraphSubCanvasModalProps) {
  const node = useBackendCanvasStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateNode = useBackendCanvasStore((s) => s.updateNode);

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[96vw] !sm:max-w-[96vw] !w-[96vw] !h-[92vh] !max-h-[92vh] p-0 gap-0 border-border bg-card overflow-hidden flex flex-col shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">{node.data.label || "LangGraph Sub-Canvas"}</DialogTitle>
        <DialogDescription className="sr-only">LangGraph Agent Sub-Canvas Studio Editor</DialogDescription>
        <ReactFlowProvider>
          <SubCanvasContent node={node} updateNode={updateNode} onClose={() => onOpenChange(false)} />
        </ReactFlowProvider>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helper: typed node accessor for step data ─────────
function getStepData(node: SubCanvasNode): StepNodeData | null {
  if (node.type === "step") return node.data as StepNodeData;
  return null;
}

// ─── Available Tools Palette Items ─────────────────────
const TOOL_PALETTE_ITEMS: {
  type: LangGraphStepConfig["type"];
  label: string;
  desc: string;
  icon: typeof Brain;
}[] = [
  { type: "llm_call", label: "LLM Reasoner", desc: "AI decision & generation node", icon: Brain },
  { type: "tool_node", label: "Tool Executor", desc: "Execute custom tools & APIs", icon: Wrench },
  { type: "evaluator", label: "Evaluator", desc: "Route based on quality checks", icon: Search },
  { type: "human_gate", label: "Human Gate", desc: "Pause for human approval", icon: ShieldCheck },
  { type: "custom_code", label: "Custom Code", desc: "Execute sandboxed logic", icon: Code2 },
  { type: "summarizer", label: "Summarizer", desc: "Compress message history", icon: Sparkles },
  { type: "vector_search", label: "Vector Search", desc: "RAG & vector index search", icon: Database },
];

// ─── Sub-Canvas Content ────────────────────────────────
function SubCanvasContent({
  node, updateNode, onClose,
}: {
  node: BackendNode;
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
  onClose: () => void;
}) {
  const data = node.data;

  const [stateChannels, setStateChannels] = useState<LangGraphStateChannel[]>(
    data.stateChannels || LANGGRAPH_STARTER_TEMPLATE.stateChannels
  );
  const [memoryConfig, setMemoryConfig] = useState<LangGraphMemoryConfig>(
    data.memoryConfig || LANGGRAPH_STARTER_TEMPLATE.memoryConfig
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<"inspector" | "state" | "memory">("inspector");

  // ── Build initial nodes from graphSteps ──
  const initialNodes = useMemo((): SubCanvasNode[] => {
    const steps: LangGraphStepConfig[] = data.graphSteps || LANGGRAPH_STARTER_TEMPLATE.graphSteps;
    const ports: LangGraphOutputPort[] = data.outputPorts || LANGGRAPH_STARTER_TEMPLATE.outputPorts;

    const result: SubCanvasNode[] = [
      { id: "START", type: "start", position: { x: 40, y: 200 }, data: { label: "START" }, deletable: false },
    ];

    steps.forEach((step, idx) => {
      const stepNode: StepNode = {
        id: step.id,
        type: "step",
        position: { x: 280 + idx * 280, y: 170 + (idx % 2 === 0 ? 0 : 60) },
        data: {
          label: step.name,
          stepId: step.id,
          stepType: step.type,
          modelConfig: step.modelConfig,
          humanGateConfig: step.humanGateConfig,
          customCode: step.customCode,
        },
      };
      result.push(stepNode);
    });

    ports.forEach((p, idx) => {
      const portNode: PortNode = {
        id: `port_${p.id}`,
        type: "port",
        position: { x: 280 + steps.length * 280 + 80, y: 80 + idx * 100 },
        data: { label: p.label, portId: p.id },
        deletable: false,
      };
      result.push(portNode);
    });

    return result;
  }, []); // intentionally empty deps — only computed once on mount

  // ── Build initial edges from graphEdges ──
  const initialEdges: Edge[] = useMemo(() => {
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
  }, []); // intentionally empty deps

  const [nodes, setNodes] = useState<SubCanvasNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

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
      position: { x: 320 + Math.random() * 180, y: 160 + Math.random() * 100 },
      data: { label, stepId, stepType: type, modelConfig: { provider: "groq", model: "llama-3.3-70b-versatile", temperature: 0.2 } },
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
    if (!selectedNodeId || selectedNodeId === "START" || selectedNodeId.startsWith("port_")) return;
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
      }));

    const graphEdges: LangGraphEdgeConfig[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      targets: [{
        id: e.target.startsWith("port_") ? e.target.replace("port_", "") : e.target,
        kind: (e.target.startsWith("port_") ? "port" : "step") as "port" | "step",
      }],
    }));

    updateNode(node.id, {
      data: { ...data, graphSteps, graphEdges, stateChannels, memoryConfig },
    });

    toast.success("Sub-Canvas saved!");
    onClose();
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground">
      {/* ── Minimal Clean Header ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="p-2 rounded-xl bg-secondary text-foreground border border-border">
            <Network className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-foreground tracking-wide">
            {data.label || "LangGraph Agent Canvas"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" className="h-8 font-semibold gap-1.5 px-4" onClick={handleSave}>
            <Save className="w-4 h-4" /> Save & Apply
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Tools Sidebar (Left Panel) ── */}
        <div className="w-60 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto p-3 gap-3">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-border/40">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Tools Sidebar
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {TOOL_PALETTE_ITEMS.map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddStep(item.type, item.label)}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary border border-border/50 text-left transition-all duration-150 group"
              >
                <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground transition-colors">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    {item.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 px-1">
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>Click any tool to spawn a step on the canvas</span>
          </div>
        </div>

        {/* ── React Flow Canvas (Middle) ── */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={subCanvasNodeTypes}
            onNodeClick={(_: React.MouseEvent, n: SubCanvasNode) => { setSelectedNodeId(n.id); setActiveSideTab("inspector"); }}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{ animated: true, style: { stroke: "#a1a1aa", strokeWidth: 2 } }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} color="#3f3f46" size={1.5} />
            <Controls className="!bg-background !border-border !text-foreground" />
            <MiniMap className="!bg-background/90 !border-border" nodeColor="#71717a" />
          </ReactFlow>
        </div>

        {/* ── Inspector Sidebar (Right Panel) ── */}
        <div className="w-[340px] border-l border-border bg-card flex flex-col overflow-hidden shrink-0">
          <Tabs value={activeSideTab} onValueChange={(v) => setActiveSideTab(v as typeof activeSideTab)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 bg-secondary/30 p-1 rounded-none border-b border-border/40">
              <TabsTrigger value="inspector" className="text-xs">Inspector</TabsTrigger>
              <TabsTrigger value="state" className="text-xs">State ({stateChannels.length})</TabsTrigger>
              <TabsTrigger value="memory" className="text-xs">Memory</TabsTrigger>
            </TabsList>

            {/* ── Inspector ── */}
            <TabsContent value="inspector" className="flex-1 p-4 overflow-y-auto m-0">
              {selectedStepData ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="font-bold text-sm text-foreground">Configure Step</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:bg-red-500/20" onClick={handleDeleteStep}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Label</Label>
                    <Input className="h-8 text-xs bg-background"
                      value={selectedStepData.label || ""}
                      onChange={(e) => updateSelectedStep({ label: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Step Type</Label>
                    <Select value={selectedStepData.stepType || "llm_call"}
                      onValueChange={(v: string) => updateSelectedStep({ stepType: v as LangGraphStepConfig["type"] })}>
                      <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llm_call">LLM Reasoner</SelectItem>
                        <SelectItem value="tool_node">Tool Executor</SelectItem>
                        <SelectItem value="evaluator">Evaluator</SelectItem>
                        <SelectItem value="summarizer">Summarizer</SelectItem>
                        <SelectItem value="human_gate">Human Gate</SelectItem>
                        <SelectItem value="custom_code">Custom Code</SelectItem>
                        <SelectItem value="vector_search">Vector Search</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/20 border border-border/50">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> Model Config</span>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[11px] text-muted-foreground">Provider</Label>
                      <Select value={selectedStepData.modelConfig?.provider || "groq"}
                        onValueChange={(v: string) => updateSelectedStep({ modelConfig: { ...selectedStepData.modelConfig, provider: v as NonNullable<LangGraphStepConfig["modelConfig"]>["provider"] } })}>
                        <SelectTrigger className="h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="groq">Groq</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[11px] text-muted-foreground">Model</Label>
                      <Input className="h-7 text-xs bg-background font-mono"
                        value={selectedStepData.modelConfig?.model || ""}
                        onChange={(e) => updateSelectedStep({ modelConfig: { ...selectedStepData.modelConfig, model: e.target.value } })} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-4 text-muted-foreground">
                  <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                  <span className="text-xs font-semibold text-foreground">Select a node</span>
                  <span className="text-[11px]">Click any step on the canvas to configure it</span>
                </div>
              )}
            </TabsContent>

            {/* ── State Channels ── */}
            <TabsContent value="state" className="flex-1 p-4 overflow-y-auto m-0 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">State Channels</span>
                <Button size="sm" variant="outline" className="h-7 text-xs border-border"
                  onClick={() => {
                    const newChannel: LangGraphStateChannel = { key: `ch_${stateChannels.length + 1}`, type: "string", reducer: "replace", defaultValue: "" };
                    setStateChannels([...stateChannels, newChannel]);
                  }}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {stateChannels.map((ch, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/50 text-xs">
                  <Input className="h-6 text-xs font-mono bg-background w-24 mr-2" value={ch.key}
                    onChange={(e) => {
                      const updated: LangGraphStateChannel = { key: e.target.value, type: ch.type, reducer: ch.reducer, defaultValue: ch.defaultValue };
                      setStateChannels(stateChannels.map((c, i) => i === idx ? updated : c));
                    }} />
                  <span className="text-muted-foreground text-[10px] mr-2">{ch.type}</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] mr-2">{ch.reducer}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400 hover:bg-red-500/20"
                    onClick={() => setStateChannels(stateChannels.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            {/* ── Memory ── */}
            <TabsContent value="memory" className="flex-1 p-4 overflow-y-auto m-0 flex flex-col gap-4">
              <span className="text-xs font-bold text-foreground">Checkpointer</span>
              <Select value={memoryConfig.checkpointer || "convex"}
                onValueChange={(v: string) => setMemoryConfig({ ...memoryConfig, checkpointer: v as LangGraphMemoryConfig["checkpointer"] })}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="convex">Convex DB</SelectItem>
                  <SelectItem value="redis">Redis</SelectItem>
                  <SelectItem value="postgres">PostgreSQL</SelectItem>
                  <SelectItem value="memory">In-Memory</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">Auto-Summarize</span>
                  <span className="text-[10px] text-muted-foreground">Compress history to save tokens</span>
                </div>
                <Switch checked={memoryConfig.autoSummarize ?? true}
                  onCheckedChange={(c) => setMemoryConfig({ ...memoryConfig, autoSummarize: c })} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

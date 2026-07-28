import React, { useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import type { BackendNode } from "@/types/canvas";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { langGraphCanvasNodeTypes } from "./sub-canvas/nodes";
import { useLangGraphCanvasState } from "./sub-canvas/hooks/useLangGraphCanvasState";
import { LangGraphCanvasHeader } from "./sub-canvas/components/LangGraphCanvasHeader";
import { ToolsSidebar } from "./sub-canvas/components/ToolsSidebar";
import { InspectorSidebar } from "./sub-canvas/components/InspectorSidebar";
import type { LangGraphCanvasNode, LangGraphCanvasEdge } from "./sub-canvas/types";

export interface LangGraphCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
}


export function LangGraphCanvasModal({ open, onOpenChange, nodeId }: LangGraphCanvasModalProps) {
  const node = useBackendCanvasStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const { setNodes: setOuterNodes } = useReactFlow<BackendNode>();

  useEffect(() => {
    if (open) {
      setOuterNodes((nds: BackendNode[]) => nds.map((n: BackendNode) => (n.selected ? { ...n, selected: false } : n)));
    }
  }, [open, setOuterNodes]);

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[96vw] !sm:max-w-[96vw] !w-[96vw] !h-[92vh] !max-h-[92vh] p-0 gap-0 border-border bg-card overflow-hidden flex flex-col shadow-2xl [&>button]:hidden"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">{node.data.label || "LangGraph Canvas"}</DialogTitle>
        <DialogDescription className="sr-only">LangGraph Agent Studio Editor</DialogDescription>
        <ReactFlowProvider>
          <LangGraphCanvasContent node={node} updateNode={updateNode} onClose={() => onOpenChange(false)} />
        </ReactFlowProvider>
      </DialogContent>
    </Dialog>
  );
}


function LangGraphCanvasContent({
  node,
  updateNode,
  onClose,
}: {
  node: BackendNode;
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
  onClose: () => void;
}) {
  const {
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
  } = useLangGraphCanvasState({ node, updateNode, onClose });

  return (
    <div
      className="flex flex-col h-full w-full bg-background text-foreground outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        e.stopPropagation();
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            activeEl.isContentEditable)
        ) {
          return;
        }

        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          handleDeleteSelected();
        }
      }}
    >
      {/* Header */}
      <LangGraphCanvasHeader
        label={node.data.label}
        onUpdateLabel={(newLabel) => updateNode(node.id, { data: { ...node.data, label: newLabel } })}
        onSave={handleSave}
        onClose={onClose}
        saveStatus={saveStatus}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Tools */}
        <ToolsSidebar onAddStep={handleAddStep} />

        {/* Center Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            nodeTypes={langGraphCanvasNodeTypes}
            deleteKeyCode={["Backspace", "Delete"]}
            edgesReconnectable={true}
            edgesFocusable={true}
            elementsSelectable={true}
            onEdgeClick={(_: React.MouseEvent, edge: LangGraphCanvasEdge) => {
              setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === edge.id })));
            }}
            onNodeClick={(_: React.MouseEvent, n: LangGraphCanvasNode) => {
              setSelectedNodeId(n.id);
              if (n.id === "START") setActiveSideTab("inputs");
              else if (n.id === "STATE_GLOBAL") setActiveSideTab("state");
              else setActiveSideTab("inspector");
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#a1a1aa", strokeWidth: 2 },
              interactionWidth: 20,
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} color="#3f3f46" size={1.5} />
            <Controls className="!bg-background !border-border !text-foreground" />
            <MiniMap className="!bg-background/90 !border-border" nodeColor="#71717a" />
          </ReactFlow>
        </div>

        {/* Right Inspector Sidebar */}
        <InspectorSidebar
          activeSideTab={activeSideTab}
          setActiveSideTab={setActiveSideTab}
          selectedStepData={selectedStepData}
          selectedLLMData={selectedLLMData}
          selectedToolData={selectedToolData}
          onDeleteStep={handleDeleteStep}
          onUpdateStep={updateSelectedStep}
          onUpdateLLM={updateSelectedLLM}
          onUpdateTool={updateSelectedTool}
          inputChannels={inputChannels}
          setInputChannels={setInputChannels}
          stateChannels={stateChannels}
          setStateChannels={setStateChannels}
          memoryConfig={memoryConfig}
          setMemoryConfig={setMemoryConfig}
        />
      </div>
    </div>
  );
}

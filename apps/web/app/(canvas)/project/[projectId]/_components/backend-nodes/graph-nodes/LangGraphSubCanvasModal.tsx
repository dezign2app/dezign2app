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
import { subCanvasNodeTypes } from "./sub-canvas/nodes";
import { useSubCanvasState } from "./sub-canvas/hooks/useSubCanvasState";
import { SubCanvasHeader } from "./sub-canvas/components/SubCanvasHeader";
import { ToolsSidebar } from "./sub-canvas/components/ToolsSidebar";
import { InspectorSidebar } from "./sub-canvas/components/InspectorSidebar";
import type { SubCanvasNode } from "./sub-canvas/types";

interface LangGraphSubCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
}

export function LangGraphSubCanvasModal({ open, onOpenChange, nodeId }: LangGraphSubCanvasModalProps) {
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
        <DialogTitle className="sr-only">{node.data.label || "LangGraph Sub-Canvas"}</DialogTitle>
        <DialogDescription className="sr-only">LangGraph Agent Sub-Canvas Studio Editor</DialogDescription>
        <ReactFlowProvider>
          <SubCanvasContent node={node} updateNode={updateNode} onClose={() => onOpenChange(false)} />
        </ReactFlowProvider>
      </DialogContent>
    </Dialog>
  );
}

function SubCanvasContent({
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
    inputChannels,
    setInputChannels,
    stateChannels,
    setStateChannels,
    memoryConfig,
    setMemoryConfig,
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
    handleSave,
  } = useSubCanvasState({ node, updateNode, onClose });

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground">
      {/* Header */}
      <SubCanvasHeader
        label={node.data.label}
        onSave={handleSave}
        onClose={onClose}
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
            nodeTypes={subCanvasNodeTypes}
            onNodeClick={(_: React.MouseEvent, n: SubCanvasNode) => {
              setSelectedNodeId(n.id);
              if (n.id === "START") setActiveSideTab("inputs");
              else if (n.id === "STATE_GLOBAL") setActiveSideTab("state");
              else setActiveSideTab("inspector");
            }}
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

        {/* Right Inspector Sidebar */}
        <InspectorSidebar
          activeSideTab={activeSideTab}
          setActiveSideTab={setActiveSideTab}
          selectedStepData={selectedStepData}
          onDeleteStep={handleDeleteStep}
          onUpdateStep={updateSelectedStep}
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

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LayoutTemplate, ArrowRight, ArrowDown, Layout } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { BackendNode } from "@/types/canvas";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useAutoLayout } from "../../../hooks/useAutoLayout";
import { langGraphCanvasNodeTypes } from "./langgraph-canvas/nodes";
import { useLangGraphCanvasState } from "./langgraph-canvas/hooks/useLangGraphCanvasState";
import { LangGraphCanvasHeader } from "./langgraph-canvas/components/LangGraphCanvasHeader";
import { ToolsSidebar } from "./langgraph-canvas/components/ToolsSidebar";
import { InspectorSidebar } from "./langgraph-canvas/components/InspectorSidebar";
import type { LangGraphCanvasNode, LangGraphCanvasEdge } from "./langgraph-canvas/types";
import { HANDLE_LLM_IN, HANDLE_TOOL_IN, HANDLE_MIDDLEWARE_IN, HANDLE_MEMORY_IN } from "./langgraph-canvas/constants";

interface LangGraphStudioViewProps {
  node: BackendNode;
  onClose: () => void;
}

export function LangGraphStudioView({ node, onClose }: LangGraphStudioViewProps) {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);

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
    selectedMiddlewareData,
    selectedAgentData,
    selectedMemoryData,
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
  } = useLangGraphCanvasState({ node, updateNode, onClose });

  const { handleLayout } = useAutoLayout({ nodes, edges, onNodesChange });

  const connectedLLMId = useMemo(() => {
    if (!selectedNodeId) return null;
    const edge = edges.find((e) => e.target === selectedNodeId && e.targetHandle === HANDLE_LLM_IN);
    return edge ? edge.source : null;
  }, [edges, selectedNodeId]);

  const connectedToolIds = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges
      .filter((e) => e.target === selectedNodeId && e.targetHandle === HANDLE_TOOL_IN)
      .map((e) => e.source);
  }, [edges, selectedNodeId]);

  const connectedMiddlewareIds = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges
      .filter((e) => e.target === selectedNodeId && e.targetHandle === HANDLE_MIDDLEWARE_IN)
      .map((e) => e.source);
  }, [edges, selectedNodeId]);

  const connectedMemoryIds = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges
      .filter((e) => e.target === selectedNodeId && e.targetHandle === HANDLE_MEMORY_IN)
      .map((e) => e.source);
  }, [edges, selectedNodeId]);

  const connectedToolsCount = connectedToolIds.length;
  const connectedMiddlewareCount = connectedMiddlewareIds.length;

  return (
    <div
      className="flex flex-col h-screen w-screen bg-background text-foreground outline-none overflow-hidden"
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
        onAutoLayout={(dir) => handleLayout(dir || "LR")}
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
            <Panel position="top-left" className="flex items-center gap-1.5 bg-background/95 backdrop-blur border border-border p-1 rounded-xl shadow-md">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 font-semibold hover:bg-accent text-foreground"
                onClick={() => handleLayout("LR")}
                title="Auto Layout Left to Right"
              >
                <Layout className="w-3.5 h-3.5 text-primary" />
                Auto Layout
              </Button>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Inspector Sidebar */}
        <InspectorSidebar
          activeSideTab={activeSideTab}
          setActiveSideTab={setActiveSideTab}
          selectedStepData={selectedStepData}
          selectedLLMData={selectedLLMData}
          selectedToolData={selectedToolData}
          selectedMiddlewareData={selectedMiddlewareData}
          selectedAgentData={selectedAgentData}
          selectedMemoryData={selectedMemoryData}
          connectedToolsCount={connectedToolsCount}
          connectedMiddlewareCount={connectedMiddlewareCount}
          availableLLMNodes={availableLLMNodes}
          availableToolNodes={availableToolNodes}
          availableMiddlewareNodes={availableMiddlewareNodes}
          availableMemoryNodes={availableMemoryNodes}
          connectedLLMId={connectedLLMId}
          connectedToolIds={connectedToolIds}
          connectedMiddlewareIds={connectedMiddlewareIds}
          connectedMemoryIds={connectedMemoryIds}
          onSelectLLM={(llmId) => selectedNodeId && handleSelectLLMForAgent(selectedNodeId, llmId)}
          onToggleTool={(toolId, connect) => selectedNodeId && handleToggleToolForAgent(selectedNodeId, toolId, connect)}
          onToggleMiddleware={(mwId, connect) => selectedNodeId && handleToggleMiddlewareForAgent(selectedNodeId, mwId, connect)}
          onToggleMemory={(memId, connect) => selectedNodeId && handleToggleMemoryForAgent(selectedNodeId, memId, connect)}
          onDeleteStep={handleDeleteStep}
          onUpdateStep={updateSelectedStep}
          onUpdateLLM={updateSelectedLLM}
          onUpdateTool={updateSelectedTool}
          onUpdateMiddleware={updateSelectedMiddleware}
          onUpdateAgent={updateSelectedAgent}
          onUpdateMemory={updateSelectedMemory}
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

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { BackendNode } from "@/types/canvas";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { langGraphCanvasNodeTypes } from "./langgraph-canvas/nodes";
import { useLangGraphCanvasState } from "./langgraph-canvas/hooks/useLangGraphCanvasState";
import { LangGraphCanvasHeader } from "./langgraph-canvas/components/LangGraphCanvasHeader";
import { ToolsSidebar } from "./langgraph-canvas/components/ToolsSidebar";
import { InspectorSidebar } from "./langgraph-canvas/components/InspectorSidebar";
import type { LangGraphCanvasNode, LangGraphCanvasEdge } from "./langgraph-canvas/types";
import { HANDLE_LLM_IN, HANDLE_TOOL_IN, HANDLE_MIDDLEWARE_IN } from "./langgraph-canvas/constants";

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
    handleDeleteStep,
    handleDeleteSelected,
    handleSave,
    saveStatus,
    availableLLMNodes,
    availableToolNodes,
    availableMiddlewareNodes,
    handleSelectLLMForAgent,
    handleToggleToolForAgent,
    handleToggleMiddlewareForAgent,
  } = useLangGraphCanvasState({ node, updateNode, onClose });

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
          selectedMiddlewareData={selectedMiddlewareData}
          selectedAgentData={selectedAgentData}
          connectedToolsCount={connectedToolsCount}
          connectedMiddlewareCount={connectedMiddlewareCount}
          availableLLMNodes={availableLLMNodes}
          availableToolNodes={availableToolNodes}
          availableMiddlewareNodes={availableMiddlewareNodes}
          connectedLLMId={connectedLLMId}
          connectedToolIds={connectedToolIds}
          connectedMiddlewareIds={connectedMiddlewareIds}
          onSelectLLM={(llmId) => selectedNodeId && handleSelectLLMForAgent(selectedNodeId, llmId)}
          onToggleTool={(toolId, connect) => selectedNodeId && handleToggleToolForAgent(selectedNodeId, toolId, connect)}
          onToggleMiddleware={(mwId, connect) => selectedNodeId && handleToggleMiddlewareForAgent(selectedNodeId, mwId, connect)}
          onDeleteStep={handleDeleteStep}
          onUpdateStep={updateSelectedStep}
          onUpdateLLM={updateSelectedLLM}
          onUpdateTool={updateSelectedTool}
          onUpdateMiddleware={updateSelectedMiddleware}
          onUpdateAgent={updateSelectedAgent}
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

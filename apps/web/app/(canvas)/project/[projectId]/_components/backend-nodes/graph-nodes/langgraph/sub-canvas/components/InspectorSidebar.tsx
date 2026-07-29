import React, { useState, useCallback } from "react";
import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
} from "@/types/canvas";
import type { StepNodeData, LangGraphLLMNodeData, ToolNodeData, MiddlewareNodeData, AgentNodeData, LangGraphLLMNode, ToolNode, MiddlewareNode } from "../types";
import { InspectorTabContent } from "./inspector/InspectorTabContent";

export interface InspectorSidebarProps {
  activeSideTab?: "inspector" | "inputs" | "state" | "memory";
  setActiveSideTab?: (tab: "inspector" | "inputs" | "state" | "memory") => void;
  selectedStepData: StepNodeData | null;
  selectedLLMData?: LangGraphLLMNodeData | null;
  selectedToolData?: ToolNodeData | null;
  selectedMiddlewareData?: MiddlewareNodeData | null;
  selectedAgentData?: AgentNodeData | null;
  connectedToolsCount?: number;
  connectedMiddlewareCount?: number;
  availableLLMNodes?: LangGraphLLMNode[];
  availableToolNodes?: ToolNode[];
  availableMiddlewareNodes?: MiddlewareNode[];
  connectedLLMId?: string | null;
  connectedToolIds?: string[];
  connectedMiddlewareIds?: string[];
  onSelectLLM?: (llmId: string | null) => void;
  onToggleTool?: (toolId: string, connect: boolean) => void;
  onToggleMiddleware?: (mwId: string, connect: boolean) => void;
  onDeleteStep: () => void;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
  onUpdateLLM?: (changes: Partial<LangGraphLLMNodeData>) => void;
  onUpdateTool?: (changes: Partial<ToolNodeData>) => void;
  onUpdateMiddleware?: (changes: Partial<MiddlewareNodeData>) => void;
  onUpdateAgent?: (changes: Partial<AgentNodeData>) => void;
  inputChannels?: LangGraphInputChannel[];
  setInputChannels?: React.Dispatch<React.SetStateAction<LangGraphInputChannel[]>>;
  stateChannels: LangGraphStateChannel[];
  setStateChannels?: React.Dispatch<React.SetStateAction<LangGraphStateChannel[]>>;
  memoryConfig?: LangGraphMemoryConfig;
  setMemoryConfig?: React.Dispatch<React.SetStateAction<LangGraphMemoryConfig>>;
}

export function InspectorSidebar({
  selectedStepData,
  selectedLLMData,
  selectedToolData,
  selectedMiddlewareData,
  selectedAgentData,
  connectedToolsCount = 0,
  connectedMiddlewareCount = 0,
  availableLLMNodes,
  availableToolNodes,
  availableMiddlewareNodes,
  connectedLLMId,
  connectedToolIds,
  connectedMiddlewareIds,
  onSelectLLM,
  onToggleTool,
  onToggleMiddleware,
  onDeleteStep,
  onUpdateStep,
  onUpdateLLM,
  onUpdateTool,
  onUpdateMiddleware,
  onUpdateAgent,
  stateChannels,
}: InspectorSidebarProps) {
  const [width, setWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(
    (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      mouseDownEvent.stopPropagation();
      setIsResizing(true);

      const startX = mouseDownEvent.clientX;
      const startWidth = width;

      const onMouseMove = (mouseMoveEvent: MouseEvent) => {
        const deltaX = startX - mouseMoveEvent.clientX;
        const newWidth = Math.min(Math.max(startWidth + deltaX, 260), 640);
        setWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [width]
  );

  const hasSelectedNode = Boolean(
    selectedStepData || selectedLLMData || selectedToolData || selectedMiddlewareData || selectedAgentData
  );

  if (!hasSelectedNode) return null;

  return (
    <div
      style={{ width: `${width}px` }}
      className={`border-l border-border bg-card flex flex-col h-full min-h-0 overflow-hidden shrink-0 relative ${
        isResizing ? "select-none" : ""
      }`}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Resizing Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors z-20 ${
          isResizing ? "bg-primary" : "bg-transparent"
        }`}
        onMouseDown={startResizing}
        title="Drag left/right to resize inspector"
      />

      <InspectorTabContent
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
        onSelectLLM={onSelectLLM}
        onToggleTool={onToggleTool}
        onToggleMiddleware={onToggleMiddleware}
        onDeleteStep={onDeleteStep}
        onUpdateStep={onUpdateStep}
        onUpdateLLM={onUpdateLLM}
        onUpdateTool={onUpdateTool}
        onUpdateMiddleware={onUpdateMiddleware}
        onUpdateAgent={onUpdateAgent}
        stateChannels={stateChannels}
      />
    </div>
  );
}

import React from "react";
import { Sparkles } from "lucide-react";
import { TabsContent } from "@workspace/ui/components/tabs";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { StepNodeData, LangGraphLLMNodeData, ToolNodeData, MiddlewareNodeData, AgentNodeData, LangGraphLLMNode, ToolNode, MiddlewareNode } from "../../types";
import { LLMNodeInspector } from "./LLMNodeInspector";
import { StepNodeInspector } from "./StepNodeInspector";
import { ToolNodeInspector } from "./ToolNodeInspector";
import { MiddlewareNodeInspector } from "./MiddlewareNodeInspector";
import { AgentNodeInspector } from "./AgentNodeInspector";

interface InspectorTabContentProps {
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
  stateChannels: LangGraphStateChannel[];
}

export function InspectorTabContent({
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
}: InspectorTabContentProps) {
  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4"
    >
      {selectedLLMData ? (
        <LLMNodeInspector
          selectedLLMData={selectedLLMData}
          onDeleteStep={onDeleteStep}
          onUpdateLLM={onUpdateLLM}
        />
      ) : selectedToolData ? (
        <ToolNodeInspector
          selectedToolData={selectedToolData}
          onDeleteTool={onDeleteStep}
          onUpdateTool={onUpdateTool!}
          stateChannels={stateChannels}
        />
      ) : selectedMiddlewareData ? (
        <MiddlewareNodeInspector
          selectedMiddlewareData={selectedMiddlewareData}
          onDeleteMiddleware={onDeleteStep}
          onUpdateMiddleware={onUpdateMiddleware!}
        />
      ) : selectedAgentData ? (
        <AgentNodeInspector
          selectedAgentData={selectedAgentData}
          onDeleteAgent={onDeleteStep}
          onUpdateAgent={onUpdateAgent!}
          availableLLMNodes={availableLLMNodes}
          availableToolNodes={availableToolNodes}
          availableMiddlewareNodes={availableMiddlewareNodes}
          connectedLLMId={connectedLLMId}
          connectedToolIds={connectedToolIds}
          connectedMiddlewareIds={connectedMiddlewareIds}
          onSelectLLM={onSelectLLM}
          onToggleTool={onToggleTool}
          onToggleMiddleware={onToggleMiddleware}
        />
      ) : selectedStepData ? (
        <StepNodeInspector
          selectedStepData={selectedStepData}
          onDeleteStep={onDeleteStep}
          onUpdateStep={onUpdateStep}
          stateChannels={stateChannels}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-6 text-muted-foreground">
          <Sparkles className="w-8 h-8 text-muted-foreground/40 stroke-[1.5]" />
          <span className="text-sm font-semibold text-foreground">Select a node</span>
          <span className="text-xs text-muted-foreground">Click any step on the canvas to configure it</span>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Sparkles } from "lucide-react";
import { TabsContent } from "@workspace/ui/components/tabs";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { StepNodeData, LangGraphLLMNodeData, ToolNodeData } from "../../types";
import { LLMNodeInspector } from "./LLMNodeInspector";
import { StepNodeInspector } from "./StepNodeInspector";
import { ToolNodeInspector } from "./ToolNodeInspector";

interface InspectorTabContentProps {
  selectedStepData: StepNodeData | null;
  selectedLLMData?: LangGraphLLMNodeData | null;
  selectedToolData?: ToolNodeData | null;
  onDeleteStep: () => void;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
  onUpdateLLM?: (changes: Partial<LangGraphLLMNodeData>) => void;
  onUpdateTool?: (changes: Partial<ToolNodeData>) => void;
  stateChannels: LangGraphStateChannel[];
}

export function InspectorTabContent({
  selectedStepData,
  selectedLLMData,
  selectedToolData,
  onDeleteStep,
  onUpdateStep,
  onUpdateLLM,
  onUpdateTool,
  stateChannels,
}: InspectorTabContentProps) {
  return (
    <TabsContent
      value="inspector"
      className="flex-1 min-h-0 overflow-y-auto p-4 m-0 data-[state=active]:flex data-[state=active]:flex-col gap-4"
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
    </TabsContent>
  );
}

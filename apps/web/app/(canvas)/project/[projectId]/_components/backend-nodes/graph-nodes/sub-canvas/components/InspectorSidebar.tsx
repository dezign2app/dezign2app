import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
} from "@/types/canvas";
import type { StepNodeData, LangGraphLLMNodeData, ToolNodeData, MiddlewareNodeData, AgentNodeData } from "../types";
import { InspectorTabContent } from "./inspector/InspectorTabContent";
import { InputsTabContent } from "./inspector/InputsTabContent";
import { StateTabContent } from "./inspector/StateTabContent";
import { MemoryTabContent } from "./inspector/MemoryTabContent";


export interface InspectorSidebarProps {
  activeSideTab: "inspector" | "inputs" | "state" | "memory";
  setActiveSideTab: (tab: "inspector" | "inputs" | "state" | "memory") => void;
  selectedStepData: StepNodeData | null;
  selectedLLMData?: LangGraphLLMNodeData | null;
  selectedToolData?: ToolNodeData | null;
  selectedMiddlewareData?: MiddlewareNodeData | null;
  selectedAgentData?: AgentNodeData | null;
  connectedToolsCount?: number;
  connectedMiddlewareCount?: number;
  onDeleteStep: () => void;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
  onUpdateLLM?: (changes: Partial<LangGraphLLMNodeData>) => void;
  onUpdateTool?: (changes: Partial<ToolNodeData>) => void;
  onUpdateMiddleware?: (changes: Partial<MiddlewareNodeData>) => void;
  onUpdateAgent?: (changes: Partial<AgentNodeData>) => void;
  inputChannels: LangGraphInputChannel[];
  setInputChannels: React.Dispatch<React.SetStateAction<LangGraphInputChannel[]>>;
  stateChannels: LangGraphStateChannel[];
  setStateChannels: React.Dispatch<React.SetStateAction<LangGraphStateChannel[]>>;
  memoryConfig: LangGraphMemoryConfig;
  setMemoryConfig: React.Dispatch<React.SetStateAction<LangGraphMemoryConfig>>;
}

export function InspectorSidebar({
  activeSideTab,
  setActiveSideTab,
  selectedStepData,
  selectedLLMData,
  selectedToolData,
  selectedMiddlewareData,
  selectedAgentData,
  connectedToolsCount = 0,
  connectedMiddlewareCount = 0,
  onDeleteStep,
  onUpdateStep,
  onUpdateLLM,
  onUpdateTool,
  onUpdateMiddleware,
  onUpdateAgent,
  inputChannels,
  setInputChannels,
  stateChannels,
  setStateChannels,
  memoryConfig,
  setMemoryConfig,
}: InspectorSidebarProps) {
  return (
    <div
      className="w-[340px] border-l border-border bg-card flex flex-col h-full min-h-0 overflow-hidden shrink-0"
      onWheel={(e) => e.stopPropagation()}
    >
      <Tabs
        value={activeSideTab}
        onValueChange={(v) => setActiveSideTab(v as typeof activeSideTab)}
        className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
      >
        <TabsList className="grid grid-cols-4 bg-muted/40 p-1 rounded-none border-b border-border/50 shrink-0">
          <TabsTrigger value="inspector" className="text-[11px] px-1 font-medium">
            Inspector
          </TabsTrigger>
          <TabsTrigger value="inputs" className="text-[11px] px-1 font-medium">
            Inputs ({inputChannels.length})
          </TabsTrigger>
          <TabsTrigger value="state" className="text-[11px] px-1 font-medium">
            State ({stateChannels.length})
          </TabsTrigger>
          <TabsTrigger value="memory" className="text-[11px] px-1 font-medium">
            Memory
          </TabsTrigger>
        </TabsList>

        {/* ── Inspector Tab ── */}
        <InspectorTabContent
          selectedStepData={selectedStepData}
          selectedLLMData={selectedLLMData}
          selectedToolData={selectedToolData}
          selectedMiddlewareData={selectedMiddlewareData}
          selectedAgentData={selectedAgentData}
          connectedToolsCount={connectedToolsCount}
          connectedMiddlewareCount={connectedMiddlewareCount}
          onDeleteStep={onDeleteStep}
          onUpdateStep={onUpdateStep}
          onUpdateLLM={onUpdateLLM}
          onUpdateTool={onUpdateTool}
          onUpdateMiddleware={onUpdateMiddleware}
          onUpdateAgent={onUpdateAgent}
          stateChannels={stateChannels}
        />

        {/* ── Inputs Tab ── */}
        <InputsTabContent
          inputChannels={inputChannels}
          setInputChannels={setInputChannels}
        />

        {/* ── State Tab ── */}
        <StateTabContent
          stateChannels={stateChannels}
          setStateChannels={setStateChannels}
        />

        {/* ── Memory Tab ── */}
        <MemoryTabContent
          memoryConfig={memoryConfig}
          setMemoryConfig={setMemoryConfig}
        />
      </Tabs>
    </div>
  );
}

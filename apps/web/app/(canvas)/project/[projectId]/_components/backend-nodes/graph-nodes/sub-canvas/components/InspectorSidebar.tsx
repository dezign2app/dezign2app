import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
} from "@/types/canvas";
import type { StepNodeData, LangGraphLLMNodeData } from "../types";
import { PROVIDER_PRESETS } from "./inspector/constants";
import { InspectorTabContent } from "./inspector/InspectorTabContent";
import { InputsTabContent } from "./inspector/InputsTabContent";
import { StateTabContent } from "./inspector/StateTabContent";
import { MemoryTabContent } from "./inspector/MemoryTabContent";

export { PROVIDER_PRESETS };

export interface InspectorSidebarProps {
  activeSideTab: "inspector" | "inputs" | "state" | "memory";
  setActiveSideTab: (tab: "inspector" | "inputs" | "state" | "memory") => void;
  selectedStepData: StepNodeData | null;
  selectedLLMData?: LangGraphLLMNodeData | null;
  onDeleteStep: () => void;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
  onUpdateLLM?: (changes: Partial<LangGraphLLMNodeData>) => void;
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
  onDeleteStep,
  onUpdateStep,
  onUpdateLLM,
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
          onDeleteStep={onDeleteStep}
          onUpdateStep={onUpdateStep}
          onUpdateLLM={onUpdateLLM}
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

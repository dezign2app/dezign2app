import React from "react";
import { NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CanvasNode } from "@workspace/canvas";
import {
  useLangGraphCanvasNode,
  NodeHandles,
  NodeHeader,
  NodeResourceBadges,
  LlmConfigPanel,
  StateUpdatesPanel,
  MemoryConfigPanel,
  ResponseFormatPanel,
  EventStreamPanel,
} from "./langgraph-canvas-node";

export const LangGraphCanvasNode = (props: NodeProps<CanvasNode>) => {
  const { data, selected } = props;
  const {
    isEditingName,
    setIsEditingName,
    nameValue,
    setNameValue,
    isExpanded,
    toggleExpand,
    handleDelete,
    handleNameSave,
    boundLLMs,
    boundTools,
    boundMiddlewares,
    boundMemories,
    llmConfig,
    stateUpdatesConfig,
    streamConfig,
    responseFormat,
    memoryConfig,
    stateUpdates,
    availableFields,
    updateAgentData,
    handleToggleLLMConfig,
    handleToggleStateUpdates,
    handleToggleStreaming,
    handleToggleResponseFormat,
    handleToggleMemory,
    handleToggleEvent,
  } = useLangGraphCanvasNode(props);

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[340px] max-w-[440px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-sky-500 ring-2 ring-sky-500/20 shadow-sky-500/10"
          : "border-border hover:border-sky-500/40 hover:shadow-sky-500/5"
      }`}
    >
      <NodeHandles />

      <NodeHeader
        isEditingName={isEditingName}
        setIsEditingName={setIsEditingName}
        nameValue={nameValue}
        setNameValue={setNameValue}
        handleNameSave={handleNameSave}
        dataName={data.name}
        isExpanded={isExpanded}
        toggleExpand={toggleExpand}
        handleDelete={handleDelete}
      />

      {/* Body */}
      <div className="p-3 flex flex-col gap-3">
        <NodeResourceBadges
          boundLLMs={boundLLMs}
          boundTools={boundTools}
          boundMiddlewares={boundMiddlewares}
          boundMemories={boundMemories}
          llmConfig={llmConfig}
          memoryConfig={memoryConfig}
        />

        {/* Expand / Collapse Action Bar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-secondary/30 hover:bg-secondary/60 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/40 transition-colors nodrag"
        >
          {isExpanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp className="w-3 h-3 text-sky-500" />
            </>
          ) : (
            <>
              <span>Show Details & Config</span>
              <ChevronDown className="w-3 h-3 text-sky-500" />
            </>
          )}
        </button>

        {isExpanded && (
          <>
            <LlmConfigPanel
              llmConfig={llmConfig}
              boundLLMs={boundLLMs}
              systemPrompt={data.systemPrompt}
              handleToggleLLMConfig={handleToggleLLMConfig}
              updateAgentData={updateAgentData}
            />

            <StateUpdatesPanel
              stateUpdatesConfig={stateUpdatesConfig}
              stateUpdates={stateUpdates}
              availableFields={availableFields}
              availableStateChannels={data.availableStateChannels}
              handleToggleStateUpdates={handleToggleStateUpdates}
            />

            <MemoryConfigPanel
              memoryConfig={memoryConfig}
              boundMemories={boundMemories}
              handleToggleMemory={handleToggleMemory}
            />

            <ResponseFormatPanel
              responseFormat={responseFormat}
              handleToggleResponseFormat={handleToggleResponseFormat}
            />

            <EventStreamPanel
              streamConfig={streamConfig}
              handleToggleStreaming={handleToggleStreaming}
              handleToggleEvent={handleToggleEvent}
            />
          </>
        )}
      </div>
    </div>
  );
};

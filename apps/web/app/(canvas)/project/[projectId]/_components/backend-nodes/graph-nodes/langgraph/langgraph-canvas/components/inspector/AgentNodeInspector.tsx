import React from "react";
import type {
  AgentNodeData,
  LangGraphLLMNode,
  ToolNode,
  MiddlewareNode,
  MemoryNode,
  LangGraphAgentResponseFormatConfig,
  LangGraphAgentMemoryConfig,
  LangGraphStateChannel,
} from "@workspace/canvas";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useShallow } from "zustand/react/shallow";

import { AgentIdentitySection } from "./agent-inspector/AgentIdentitySection";
import { AgentAttachedComponentsSection } from "./agent-inspector/AgentAttachedComponentsSection";
import { AgentMemoryConfigSection } from "./agent-inspector/AgentMemoryConfigSection";
import { AgentStructuredOutputSection } from "./agent-inspector/AgentStructuredOutputSection";
import { AgentEventStreamingSection } from "./agent-inspector/AgentEventStreamingSection";
import { AgentStateUpdatesSection } from "./agent-inspector/AgentStateUpdatesSection";

interface AgentNodeInspectorProps {
  selectedAgentData: AgentNodeData;
  onDeleteAgent: () => void;
  onUpdateAgent: (changes: Partial<AgentNodeData>) => void;
  availableLLMNodes?: LangGraphLLMNode[];
  availableToolNodes?: ToolNode[];
  availableMiddlewareNodes?: MiddlewareNode[];
  availableMemoryNodes?: MemoryNode[];
  connectedLLMId?: string | null;
  connectedToolIds?: string[];
  connectedMiddlewareIds?: string[];
  connectedMemoryIds?: string[];
  onSelectLLM?: (llmId: string | null) => void;
  onToggleTool?: (toolId: string, connect: boolean) => void;
  onToggleMiddleware?: (mwId: string, connect: boolean) => void;
  onToggleMemory?: (memId: string, connect: boolean) => void;
  stateChannels?: LangGraphStateChannel[];
}

export function AgentNodeInspector({
  selectedAgentData,
  onDeleteAgent,
  onUpdateAgent,
  availableLLMNodes = [],
  availableToolNodes = [],
  availableMiddlewareNodes = [],
  availableMemoryNodes = [],
  connectedLLMId = null,
  connectedToolIds = [],
  connectedMiddlewareIds = [],
  connectedMemoryIds = [],
  onSelectLLM,
  onToggleTool,
  onToggleMiddleware,
  onToggleMemory,
  stateChannels = [],
}: AgentNodeInspectorProps) {
  const entities = useBackendCanvasStore(
    useShallow((s) =>
      s.nodes.filter(
        (n) => n?.type === "entity" && n.data?.dbType !== "vector",
      ),
    ),
  );

  const memConfig: LangGraphAgentMemoryConfig =
    selectedAgentData.memoryConfig || {
      enabled: true,
      checkpointer: "memory",
      threadIdKey: "thread_id",
      threadScope: "session",
      autoSummarize: true,
      saveMessages: true,
    };

  const updateMemoryConfig = (changes: Partial<LangGraphAgentMemoryConfig>) => {
    onUpdateAgent({
      memoryConfig: {
        ...memConfig,
        ...changes,
      },
    });
  };

  const rfConfig: LangGraphAgentResponseFormatConfig =
    selectedAgentData.responseFormat || {
      enabled: false,
      strategy: "auto",
      schemaType: "json_schema",
      schemaJson: "",
      handleErrorMode: "default",
    };

  const updateResponseFormat = (
    changes: Partial<LangGraphAgentResponseFormatConfig>,
  ) => {
    onUpdateAgent({
      responseFormat: {
        ...rfConfig,
        ...changes,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── 1. Identity & System Prompt ─────────────────────────────────────── */}
      <AgentIdentitySection
        selectedAgentData={selectedAgentData}
        onDeleteAgent={onDeleteAgent}
        onUpdateAgent={onUpdateAgent}
      />

      {/* ─── 2. Attached Resources Selection ─────────────────────────────────── */}
      <AgentAttachedComponentsSection
        availableLLMNodes={availableLLMNodes}
        availableToolNodes={availableToolNodes}
        availableMiddlewareNodes={availableMiddlewareNodes}
        availableMemoryNodes={availableMemoryNodes}
        connectedLLMId={connectedLLMId}
        connectedToolIds={connectedToolIds}
        connectedMiddlewareIds={connectedMiddlewareIds}
        connectedMemoryIds={connectedMemoryIds}
        onSelectLLM={onSelectLLM}
        onToggleTool={onToggleTool}
        onToggleMiddleware={onToggleMiddleware}
        onToggleMemory={onToggleMemory}
      />

      {/* ─── 3. State Channel Updates ─────────────────────────────────────────── */}
      <AgentStateUpdatesSection
        selectedAgentData={selectedAgentData}
        onUpdateAgent={onUpdateAgent}
        stateChannels={stateChannels}
      />

      {/* ─── 4. Memory & Checkpointer Configuration ────────────────────────────── */}
      <AgentMemoryConfigSection
        memConfig={memConfig}
        updateMemoryConfig={updateMemoryConfig}
        entities={entities}
      />

      {/* ─── 5. Structured Output / Response Format ────────────────────────────── */}
      <AgentStructuredOutputSection
        rfConfig={rfConfig}
        updateResponseFormat={updateResponseFormat}
      />

      {/* ─── 6. Event Streaming Configuration ──────────────────────────────────── */}
      <AgentEventStreamingSection
        selectedAgentData={selectedAgentData}
        onUpdateAgent={onUpdateAgent}
      />
    </div>
  );
}

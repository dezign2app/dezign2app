import React from "react";
import {
  Radio,
  Trash2,
  Zap,
  Plug,
  Globe,
  Sparkles,
  Layers,
  Info,
  Cpu,
  Link2,
} from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { OutputNodeData, LangGraphLLMNode } from "@workspace/canvas";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { ConnectedRouteInfo } from "../../../LangGraphNode";
import { LocalInput } from "../../../../common";

interface OutputNodeInspectorProps {
  selectedOutputData: OutputNodeData;
  onDeleteOutput: () => void;
  onUpdateOutput: (changes: Partial<OutputNodeData>) => void;
  stateChannels?: LangGraphStateChannel[];
  availableLLMNodes?: LangGraphLLMNode[];
  connectedRoutes?: ConnectedRouteInfo[];
}

function isOutputTransportType(val: string): val is OutputNodeData["type"] {
  return (
    val === "sse" ||
    val === "websocket" ||
    val === "event" ||
    val === "webhook" ||
    val === "rest"
  );
}

function isStreamContentMode(
  val: string,
): val is
  | "ai_node_tokens"
  | "structured_output"
  | "step_output"
  | "full_state" {
  return (
    val === "ai_node_tokens" ||
    val === "structured_output" ||
    val === "step_output" ||
    val === "full_state"
  );
}

export function OutputNodeInspector({
  selectedOutputData,
  onDeleteOutput,
  onUpdateOutput,
  stateChannels = [],
  availableLLMNodes = [],
  connectedRoutes = [],
}: OutputNodeInspectorProps) {
  const channelType = selectedOutputData.type || "sse";
  const contentMode = selectedOutputData.streamContentMode || "ai_node_tokens";
  const boundRouteIds = selectedOutputData.boundRouteIds || [];

  const toggleRouteBinding = (edgeId: string) => {
    if (boundRouteIds.includes(edgeId)) {
      onUpdateOutput({
        boundRouteIds: boundRouteIds.filter((id) => id !== edgeId),
      });
    } else {
      onUpdateOutput({ boundRouteIds: [...boundRouteIds, edgeId] });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-mono truncate max-w-[170px]">
                {selectedOutputData.name ||
                  selectedOutputData.label ||
                  "Output Channel"}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground opacity-70">
                {selectedOutputData.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDeleteOutput}
            title="Delete Output Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Settings */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Output Transport
          </h3>
        </div>

        {/* Channel Name */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold">Channel Label</Label>
          <LocalInput
            value={selectedOutputData.name || selectedOutputData.label || ""}
            onChange={(e) =>
              onUpdateOutput({ name: e.target.value, label: e.target.value })
            }
            placeholder="e.g. Real-Time AI Stream"
            className="bg-background text-xs h-8"
          />
        </div>

        {/* Transport Type */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold">Transport Protocol</Label>
          <Select
            value={channelType}
            onValueChange={(val) => {
              if (isOutputTransportType(val)) {
                onUpdateOutput({ type: val });
              }
            }}
          >
            <SelectTrigger className="bg-background text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sse" className="text-xs">
                📡 SSE Stream (text/event-stream)
              </SelectItem>
              <SelectItem value="websocket" className="text-xs">
                🔌 WebSocket Push (Socket.io)
              </SelectItem>
              <SelectItem value="event" className="text-xs">
                ⚡ Event Publisher (Kafka / RabbitMQ)
              </SelectItem>
              <SelectItem value="webhook" className="text-xs">
                🌐 Webhook Dispatcher (HTTP POST)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payload Content Mode */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Streamed Content Mode</span>
          </Label>
          <Select
            value={contentMode}
            onValueChange={(val) => {
              if (isStreamContentMode(val)) {
                onUpdateOutput({ streamContentMode: val });
              }
            }}
          >
            <SelectTrigger className="bg-background text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai_node_tokens" className="text-xs">
                🤖 AI Node Tokens (Real-time LLM streamMode)
              </SelectItem>
              <SelectItem value="structured_output" className="text-xs">
                📦 Structured Output Stream (Zod / JSON Schema)
              </SelectItem>
              <SelectItem value="step_output" className="text-xs">
                ⚡ Target Step Output Payload
              </SelectItem>
              <SelectItem value="full_state" className="text-xs">
                📊 Full Graph State Object
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Target AI Node / Step selection */}
        {contentMode === "ai_node_tokens" && availableLLMNodes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">
              Source AI / LLM Node
            </Label>
            <Select
              value={selectedOutputData.sourceStepId || "__first__"}
              onValueChange={(val) =>
                onUpdateOutput({
                  sourceStepId: val === "__first__" ? undefined : val,
                })
              }
            >
              <SelectTrigger className="bg-background text-xs h-8 font-mono">
                <SelectValue placeholder="First LLM Node (Default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__first__" className="text-xs font-mono">
                  Default / First AI Node
                </SelectItem>
                {availableLLMNodes.map((llm) => (
                  <SelectItem
                    key={llm.id}
                    value={llm.id}
                    className="text-xs font-mono"
                  >
                    {llm.data.label || llm.id} ({llm.data.provider || "llm"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Topic / Event Name */}
        {(channelType === "event" ||
          channelType === "websocket" ||
          channelType === "webhook") && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">
              Topic / Event / Endpoint Name
            </Label>
            <LocalInput
              value={selectedOutputData.topicOrEventName || ""}
              onChange={(e) =>
                onUpdateOutput({ topicOrEventName: e.target.value })
              }
              placeholder={
                channelType === "event"
                  ? "e.g. ticket.resolved"
                  : channelType === "websocket"
                    ? "e.g. agent_progress"
                    : "e.g. https://api.mycompany.com/webhook"
              }
              className="bg-background font-mono text-xs h-8"
            />
          </div>
        )}

        {/* State Field Selection (if state object mode) */}
        {contentMode === "full_state" && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Target State Channel</span>
            </Label>
            <Select
              value={selectedOutputData.targetStateChannel || "__all__"}
              onValueChange={(val) =>
                onUpdateOutput({
                  targetStateChannel: val === "__all__" ? undefined : val,
                })
              }
            >
              <SelectTrigger className="bg-background text-xs h-8 font-mono">
                <SelectValue placeholder="All State Fields (Full Output)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__" className="text-xs font-mono">
                  Full Graph State (All Fields)
                </SelectItem>
                {stateChannels.map((ch) => (
                  <SelectItem
                    key={ch.key}
                    value={ch.key}
                    className="text-xs font-mono"
                  >
                    {ch.key} ({ch.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bound Routes Section */}
        {connectedRoutes.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span>Bound Incoming Routes</span>
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Select which entry points emit over this output channel (leave
              empty for all routes):
            </p>
            <div className="flex flex-col gap-1.5 bg-background p-2 rounded-lg border border-border/50 max-h-32 overflow-y-auto">
              {connectedRoutes.map((route) => {
                const isBound = boundRouteIds.includes(route.edgeId);
                return (
                  <label
                    key={route.edgeId}
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-secondary/30 p-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isBound}
                        onChange={() => toggleRouteBinding(route.edgeId)}
                        className="rounded border-border text-primary focus:ring-primary accent-primary"
                      />
                      <span className="font-mono font-medium text-[11px] text-foreground">
                        {route.method} {route.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {route.sourceNodeLabel}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold">
            Channel Notes / Description
          </Label>
          <LocalInput
            value={selectedOutputData.description || ""}
            onChange={(e) => onUpdateOutput({ description: e.target.value })}
            placeholder="e.g. Streams AI response tokens for the /chat route"
            className="bg-background text-xs h-8"
          />
        </div>

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-secondary/30 p-2 rounded-lg border border-border/40 mt-1">
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            {contentMode === "ai_node_tokens"
              ? "Streams incremental AI response tokens (streamMode: 'messages') from the AI node directly out to the caller."
              : "Emits state updates for configured routes over this channel."}
          </span>
        </div>
      </div>
    </div>
  );
}

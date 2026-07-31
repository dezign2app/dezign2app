import React from "react";
import { Radio, Trash2, Zap, Plug, Globe, Sparkles, Layers, Info } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { OutputNodeData } from "../../types";
import type { LangGraphStateChannel } from "@/types/canvas";
import { LocalInput } from "../../../../common/shared";

interface OutputNodeInspectorProps {
  selectedOutputData: OutputNodeData;
  onDeleteOutput: () => void;
  onUpdateOutput: (changes: Partial<OutputNodeData>) => void;
  stateChannels?: LangGraphStateChannel[];
}

function isOutputTransportType(val: string): val is OutputNodeData["type"] {
  return val === "sse" || val === "websocket" || val === "event" || val === "webhook" || val === "rest";
}

export function OutputNodeInspector({
  selectedOutputData,
  onDeleteOutput,
  onUpdateOutput,
  stateChannels = [],
}: OutputNodeInspectorProps) {
  const channelType = selectedOutputData.type || "sse";

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
                {selectedOutputData.name || selectedOutputData.label || "Output Channel"}
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Output Transport</h3>
        </div>

        {/* Channel Name */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold">Channel Label</Label>
          <LocalInput
            value={selectedOutputData.name || selectedOutputData.label || ""}
            onChange={(e) => onUpdateOutput({ name: e.target.value, label: e.target.value })}
            placeholder="e.g. SSE Ticket Stream"
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
              <SelectItem value="sse" className="text-xs">📡 SSE Stream (text/event-stream)</SelectItem>
              <SelectItem value="websocket" className="text-xs">🔌 WebSocket Push (Socket.io)</SelectItem>
              <SelectItem value="event" className="text-xs">⚡ Event Publisher (Kafka / RabbitMQ)</SelectItem>
              <SelectItem value="webhook" className="text-xs">🌐 Webhook Dispatcher (HTTP POST)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Topic / Event Name */}
        {(channelType === "event" || channelType === "websocket" || channelType === "webhook") && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Topic / Event / Endpoint Name</Label>
            <LocalInput
              value={selectedOutputData.topicOrEventName || ""}
              onChange={(e) => onUpdateOutput({ topicOrEventName: e.target.value })}
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

        {/* State Field Selection */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Target State Channel</span>
          </Label>
          <Select
            value={selectedOutputData.targetStateChannel || "__all__"}
            onValueChange={(val) => onUpdateOutput({ targetStateChannel: val === "__all__" ? undefined : val })}
          >
            <SelectTrigger className="bg-background text-xs h-8 font-mono">
              <SelectValue placeholder="All State Fields (Full Output)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" className="text-xs font-mono">Full Graph State (All Fields)</SelectItem>
              {stateChannels.map((ch) => (
                <SelectItem key={ch.key} value={ch.key} className="text-xs font-mono">
                  {ch.key} ({ch.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold">Channel Notes / Description</Label>
          <LocalInput
            value={selectedOutputData.description || ""}
            onChange={(e) => onUpdateOutput({ description: e.target.value })}
            placeholder="e.g. Pushes real-time execution tokens to frontend UI"
            className="bg-background text-xs h-8"
          />
        </div>

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-secondary/30 p-2 rounded-lg border border-border/40 mt-1">
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            This output channel creates a dedicated outgoing handle (`channel-out-${selectedOutputData.id.slice(0, 6)}`) on the main system design canvas card.
          </span>
        </div>
      </div>
    </div>
  );
}

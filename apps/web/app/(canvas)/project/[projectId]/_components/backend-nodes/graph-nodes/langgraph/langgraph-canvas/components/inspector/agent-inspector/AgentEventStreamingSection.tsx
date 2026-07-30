import React from "react";
import { Radio, Check, FileJson, Code } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { LocalTextarea } from "../../../../../common/shared";
import type { AgentNodeData } from "../../../types";
import {
  STREAM_EVENT_TYPES,
  DEFAULT_EVENT_STREAM_SIGNATURE,
  DEFAULT_STREAM_TRANSFORMERS,
  DEFAULT_SELECTED_STREAM_EVENTS,
} from "../../../constants";

interface AgentEventStreamingSectionProps {
  selectedAgentData: AgentNodeData;
  onUpdateAgent: (changes: Partial<AgentNodeData>) => void;
}

export function AgentEventStreamingSection({
  selectedAgentData,
  onUpdateAgent,
}: AgentEventStreamingSectionProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-cyan-950/10 dark:bg-cyan-950/20 rounded-xl border border-cyan-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md border ${
              selectedAgentData.streamConfig?.enabled
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-500 animate-pulse"
                : "bg-secondary/30 border-border text-muted-foreground"
            }`}
          >
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              Event Streaming
              {selectedAgentData.streamConfig?.enabled && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                  v3 Active
                </span>
              )}
            </h3>
            <p className="text-[10px] font-mono text-muted-foreground">
              streamEvents(..., version="v3")
            </p>
          </div>
        </div>

        <Switch
          checked={Boolean(selectedAgentData.streamConfig?.enabled)}
          onCheckedChange={(enabled) => {
            onUpdateAgent({
              streamConfig: {
                version: "v3",
                selectedEvents: DEFAULT_SELECTED_STREAM_EVENTS,
                eventSignature: DEFAULT_EVENT_STREAM_SIGNATURE,
                customTransformers: DEFAULT_STREAM_TRANSFORMERS,
                ...selectedAgentData.streamConfig,
                enabled,
              },
            });
          }}
        />
      </div>

      {selectedAgentData.streamConfig?.enabled && (
        <div className="flex flex-col gap-4 pt-2 border-t border-cyan-500/20">
          {/* Event Projections Selection */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Active Event Projections</Label>
            <div className="flex flex-wrap gap-1.5">
              {STREAM_EVENT_TYPES.map((ev) => {
                const currentEvents =
                  selectedAgentData.streamConfig?.selectedEvents || DEFAULT_SELECTED_STREAM_EVENTS;
                const isSelected = currentEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? currentEvents.filter((id) => id !== ev.id)
                        : [...currentEvents, ev.id];
                      onUpdateAgent({
                        streamConfig: {
                          ...selectedAgentData.streamConfig,
                          selectedEvents: updated,
                        },
                      });
                    }}
                    title={`${ev.label}: ${ev.description}`}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 font-semibold"
                        : "bg-background/60 border-border/50 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-cyan-500 shrink-0" />}
                    <span>{ev.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Signature Schema (JSON Template) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-cyan-500" />
                Event Signature Schema (JSON)
              </Label>
              <button
                type="button"
                onClick={() => {
                  onUpdateAgent({
                    streamConfig: {
                      ...selectedAgentData.streamConfig,
                      eventSignature: DEFAULT_EVENT_STREAM_SIGNATURE,
                    },
                  });
                }}
                className="text-[10px] font-mono text-muted-foreground hover:text-cyan-500 underline"
              >
                Reset Default
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Specifies standard JSON envelope signature for frontend parsing.
            </p>
            <LocalTextarea
              value={selectedAgentData.streamConfig?.eventSignature ?? DEFAULT_EVENT_STREAM_SIGNATURE}
              onChange={(e) => {
                onUpdateAgent({
                  streamConfig: {
                    ...selectedAgentData.streamConfig,
                    eventSignature: e.target.value,
                  },
                });
              }}
              className="text-xs min-h-[110px] resize-y bg-background font-mono leading-relaxed text-cyan-600 dark:text-cyan-300"
              placeholder="Configure event signature JSON structure..."
            />
          </div>

          {/* Custom Stream Transformers / Handler Code */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-sky-500" />
                Stream Transformers / Config
              </Label>
              <button
                type="button"
                onClick={() => {
                  onUpdateAgent({
                    streamConfig: {
                      ...selectedAgentData.streamConfig,
                      customTransformers: DEFAULT_STREAM_TRANSFORMERS,
                    },
                  });
                }}
                className="text-[10px] font-mono text-muted-foreground hover:text-sky-500 underline"
              >
                Reset Default
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Configure stream projection transformers and options.
            </p>
            <LocalTextarea
              value={selectedAgentData.streamConfig?.customTransformers ?? DEFAULT_STREAM_TRANSFORMERS}
              onChange={(e) => {
                onUpdateAgent({
                  streamConfig: {
                    ...selectedAgentData.streamConfig,
                    customTransformers: e.target.value,
                  },
                });
              }}
              className="text-xs min-h-[110px] resize-y bg-background font-mono leading-relaxed text-sky-600 dark:text-sky-300"
              placeholder="Configure stream transformer code or options..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

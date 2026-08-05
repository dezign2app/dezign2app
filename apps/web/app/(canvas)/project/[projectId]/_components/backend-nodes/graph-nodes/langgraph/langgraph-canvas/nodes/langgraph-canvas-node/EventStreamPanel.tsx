import React from "react";
import { Radio, Check } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { LangGraphAgentStreamConfig } from "@workspace/canvas";
import {
  STREAM_EVENT_TYPES,
  DEFAULT_SELECTED_STREAM_EVENTS,
} from "../../constants";

interface EventStreamPanelProps {
  streamConfig: LangGraphAgentStreamConfig;
  handleToggleStreaming: (enabled: boolean) => void;
  handleToggleEvent: (eventId: string) => void;
}

export const EventStreamPanel: React.FC<EventStreamPanelProps> = ({
  streamConfig,
  handleToggleStreaming,
  handleToggleEvent,
}) => {
  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-cyan-950/10 dark:bg-cyan-950/20 border border-cyan-500/30 nodrag">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className={`p-1 rounded ${streamConfig.enabled ? "bg-cyan-500/20 text-cyan-500 animate-pulse" : "bg-muted/30 text-muted-foreground"}`}
          >
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Event Stream
              {streamConfig.enabled && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                  v3 Active
                </span>
              )}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono">
              streamEvents(..., version="v3")
            </span>
          </div>
        </div>

        <div
          className="nodrag"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Switch
            checked={Boolean(streamConfig.enabled)}
            onCheckedChange={handleToggleStreaming}
            className="scale-90"
          />
        </div>
      </div>

      {streamConfig.enabled && (
        <div className="flex flex-col gap-2.5 mt-1 pt-2 border-t border-cyan-500/20">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
              Stream Event Projections
            </span>
            <div className="flex flex-wrap gap-1">
              {STREAM_EVENT_TYPES.map((ev) => {
                const isSelected = (
                  streamConfig.selectedEvents || DEFAULT_SELECTED_STREAM_EVENTS
                ).includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleEvent(ev.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={`${ev.label}: ${ev.description}`}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 font-semibold"
                        : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-2.5 h-2.5 text-cyan-500 shrink-0" />
                    )}
                    <span>{ev.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-1 opacity-80 border-t border-cyan-500/10">
            <span>
              Configure signature & transformer logic in Inspector sidebar →
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { Layers } from "lucide-react";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { ResponseExecutionMode, ResponseOutputMode } from "../types";

interface OutputDeliverySectionProps {
  responseExecutionMode: ResponseExecutionMode;
  onResponseExecutionModeChange: (mode: ResponseExecutionMode) => void;
  responseOutputMode: ResponseOutputMode;
  onResponseOutputModeChange: (mode: ResponseOutputMode) => void;
  responseFields: string[];
  onResponseFieldsChange: (fields: string[]) => void;
  stateChannels: LangGraphStateChannel[];
}

export const OutputDeliverySection: React.FC<OutputDeliverySectionProps> = ({
  responseExecutionMode,
  onResponseExecutionModeChange,
  responseOutputMode,
  onResponseOutputModeChange,
  responseFields,
  onResponseFieldsChange,
  stateChannels,
}) => {
  return (
    <div className="flex flex-col gap-3 p-3.5 bg-secondary/10 rounded-xl border border-border/60 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
            Output Delivery & Field Selection
          </span>
        </div>
      </div>

      {/* Delivery Execution Mode Pills */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground">
          Execution Delivery Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-background/60 p-1 rounded-lg border border-border/50 text-xs">
          <button
            type="button"
            onClick={() => onResponseExecutionModeChange("sync")}
            className={`py-1.5 px-2 rounded-md font-medium text-center transition-all ${
              responseExecutionMode === "sync"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            Sync REST (200)
          </button>
          <button
            type="button"
            onClick={() => onResponseExecutionModeChange("stream")}
            className={`py-1.5 px-2 rounded-md font-medium text-center transition-all ${
              responseExecutionMode === "stream"
                ? "bg-purple-600 text-white font-bold shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            SSE Stream
          </button>
          <button
            type="button"
            onClick={() => onResponseExecutionModeChange("async_ack")}
            className={`py-1.5 px-2 rounded-md font-medium text-center transition-all ${
              responseExecutionMode === "async_ack"
                ? "bg-amber-600 text-white font-bold shadow-sm"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            Async Ack (202)
          </button>
        </div>
      </div>

      {/* Output Field Selector (only active for sync mode) */}
      {responseExecutionMode === "sync" && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Response Payload Fields
            </label>
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => onResponseOutputModeChange("full")}
                className={`px-2 py-0.5 rounded border ${
                  responseOutputMode === "full"
                    ? "bg-primary/15 text-primary border-primary/30 font-bold"
                    : "text-muted-foreground border-border/40"
                }`}
              >
                Full Graph State
              </button>
              <button
                type="button"
                onClick={() => onResponseOutputModeChange("selected")}
                className={`px-2 py-0.5 rounded border ${
                  responseOutputMode === "selected"
                    ? "bg-primary/15 text-primary border-primary/30 font-bold"
                    : "text-muted-foreground border-border/40"
                }`}
              >
                Selected Fields
              </button>
            </div>
          </div>

          {responseOutputMode === "selected" && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-background/80 rounded-lg border border-border/50">
              {stateChannels.map((ch) => {
                const isSelected = responseFields.includes(ch.key);
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onResponseFieldsChange(
                          responseFields.filter((f) => f !== ch.key),
                        );
                      } else {
                        onResponseFieldsChange([...responseFields, ch.key]);
                      }
                    }}
                    className={`text-[11px] font-mono px-2 py-1 rounded border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                        : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {ch.key}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from "react";
import { FileJson, Layers } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { LangGraphAgentResponseFormatConfig } from "@workspace/canvas";

interface ResponseFormatPanelProps {
  responseFormat: LangGraphAgentResponseFormatConfig;
  handleToggleResponseFormat: (enabled: boolean) => void;
}

export const ResponseFormatPanel: React.FC<ResponseFormatPanelProps> = ({
  responseFormat,
  handleToggleResponseFormat,
}) => {
  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/50 nodrag">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`p-1 rounded shrink-0 ${responseFormat.enabled ? "bg-sky-500/20 text-sky-500" : "bg-muted/30 text-muted-foreground"}`}
          >
            <FileJson className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
              Structured Output
              {responseFormat.enabled && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-semibold shrink-0">
                  {responseFormat.strategy === "provider"
                    ? "providerStrategy"
                    : responseFormat.strategy === "tool"
                      ? "toolStrategy"
                      : "responseFormat"}
                </span>
              )}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono truncate">
              responseFormat → state.structuredResponse
            </span>
          </div>
        </div>

        <div
          className="nodrag shrink-0"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Switch
            checked={Boolean(responseFormat.enabled)}
            onCheckedChange={handleToggleResponseFormat}
            className="scale-90"
          />
        </div>
      </div>

      {responseFormat.enabled && (
        <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-foreground font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-500" />
              Format: JSON Schema
            </span>
            <span className="text-muted-foreground text-[9px]">
              Mode: {responseFormat.strategy || "auto"}
            </span>
          </div>

          {responseFormat.toolMessageContent && (
            <p className="text-[9px] font-mono text-muted-foreground bg-background/60 p-1.5 rounded border border-border/40 truncate">
              <span className="text-sky-500 font-semibold">toolMsg:</span> "
              {responseFormat.toolMessageContent}"
            </p>
          )}

          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-0.5 opacity-80">
            <span>Edit schema & retry options in Inspector sidebar →</span>
          </div>
        </div>
      )}
    </div>
  );
};

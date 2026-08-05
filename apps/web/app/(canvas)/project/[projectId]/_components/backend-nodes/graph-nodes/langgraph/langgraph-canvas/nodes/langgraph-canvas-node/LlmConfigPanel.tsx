import React from "react";
import { Brain } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { Edge } from "@xyflow/react";
import type { LLMConfigState, CanvasNode } from "@workspace/canvas";
import { LocalTextarea } from "../../../../common";

interface LlmConfigPanelProps {
  llmConfig: LLMConfigState;
  boundLLMs: Edge[];
  systemPrompt?: string;
  handleToggleLLMConfig: (enabled: boolean) => void;
  updateAgentData: (changes: Partial<CanvasNode["data"]>) => void;
}

export const LlmConfigPanel: React.FC<LlmConfigPanelProps> = ({
  llmConfig,
  boundLLMs,
  systemPrompt,
  handleToggleLLMConfig,
  updateAgentData,
}) => {
  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-sky-500/5 border border-sky-500/20 nodrag">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`p-1 rounded shrink-0 ${llmConfig.enabled !== false ? "bg-sky-500/20 text-sky-500" : "bg-muted/30 text-muted-foreground"}`}
          >
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
              LLM Config
              {boundLLMs.length > 0 ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-semibold shrink-0">
                  Bound Edge
                </span>
              ) : llmConfig.enabled !== false ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-semibold shrink-0">
                  {llmConfig.provider || "default"}
                </span>
              ) : null}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono truncate">
              {llmConfig.enabled !== false
                ? "Model execution enabled"
                : "LLM config disabled"}
            </span>
          </div>
        </div>

        <div
          className="nodrag shrink-0"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Switch
            checked={llmConfig.enabled !== false}
            onCheckedChange={handleToggleLLMConfig}
            className="scale-90"
          />
        </div>
      </div>

      {llmConfig.enabled !== false && (
        <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-sky-500/20 nodrag">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">
            System Prompt
          </span>
          <LocalTextarea
            className="min-h-[50px] max-h-[100px] text-[11px] bg-secondary/20 border border-border/50 p-2 rounded font-mono leading-relaxed resize-y placeholder:text-muted-foreground/50 nodrag"
            placeholder="System prompt / instructions for this node..."
            value={systemPrompt || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              updateAgentData({ systemPrompt: e.target.value })
            }
            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

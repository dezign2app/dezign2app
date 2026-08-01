import React from "react";
import { GitFork } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalTextarea } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function ModelFallbackConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <GitFork className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Model Fallback Config
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Fallback Models (In Priority Order)
        </Label>
        <LocalTextarea
          value={data.modelFallbackConfig?.fallbackModels?.join(", ") || ""}
          onChange={(e) =>
            onUpdate({
              modelFallbackConfig: {
                fallbackModels: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          className="text-xs min-h-[60px] font-mono bg-background"
          placeholder="gpt-5.4-mini, claude-3-5-sonnet-20241022, gemini-2.5-flash"
        />
        <p className="text-[10px] text-muted-foreground">
          Comma-separated list of fallback models tried sequentially when the
          primary model fails.
        </p>
      </div>
    </div>
  );
}

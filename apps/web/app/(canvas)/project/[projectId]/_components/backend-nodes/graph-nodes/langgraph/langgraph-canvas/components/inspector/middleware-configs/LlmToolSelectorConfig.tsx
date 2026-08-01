import React from "react";
import { Filter } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalInput, LocalTextarea } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function LlmToolSelectorConfig({
  data,
  onUpdate,
}: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          LLM Tool Selector Config
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Selector Model
        </Label>
        <LocalInput
          value={data.llmToolSelectorConfig?.model || "gpt-5.4-mini"}
          onChange={(e) =>
            onUpdate({
              llmToolSelectorConfig: {
                ...data.llmToolSelectorConfig,
                model: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="gpt-5.4-mini"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Max Tools to Select
        </Label>
        <LocalInput
          type="number"
          min="1"
          value={data.llmToolSelectorConfig?.maxTools ?? 3}
          onChange={(e) =>
            onUpdate({
              llmToolSelectorConfig: {
                ...data.llmToolSelectorConfig,
                maxTools: parseInt(e.target.value) || 3,
              },
            })
          }
          className="h-7 w-24 text-right text-xs font-mono bg-background"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Always Include Tools
        </Label>
        <LocalInput
          value={data.llmToolSelectorConfig?.alwaysInclude?.join(", ") || ""}
          onChange={(e) =>
            onUpdate({
              llmToolSelectorConfig: {
                ...data.llmToolSelectorConfig,
                alwaysInclude: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="search, calculator (comma-separated)"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Selector Prompt Override
        </Label>
        <LocalTextarea
          value={data.llmToolSelectorConfig?.systemPrompt || ""}
          onChange={(e) =>
            onUpdate({
              llmToolSelectorConfig: {
                ...data.llmToolSelectorConfig,
                systemPrompt: e.target.value,
              },
            })
          }
          className="text-xs min-h-[50px] bg-background"
          placeholder="Select relevant tools for query..."
        />
      </div>
    </div>
  );
}

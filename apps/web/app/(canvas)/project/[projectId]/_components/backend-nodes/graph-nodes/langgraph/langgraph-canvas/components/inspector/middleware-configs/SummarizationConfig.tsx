import React from "react";
import { FileText } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalInput, LocalTextarea } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function SummarizationConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Summarization Config</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Summarization Model</Label>
        <LocalInput
          value={data.summarizationConfig?.model || "gpt-5.4-mini"}
          onChange={(e) =>
            onUpdate({
              summarizationConfig: {
                ...data.summarizationConfig,
                model: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="gpt-5.4-mini or openai:gpt-4o-mini"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">Trigger Tokens</Label>
          <LocalInput
            type="number"
            value={data.summarizationConfig?.triggerTokens ?? 4000}
            onChange={(e) =>
              onUpdate({
                summarizationConfig: {
                  ...data.summarizationConfig,
                  triggerTokens: parseInt(e.target.value) || 0,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">Messages to Keep</Label>
          <LocalInput
            type="number"
            value={data.summarizationConfig?.keepMessages ?? 20}
            onChange={(e) =>
              onUpdate({
                summarizationConfig: {
                  ...data.summarizationConfig,
                  keepMessages: parseInt(e.target.value) || 0,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Trim Tokens To Summarize</Label>
        <LocalInput
          type="number"
          value={data.summarizationConfig?.trimTokensToSummarize ?? 4000}
          onChange={(e) =>
            onUpdate({
              summarizationConfig: {
                ...data.summarizationConfig,
                trimTokensToSummarize: parseInt(e.target.value) || 4000,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Summary Prefix</Label>
        <LocalInput
          value={data.summarizationConfig?.summaryPrefix ?? "Summary of previous conversation:"}
          onChange={(e) =>
            onUpdate({
              summarizationConfig: {
                ...data.summarizationConfig,
                summaryPrefix: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Custom Summary Prompt</Label>
        <LocalTextarea
          value={data.summarizationConfig?.summaryPrompt || ""}
          onChange={(e) =>
            onUpdate({
              summarizationConfig: {
                ...data.summarizationConfig,
                summaryPrompt: e.target.value,
              },
            })
          }
          className="text-xs min-h-[60px] bg-background font-mono"
          placeholder="Summarize key info preserving facts. History: {messages}"
        />
      </div>
    </div>
  );
}

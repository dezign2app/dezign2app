import React from "react";
import { Scissors } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { LocalInput } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function ContextEditingConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Scissors className="w-4 h-4 text-pink-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Context Editing (Clear Tool Uses)</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">Trigger Tokens</Label>
          <LocalInput
            type="number"
            value={data.contextEditingConfig?.triggerTokens ?? 100000}
            onChange={(e) =>
              onUpdate({
                contextEditingConfig: {
                  ...data.contextEditingConfig,
                  triggerTokens: parseInt(e.target.value) || 100000,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">Keep Recent Tools</Label>
          <LocalInput
            type="number"
            value={data.contextEditingConfig?.keep ?? 3}
            onChange={(e) =>
              onUpdate({
                contextEditingConfig: {
                  ...data.contextEditingConfig,
                  keep: parseInt(e.target.value) || 3,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <Label htmlFor="clear-inputs" className="text-xs cursor-pointer">Clear Tool Call Inputs</Label>
        <Switch
          id="clear-inputs"
          checked={data.contextEditingConfig?.clearToolInputs ?? false}
          onCheckedChange={(c) =>
            onUpdate({
              contextEditingConfig: { ...data.contextEditingConfig, clearToolInputs: c },
            })
          }
          className="scale-75 origin-right"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Excluded Tools</Label>
        <LocalInput
          value={data.contextEditingConfig?.excludeTools?.join(", ") || ""}
          onChange={(e) =>
            onUpdate({
              contextEditingConfig: {
                ...data.contextEditingConfig,
                excludeTools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="e.g. user_memory, system_config"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Cleared Placeholder Text</Label>
        <LocalInput
          value={data.contextEditingConfig?.placeholder ?? "[cleared]"}
          onChange={(e) =>
            onUpdate({
              contextEditingConfig: {
                ...data.contextEditingConfig,
                placeholder: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
        />
      </div>
    </div>
  );
}

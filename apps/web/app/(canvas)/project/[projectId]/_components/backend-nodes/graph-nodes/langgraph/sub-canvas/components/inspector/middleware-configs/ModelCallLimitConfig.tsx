import React from "react";
import { Cpu } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { LocalInput } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function ModelCallLimitConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-rose-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Call Limit Config</h3>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-foreground">Thread Limit (Total Calls)</Label>
        <LocalInput
          type="number"
          min="1"
          value={data.modelCallLimitConfig?.threadLimit ?? 10}
          onChange={(e) =>
            onUpdate({
              modelCallLimitConfig: {
                ...data.modelCallLimitConfig,
                threadLimit: parseInt(e.target.value) || 10,
              },
            })
          }
          className="h-7 w-24 text-right text-xs font-mono bg-background"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-foreground">Run Limit (Per Invoc.)</Label>
        <LocalInput
          type="number"
          min="1"
          value={data.modelCallLimitConfig?.runLimit ?? 5}
          onChange={(e) =>
            onUpdate({
              modelCallLimitConfig: {
                ...data.modelCallLimitConfig,
                runLimit: parseInt(e.target.value) || 5,
              },
            })
          }
          className="h-7 w-24 text-right text-xs font-mono bg-background"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Exit Behavior</Label>
        <Select
          value={data.modelCallLimitConfig?.exitBehavior || "end"}
          onValueChange={(val: any) =>
            onUpdate({
              modelCallLimitConfig: {
                ...data.modelCallLimitConfig,
                exitBehavior: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="end">end (Graceful termination)</SelectItem>
            <SelectItem value="error">error (Throw exception)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

import React from "react";
import { Wrench } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { LocalInput } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function ToolCallLimitConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-orange-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tool Call Limit Config</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Tool Name (Optional)</Label>
        <LocalInput
          value={data.toolCallLimitConfig?.toolName || ""}
          onChange={(e) =>
            onUpdate({
              toolCallLimitConfig: {
                ...data.toolCallLimitConfig,
                toolName: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="e.g. search (Leave empty for all tools)"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">Thread Limit</Label>
          <LocalInput
            type="number"
            value={data.toolCallLimitConfig?.threadLimit ?? 20}
            onChange={(e) =>
              onUpdate({
                toolCallLimitConfig: {
                  ...data.toolCallLimitConfig,
                  threadLimit: parseInt(e.target.value) || 20,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">Run Limit</Label>
          <LocalInput
            type="number"
            value={data.toolCallLimitConfig?.runLimit ?? 10}
            onChange={(e) =>
              onUpdate({
                toolCallLimitConfig: {
                  ...data.toolCallLimitConfig,
                  runLimit: parseInt(e.target.value) || 10,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Exit Behavior</Label>
        <Select
          value={data.toolCallLimitConfig?.exitBehavior || "continue"}
          onValueChange={(val: any) =>
            onUpdate({
              toolCallLimitConfig: {
                ...data.toolCallLimitConfig,
                exitBehavior: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="continue">continue (Return error message & allow LLM recovery)</SelectItem>
            <SelectItem value="error">error (Throw ToolCallLimitExceededError)</SelectItem>
            <SelectItem value="end">end (Stop execution with AI message)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

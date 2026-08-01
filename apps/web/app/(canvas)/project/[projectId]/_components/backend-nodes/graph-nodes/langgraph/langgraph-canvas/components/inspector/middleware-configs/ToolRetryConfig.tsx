import React from "react";
import { RotateCcw } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalInput } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function ToolRetryConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <RotateCcw className="w-4 h-4 text-yellow-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Tool Retry Config
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">
            Max Retries
          </Label>
          <LocalInput
            type="number"
            min="0"
            value={data.toolRetryConfig?.maxRetries ?? 3}
            onChange={(e) =>
              onUpdate({
                toolRetryConfig: {
                  ...data.toolRetryConfig,
                  maxRetries: parseInt(e.target.value) || 0,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">
            Backoff Factor
          </Label>
          <LocalInput
            type="number"
            step="0.1"
            value={data.toolRetryConfig?.backoffFactor ?? 2.0}
            onChange={(e) =>
              onUpdate({
                toolRetryConfig: {
                  ...data.toolRetryConfig,
                  backoffFactor: parseFloat(e.target.value) || 1.0,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">
            Initial Delay (ms)
          </Label>
          <LocalInput
            type="number"
            value={data.toolRetryConfig?.initialDelayMs ?? 1000}
            onChange={(e) =>
              onUpdate({
                toolRetryConfig: {
                  ...data.toolRetryConfig,
                  initialDelayMs: parseInt(e.target.value) || 1000,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold text-foreground">
            Max Delay (ms)
          </Label>
          <LocalInput
            type="number"
            value={data.toolRetryConfig?.maxDelayMs ?? 60000}
            onChange={(e) =>
              onUpdate({
                toolRetryConfig: {
                  ...data.toolRetryConfig,
                  maxDelayMs: parseInt(e.target.value) || 60000,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <Label htmlFor="retry-jitter" className="text-xs cursor-pointer">
          Add Jitter (±25%)
        </Label>
        <Switch
          id="retry-jitter"
          checked={data.toolRetryConfig?.jitter ?? true}
          onCheckedChange={(c) =>
            onUpdate({
              toolRetryConfig: { ...data.toolRetryConfig, jitter: c },
            })
          }
          className="scale-75 origin-right"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          On Exhausted Retries
        </Label>
        <Select
          value={data.toolRetryConfig?.onFailure || "continue"}
          onValueChange={(val: any) =>
            onUpdate({
              toolRetryConfig: {
                ...data.toolRetryConfig,
                onFailure: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="continue">
              continue (Return error ToolMessage)
            </SelectItem>
            <SelectItem value="error">error (Throw exception)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Apply to Specific Tools
        </Label>
        <LocalInput
          value={data.toolRetryConfig?.tools?.join(", ") || ""}
          onChange={(e) =>
            onUpdate({
              toolRetryConfig: {
                ...data.toolRetryConfig,
                tools: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="e.g. search_db, fetch_api (Leave empty for all)"
        />
      </div>
    </div>
  );
}

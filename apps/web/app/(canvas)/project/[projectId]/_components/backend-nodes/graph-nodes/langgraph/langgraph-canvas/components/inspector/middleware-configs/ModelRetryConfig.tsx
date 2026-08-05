import React from "react";
import { RefreshCw } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalInput } from "../../../../../common";
import type { MiddlewareConfigProps } from "./types";

export function ModelRetryConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Model Retry Config
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
            value={data.modelRetryConfig?.maxRetries ?? 3}
            onChange={(e) =>
              onUpdate({
                modelRetryConfig: {
                  ...data.modelRetryConfig,
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
            value={data.modelRetryConfig?.backoffFactor ?? 2.0}
            onChange={(e) =>
              onUpdate({
                modelRetryConfig: {
                  ...data.modelRetryConfig,
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
            value={data.modelRetryConfig?.initialDelayMs ?? 1000}
            onChange={(e) =>
              onUpdate({
                modelRetryConfig: {
                  ...data.modelRetryConfig,
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
            value={data.modelRetryConfig?.maxDelayMs ?? 60000}
            onChange={(e) =>
              onUpdate({
                modelRetryConfig: {
                  ...data.modelRetryConfig,
                  maxDelayMs: parseInt(e.target.value) || 60000,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <Label htmlFor="model-retry-jitter" className="text-xs cursor-pointer">
          Add Jitter (±25%)
        </Label>
        <Switch
          id="model-retry-jitter"
          checked={data.modelRetryConfig?.jitter ?? true}
          onCheckedChange={(c) =>
            onUpdate({
              modelRetryConfig: { ...data.modelRetryConfig, jitter: c },
            })
          }
          className="scale-75 origin-right"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          On Failure
        </Label>
        <Select
          value={data.modelRetryConfig?.onFailure || "continue"}
          onValueChange={(val: any) =>
            onUpdate({
              modelRetryConfig: {
                ...data.modelRetryConfig,
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
              continue (Return AIMessage with error)
            </SelectItem>
            <SelectItem value="error">error (Throw exception)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

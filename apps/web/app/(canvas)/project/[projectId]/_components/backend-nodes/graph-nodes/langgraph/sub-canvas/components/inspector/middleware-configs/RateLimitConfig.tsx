import React from "react";
import { Gauge } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalInput } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function RateLimitConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rate Limiter Config</h3>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-foreground">Requests Per Minute</Label>
        <LocalInput
          type="number"
          min="1"
          max="10000"
          value={data.rateLimitConfig?.requestsPerMinute ?? 60}
          onChange={(e) =>
            onUpdate({
              rateLimitConfig: {
                ...data.rateLimitConfig,
                requestsPerMinute: parseInt(e.target.value) || 60,
              },
            })
          }
          className="h-7 w-24 text-right text-xs font-mono bg-background"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-foreground">Sliding Window (ms)</Label>
        <LocalInput
          type="number"
          min="1000"
          step="1000"
          value={data.rateLimitConfig?.windowMs ?? 60000}
          onChange={(e) =>
            onUpdate({
              rateLimitConfig: {
                requestsPerMinute: data.rateLimitConfig?.requestsPerMinute ?? 60,
                windowMs: parseInt(e.target.value) || 60000,
              },
            })
          }
          className="h-7 w-28 text-right text-xs font-mono bg-background"
        />
      </div>
    </div>
  );
}

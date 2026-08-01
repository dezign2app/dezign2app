import React from "react";
import { Activity } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { MiddlewareConfigProps } from "./types";

export function LoggingTracingConfig({
  data,
  onUpdate,
}: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Logging & Tracing
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Log Level
        </Label>
        <Select
          value={data.loggingConfig?.logLevel || "info"}
          onValueChange={(val: any) =>
            onUpdate({
              loggingConfig: {
                ...data.loggingConfig,
                logLevel: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debug">debug (verbose)</SelectItem>
            <SelectItem value="info">info (standard)</SelectItem>
            <SelectItem value="warn">warn (warnings only)</SelectItem>
            <SelectItem value="error">error (failures only)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Tracing Target
        </Label>
        <Select
          value={data.loggingConfig?.tracingTarget || "langsmith"}
          onValueChange={(val: any) =>
            onUpdate({
              loggingConfig: {
                logLevel: data.loggingConfig?.logLevel || "info",
                tracingTarget: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="langsmith">LangSmith</SelectItem>
            <SelectItem value="opentelemetry">OpenTelemetry (OTEL)</SelectItem>
            <SelectItem value="convex">Convex Internal Database</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

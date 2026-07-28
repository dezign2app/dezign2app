import React from "react";
import { Shield, Trash2, UserCheck, Gauge, Activity, Code2, AlertCircle } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { MiddlewareNodeData } from "../../types";
import { LocalInput, LocalTextarea } from "../../../shared";

interface MiddlewareNodeInspectorProps {
  selectedMiddlewareData: MiddlewareNodeData;
  onDeleteMiddleware: () => void;
  onUpdateMiddleware: (changes: Partial<MiddlewareNodeData>) => void;
}

export function MiddlewareNodeInspector({
  selectedMiddlewareData,
  onDeleteMiddleware,
  onUpdateMiddleware,
}: MiddlewareNodeInspectorProps) {
  const currentType = selectedMiddlewareData.type || "human_in_the_loop";

  const handleNameChange = (val: string) => {
    onUpdateMiddleware({ name: val });
  };

  const handleInterruptToggle = (key: string, enabled: boolean) => {
    const currentConfig = selectedMiddlewareData.humanInTheLoopConfig || {};
    const currentFlags = currentConfig.interruptOn || { writeFile: true };
    onUpdateMiddleware({
      humanInTheLoopConfig: {
        ...currentConfig,
        interruptOn: {
          ...currentFlags,
          [key]: enabled,
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-mono truncate max-w-[150px]">
                {selectedMiddlewareData.name || "Middleware"}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground opacity-70">
                {selectedMiddlewareData.middlewareId || selectedMiddlewareData.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDeleteMiddleware}
            title="Delete Middleware Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── 1. General Config ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-purple-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Middleware Type</h3>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">Name</Label>
          <LocalInput
            value={selectedMiddlewareData.name || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-7 text-xs font-mono bg-background"
            placeholder="human_approval_mw"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">Type</Label>
          <Select
            value={currentType}
            onValueChange={(val: any) => onUpdateMiddleware({ type: val })}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="human_in_the_loop">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Human in the Loop (Approval Interceptor)</span>
                </div>
              </SelectItem>
              <SelectItem value="rate_limit">
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rate Limiter</span>
                </div>
              </SelectItem>
              <SelectItem value="logging_tracing">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>Logging & Tracing (LangSmith)</span>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Custom JS Middleware</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── 2. Type-Specific Config ───────────────────────────────────────── */}
      {currentType === "human_in_the_loop" && (
        <div className="flex flex-col gap-4 p-3 bg-purple-500/5 rounded-xl border border-purple-500/20">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500">Human-in-the-Loop Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Interrupt On Actions</Label>
            <div className="flex flex-col gap-2 p-2 bg-background border border-border/50 rounded-lg">
              {[
                { key: "writeFile", label: "File System Modifications (writeFile)" },
                { key: "executeCode", label: "Arbitrary Code Execution (executeCode)" },
                { key: "deleteData", label: "Database Deletions / Mutating Queries" },
                { key: "apiCall", label: "External API Endpoint Calls" },
              ].map(({ key, label }) => {
                const checked = selectedMiddlewareData.humanInTheLoopConfig?.interruptOn?.[key] ?? (key === "writeFile");
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <Label htmlFor={`interrupt-${key}`} className="text-xs cursor-pointer">{label}</Label>
                    <Switch
                      id={`interrupt-${key}`}
                      checked={checked}
                      onCheckedChange={(c) => handleInterruptToggle(key, c)}
                      className="scale-75 origin-right"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Approval Prompt</Label>
            <LocalTextarea
              value={selectedMiddlewareData.humanInTheLoopConfig?.approvalPrompt || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  humanInTheLoopConfig: {
                    ...selectedMiddlewareData.humanInTheLoopConfig,
                    approvalPrompt: e.target.value,
                  },
                })
              }
              className="text-xs min-h-[50px] bg-background"
              placeholder="Requires admin approval before executing side effects..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Required Role</Label>
            <LocalInput
              value={selectedMiddlewareData.humanInTheLoopConfig?.requiredRole || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  humanInTheLoopConfig: {
                    ...selectedMiddlewareData.humanInTheLoopConfig,
                    requiredRole: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="admin, supervisor"
            />
          </div>
        </div>
      )}

      {currentType === "rate_limit" && (
        <div className="flex flex-col gap-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Rate Limiter Config</h3>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold text-foreground">Requests Per Minute</Label>
            <LocalInput
              type="number"
              min="1"
              max="10000"
              value={selectedMiddlewareData.rateLimitConfig?.requestsPerMinute ?? 60}
              onChange={(e) =>
                onUpdateMiddleware({
                  rateLimitConfig: {
                    ...selectedMiddlewareData.rateLimitConfig,
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
              value={selectedMiddlewareData.rateLimitConfig?.windowMs ?? 60000}
              onChange={(e) =>
                onUpdateMiddleware({
                  rateLimitConfig: {
                    requestsPerMinute: selectedMiddlewareData.rateLimitConfig?.requestsPerMinute ?? 60,
                    windowMs: parseInt(e.target.value) || 60000,
                  },
                })
              }
              className="h-7 w-28 text-right text-xs font-mono bg-background"
            />
          </div>
        </div>
      )}

      {currentType === "logging_tracing" && (
        <div className="flex flex-col gap-4 p-3 bg-sky-500/5 rounded-xl border border-sky-500/20">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-500">Logging & Tracing</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Log Level</Label>
            <Select
              value={selectedMiddlewareData.loggingConfig?.logLevel || "info"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  loggingConfig: {
                    ...selectedMiddlewareData.loggingConfig,
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
            <Label className="text-xs font-semibold text-foreground">Tracing Target</Label>
            <Select
              value={selectedMiddlewareData.loggingConfig?.tracingTarget || "langsmith"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  loggingConfig: {
                    logLevel: selectedMiddlewareData.loggingConfig?.logLevel || "info",
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
      )}

      {currentType === "custom" && (
        <div className="flex flex-col gap-4 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500">Custom JS Middleware</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground flex justify-between">
              <span>Middleware Function Body</span>
              <span className="text-[9px] text-indigo-400">({`{ request, state }, next`})</span>
            </Label>
            <LocalTextarea
              value={selectedMiddlewareData.customBody || ""}
              onChange={(e) => onUpdateMiddleware({ customBody: e.target.value })}
              className="text-[11px] min-h-[140px] resize-y bg-background font-mono leading-relaxed"
              placeholder={'async ({ request, state }, next) => {\n  console.log("Before request:", request);\n  const response = await next();\n  console.log("After response:", response);\n  return response;\n}'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

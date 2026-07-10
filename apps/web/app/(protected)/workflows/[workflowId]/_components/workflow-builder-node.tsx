"use client";

import React, { useState, memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { Check, Copy, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  getWorkflowNodeSummary,
  WORKFLOW_NODE_REGISTRY,
} from "./workflow-node-registry";
import type { WorkflowEditorNode } from "./workflow-editor-types";

const handleClassName =
  "!size-3 !border-2 !border-background !bg-primary shadow-sm transition-colors";

export const WorkflowBuilderNode = memo(({
  id,
  data,
  selected,
}: NodeProps<WorkflowEditorNode>) => {
  const definition = WORKFLOW_NODE_REGISTRY[data.nodeType];
  const Icon = definition.icon;
  const summary = getWorkflowNodeSummary(data.nodeType, data.config).filter(
    Boolean,
  );
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn(
        "group/node relative min-w-[240px] rounded-2xl border bg-card text-card-foreground shadow-sm transition-all",
        selected
          ? "border-primary/50 ring-2 ring-primary/25 shadow-lg"
          : "border-border/70 hover:scale-102",
        data.status === "running" && "border-(--tt-brand-color-400)",
        data.status === "failed" && "border-(--tt-color-red-base)",
        data.status === "completed" && "border-(--tt-color-green-base) shadow-[0_0_15px_rgba(34,197,94,0.15)]",
      )}
    >
      {data.status === "failed" && (
        <div className="absolute -inset-1 z-[-1] rounded-[1.25rem] border-2 border-destructive/20 pointer-events-none animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
      )}
      {definition.hasTargetHandle ? (
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          className={cn(handleClassName, "!bg-muted-foreground")}
        />
      ) : null}

      <div
        className={cn(
          "rounded-t-2xl bg-gradient-to-r px-4 py-3 rounded-2xl",
          definition.accentClassName,
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border bg-background/80 shadow-sm">
              <Icon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{definition.title}</p>
                {data.status === "running" && (
                  <Loader2 className="size-3 animate-spin text-primary" />
                )}
                {data.status === "failed" && (
                  <AlertCircle className="size-3 text-destructive" />
                )}
                {data.status === "completed" && (
                  <CheckCircle2 className="size-3 text-green-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {definition.badge}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyId}
              title={`Copy node ID: ${id}`}
              className="group flex items-center gap-1 rounded-md border border-transparent bg-background/60 px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 transition-all hover:border-border hover:bg-background hover:text-foreground group-hover/node:opacity-100 nodrag nopan"
            >
              {copied ? (
                <Check className="size-2.5 text-green-500" />
              ) : (
                <Copy className="size-2.5" />
              )}
              <span>{copied ? "Copied!" : "Copy ID"}</span>
            </button>
            <Badge variant="outline">{data.nodeType}</Badge>
          </div>
        </div>

        <div className="rounded-xl border bg-background/75 px-3 py-2">
          <p className="truncate text-sm font-medium">{data.label}</p>
          <div className="mt-2 space-y-1">
            {summary.slice(0, 3).map((line) => (
              <p
                key={`${data.label}-${line}`}
                className="truncate text-xs text-muted-foreground"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {definition.sourceHandles.length > 1 ? (
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {definition.sourceHandles.map((handle) => (
            <Badge
              key={handle.id}
              variant={handle.id === "false" ? "destructive" : "secondary"}
            >
              {handle.label ?? handle.id}
            </Badge>
          ))}
        </div>
      ) : null}

      {definition.sourceHandles.map((handle, index) => {
        const topOffset =
          definition.sourceHandles.length === 1
            ? "50%"
            : `${((index + 1) / (definition.sourceHandles.length + 1)) * 100}%`;

        return (
          <Handle
            key={`${data.nodeType}-${handle.id}`}
            id={handle.id}
            type="source"
            position={Position.Right}
            style={{ top: topOffset }}
            className={cn(
              handleClassName,
              handle.id === "true"
                ? "!bg-primary"
                : handle.id === "false"
                  ? "!bg-destructive"
                  : undefined,
            )}
          />
        );
      })}
    </div>
  );
});

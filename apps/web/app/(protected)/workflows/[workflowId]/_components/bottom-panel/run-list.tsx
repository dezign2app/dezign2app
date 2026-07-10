"use client";

import React from "react";
import { Doc, Id } from "@workspace/backend/_generated/dataModel";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";

interface RunListProps {
  recentRuns: Doc<"workflow_runs">[];
  selectedRunId: Id<"workflow_runs"> | null;
  onSelectRun: (runId: Id<"workflow_runs">) => void;
  runStatusTone: Record<Doc<"workflow_runs">["status"], string>;
  formatTimestamp: (timestamp: number) => string;
}

export const RunList = ({
  recentRuns,
  selectedRunId,
  onSelectRun,
  runStatusTone,
  formatTimestamp,
}: RunListProps) => {
  return (
    <div className="flex min-h-0 flex-col bg-sidebar-accent/30">
      <div className="border-b border-sidebar-border px-4 py-3 font-mono text-xs uppercase text-sidebar-foreground/60">
        Recent Runs
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2 w-full">
          {recentRuns.length > 0 ? (
            recentRuns.map((run) => (
              <button
                key={run._id}
                type="button"
                onClick={() => onSelectRun(run._id)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors",
                  run._id === selectedRunId
                    ? "border bg-sidebar text-sidebar-foreground"
                    : "border-transparent bg-transparent text-sidebar-foreground/70 hover:border-sidebar-border hover:bg-sidebar",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{run._id.substring(0, 6)}</span>
                  <span className={runStatusTone[run.status]}>
                    {run.status}
                  </span>
                </div>
                <div className="mt-1 text-sidebar-foreground/45">
                  {formatTimestamp(run.startedAt)}
                </div>
              </button>
            ))
          ) : (
            <div className="px-2 py-4 font-mono text-xs text-sidebar-foreground/45">
              No workflow runs yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

"use client";

import React from "react";
import { Doc } from "@workspace/backend/_generated/dataModel";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { PlayCircle } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { RunList } from "./run-list";
import { JsonLine, tryParseJson } from "./json-view";

import { useWorkflowEditorContext } from "../workflow-editor-context";

const runStatusTone: Record<Doc<"workflow_runs">["status"], string> = {
  queued: "text-orange-400/70",
  running: "text-yellow-400/70",
  completed: "text-green-400/70",
  failed: "text-red-400/70",
  cancelled: "text-yellow-400/70",
};

const eventLevelTone: Record<Doc<"workflow_run_events">["level"], string> = {
  debug: "text-sidebar-foreground/55",
  info: "text-sidebar-foreground",
  warn: "text-chart-3",
  error: "text-destructive",
};

const formatTimestamp = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);

// ─── Event helpers ────────────────────────────────────────────────────────────

const formatEventMessage = (event: Doc<"workflow_run_events">) => {
  const payload = event.payload;

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return event.type.replaceAll("_", " ");
};

const getEventDetailLines = (
  event: Doc<"workflow_run_events">,
): { lines: string[]; isJson: boolean } => {
  if (!event.payload || typeof event.payload !== "object") {
    return { lines: [], isJson: false };
  }

  const payloadEntries = Object.entries(event.payload).filter(
    ([key]) => key !== "message",
  );

  if (payloadEntries.length === 0) {
    return { lines: [], isJson: false };
  }

  // Single-entry payloads that hold a JSON value → unwrap and pretty-print
  if (payloadEntries.length === 1) {
    const firstEntry = payloadEntries[0];
    if (firstEntry) {
      const [_, val] = firstEntry;
      const { isJson, parsed } = tryParseJson(val);
      if (isJson) {
        return {
          lines: JSON.stringify(parsed, null, 2).split("\n"),
          isJson: true,
        };
      }
    }
  }

  // Multi-entry payloads — parse any embedded JSON string values
  const hasNestedJson = payloadEntries.some(([, v]) => tryParseJson(v).isJson);
  const processed = Object.fromEntries(
    payloadEntries.map(([k, v]) => {
      const { isJson, parsed } = tryParseJson(v);
      return [k, isJson ? parsed : v];
    }),
  );

  return {
    lines: JSON.stringify(processed, null, 2).split("\n"),
    isJson: hasNestedJson,
  };
};

export const TerminalTab = () => {
  const {
    selectedRun,
    selectedRunId,
    selectedRunEvents: runEvents = [],
    recentRuns = [],
    setSelectedRunId: onSelectRun,
  } = useWorkflowEditorContext();

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_280px]">
      <ScrollArea className="h-full border-r border-sidebar-border text-xs overflow-y-auto">
        <div className="space-y-3 px-4 py-3 font-mono leading-6">
          {selectedRun ? (
            <>
              <div className="flex items-start gap-3 text-sidebar-foreground">
                <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                  1
                </span>
                <span>{`$ workflow run --draft --run ${selectedRun._id}`}</span>
              </div>
              <div
                className={cn(
                  "flex items-start gap-3",
                  runStatusTone[selectedRun.status],
                )}
              >
                <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                  2
                </span>
                <span>{`[${selectedRun.status}] ${formatTimestamp(
                  selectedRun.startedAt,
                )}`}</span>
              </div>

              {runEvents.length > 0 ? (
                runEvents.map((event, index) => {
                  const { lines, isJson } = getEventDetailLines(event);

                  return (
                    <div key={event._id} className="space-y-1">
                      <div
                        className={cn(
                          "flex items-start gap-3",
                          eventLevelTone[event.level],
                        )}
                      >
                        <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                          {index + 3}
                        </span>
                        <span className="min-w-0 flex-1 break-words">
                          <span className="text-sidebar-foreground/40">
                            [{formatTimestamp(event.createdAt)}]
                          </span>{" "}
                          {formatEventMessage(event)}
                        </span>
                      </div>

                      {lines.length > 0 ? (
                        <div className="pl-[3.25rem]">
                          {isJson ? (
                            <div className="my-1 border-l-2 border-sidebar-border/60 pl-3 text-sidebar-foreground/80">
                              {lines.map((line, detailIndex) => (
                                <JsonLine
                                  key={`${event._id}-${detailIndex}`}
                                  line={line}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-sidebar-foreground/70">
                              {lines.map((line, detailIndex) => (
                                <div
                                  key={`${event._id}-${detailIndex}`}
                                  className="break-all leading-5"
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-start gap-3 text-sidebar-foreground/55">
                  <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                    3
                  </span>
                  <span>{"> waiting for workflow events..."}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 text-sidebar-foreground">
                <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                  1
                </span>
                <span className="inline-flex items-center gap-2">
                  <PlayCircle className="size-3.5 text-sidebar-foreground/50" />
                  Terminal is waiting for workflow runs...
                </span>
              </div>
              <div className="flex items-start gap-3 text-sidebar-foreground/70">
                <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                  2
                </span>
                <span>
                  {"> manual test execution logs will stream here"}
                </span>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <RunList
        recentRuns={recentRuns}
        selectedRunId={selectedRunId}
        onSelectRun={onSelectRun}
        runStatusTone={runStatusTone}
        formatTimestamp={formatTimestamp}
      />
    </div>
  );
};

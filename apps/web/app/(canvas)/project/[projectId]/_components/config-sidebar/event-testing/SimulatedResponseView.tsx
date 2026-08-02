import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Loader2, Trash, ChevronRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { JSONValue } from "@/types/canvas";
import type { SimulationTraceEntry } from "@/lib/simulation/runtime";
import { is2xxStatus } from "@/lib/simulation/runtime";

export interface SimulatedResponseData {
  headers?: Record<string, string>;
  status?: number;
  statusText?: string;
  body?: JSONValue;
  trace?: SimulationTraceEntry[];
}

interface SimulatedResponseViewProps {
  response: SimulatedResponseData;
  isExecutionFinished: boolean;
  activeIndex: number;
  onClear: () => void;
}

export const SimulatedResponseView: React.FC<SimulatedResponseViewProps> = ({
  response,
  isExecutionFinished,
  activeIndex,
  onClear,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm mt-2">
      <div className="flex items-center justify-between border-b pb-3">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Simulated Response
        </h4>
        <div className="flex items-center gap-2">
          {isExecutionFinished ? (
            <span
              className={cn(
                "px-2 py-1 rounded text-[11px] font-bold font-mono border shadow-sm transition-all",
                response.status && is2xxStatus(response.status)
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20",
              )}
            >
              {response.status} {response.statusText}
            </span>
          ) : (
            <span className="px-2 py-1 rounded text-[11px] font-bold font-mono border bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-sm flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Executing...
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onClear}
            title="Clear Response"
          >
            <Trash className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {response.trace && response.trace.length > 0 && (
        <div className="flex flex-col gap-1.5 border rounded-lg p-3 bg-background/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Execution Trace
          </span>
          {response.trace
            .slice(
              0,
              activeIndex >= 0
                ? activeIndex + 1
                : response.trace.length,
            )
            .map((entry, idx) => (
              <div
                key={`${entry.id}-${idx}`}
                className="flex flex-col gap-1 text-xs font-mono pb-2 border-b last:border-0 border-border/40 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={
                      entry.status === "failed"
                        ? "text-destructive"
                        : "text-green-600"
                    }
                  >
                    {entry.status === "failed" ? "✕" : "✓"}
                  </span>
                  <span className="flex-1 font-semibold text-foreground/80">
                    {entry.label}
                    {entry.detail ? ` — ${entry.detail}` : ""}
                  </span>
                </div>
                {(entry.input !== undefined ||
                  entry.output !== undefined) && (
                  <div className="pl-5 flex flex-col gap-1.5">
                    {entry.input !== undefined && (
                      <details className="group">
                        <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground list-none flex items-center select-none font-sans">
                          <ChevronRight className="w-3 h-3 mr-1 group-open:rotate-90 transition-transform" />
                          Input
                        </summary>
                        <pre className="mt-1.5 p-2 bg-secondary/20 rounded border text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[150px] overflow-y-auto text-foreground/70">
                          {typeof entry.input === "string"
                            ? entry.input
                            : JSON.stringify(entry.input, null, 2)}
                        </pre>
                      </details>
                    )}
                    {entry.output !== undefined && (
                      <details className="group">
                        <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground list-none flex items-center select-none font-sans">
                          <ChevronRight className="w-3 h-3 mr-1 group-open:rotate-90 transition-transform" />
                          Output
                        </summary>
                        <pre className="mt-1.5 p-2 bg-secondary/20 rounded border text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[150px] overflow-y-auto text-foreground/70">
                          {typeof entry.output === "string"
                            ? entry.output
                            : JSON.stringify(entry.output, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {isExecutionFinished ? (
        <>
          {response.headers &&
            Object.keys(response.headers).length > 0 && (
              <div className="p-3 border rounded-lg bg-background/50 flex flex-col gap-1.5 text-xs font-mono text-muted-foreground">
                {Object.entries(response.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-4">
                    <span className="w-1/3 truncate">{k}:</span>
                    <span className="text-foreground flex-1 break-all">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}

          <pre className="p-4 border rounded-lg bg-secondary/30 font-mono text-xs overflow-x-auto text-foreground whitespace-pre-wrap">
            {typeof response.body === "string"
              ? response.body
              : JSON.stringify(response.body, null, 2)}
          </pre>
        </>
      ) : (
        <div className="p-4 border rounded-lg bg-secondary/10 border-dashed text-xs font-mono text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Executing step-by-step canvas simulation...
        </div>
      )}
    </div>
  );
};

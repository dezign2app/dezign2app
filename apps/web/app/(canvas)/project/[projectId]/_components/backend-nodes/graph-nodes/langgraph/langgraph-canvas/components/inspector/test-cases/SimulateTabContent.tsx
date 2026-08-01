import React, { useState, useEffect } from "react";
import { Send, Loader2, Trash, ChevronRight, FlaskConical, Route } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { is2xxStatus } from "./utils";
import type { SimulationTestCase } from "@workspace/canvas";
import type { ConnectedRouteInfo } from "../../../../LangGraphNode";
import type { SimulationTestCaseResult } from "@/lib/simulation/runtime";

export type SimulateTabContentProps = {
  graphNodeId: string;
  graphTestCases: SimulationTestCase[];
  orderedRoutes: ConnectedRouteInfo[];
  onRunTestCase?: (
    testCase: SimulationTestCase
  ) => Promise<SimulationTestCaseResult | void> | SimulationTestCaseResult | void;
};

export const SimulateTabContent = ({
  graphTestCases,
  orderedRoutes,
  onRunTestCase,
}: SimulateTabContentProps) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<SimulationTestCaseResult | null>(null);

  // Auto-select first test case when available
  useEffect(() => {
    if (graphTestCases.length > 0 && graphTestCases[0] && !selectedCaseId) {
      setSelectedCaseId(graphTestCases[0].id);
    }
  }, [graphTestCases, selectedCaseId]);

  const selectedCase = graphTestCases.find((tc) => tc.id === selectedCaseId);
  const selectedRoute = orderedRoutes.find(
    (r) => r.edgeId === selectedCase?.targetRouteId
  );

  const handleSendSimulate = async () => {
    if (!selectedCase || !onRunTestCase) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await onRunTestCase(selectedCase);
      if (res) {
        setResponse(res);
      }
    } catch (err) {
      console.error(err);
      toast.error("Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  if (graphTestCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border rounded-xl bg-card/40 gap-2 font-sans">
        <FlaskConical className="w-8 h-8 text-muted-foreground/60" />
        <div className="text-xs font-semibold text-foreground">No Test Cases Saved</div>
        <div className="text-xs text-muted-foreground max-w-xs">
          Create and configure test cases in the <strong>Test Cases</strong> tab to simulate graph runs.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-0 m-0 font-sans">
      <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Select Test Case to Simulate
          </Label>
          <Select
            value={selectedCaseId}
            onValueChange={(val) => {
              setSelectedCaseId(val);
              setResponse(null);
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-background font-medium">
              <SelectValue placeholder="Choose a test case" />
            </SelectTrigger>
            <SelectContent>
              {graphTestCases.map((tc) => (
                <SelectItem key={tc.id} value={tc.id}>
                  {tc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Test Case Summary Card */}
        {selectedCase && (
          <div className="flex flex-col gap-2 p-3 border rounded-lg bg-background/60 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground truncate">
                {selectedCase.name}
              </span>
              {selectedRoute && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <Route className="w-3 h-3" />
                  {selectedRoute.method} {selectedRoute.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
              <span>
                Initial State: {selectedCase.initialState ? Object.keys(selectedCase.initialState).length : 0} keys
              </span>
              <span>•</span>
              <span>
                Mock Outputs: {selectedCase.mocks ? Object.keys(selectedCase.mocks).length : 0} nodes
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t">
          <Button
            size="sm"
            className="text-xs font-medium h-8 px-5"
            onClick={handleSendSimulate}
            disabled={loading || !selectedCase}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                Simulate
                <Send className="ml-2 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Response / Trace output */}
      {response && (
        <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm mt-2">
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Simulated Response
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2 py-1 rounded text-[11px] font-bold font-mono border shadow-sm transition-all",
                  response.status && is2xxStatus(response.status)
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {response.status}{" "}
                {response.statusText || (is2xxStatus(response.status) ? "OK" : "Error")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => {
                  setResponse(null);
                  useSimulationStore.getState().clear();
                }}
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
              {response.trace.map((entry) => (
                <div
                  key={entry.id}
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
                  {(entry.input !== undefined || entry.output !== undefined) && (
                    <div className="pl-5 flex flex-col gap-1.5">
                      {entry.input !== undefined && (
                        <details className="group">
                          <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground list-none flex items-center select-none font-sans">
                            <ChevronRight className="w-3 h-3 mr-1 group-open:rotate-90 transition-transform" />
                            Input
                          </summary>
                          <pre className="mt-1.5 p-2 bg-secondary/20 rounded border text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[150px] overflow-y-auto text-foreground/70 font-mono">
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
                          <pre className="mt-1.5 p-2 bg-secondary/20 rounded border text-[10px] overflow-x-auto whitespace-pre-wrap max-h-[150px] overflow-y-auto text-foreground/70 font-mono">
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
        </div>
      )}
    </div>
  );
};

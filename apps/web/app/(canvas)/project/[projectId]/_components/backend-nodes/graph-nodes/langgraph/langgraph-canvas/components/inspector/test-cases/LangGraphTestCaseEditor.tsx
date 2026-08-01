import React, { useState, useEffect, useRef, useMemo } from "react";
import { Play, Trash, Route, GitBranch } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { JsonPayloadEditor } from "../../../../../Editors";
import { buildTracePath, type TraceEdge } from "./utils";
import type {
  LangGraphInputChannel,
  LangGraphStateChannel,
  LangGraphStepConfig,
  JSONValue,
} from "@/types/canvas";
import type { SimulationTestCase } from "@workspace/canvas";
import type { ConnectedRouteInfo } from "../../../../LangGraphNode";
import type { SimulationTestCaseResult } from "@/lib/simulation/runtime";

export type LangGraphTestCaseEditorProps = {
  testCase: SimulationTestCase;
  triggerLabel: string;
  orderedRoutes: ConnectedRouteInfo[];
  inputChannels: LangGraphInputChannel[];
  stateChannels: LangGraphStateChannel[];
  graphSteps: LangGraphStepConfig[];
  graphEdges: TraceEdge[];
  graphNodeLabels: Record<string, string>;
  defaultState: Record<string, JSONValue>;
  defaultBody: Record<string, JSONValue>;
  onSave: (updated: SimulationTestCase) => void;
  onDelete: () => void;
  onRunTestCase?: (
    testCase: SimulationTestCase
  ) => Promise<SimulationTestCaseResult | void> | SimulationTestCaseResult | void;
};

export const LangGraphTestCaseEditor = ({
  testCase,
  triggerLabel,
  orderedRoutes,
  graphSteps,
  graphEdges,
  graphNodeLabels,
  defaultState,
  onSave,
  onDelete,
  onRunTestCase,
}: LangGraphTestCaseEditorProps) => {
  const [name, setName] = useState(testCase.name);
  const [targetRouteId, setTargetRouteId] = useState(testCase.targetRouteId);
  const [body, setBody] = useState<JSONValue | undefined>(testCase.request?.body);
  const [initialState, setInitialState] = useState<Record<string, JSONValue>>(
    (testCase.initialState as Record<string, JSONValue> | undefined) || defaultState
  );
  const [routerChoices, setRouterChoices] = useState<Record<string, string>>(
    testCase.routerChoices || {}
  );
  const [mocks, setMocks] = useState<
    Record<string, { returnData: JSONValue; status: number }>
  >(testCase.mocks || {});
  const [expectedState, setExpectedState] = useState<Record<string, JSONValue>>(
    (testCase.expectedState as Record<string, JSONValue> | undefined) || defaultState
  );

  useEffect(() => {
    setName(testCase.name);
    setTargetRouteId(testCase.targetRouteId);
    setBody(testCase.request?.body);
    setInitialState(
      (testCase.initialState as Record<string, JSONValue> | undefined) || defaultState
    );
    setRouterChoices(testCase.routerChoices || {});
    setMocks(testCase.mocks || {});
    setExpectedState(
      (testCase.expectedState as Record<string, JSONValue> | undefined) || defaultState
    );
  }, [
    testCase.id,
    testCase.name,
    testCase.targetRouteId,
    testCase.request,
    testCase.initialState,
    testCase.routerChoices,
    testCase.mocks,
    testCase.expectedState,
    defaultState,
  ]);

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const handler = setTimeout(() => {
      onSave({
        ...testCase,
        name,
        targetRouteId,
        request: { ...testCase.request, body },
        initialState,
        routerChoices,
        mocks,
        expectedState,
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [
    name,
    targetRouteId,
    body,
    initialState,
    routerChoices,
    mocks,
    expectedState,
    testCase,
    onSave,
  ]);

  const routers = graphSteps.filter((step) => step.type === "router");

  const currentCaseForTrace = useMemo<SimulationTestCase>(
    () => ({
      ...testCase,
      routerChoices,
    }),
    [testCase, routerChoices]
  );

  const pathPreview = useMemo(
    () =>
      buildTracePath({
        graphEdges,
        graphNodeLabels,
        graphSteps,
        selectedCase: currentCaseForTrace,
      }),
    [graphEdges, graphNodeLabels, graphSteps, currentCaseForTrace]
  );

  return (
    <div
      className="flex flex-col gap-4 bg-secondary/5 border rounded-lg p-3 font-sans mt-2"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Bar: Trigger Label + Run + Delete */}
      <div className="flex items-center justify-between border-b pb-2">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">
          {triggerLabel}
        </span>
        <div className="flex items-center gap-1.5">
          {onRunTestCase && (
            <Button
              variant="outline"
              size="sm"
              className="h-5 px-2 text-[10px] gap-1 font-medium text-primary hover:bg-primary/10 border-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                void onRunTestCase({
                  ...testCase,
                  name,
                  targetRouteId,
                  request: { ...testCase.request, body },
                  initialState,
                  routerChoices,
                  mocks,
                  expectedState,
                });
              }}
            >
              <Play className="w-3 h-3 text-primary" /> Run
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-destructive hover:bg-destructive/10"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Test Case</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this test case? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Test Case Name */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-mono text-muted-foreground">Test Case Name</Label>
        <Input
          className="h-7 text-xs bg-background font-medium"
          value={name}
          placeholder="Test Case Name"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Invocation Route */}
      {orderedRoutes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Route className="w-3 h-3 text-muted-foreground" /> Invocation Route
          </Label>
          <Select
            value={targetRouteId || "none"}
            onValueChange={(value) => setTargetRouteId(value === "none" ? undefined : value)}
          >
            <SelectTrigger className="h-7 text-xs bg-background">
              <SelectValue placeholder="Select route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No external route</SelectItem>
              {orderedRoutes.map((route) => (
                <SelectItem key={route.edgeId} value={route.edgeId}>
                  {route.method} {route.label} · {route.sourceNodeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Payload / Input Payload */}
      <JsonPayloadEditor
        title="Input Payload (from route)"
        value={body}
        onChange={setBody}
      />

      {/* Initial Agent State */}
      <JsonPayloadEditor
        title="Initial Agent State (auto-populated)"
        value={initialState}
        onChange={(val: JSONValue) => {
          if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            setInitialState(val as Record<string, JSONValue>);
          } else {
            setInitialState({});
          }
        }}
      />

      {/* Conditional Router Choices */}
      {routers.length > 0 && (
        <div className="flex flex-col gap-2 border rounded-lg p-3 bg-background/50">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> Conditional Router Choices
          </div>
          {routers.map((router) => (
            <div key={router.id} className="flex flex-col gap-1">
              <Label className="text-xs font-mono text-muted-foreground">
                {router.name || router.id}
              </Label>
              <Select
                value={routerChoices[router.id] || "auto"}
                onValueChange={(value) =>
                  setRouterChoices((prev) => ({
                    ...prev,
                    [router.id]: value === "auto" ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="h-7 text-xs bg-background">
                  <SelectValue placeholder="Evaluate conditions automatically" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Evaluate conditions automatically</SelectItem>
                  {(router.routerConfig?.branches || []).map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.label || branch.id}
                      {branch.isDefault ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Selected Graph Path */}
      <div className="flex flex-col gap-1.5 border rounded-lg p-3 bg-background/50">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Selected Graph Path / Trace Nodes
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {pathPreview.map((node, index) => (
            <React.Fragment key={`${node.id}-${index}`}>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                  index === 0 || index === pathPreview.length - 1
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {node.label}
              </span>
              {index < pathPreview.length - 1 && (
                <span className="text-muted-foreground text-xs">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Changing a router branch updates this path and trace node outputs.
        </div>
      </div>

      {/* Downstream Node Outputs (mockables format) */}
      {pathPreview.filter((node) => node.id !== "START" && node.id !== "END").length > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Manual Node Outputs
            </div>
            <div className="text-[10px] text-muted-foreground">
              Configure mock return output for each step during simulation.
            </div>
          </div>
          {pathPreview
            .filter((node) => node.id !== "START" && node.id !== "END")
            .map((node) => {
              const mock = mocks[node.id];
              return (
                <div key={node.id} className="flex flex-col gap-2 pt-3 border-t">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <span className="normal-case font-mono bg-background border px-1.5 py-0.5 rounded text-[9px] text-foreground">
                      {node.label}
                    </span>
                    <span className="px-1 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono border bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Step Mock Output
                    </span>
                  </h5>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-mono text-muted-foreground w-24">Status</Label>
                    <Input
                      type="number"
                      placeholder="200"
                      className="h-7 text-xs font-mono bg-background w-24"
                      value={mock?.status ?? 200}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : 200;
                        setMocks((prev) => ({
                          ...prev,
                          [node.id]: {
                            returnData: prev[node.id]?.returnData ?? {},
                            status: val,
                          },
                        }));
                      }}
                    />
                  </div>
                  <JsonPayloadEditor
                    title={`Output · ${node.label}`}
                    value={mock?.returnData ?? {}}
                    onChange={(returnData: JSONValue) => {
                      setMocks((prev) => ({
                        ...prev,
                        [node.id]: {
                          returnData,
                          status: prev[node.id]?.status ?? 200,
                        },
                      }));
                    }}
                  />
                </div>
              );
            })}
        </div>
      )}

      {/* Expected Final State */}
      <JsonPayloadEditor
        title="Expected Final State"
        value={expectedState}
        onChange={(val: JSONValue) => {
          if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            setExpectedState(val as Record<string, JSONValue>);
          } else {
            setExpectedState({});
          }
        }}
      />
    </div>
  );
};

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { Plus, Trash2, Route, GitBranch, Play, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { JsonPayloadEditor } from "../../../../Editors";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { generateId } from "../../../../shared";
import { api } from "@workspace/backend/_generated/api";
import type { Id } from "@workspace/backend/_generated/dataModel";
import type { LangGraphInputChannel, LangGraphStateChannel, LangGraphStepConfig, JSONValue } from "@/types/canvas";
import type { SimulationTestCase } from "@workspace/canvas";
import type { ConnectedRouteInfo } from "../../../LangGraphNode";

type Props = {
  graphNodeId: string;
  inputChannels: LangGraphInputChannel[];
  stateChannels: LangGraphStateChannel[];
  graphSteps: LangGraphStepConfig[];
  graphEdges: Array<{ source: string; sourceHandle?: string | null; target: string }>;
  graphNodeLabels: Record<string, string>;
  connectedRoutes: ConnectedRouteInfo[];
  onRunTestCase?: (testCase: SimulationTestCase) => void;
};

function channelDefault(channel: LangGraphStateChannel): JSONValue {
  if (channel.defaultValue !== undefined) return channel.defaultValue as JSONValue;
  if (channel.type === "messages" || channel.type === "array") return [];
  if (channel.type === "object" || channel.type === "json") return {};
  if (channel.type === "number") return 0;
  if (channel.type === "boolean") return false;
  return "";
}

export function StartNodeTestCasesInspector({ graphNodeId, inputChannels, stateChannels, graphSteps, graphEdges, graphNodeLabels, connectedRoutes, onRunTestCase }: Props) {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const testCases = useSimulationStore((state) => state.testCases);
  const addTestCase = useSimulationStore((state) => state.addTestCase);
  const updateTestCase = useSimulationStore((state) => state.updateTestCase);
  const deleteTestCase = useSimulationStore((state) => state.deleteTestCase);
  const upsertBackendTestCase = useMutation(api.canvas.upsertBackendTestCase);
  const removeBackendTestCase = useMutation(api.canvas.removeBackendTestCase);
  const graphTestCases = useMemo(() => testCases.filter((testCase) => testCase.targetNodeId === graphNodeId), [testCases, graphNodeId]);
  const [expandedCaseId, setExpandedCaseId] = useState<string>();
  const selectedCase = graphTestCases.find((testCase) => testCase.id === expandedCaseId);

  const defaultBody = useMemo(() => inputChannels.reduce<Record<string, JSONValue>>((body, channel) => {
    body[channel.key] = channel.type === "number" ? 0 : channel.type === "boolean" ? false : channel.type === "array" || channel.type === "messages" ? [] : channel.type === "object" || channel.type === "json" ? {} : "";
    return body;
  }, {}), [inputChannels]);
  const defaultState = useMemo(() => stateChannels.reduce<Record<string, JSONValue>>((state, channel) => {
    state[channel.key] = channelDefault(channel);
    return state;
  }, {}), [stateChannels]);

  const persist = (testCase: SimulationTestCase) => {
    updateTestCase(testCase.id, testCase);
    if (projectId) void upsertBackendTestCase({ projectId, testCaseId: testCase.id, data: testCase });
  };
  const updateSelected = (changes: Partial<SimulationTestCase>) => {
    if (selectedCase) persist({ ...selectedCase, ...changes });
  };
  const createTestCase = () => {
    const testCase: SimulationTestCase = {
      id: generateId(), name: `Graph test ${graphTestCases.length + 1}`, targetNodeId: graphNodeId,
      targetRouteId: connectedRoutes[0]?.edgeId,
      request: { headers: { "content-type": "application/json" }, params: {}, body: defaultBody },
      initialState: defaultState, routerChoices: {}, expectedStatus: 200, expectedBody: {}, mocks: {},
    };
    addTestCase(testCase); setExpandedCaseId(testCase.id);
    if (projectId) void upsertBackendTestCase({ projectId, testCaseId: testCase.id, data: testCase });
  };
  const removeSelected = () => {
    if (!selectedCase) return;
    deleteTestCase(selectedCase.id);
    if (projectId) void removeBackendTestCase({ projectId, testCaseId: selectedCase.id });
    setExpandedCaseId(undefined);
  };

  const routers = graphSteps.filter((step) => step.type === "router");
  const pathPreview = useMemo(() => {
    const path: Array<{ id: string; label: string }> = [];
    const visited = new Set<string>();
    let currentId: string | undefined = "START";
    let guard = 0;
    while (currentId && !visited.has(currentId) && guard++ < graphEdges.length + 5) {
      visited.add(currentId);
      path.push({ id: currentId, label: graphNodeLabels[currentId] || currentId });
      if (currentId === "END") break;
      const currentStep = graphSteps.find((step) => step.id === currentId);
      const outgoing = graphEdges.filter((edge) => edge.source === currentId);
      if (outgoing.length === 0) break;
      const branchId = currentStep?.type === "router" ? selectedCase?.routerChoices?.[currentId] : undefined;
      const selectedEdge = branchId ? outgoing.find((edge) => edge.sourceHandle === branchId) : undefined;
      currentId = (selectedEdge || outgoing[0])?.target;
    }
    return path;
  }, [graphEdges, graphNodeLabels, graphSteps, selectedCase]);

  return (
    <div className="border-t border-border/60 px-4 py-4 flex flex-col gap-3 shrink-0">
      <div className="flex items-center justify-between">
        <div><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graph Test Cases</div><div className="text-xs text-muted-foreground">Route, state, branches, and graph path</div></div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={createTestCase}><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      {graphTestCases.length > 0 && <>
        <div className="flex flex-col gap-1.5">{graphTestCases.map((testCase) => { const isExpanded = expandedCaseId === testCase.id; return <div key={testCase.id} className={`rounded-lg border ${isExpanded ? "border-primary/40 bg-primary/5" : "border-border bg-card/30"}`}><button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs" onClick={() => setExpandedCaseId(isExpanded ? undefined : testCase.id)} aria-expanded={isExpanded}><span className="text-muted-foreground">{isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</span><span className="flex-1 truncate font-medium">{testCase.name}</span><span className="text-[10px] text-muted-foreground">{testCase.targetRouteId ? "route selected" : "no route"}</span></button></div>; })}</div>
        {selectedCase && <div className="flex flex-col gap-3 rounded-lg border bg-card/50 p-3">
          <div className="flex items-end gap-2"><div className="flex-1 flex flex-col gap-1"><Label className="text-[10px] uppercase text-muted-foreground">Name</Label><Input className="h-7 text-xs" value={selectedCase.name} onChange={(event) => updateSelected({ name: event.target.value })} /></div>{onRunTestCase && <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onRunTestCase(selectedCase)}><Play className="w-3 h-3" /> Run</Button>}<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={removeSelected}><Trash2 className="w-3.5 h-3.5" /></Button></div>
          <div className="flex flex-col gap-1"><Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Route className="w-3 h-3" /> Invocation Route</Label><Select value={selectedCase.targetRouteId || "none"} onValueChange={(value) => updateSelected({ targetRouteId: value === "none" ? undefined : value })}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select route" /></SelectTrigger><SelectContent><SelectItem value="none">No external route</SelectItem>{connectedRoutes.map((route) => <SelectItem key={route.edgeId} value={route.edgeId}>{route.method} {route.label} · {route.sourceNodeLabel}</SelectItem>)}</SelectContent></Select></div>
          <JsonPayloadEditor title="Input Payload (from route)" value={selectedCase.request?.body} onChange={(body) => updateSelected({ request: { ...selectedCase.request, body } })} />
          <JsonPayloadEditor title="Initial Agent State (auto-populated)" value={selectedCase.initialState || defaultState} onChange={(initialState) => updateSelected({ initialState: initialState as Record<string, JSONValue> })} />
          {routers.length > 0 && <div className="flex flex-col gap-2 border rounded-lg p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><GitBranch className="w-3 h-3" /> Conditional Router Choices</div>{routers.map((router) => <div key={router.id} className="flex flex-col gap-1"><Label className="text-xs">{router.name || router.id}</Label><Select value={selectedCase.routerChoices?.[router.id] || "auto"} onValueChange={(value) => updateSelected({ routerChoices: { ...(selectedCase.routerChoices || {}), [router.id]: value === "auto" ? "" : value } })}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Evaluate conditions automatically" /></SelectTrigger><SelectContent><SelectItem value="auto">Evaluate conditions automatically</SelectItem>{(router.routerConfig?.branches || []).map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.label || branch.id}{branch.isDefault ? " (default)" : ""}</SelectItem>)}</SelectContent></Select></div>)}</div>}
          <div className="flex flex-col gap-1 border rounded-lg p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selected Graph Path / Trace Nodes</div><div className="flex flex-wrap items-center gap-1">{pathPreview.map((node, index) => <React.Fragment key={`${node.id}-${index}`}><span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${index === 0 || index === pathPreview.length - 1 ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background"}`}>{node.label}</span>{index < pathPreview.length - 1 && <span className="text-muted-foreground text-xs">→</span>}</React.Fragment>)}</div><div className="text-[10px] text-muted-foreground">Changing a router branch updates this path and the nodes emitted by the execution trace.</div></div>
          <div className="flex flex-col gap-3 border rounded-lg p-3"><div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manual Node Outputs</div><div className="text-[10px] text-muted-foreground">Nodes do not execute during simulation. Configure the output each node should return.</div></div>{pathPreview.filter((node) => node.id !== "START" && node.id !== "END").map((node) => { const mock = selectedCase.mocks?.[node.id]; return <div key={`mock-${node.id}`} className="flex flex-col gap-2 border-t border-border/60 pt-3"><div className="flex items-center justify-between"><Label className="text-xs font-semibold">{node.label}</Label><Input type="number" className="h-7 w-20 text-xs" value={mock?.status ?? 200} onChange={(event) => updateSelected({ mocks: { ...(selectedCase.mocks || {}), [node.id]: { returnData: mock?.returnData ?? {}, status: event.target.value ? Number(event.target.value) : 200 } } })} /></div><JsonPayloadEditor title={`Output · ${node.label}`} value={mock?.returnData ?? {}} onChange={(returnData) => updateSelected({ mocks: { ...(selectedCase.mocks || {}), [node.id]: { returnData, status: mock?.status ?? 200 } } })} /></div>; })}</div>
          <JsonPayloadEditor title="Expected Final State" value={selectedCase.expectedState || defaultState} onChange={(expectedState) => updateSelected({ expectedState: expectedState as Record<string, JSONValue> })} />
        </div>}
      </>}
      {graphTestCases.length === 0 && <div className="text-xs text-muted-foreground border border-dashed rounded-lg p-3">Add a test case to select an invocation route and configure the graph state.</div>}
    </div>
  );
}

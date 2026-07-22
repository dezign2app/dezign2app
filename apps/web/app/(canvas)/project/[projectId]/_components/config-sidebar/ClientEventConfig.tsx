import React, { useState, useEffect } from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { generateId, endpointInputParams, getInitialBody } from "../backend-nodes/graph-nodes/shared";
import { JsonPayloadEditor } from "../backend-nodes/graph-nodes/Editors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Parameter, JSONValue, Endpoint, BackendNode, UIEventItem } from "@/types/canvas";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Trash, Plus } from "lucide-react";
import { WEB_CLIENT_EVENTS } from "@workspace/canvas";

const EVENT_OPTIONS = [...WEB_CLIENT_EVENTS];

interface ClientEventConfigProps {
  id: string; // The event ID
  nodeId: string;
}

export const ClientEventConfig = ({ id, nodeId }: ClientEventConfigProps) => {
  const paramsHook = useParams();
  const projectId = paramsHook.projectId as Id<"projects">;
  
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const edges = useBackendCanvasStore((s) => s.edges);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  
  const testCases = useSimulationStore((s) => s.testCases);
  const addTestCase = useSimulationStore((s) => s.addTestCase);
  const updateTestCase = useSimulationStore((s) => s.updateTestCase);
  const deleteTestCase = useSimulationStore((s) => s.deleteTestCase);
  const upsertBackendTestCase = useMutation(api.canvas.upsertBackendTestCase);

  // Find the event item
  const parentNode = nodes.find((n) => n.id === nodeId);
  const currentEvents = parentNode?.data?.events || [];
  const item: UIEventItem | undefined = currentEvents.find((e) => e.id === id);

  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  
  const initialEvent = item?.event || "click";
  const isStandard = EVENT_OPTIONS.some(opt => opt === initialEvent);

  const [eventName, setEventName] = useState(item?.name || "");
  const [eventType, setEventType] = useState(isStandard ? initialEvent : (initialEvent ? "other" : "click"));
  const [customEvent, setCustomEvent] = useState(isStandard ? "" : initialEvent);
  const [eventSchema, setEventSchema] = useState(item?.schema || "");

  useEffect(() => {
    if (item) {
      setEventName(item.name || "");
      const evt = item.event || "click";
      const isStd = EVENT_OPTIONS.some(opt => opt === evt);
      setEventType(isStd ? evt : (evt ? "other" : "click"));
      setCustomEvent(isStd ? "" : evt);
      setEventSchema(item.schema || "");
    }
  }, [item]);

  const handleUpdateEvent = (name: string, finalEvent: string, schema: string) => {
    if (!parentNode) return;
    const currentNodeEvents = parentNode.data.events || [];
    const newEvents: UIEventItem[] = currentNodeEvents.map(e => e.id === id ? { ...e, name, event: finalEvent, schema } : e);
    updateNode(nodeId, { data: { ...parentNode.data, events: newEvents } });
  };

  // Find linked endpoint
  const getLinkedEndpoint = () => {
    const edge = edges.find((e) => e.source === nodeId && e.sourceHandle === `events-${id}`);
    if (!edge || !edge.targetHandle) return null;
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!targetNode) return null;
    const parts = edge.targetHandle.split("-in-");
    const endpointId = parts[parts.length - 1];
    if (!endpointId) return null;

    let endpoint: Endpoint | undefined = endpoints.find((ep) => ep.nodeId === targetNode.id && ep.id === endpointId);
    if (!endpoint) endpoint = targetNode.data?.endpoints?.find((ep: Endpoint) => ep.id === endpointId);
    if (!endpoint && targetNode.data?.routeGroups) {
      for (const group of targetNode.data.routeGroups) {
        endpoint = group.endpoints?.find((ep: Endpoint) => ep.id === endpointId);
        if (endpoint) break;
      }
    }
    if (!endpoint) return null;
    return { targetNode, endpoint };
  };

  const link = getLinkedEndpoint();
  const endpoint = link?.endpoint;

  const inferSchemaFromEndpoint = () => {
    if (!endpoint) return;
    const inferred: Record<string, string> = {};

    if (endpoint.pathParams) endpoint.pathParams.forEach(p => { if (p.name) inferred[p.name] = p.type || "string"; });
    if (endpoint.queryParams) endpoint.queryParams.forEach(p => { if (p.name) inferred[p.name] = p.type || "string"; });
    if (endpoint.headers) endpoint.headers.forEach(h => { if (h.name) inferred[h.name] = h.type || "string"; });
    
    if (endpoint.requestBody?.fields) {
      endpoint.requestBody.fields.forEach(f => { if (f.name) inferred[f.name] = f.type || "string"; });
    } else if (endpoint.requestBody?.rawJson) {
       try {
         const parsed = JSON.parse(endpoint.requestBody.rawJson);
         Object.assign(inferred, parsed);
       } catch {}
    }

    const strVal = JSON.stringify(inferred, null, 2);
    setEventSchema(strVal);
    handleUpdateEvent(eventName, eventType === "other" ? customEvent : eventType, strVal);
    toast.success("Inferred schema from connected endpoint!");
  };

  const triggerTestCases = testCases.filter(tc => tc.targetEventId === id);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const [headers, setHeaders] = useState<Parameter[]>([]);
  const [params, setParams] = useState<Parameter[]>([]);
  const [body, setBody] = useState<JSONValue | undefined>(undefined);
  
  const [expectedStatus, setExpectedStatus] = useState<number | undefined>(undefined);
  const [expectedBody, setExpectedBody] = useState<JSONValue | undefined>(undefined);

  useEffect(() => {
    if (triggerTestCases[0]?.id && !activeCaseId) {
      setActiveCaseId(triggerTestCases[0].id);
    }
  }, [triggerTestCases[0], activeCaseId]);

  useEffect(() => {
    if (!endpoint) return;
    
    if (activeCaseId) {
      const testCase = testCases.find(tc => tc.id === activeCaseId);
      if (testCase) {
        setHeaders(endpoint.headers?.map((h) => ({ ...h, key: h.key ?? h.name, value: testCase.request?.headers?.[h.name] ?? h.defaultValue ?? "" })) || []);
        setParams(endpointInputParams(endpoint).map(param => ({ ...param, value: testCase.request?.params?.[param.key || param.name] ?? param.value ?? "" })));
        setBody(testCase.request?.body === undefined ? getInitialBody(endpoint) : testCase.request.body);
        setExpectedStatus(testCase.expectedStatus);
        setExpectedBody(testCase.expectedBody);
        return;
      }
    }

    setHeaders(endpoint.headers?.map((h) => ({ ...h, key: h.key ?? h.name, value: h.value ?? h.defaultValue ?? "" })) || []);
    setParams(endpointInputParams(endpoint));
    setBody(getInitialBody(endpoint));
    setExpectedStatus(undefined);
    setExpectedBody(undefined);
  }, [activeCaseId, endpoint, testCases]);

  if (!item) return null;

  const handleSaveTestCase = () => {
    if (!endpoint) return;
    
    const parsedBody = body;
    const queryParams: Record<string, string> = {};
    params.forEach(p => { if (p.key) queryParams[p.key] = p.value || `[${p.type || "string"}]`; });
    const reqHeaders: Record<string, string> = {};
    headers.forEach(h => { if (h.key) reqHeaders[h.key.toLowerCase()] = h.value || ""; });
    
    if (activeCaseId) {
      const existingTestCase = testCases.find(tc => tc.id === activeCaseId);
      if (existingTestCase) {
        const updatedCase = {
          ...existingTestCase,
          request: { headers: reqHeaders, params: queryParams, body: parsedBody },
          expectedStatus,
          expectedBody
        };
        updateTestCase(updatedCase.id, { request: updatedCase.request, expectedStatus: updatedCase.expectedStatus, expectedBody: updatedCase.expectedBody });
        if (projectId) {
          upsertBackendTestCase({ projectId, testCaseId: updatedCase.id, data: updatedCase });
        }
        toast.success("Test case updated!");
        return;
      }
    }

    const caseName = prompt("Enter test case name:", `Test for ${item.name || item.event}`);
    if (!caseName) return;

    const newCase: import("@/types/canvas").SimulationTestCase = {
      id: generateId(),
      name: caseName,
      targetNodeId: nodeId,
      targetEventId: id,
      request: { headers: reqHeaders, params: queryParams, body: parsedBody },
      expectedStatus,
      expectedBody
    };
    
    addTestCase(newCase);
    if (projectId) {
      upsertBackendTestCase({ projectId, testCaseId: newCase.id, data: newCase });
    }
    setActiveCaseId(newCase.id);
    toast.success("Test case saved!");
  };

  const handleDelete = (tcId: string) => {
    deleteTestCase(tcId);
    if (activeCaseId === tcId) {
      setActiveCaseId(null);
    }
    toast.success("Test case deleted");
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Event Settings</h3>
        <div className="flex flex-col gap-2 p-3 bg-secondary/10 border rounded-lg">
          <div className="grid gap-1">
            <Label className="text-xs font-mono text-muted-foreground">Name</Label>
            <Input 
              className="h-8 text-xs bg-background" 
              value={eventName} 
              onChange={e => setEventName(e.target.value)} 
              onBlur={() => handleUpdateEvent(eventName, eventType === "other" ? customEvent : eventType, eventSchema)} 
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs font-mono text-muted-foreground">Type</Label>
            <div className="flex flex-col gap-1">
              <Select 
                 value={eventType} 
                 onValueChange={(v) => {
                   setEventType(v);
                   handleUpdateEvent(eventName, v === "other" ? customEvent : v, eventSchema);
                 }}
              >
                <SelectTrigger className="h-8 text-xs w-full bg-background focus:ring-1 focus:ring-ring focus:ring-offset-0">
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_OPTIONS.map(opt => (
                     <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {eventType === "other" && (
                 <Input 
                    value={customEvent}
                    onChange={(e) => setCustomEvent(e.target.value)}
                    onBlur={() => handleUpdateEvent(eventName, customEvent, eventSchema)}
                    placeholder="Custom event"
                    className="h-8 text-xs w-full"
                 />
              )}
            </div>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
               <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Input Schema</Label>
               {endpoint && (
                 <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2 shadow-sm" onClick={inferSchemaFromEndpoint}>
                   Fetch from Endpoint
                 </Button>
               )}
            </div>
            <JsonPayloadEditor
              title="Schema"
              value={(() => {
                if (!eventSchema) return undefined;
                try {
                  return JSON.parse(eventSchema);
                } catch {
                  return undefined;
                }
              })()}
              onChange={(val) => {
                const strVal = JSON.stringify(val);
                setEventSchema(strVal);
                handleUpdateEvent(eventName, eventType === "other" ? customEvent : eventType, strVal);
              }}
            />
          </div>
        </div>

        {endpoint ? (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            Triggers 
            <span className="font-mono bg-secondary/30 border px-1 py-0.5 rounded text-[10px]">
              {endpoint.type || "GET"} {endpoint.name}
            </span>
          </p>
        ) : (
          <p className="text-xs mt-1 text-amber-500">
            No endpoint connected to this event.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
          {activeCaseId ? `Editing Test Case: ${triggerTestCases.find(t => t.id === activeCaseId)?.name || 'Default'}` : "New Test Case"}
        </h4>

        {endpoint && (
          <div className="flex flex-col gap-4 bg-secondary/5 border rounded-lg p-3">
            {/* Input params */}
            {(params.length > 0 || headers.length > 0) && (
              <div className="flex flex-col gap-3">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Request Parameters</h5>
                {params.map((param, idx) => (
                  <div key={`param-${idx}`} className="flex items-center gap-2">
                    <Label className="text-xs font-mono text-muted-foreground w-24 truncate">{param.key || param.name}</Label>
                    <Input 
                      className="h-7 text-xs bg-background flex-1" 
                      value={param.value || ""} 
                      placeholder={`[${param.type || "string"}]`}
                      onChange={(e) => {
                        const newParams = [...params];
                        if (newParams[idx]) newParams[idx].value = e.target.value;
                        setParams(newParams);
                      }}
                    />
                  </div>
                ))}
                {headers.map((header, idx) => (
                  <div key={`header-${idx}`} className="flex items-center gap-2">
                    <Label className="text-xs font-mono text-muted-foreground w-24 truncate">H: {header.key || header.name}</Label>
                    <Input 
                      className="h-7 text-xs bg-background flex-1" 
                      value={header.value || ""} 
                      placeholder={header.defaultValue || ""}
                      onChange={(e) => {
                        const newHeaders = [...headers];
                        if (newHeaders[idx]) newHeaders[idx].value = e.target.value;
                        setHeaders(newHeaders);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <JsonPayloadEditor
                key={`mock-body-${activeCaseId || 'none'}-${endpoint?.id}`}
                title="Request Body"
                schema={endpoint.requestBody}
                value={body}
                onChange={(val) => setBody(val)}
              />
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t">
              <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Expected Outputs</h5>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-mono text-muted-foreground w-24">Status</Label>
                <Input
                  type="number"
                  className="h-7 text-xs font-mono bg-background w-24"
                  placeholder="e.g. 200"
                  value={expectedStatus || ""}
                  onChange={(e) => setExpectedStatus(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <JsonPayloadEditor
                key={`expected-body-${activeCaseId || 'none'}-${endpoint?.id}`}
                title="Expected Body"
                schema={endpoint.responseBody}
                value={expectedBody}
                onChange={(val) => setExpectedBody(val)}
              />
            </div>

            <Button size="sm" variant="secondary" className="w-full mt-2" onClick={handleSaveTestCase}>
              {activeCaseId ? "Update Test Case" : "Save as New Test Case"}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Test Cases for this Event</h4>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setActiveCaseId(null)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </Button>
          </div>
          {triggerTestCases.length > 0 ? (
            <div className="grid gap-2">
              {triggerTestCases.map(tc => (
                <div 
                  key={tc.id} 
                  className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer text-xs ${activeCaseId === tc.id ? "bg-primary/10 border-primary/50" : "bg-secondary/10 hover:bg-secondary/20"}`}
                  onClick={() => setActiveCaseId(tc.id)}
                >
                  <span>{tc.name}</span>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-destructive hover:bg-destructive/10" onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this test case?")) handleDelete(tc.id);
                  }}>
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground p-4 text-center border rounded-lg border-dashed">
              No test cases saved for this event yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

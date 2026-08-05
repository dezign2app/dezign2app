import React, { useState, useEffect } from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { JsonPayloadEditor } from "../backend-nodes/graph-nodes/Editors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@workspace/ui/components/accordion";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import {
  Parameter,
  BackendNode,
  UIEventItem,
} from "@/types/canvas";
import { toast } from "sonner";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Endpoint, WEB_CLIENT_EVENTS } from "@workspace/canvas";
import { Server, Route, Link2, CheckCircle2, Info } from "lucide-react";
import { useParams } from "next/navigation";

const EVENT_OPTIONS = [...WEB_CLIENT_EVENTS];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  PATCH: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  WS: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  SSE: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  RTC: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
};

function getMethodColor(method: string) {
  return (
    METHOD_COLORS[method?.toUpperCase()] ||
    "bg-secondary/40 text-secondary-foreground border-border"
  );
}

/** Collect all endpoints from a node */
function collectEndpoints(
  node: BackendNode,
  storeEndpoints: (Endpoint & { nodeId: string })[],
): Endpoint[] {
  const results: Endpoint[] = [];

  const persisted = storeEndpoints.filter((ep) => ep.nodeId === node.id);
  results.push(...persisted);

  if (node.data.endpoints) {
    for (const ep of node.data.endpoints) {
      if (!results.find((r) => r.id === ep.id)) results.push(ep);
    }
  }

  if (node.data.routeGroups) {
    for (const group of node.data.routeGroups) {
      for (const ep of group.endpoints || []) {
        if (!results.find((r) => r.id === ep.id)) results.push(ep);
      }
    }
  }

  return results;
}

const SERVER_NODE_TYPES = [
  "service",
  "gateway",
  "serverless",
  "langgraph",
  "worker",
  "external",
];

interface WebClientEventConfigProps {
  id: string; // The event ID
  nodeId: string;
}

export const WebClientEventConfig = ({ id, nodeId }: WebClientEventConfigProps) => {
  const paramsHook = useParams();
  const projectId = paramsHook.projectId as Id<"projects">;

  const nodes = useBackendCanvasStore((s) => s.nodes);
  const edges = useBackendCanvasStore((s) => s.edges);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const onConnect = useBackendCanvasStore((s) => s.onConnect);
  const deleteEdge = useBackendCanvasStore((s) => s.deleteEdge);

  // Find the parent WebClient node and the event item
  const parentNode = nodes.find((n) => n.id === nodeId);
  const currentEvents = parentNode?.data?.events || [];
  const item: UIEventItem | undefined = currentEvents.find((e) => e.id === id);

  const initialEvent = item?.event || "click";
  const isStandard = EVENT_OPTIONS.some((opt) => opt === initialEvent);

  const [eventName, setEventName] = useState(item?.name || "");
  const [eventType, setEventType] = useState(
    isStandard ? initialEvent : initialEvent ? "other" : "click",
  );
  const [customEvent, setCustomEvent] = useState(
    isStandard ? "" : initialEvent,
  );
  const [eventSchema, setEventSchema] = useState(item?.schema || "");

  useEffect(() => {
    if (item) {
      setEventName(item.name || "");
      const evt = item.event || "click";
      const isStd = EVENT_OPTIONS.some((opt) => opt === evt);
      setEventType(isStd ? evt : evt ? "other" : "click");
      setCustomEvent(isStd ? "" : evt);
      setEventSchema(item.schema || "");
    }
  }, [item]);

  const handleUpdateEvent = (
    name: string,
    finalEvent: string,
    schema: string,
  ) => {
    if (!parentNode) return;
    const currentNodeEvents = parentNode.data.events || [];
    const newEvents: UIEventItem[] = currentNodeEvents.map((e) =>
      e.id === id ? { ...e, name, event: finalEvent, schema } : e,
    );
    updateNode(nodeId, { data: { ...parentNode.data, events: newEvents } });
  };

  // Find linked endpoint via existing edge
  const existingEdge = edges.find(
    (e) => e.source === nodeId && e.sourceHandle === `events-${id}`,
  );

  const getLinkedEndpoint = () => {
    if (!existingEdge || !existingEdge.targetHandle) return null;
    const targetNode = nodes.find((n) => n.id === existingEdge.target);
    if (!targetNode) return null;
    const parts = existingEdge.targetHandle.split("-in-");
    const endpointId = parts[parts.length - 1];
    if (!endpointId) return null;

    let endpoint: Endpoint | undefined = endpoints.find(
      (ep) => ep.nodeId === targetNode.id && ep.id === endpointId,
    );
    if (!endpoint)
      endpoint = targetNode.data?.endpoints?.find(
        (ep: Endpoint) => ep.id === endpointId,
      );
    if (!endpoint && targetNode.data?.routeGroups) {
      for (const group of targetNode.data.routeGroups) {
        endpoint = group.endpoints?.find(
          (ep: Endpoint) => ep.id === endpointId,
        );
        if (endpoint) break;
      }
    }
    if (!endpoint) return null;
    return { targetNode, endpoint };
  };

  const link = getLinkedEndpoint();
  const linkedTargetNode = link?.targetNode;
  const endpoint = link?.endpoint;

  // All service nodes available on the canvas
  const serviceNodes = nodes.filter(
    (n) => n.id !== nodeId && SERVER_NODE_TYPES.includes(n.type),
  );

  const currentServiceId = linkedTargetNode?.id || "";
  const currentEndpointId = endpoint?.id || "";

  const availableEndpoints = linkedTargetNode
    ? collectEndpoints(linkedTargetNode, endpoints)
    : [];

  const handleServiceChange = (serviceId: string) => {
    // Remove existing edge for this event
    if (existingEdge) {
      deleteEdge(existingEdge.id);
    }
    if (serviceId === "none" || !serviceId) return;

    // Target service selected; user can pick endpoint next
    const targetService = serviceNodes.find((n) => n.id === serviceId);
    if (!targetService) return;

    const endpointsList = collectEndpoints(targetService, endpoints);
    if (endpointsList.length > 0 && endpointsList[0]) {
      const targetEp = endpointsList[0];
      onConnect({
        source: nodeId,
        target: serviceId,
        sourceHandle: `events-${id}`,
        targetHandle: `endpoint-in-${targetEp.id}`,
      });
    }
  };

  const handleEndpointChange = (endpointId: string) => {
    if (!currentServiceId) return;

    // Remove old edge
    if (existingEdge) {
      deleteEdge(existingEdge.id);
    }

    if (endpointId === "none" || !endpointId) return;

    // Connect new edge
    onConnect({
      source: nodeId,
      target: currentServiceId,
      sourceHandle: `events-${id}`,
      targetHandle: `endpoint-in-${endpointId}`,
    });
  };

  useEffect(() => {
    if (!endpoint) return;
    const inferred: Record<string, string> = {};

    if (endpoint.pathParams)
      endpoint.pathParams.forEach((p) => {
        if (p.name) inferred[p.name] = p.type || "string";
      });
    if (endpoint.queryParams)
      endpoint.queryParams.forEach((p) => {
        if (p.name) inferred[p.name] = p.type || "string";
      });
    if (endpoint.headers)
      endpoint.headers.forEach((h) => {
        if (h.name) inferred[h.name] = h.type || "string";
      });

    if (endpoint.requestBody?.rawJson) {
      try {
        const parsed = JSON.parse(endpoint.requestBody.rawJson);
        Object.assign(inferred, parsed);
      } catch {}
    }

    const strVal = JSON.stringify(inferred, null, 2);
    setEventSchema(strVal);
    handleUpdateEvent(
      eventName,
      eventType === "other" ? customEvent : eventType,
      strVal,
    );
  }, [endpoint?.id]);

  if (!item) return null;

  return (
    <div className="flex flex-col gap-5 font-sans">
      <Accordion
        type="multiple"
        defaultValue={["connection", "settings"]}
        className="w-full flex flex-col gap-3"
      >
        {/* ── 1. TARGET SERVICE & ENDPOINT SELECTION ── */}
        <AccordionItem
          value="connection"
          className="border rounded-xl overflow-hidden bg-card"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/20 transition-colors [&>svg]:shrink-0">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-primary" />
              <span className="text-xs font-semibold">
                Target Service & Endpoint
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 pt-2">
            <div className="flex flex-col gap-4">
              {/* Select Service */}
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Server size={10} />
                  Target Service
                </Label>
                <Select
                  value={currentServiceId || "none"}
                  onValueChange={handleServiceChange}
                >
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Choose target service…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="none"
                      className="text-xs text-muted-foreground"
                    >
                      — None (Unconnected) —
                    </SelectItem>
                    {serviceNodes.map((sn) => (
                      <SelectItem key={sn.id} value={sn.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            {sn.type}
                          </span>
                          <span className="font-medium">
                            {sn.data.label || "Untitled Service"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {serviceNodes.length === 0 && (
                  <p className="text-[11px] text-amber-500 flex items-center gap-1.5 mt-1">
                    <Info size={11} className="shrink-0" />
                    No service nodes on canvas.
                  </p>
                )}
              </div>

              {/* Select Endpoint */}
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Route size={10} />
                  Target Endpoint
                </Label>
                <Select
                  value={currentEndpointId || "none"}
                  onValueChange={handleEndpointChange}
                  disabled={!linkedTargetNode}
                >
                  <SelectTrigger className="h-9 text-xs bg-background disabled:opacity-50">
                    <SelectValue
                      placeholder={
                        linkedTargetNode
                          ? availableEndpoints.length > 0
                            ? "Choose target endpoint…"
                            : "No endpoints defined on this service"
                          : "Select a service first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="none"
                      className="text-xs text-muted-foreground"
                    >
                      — None —
                    </SelectItem>
                    {availableEndpoints.map((ep) => (
                      <SelectItem key={ep.id} value={ep.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getMethodColor(ep.type || "GET")}`}
                          >
                            {ep.type || "GET"}
                          </span>
                          <span className="font-mono">{ep.name || ep.id}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Connection Badge */}
              {linkedTargetNode && endpoint && (
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Connected Endpoint
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-[10px] gap-1 px-2 py-0.5 font-medium"
                    >
                      <Server size={9} />
                      {linkedTargetNode.data.label}
                    </Badge>
                    <span className="text-muted-foreground text-xs">→</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 px-2 py-0.5 border font-mono ${getMethodColor(endpoint.type || "GET")}`}
                    >
                      <span className="font-bold not-italic">
                        {endpoint.type || "GET"}
                      </span>
                      {endpoint.name}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── 2. EVENT SETTINGS ── */}
        <AccordionItem
          value="settings"
          className="border rounded-xl overflow-hidden bg-card"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/20 transition-colors [&>svg]:shrink-0">
            <span className="text-xs font-semibold">Event Properties & Schema</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 p-3 bg-secondary/10 border rounded-lg">
                <div className="grid gap-1">
                  <Label className="text-xs font-mono text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    className="h-8 text-xs bg-background"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    onBlur={() =>
                      handleUpdateEvent(
                        eventName,
                        eventType === "other" ? customEvent : eventType,
                        eventSchema,
                      )
                    }
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-xs font-mono text-muted-foreground">
                    Type
                  </Label>
                  <div className="flex flex-col gap-1">
                    <Select
                      value={eventType}
                      onValueChange={(v) => {
                        setEventType(v);
                        handleUpdateEvent(
                          eventName,
                          v === "other" ? customEvent : v,
                          eventSchema,
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs w-full bg-background focus:ring-1 focus:ring-ring focus:ring-offset-0">
                        <SelectValue placeholder="Event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {eventType === "other" && (
                      <Input
                        value={customEvent}
                        onChange={(e) => setCustomEvent(e.target.value)}
                        onBlur={() =>
                          handleUpdateEvent(
                            eventName,
                            customEvent,
                            eventSchema,
                          )
                        }
                        placeholder="Custom event"
                        className="h-8 text-xs w-full"
                      />
                    )}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Input Schema
                    </Label>
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
                      handleUpdateEvent(
                        eventName,
                        eventType === "other" ? customEvent : eventType,
                        strVal,
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

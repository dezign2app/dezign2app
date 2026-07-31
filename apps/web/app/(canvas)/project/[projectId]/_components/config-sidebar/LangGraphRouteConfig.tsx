import React, { useState, useEffect } from "react";
import {
  Network, Plug, Sparkles, Layers, Check, RefreshCw, Plus, Trash2, ArrowRight, Zap
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import type { LangGraphStateChannel } from "@/types/canvas";
import { BusinessLogicBlock } from "@/app/(canvas)/project/[projectId]/_components/shared/BusinessLogicBlock";
import type { LogicMode } from "@/app/(canvas)/project/[projectId]/_components/shared/BusinessLogicBlock";

interface LangGraphRouteConfigProps {
  id: string;
  nodeId: string;
}

export const LangGraphRouteConfig: React.FC<LangGraphRouteConfigProps> = ({ id, nodeId }) => {
  const edges = useBackendCanvasStore((s) => s.edges);
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const events = useBackendCanvasStore((s) => s.events);
  const updateEdge = useBackendCanvasStore((s) => s.updateEdge);

  const targetEdge = edges.find((e) => e.id === id);
  const targetNode = nodes.find((n) => n.id === nodeId);
  const sourceNode = targetEdge ? nodes.find((n) => n.id === targetEdge.source) : null;

  // Resolve caller details
  let routeLabel = sourceNode?.data?.label || "Connected Route";
  let method = "POST";
  let kind: "endpoint" | "event" | "task" = "task";

  if (targetEdge?.sourceHandle?.startsWith("endpoint-out-")) {
    kind = "endpoint";
    const endpointId = targetEdge.sourceHandle.replace("endpoint-out-", "");
    const ep = endpoints.find((e) => e.id === endpointId);
    if (ep) {
      routeLabel = ep.name || ep.id;
      method = ep.type || "POST";
    }
  } else if (targetEdge?.sourceHandle?.startsWith("consumedEvents-out-")) {
    kind = "event";
    const eventId = targetEdge.sourceHandle.replace("consumedEvents-out-", "");
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      routeLabel = ev.name || eventId;
      method = "EVENT";
    }
  }

  const stateChannels: LangGraphStateChannel[] = targetNode?.data?.stateChannels || [
    { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
  ];

  const existingMapping: Record<string, string> = targetEdge?.data?.payloadMapping || {};
  const [mapping, setMapping] = useState<Record<string, string>>(existingMapping);
  const [preInvokeMode, setPreInvokeMode] = useState<LogicMode>(targetEdge?.data?.preInvokeLogicMode || "natural_language");
  const [preInvokePrompt, setPreInvokePrompt] = useState<string>(targetEdge?.data?.preInvokePrompt || "");
  const [preInvokeCode, setPreInvokeCode] = useState<string>(targetEdge?.data?.preInvokeCode || "");
  
  // Output & Response Config State
  const [responseExecutionMode, setResponseExecutionMode] = useState<"sync" | "stream" | "async_ack">(targetEdge?.data?.responseExecutionMode || "sync");
  const [responseOutputMode, setResponseOutputMode] = useState<"full" | "selected">(targetEdge?.data?.responseOutputMode || "full");
  const [responseFields, setResponseFields] = useState<string[]>(targetEdge?.data?.responseFields || []);
  const [postInvokeMode, setPostInvokeMode] = useState<LogicMode>(targetEdge?.data?.postInvokeLogicMode || "natural_language");
  const [postInvokePrompt, setPostInvokePrompt] = useState<string>(targetEdge?.data?.postInvokePrompt || "");
  const [postInvokeCode, setPostInvokeCode] = useState<string>(targetEdge?.data?.postInvokeCode || "");

  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    setMapping(targetEdge?.data?.payloadMapping || {});
    setPreInvokeMode(targetEdge?.data?.preInvokeLogicMode || "natural_language");
    setPreInvokePrompt(targetEdge?.data?.preInvokePrompt || "");
    setPreInvokeCode(targetEdge?.data?.preInvokeCode || "");
    setResponseExecutionMode(targetEdge?.data?.responseExecutionMode || "sync");
    setResponseOutputMode(targetEdge?.data?.responseOutputMode || "full");
    setResponseFields(targetEdge?.data?.responseFields || []);
    setPostInvokeMode(targetEdge?.data?.postInvokeLogicMode || "natural_language");
    setPostInvokePrompt(targetEdge?.data?.postInvokePrompt || "");
    setPostInvokeCode(targetEdge?.data?.postInvokeCode || "");
  }, [
    id,
    targetEdge?.data?.payloadMapping,
    targetEdge?.data?.preInvokeLogicMode,
    targetEdge?.data?.preInvokePrompt,
    targetEdge?.data?.preInvokeCode,
    targetEdge?.data?.responseExecutionMode,
    targetEdge?.data?.responseOutputMode,
    targetEdge?.data?.responseFields,
    targetEdge?.data?.postInvokeLogicMode,
    targetEdge?.data?.postInvokePrompt,
    targetEdge?.data?.postInvokeCode,
  ]);

  // Autosave Effect
  useEffect(() => {
    if (!targetEdge) return;
    
    const finalMapping: Record<string, string> = { ...mapping };
    customFields.forEach((cf) => {
      if (cf.key.trim()) {
        finalMapping[cf.key.trim()] = cf.value.trim();
      }
    });

    const currentMapping = targetEdge.data?.payloadMapping || {};
    const isDifferent = 
      JSON.stringify(currentMapping) !== JSON.stringify(finalMapping) ||
      targetEdge.data?.preInvokeLogicMode !== preInvokeMode ||
      (targetEdge.data?.preInvokePrompt || "") !== preInvokePrompt.trim() ||
      (targetEdge.data?.preInvokeCode || "") !== preInvokeCode.trim() ||
      (targetEdge.data?.responseExecutionMode || "sync") !== responseExecutionMode ||
      (targetEdge.data?.responseOutputMode || "full") !== responseOutputMode ||
      JSON.stringify(targetEdge.data?.responseFields || []) !== JSON.stringify(responseFields) ||
      targetEdge.data?.postInvokeLogicMode !== postInvokeMode ||
      (targetEdge.data?.postInvokePrompt || "") !== postInvokePrompt.trim() ||
      (targetEdge.data?.postInvokeCode || "") !== postInvokeCode.trim();

    if (isDifferent) {
      const timeout = setTimeout(() => {
        updateEdge(targetEdge.id, {
          data: {
            ...targetEdge.data,
            payloadMapping: finalMapping,
            preInvokeLogicMode: preInvokeMode,
            preInvokePrompt: preInvokePrompt.trim(),
            preInvokeCode: preInvokeCode.trim(),
            responseExecutionMode,
            responseOutputMode,
            responseFields,
            postInvokeLogicMode: postInvokeMode,
            postInvokePrompt: postInvokePrompt.trim(),
            postInvokeCode: postInvokeCode.trim(),
          },
        });
      }, 500); // Debounce saves
      return () => clearTimeout(timeout);
    }
  }, [
    mapping,
    customFields,
    preInvokeMode,
    preInvokePrompt,
    preInvokeCode,
    responseExecutionMode,
    responseOutputMode,
    responseFields,
    postInvokeMode,
    postInvokePrompt,
    postInvokeCode,
    targetEdge,
  ]);

  const handleAutoMap = () => {
    const autoMapped: Record<string, string> = {};
    stateChannels.forEach((ch) => {
      if (ch.key === "messages") {
        autoMapped["messages"] = "body.message";
      } else {
        autoMapped[ch.key] = `body.${ch.key}`;
      }
    });
    setMapping(autoMapped);
  };

  const handleMappingChange = (stateKey: string, sourcePath: string) => {
    setMapping((prev) => ({
      ...prev,
      [stateKey]: sourcePath,
    }));
  };

  const handleRemoveMapping = (stateKey: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      delete next[stateKey];
      return next;
    });
  };

  const addCustomField = () => {
    setCustomFields((prev) => [...prev, { key: "", value: "body." }]);
  };

  const updateCustomField = (index: number, field: "key" | "value", val: string) => {
    setCustomFields((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index][field] = val;
      }
      return next;
    });
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Route Invocation Config
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                {method}
              </span>
            </div>
            <h2 className="text-lg font-bold truncate text-foreground">{routeLabel}</h2>
            <p className="text-xs text-muted-foreground">
              Invokes agent: <span className="text-foreground font-semibold">{targetNode?.data?.label || "LangGraph Node"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {kind === "event" ? <Zap className="w-4 h-4 text-purple-400" /> : <Plug className="w-4 h-4 text-primary" />}
          <span className="font-semibold text-foreground">{sourceNode?.data?.label || "Source Node"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-semibold text-primary">{targetNode?.data?.label || "LangGraph Node"}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground bg-background/50 px-2 py-0.5 rounded border border-border/40">
          Edge: {id.slice(0, 8)}
        </span>
      </div>

      {/* Section 1: State Channels Payload Mapping */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">State Channels Payload Mapping</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoMap}
            className="h-7 text-xs font-semibold gap-1.5 border-border hover:bg-secondary"
            title="Auto-fill default mapping for state channels"
          >
            <RefreshCw className="w-3 h-3 text-primary" />
            Auto-map Fields
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Map incoming request body/headers (`req.body`, `req.headers`) to graph state channels defined on this LangGraph agent.
        </p>

        {/* Channels List */}
        <div className="flex flex-col gap-2 bg-secondary/20 p-3 rounded-xl border border-border/50">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
            <span className="col-span-5">Graph State Channel</span>
            <span className="col-span-6">Source Payload Accessor (`req.body...`)</span>
            <span className="col-span-1 text-right">Clear</span>
          </div>

          {stateChannels.map((ch) => {
            return (
              <div key={ch.key} className="grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                  <span className="font-mono font-bold text-primary truncate bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[11px]">
                    {ch.key}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono bg-background/80 px-1 py-0.5 rounded border border-border/30">
                    {ch.type}
                  </span>
                </div>
                <div className="col-span-6">
                  <Input
                    value={mapping[ch.key] ?? ""}
                    placeholder={`e.g. body.${ch.key} or headers.x-key`}
                    onChange={(e) => handleMappingChange(ch.key, e.target.value)}
                    className="h-8 text-xs font-mono bg-background/80"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  {mapping[ch.key] !== undefined && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMapping(ch.key)}
                      title="Remove custom mapping"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Custom Additional Fields */}
          {customFields.map((cf, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs pt-1 border-t border-border/30">
              <div className="col-span-5">
                <Input
                  value={cf.key}
                  placeholder="Custom state key"
                  onChange={(e) => updateCustomField(idx, "key", e.target.value)}
                  className="h-8 text-xs font-mono bg-background/80"
                />
              </div>
              <div className="col-span-6">
                <Input
                  value={cf.value}
                  placeholder="Source accessor e.g. body.custom"
                  onChange={(e) => updateCustomField(idx, "value", e.target.value)}
                  className="h-8 text-xs font-mono bg-background/80"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeCustomField(idx)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={addCustomField}
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 mt-1 border border-dashed border-border/60 hover:bg-secondary/40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Mapping Field
          </Button>
        </div>
      </div>

      {/* Section 2: Pre-Invoke Business Logic Block */}
      <BusinessLogicBlock
        title="Pre-LangGraph Invoke Business Logic"
        description={`Runs inside the route handler before calling graph.invoke(state)`}
        mode={preInvokeMode}
        onModeChange={setPreInvokeMode}
        prompt={preInvokePrompt}
        onPromptChange={setPreInvokePrompt}
        code={preInvokeCode}
        onCodeChange={setPreInvokeCode}
        promptPlaceholder={`Describe what should happen before invoking the graph:\n• Validate the request payload\n• Enrich state with user context (e.g. req.headers["x-user-id"])\n• Transform or format fields before passing into the agent`}
        codePlaceholder={`// Pre-invoke code executes before: await graph.invoke(state)\n// You have access to: req, res, state\n// Example:\nstate.userId = req.headers["x-user-id"] ?? "guest";\nif (!req.body.query) return res.status(400).json({ error: "query is required" });\nstate.query = req.body.query.trim();`}
        codeLanguageLabel="TypeScript (Express Route Body)"
      />

      {/* Section 3: Response Execution Mode & Output Selection */}
      <div className="flex flex-col gap-3 p-3.5 bg-secondary/10 rounded-xl border border-border/60 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
              Output Delivery & Field Selection
            </span>
          </div>
        </div>

        {/* Delivery Execution Mode Pills */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground">Execution Delivery Mode</label>
          <div className="grid grid-cols-3 gap-1.5 bg-background/60 p-1 rounded-lg border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setResponseExecutionMode("sync")}
              className={`py-1.5 px-2 rounded-md font-medium text-center transition-all ${
                responseExecutionMode === "sync"
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              Sync REST (200)
            </button>
            <button
              type="button"
              onClick={() => setResponseExecutionMode("stream")}
              className={`py-1.5 px-2 rounded-md font-medium text-center transition-all ${
                responseExecutionMode === "stream"
                  ? "bg-purple-600 text-white font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              SSE Stream
            </button>
            <button
              type="button"
              onClick={() => setResponseExecutionMode("async_ack")}
              className={`py-1.5 px-2 rounded-md font-medium text-center transition-all ${
                responseExecutionMode === "async_ack"
                  ? "bg-amber-600 text-white font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              Async Ack (202)
            </button>
          </div>
        </div>

        {/* Output Field Selector (only active for sync mode) */}
        {responseExecutionMode === "sync" && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground">Response Payload Fields</label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setResponseOutputMode("full")}
                  className={`px-2 py-0.5 rounded border ${
                    responseOutputMode === "full"
                      ? "bg-primary/15 text-primary border-primary/30 font-bold"
                      : "text-muted-foreground border-border/40"
                  }`}
                >
                  Full Graph State
                </button>
                <button
                  type="button"
                  onClick={() => setResponseOutputMode("selected")}
                  className={`px-2 py-0.5 rounded border ${
                    responseOutputMode === "selected"
                      ? "bg-primary/15 text-primary border-primary/30 font-bold"
                      : "text-muted-foreground border-border/40"
                  }`}
                >
                  Selected Fields
                </button>
              </div>
            </div>

            {responseOutputMode === "selected" && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-background/80 rounded-lg border border-border/50">
                {stateChannels.map((ch) => {
                  const isSelected = responseFields.includes(ch.key);
                  return (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setResponseFields(responseFields.filter((f) => f !== ch.key));
                        } else {
                          setResponseFields([...responseFields, ch.key]);
                        }
                      }}
                      className={`text-[11px] font-mono px-2 py-1 rounded border transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                          : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}{ch.key}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Post-Invoke Business Logic Block */}
      <BusinessLogicBlock
        title="Post-LangGraph Invoke Business Logic"
        description={`Runs after graph execution finishes, before sending output to client`}
        mode={postInvokeMode}
        onModeChange={setPostInvokeMode}
        prompt={postInvokePrompt}
        onPromptChange={setPostInvokePrompt}
        code={postInvokeCode}
        onCodeChange={setPostInvokeCode}
        promptPlaceholder={`Describe what to do after the graph completes:\n• Filter or redact sensitive response properties\n• Format final response object\n• Log execution completion`}
        codePlaceholder={`// Post-invoke code executes after: const result = await graph.invoke(state)\n// You have access to: req, res, state, result\n// Example:\nresult.messages = result.messages?.slice(-1); // Keep last message only`}
        codeLanguageLabel="TypeScript (Express Post-Processing)"
      />

    </div>
  );
};

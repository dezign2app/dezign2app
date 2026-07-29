import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Globe, Trash2, Code, Key, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import type { CustomLLMNode, LangGraphCanvasNode } from "../types";
import { LANGGRAPH_CANVAS_NODE_LLM } from "../constants";
import { LocalInput, LocalTextarea } from "../../../common/shared";

import { DEFAULT_LLM_MODEL } from "@workspace/canvas/constants";

export const LangGraphCanvasCustomLLMNode = ({ id, data, selected }: NodeProps<CustomLLMNode>) => {
  const { setNodes } = useReactFlow<LangGraphCanvasNode>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || "Custom LLM API");

  useEffect(() => {
    setNameValue(data.label || "Custom LLM API");
  }, [data.label]);

  const updateLLMData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === LANGGRAPH_CANVAS_NODE_LLM ? { ...n, data: { ...n.data, ...changes } } : n))
    );
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim() || "Custom LLM API";
    setNameValue(trimmed);
    if (trimmed !== data.label) {
      updateLLMData({ label: trimmed });
    }
  };

  const defaultBody = JSON.stringify(
    {
      model: data.model || DEFAULT_LLM_MODEL,
      messages: [{ role: "user", content: "{{input}}" }],
      temperature: 0.7,
    },
    null,
    2
  );

  const defaultHeaders = JSON.stringify(
    {
      "Content-Type": "application/json",
      Authorization: data.apiKeyHeader ? `Bearer ${data.apiKeyHeader}` : "Bearer YOUR_API_KEY",
    },
    null,
    2
  );

  return (
    <div
      className={`rounded-xl bg-card/95 backdrop-blur-md border-2 min-w-[300px] max-w-[360px] p-3 flex flex-col gap-2.5 transition-all duration-200 shadow-xl relative group ${
        selected ? "border-sky-400 ring-4 ring-sky-400/20 shadow-sky-400/10" : "border-sky-500/40 hover:border-sky-400/80"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0 border border-sky-500/20">
            <Globe className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {isEditingName ? (
              <div
                className="nodrag"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <LocalInput
                  autoFocus
                  className="h-6 text-xs bg-background p-1 font-bold flex-1 nodrag"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setNameValue(data.label || "Custom LLM API");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <span
                className="font-bold text-xs text-foreground truncate max-w-[140px] cursor-pointer hover:text-sky-400 transition-colors nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                title="Click to rename endpoint"
              >
                {data.label || "Custom LLM API"}
              </span>
            )}
            <span className="text-[9px] font-mono text-muted-foreground">{data.llmId}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono border border-sky-500/20">
            {data.method || "POST"} API
          </span>
          {data.onDeleteLLM && (
            <button
              type="button"
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 nodrag"
              onClick={(e) => {
                e.stopPropagation();
                data.onDeleteLLM?.();
              }}
              title="Delete Custom LLM Node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Endpoint Config Tabs matching EndpointConfig & ServiceNode style */}
      <Tabs defaultValue="endpoint" className="w-full text-xs nodrag">
        <TabsList className="grid grid-cols-3 h-7 bg-secondary/50 p-0.5 rounded-lg border border-border/50 text-[10px] nodrag">
          <TabsTrigger value="endpoint" className="h-6 text-[10px] font-medium data-[state=active]:bg-background data-[state=active]:text-sky-400 nodrag">
            Endpoint
          </TabsTrigger>
          <TabsTrigger value="headers" className="h-6 text-[10px] font-medium data-[state=active]:bg-background data-[state=active]:text-amber-400 nodrag">
            Headers
          </TabsTrigger>
          <TabsTrigger value="body" className="h-6 text-[10px] font-medium data-[state=active]:bg-background data-[state=active]:text-emerald-400 nodrag">
            Body
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Endpoint & Auth */}
        <TabsContent value="endpoint" className="flex flex-col gap-2 pt-2 nodrag">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3 text-sky-400" /> Method & Endpoint URL
            </label>
            <div className="flex items-center gap-1.5">
              <Select
                value={data.method || "POST"}
                onValueChange={(val: string) => updateLLMData({ method: val })}
              >
                <SelectTrigger className="h-6 w-20 text-[10px] bg-background border border-border/60 rounded px-1.5 font-bold font-mono text-sky-400 nodrag">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="nodrag">
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>

              <LocalInput
                className="h-6 text-[10px] bg-background border border-border/60 rounded px-1.5 font-mono text-foreground flex-1 nodrag"
                placeholder="http://localhost:11434/v1/chat/completions"
                value={data.url || data.baseUrl || ""}
                onChange={(e) => updateLLMData({ url: e.target.value, baseUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" /> API Key / Auth Token (Optional)
            </label>
            <LocalInput
              type="password"
              className="h-6 text-[10px] bg-background border border-border/60 rounded px-1.5 font-mono text-foreground nodrag"
              placeholder="Bearer ... or secret token"
              value={data.apiKeyHeader || ""}
              onChange={(e) => updateLLMData({ apiKeyHeader: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-medium text-muted-foreground">Model Identifier</label>
            <LocalInput
              className="h-6 text-[10px] bg-background border border-border/60 rounded px-1.5 font-mono text-foreground nodrag"
              placeholder="e.g. llama3:8b, mistral, gpt-4o"
              value={data.model || ""}
              onChange={(e) => updateLLMData({ model: e.target.value })}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Headers */}
        <TabsContent value="headers" className="flex flex-col gap-1.5 pt-2 nodrag">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" /> Request Headers (JSON)
            </label>
          </div>
          <LocalTextarea
            className="min-h-[90px] max-h-[160px] text-[9.5px] bg-background border border-border/60 rounded p-1.5 font-mono text-foreground nodrag resize-y"
            placeholder='{\n  "Content-Type": "application/json"\n}'
            rows={4}
            value={data.headersJson !== undefined ? data.headersJson : defaultHeaders}
            onChange={(e) => updateLLMData({ headersJson: e.target.value })}
          />
        </TabsContent>

        {/* Tab 3: Request Body */}
        <TabsContent value="body" className="flex flex-col gap-1.5 pt-2 nodrag">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
              <Code className="w-3 h-3 text-emerald-400" /> Request Payload (JSON Body)
            </label>
          </div>
          <LocalTextarea
            className="min-h-[100px] max-h-[180px] text-[9.5px] bg-background border border-border/60 rounded p-1.5 font-mono text-foreground nodrag resize-y"
            placeholder='{\n  "model": "llama3:8b",\n  "messages": [{"role": "user", "content": "{{input}}"}]\n}'
            rows={5}
            value={data.bodyJson !== undefined ? data.bodyJson : defaultBody}
            onChange={(e) => updateLLMData({ bodyJson: e.target.value })}
          />
        </TabsContent>
      </Tabs>

      {/* Output Handle to connect edge to step nodes */}
      <Handle
        type="source"
        position={Position.Top}
        id="llm_out"
        className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect to Step Node LLM Config"
      />
    </div>
  );
};

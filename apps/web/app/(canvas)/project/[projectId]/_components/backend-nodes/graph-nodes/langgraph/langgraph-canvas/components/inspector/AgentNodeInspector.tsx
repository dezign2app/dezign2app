import React from "react";
import { Bot, Trash2, Cpu, Wrench, Shield, Sparkles, AlertCircle, Radio, Code, FileJson, Check, Layers, Settings2, MessageSquare, AlertTriangle, Database, Key, HardDrive } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import type { AgentNodeData, LangGraphLLMNode, ToolNode, MiddlewareNode, MemoryNode, LangGraphAgentResponseFormatConfig } from "../../types";
import type { LangGraphAgentMemoryConfig } from "@/types/canvas";
import {
  STREAM_EVENT_TYPES,
  DEFAULT_EVENT_STREAM_SIGNATURE,
  DEFAULT_STREAM_TRANSFORMERS,
  DEFAULT_SELECTED_STREAM_EVENTS,
  DEFAULT_RESPONSE_FORMAT_JSON_SCHEMA,
  DEFAULT_RESPONSE_FORMAT_ZOD_SCHEMA,
  RESPONSE_FORMAT_PRESETS,
} from "../../constants";
import { LocalInput, LocalTextarea } from "../../../../common/shared";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useShallow } from "zustand/react/shallow";

interface AgentNodeInspectorProps {
  selectedAgentData: AgentNodeData;
  onDeleteAgent: () => void;
  onUpdateAgent: (changes: Partial<AgentNodeData>) => void;
  availableLLMNodes?: LangGraphLLMNode[];
  availableToolNodes?: ToolNode[];
  availableMiddlewareNodes?: MiddlewareNode[];
  availableMemoryNodes?: MemoryNode[];
  connectedLLMId?: string | null;
  connectedToolIds?: string[];
  connectedMiddlewareIds?: string[];
  connectedMemoryIds?: string[];
  onSelectLLM?: (llmId: string | null) => void;
  onToggleTool?: (toolId: string, connect: boolean) => void;
  onToggleMiddleware?: (mwId: string, connect: boolean) => void;
  onToggleMemory?: (memId: string, connect: boolean) => void;
}

export function AgentNodeInspector({
  selectedAgentData,
  onDeleteAgent,
  onUpdateAgent,
  availableLLMNodes = [],
  availableToolNodes = [],
  availableMiddlewareNodes = [],
  availableMemoryNodes = [],
  connectedLLMId = null,
  connectedToolIds = [],
  connectedMiddlewareIds = [],
  connectedMemoryIds = [],
  onSelectLLM,
  onToggleTool,
  onToggleMiddleware,
  onToggleMemory,
}: AgentNodeInspectorProps) {
  const entities = useBackendCanvasStore(useShallow((s) => s.nodes.filter((n) => n?.type === "entity" && n.data?.dbType !== "vector")));

  const memConfig: LangGraphAgentMemoryConfig = selectedAgentData.memoryConfig || {
    enabled: true,
    checkpointer: "memory",
    threadIdKey: "thread_id",
    threadScope: "session",
    autoSummarize: true,
    saveMessages: true,
  };

  const updateMemoryConfig = (changes: Partial<LangGraphAgentMemoryConfig>) => {
    onUpdateAgent({
      memoryConfig: {
        ...memConfig,
        ...changes,
      },
    });
  };
  const rfConfig: LangGraphAgentResponseFormatConfig = selectedAgentData.responseFormat || {
    enabled: false,
    strategy: "auto",
    schemaType: "json_schema",
    schemaJson: DEFAULT_RESPONSE_FORMAT_JSON_SCHEMA,
    handleErrorMode: "default",
  };

  const updateResponseFormat = (changes: Partial<LangGraphAgentResponseFormatConfig>) => {
    onUpdateAgent({
      responseFormat: {
        ...rfConfig,
        ...changes,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md border border-border bg-secondary/30 text-foreground">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-mono truncate max-w-[150px]">
                {selectedAgentData.name || "AI Agent"}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground opacity-70">
                {selectedAgentData.agentId || selectedAgentData.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDeleteAgent}
            title="Delete Agent Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── 1. Identity & System Prompt ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agent Identity</h3>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">Agent Name</Label>
          <LocalInput
            value={selectedAgentData.name || ""}
            onChange={(e) => onUpdateAgent({ name: e.target.value })}
            className="h-7 text-xs font-mono bg-background"
            placeholder="search_assistant"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">System Prompt</Label>
          <LocalTextarea
            value={selectedAgentData.systemPrompt || ""}
            onChange={(e) => onUpdateAgent({ systemPrompt: e.target.value })}
            className="text-xs min-h-[90px] resize-y bg-background font-mono leading-relaxed"
            placeholder="You are a helpful research assistant. Use tools when needed..."
          />
        </div>
      </div>

      {/* ─── 2. Attached Resources Selection ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attached Components</h3>

        {/* LLM Selection */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Model / LLM Node</span>
            </div>
          </div>
          {availableLLMNodes.length > 0 ? (
            <Select
              value={connectedLLMId || "none"}
              onValueChange={(val) => onSelectLLM?.(val === "none" ? null : val)}
            >
              <SelectTrigger className="h-7 text-xs bg-background font-mono">
                <SelectValue placeholder="Select LLM Node..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Unbound)</SelectItem>
                {availableLLMNodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-medium text-foreground truncate">
                        {node.data.label || node.id}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">{node.data.model || "custom"}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">
              No LLM Nodes on canvas. Add an LLM node from toolbar to connect.
            </p>
          )}
        </div>

        {/* Tools Multi-Selection */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Attached Tools</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground font-bold">
              {connectedToolIds.length} selected
            </span>
          </div>
          {availableToolNodes.length > 0 ? (
            <div className="flex flex-col gap-1.5 mt-1 max-h-[160px] overflow-y-auto pr-1">
              {availableToolNodes.map((tool) => {
                const isConnected = connectedToolIds.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-1.5 rounded bg-background/60 border border-border/40 text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-medium text-foreground truncate">
                        {tool.data.name || tool.data.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        returnType: {tool.data.returnType || "string"}
                      </span>
                    </div>
                    <Switch
                      checked={isConnected}
                      onCheckedChange={(c) => onToggleTool?.(tool.id, c)}
                      className="scale-75 origin-right"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">
              No Tool Nodes on canvas. Add a Tool node from toolbar to attach.
            </p>
          )}
        </div>

        {/* Middleware Multi-Selection */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Attached Middleware</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground font-bold">
              {connectedMiddlewareIds.length} active
            </span>
          </div>
          {availableMiddlewareNodes.length > 0 ? (
            <div className="flex flex-col gap-1.5 mt-1 max-h-[160px] overflow-y-auto pr-1">
              {availableMiddlewareNodes.map((mw) => {
                const isConnected = connectedMiddlewareIds.includes(mw.id);
                return (
                  <div
                    key={mw.id}
                    className="flex items-center justify-between p-1.5 rounded bg-background/60 border border-border/40 text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-medium text-foreground truncate">
                        {mw.data.name || mw.data.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        type: {mw.data.type}
                      </span>
                    </div>
                    <Switch
                      checked={isConnected}
                      onCheckedChange={(c) => onToggleMiddleware?.(mw.id, c)}
                      className="scale-75 origin-right"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">
              No Middleware Nodes on canvas. Add a Middleware node from toolbar to attach.
            </p>
          )}
        </div>

        {/* Memory / DB Nodes Multi-Selection */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-foreground">Attached Memory / DB Nodes</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground font-bold">
              {connectedMemoryIds.length} connected
            </span>
          </div>
          {availableMemoryNodes.length > 0 ? (
            <div className="flex flex-col gap-1.5 mt-1 max-h-[160px] overflow-y-auto pr-1">
              {availableMemoryNodes.map((mem) => {
                const isConnected = connectedMemoryIds.includes(mem.id);
                return (
                  <div
                    key={mem.id}
                    className="flex items-center justify-between p-1.5 rounded bg-background/60 border border-border/40 text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-medium text-foreground truncate">
                        {mem.data.name || mem.data.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        checkpointer: {mem.data.checkpointer || "convex"} ({mem.data.threadIdKey || "thread_id"})
                      </span>
                    </div>
                    <Switch
                      checked={isConnected}
                      onCheckedChange={(c) => onToggleMemory?.(mem.id, c)}
                      className="scale-75 origin-right"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">
              No Memory Nodes on canvas. Add a Memory node from toolbar to connect.
            </p>
          )}
        </div>

        <div className="flex gap-2 p-2 rounded bg-secondary/20 border border-border/50 items-start text-[10px] text-muted-foreground leading-tight">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Selecting nodes or toggling switches automatically draws and updates canvas edges to <code>llm_in</code>, <code>tool_in</code>, <code>middleware_in</code>, and <code>memory_in</code>.
          </p>
        </div>
      </div>

      {/* ─── 3. Memory & Checkpointer Configuration ────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-amber-950/10 dark:bg-amber-950/20 rounded-xl border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md border ${memConfig.enabled !== false ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : "bg-secondary/30 border-border text-muted-foreground"}`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                Memory & Checkpointer
                {memConfig.enabled !== false && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                    {memConfig.checkpointer || "convex"}
                  </span>
                )}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground">
                Saves chat history & state checkpoints per session
              </p>
            </div>
          </div>

          <Switch
            checked={memConfig.enabled !== false}
            onCheckedChange={(enabled) => updateMemoryConfig({ enabled })}
          />
        </div>

        {memConfig.enabled !== false && (
          <div className="flex flex-col gap-4 pt-2 border-t border-amber-500/20">
            {/* Checkpointer Saver Choice */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Checkpointer Saver Engine
              </Label>
              <Select
                value={memConfig.checkpointer || "memory"}
                onValueChange={(val: string) => updateMemoryConfig({ checkpointer: val })}
              >
                <SelectTrigger className="h-7 text-xs bg-background font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="memory">In-Memory (MemorySaver)</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.data?.label || e.id}>
                      {e.data?.label || "Untitled Table"} (Schema Entity)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Specifies backend persistence engine used to checkpoint and restore conversation state across turns.
              </p>
            </div>

            {/* Session ID / Thread Key */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Session / Thread ID Key
              </Label>
              <LocalInput
                value={memConfig.threadIdKey || "thread_id"}
                onChange={(e) => updateMemoryConfig({ threadIdKey: e.target.value })}
                className="h-7 text-xs font-mono bg-background"
                placeholder="thread_id"
              />
              <div className="flex flex-wrap gap-1 mt-0.5">
                {["thread_id", "session_id", "user_id"].map((keyName) => (
                  <button
                    key={keyName}
                    type="button"
                    onClick={() => updateMemoryConfig({ threadIdKey: keyName })}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      (memConfig.threadIdKey || "thread_id") === keyName
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-300 font-bold"
                        : "bg-background/60 border-border/40 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {keyName}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-muted-foreground">
                Runtime config key: <code>{`configurable: { ${memConfig.threadIdKey || "thread_id"}: "..." }`}</code>
              </p>
            </div>

            {/* Auto Summarization & Limits */}
            <div className="flex items-center justify-between p-2 rounded bg-background/60 border border-border/40">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Auto-Summarize</span>
                <span className="text-[9px] text-muted-foreground">Compress past messages when token window exceeds limit</span>
              </div>
              <Switch
                checked={memConfig.autoSummarize ?? true}
                onCheckedChange={(autoSummarize) => updateMemoryConfig({ autoSummarize })}
                className="scale-85 origin-right"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Structured Output / Response Format (Output Node) ──────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md border ${rfConfig.enabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/30 border-border text-muted-foreground"}`}>
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                Structured Output
                {rfConfig.enabled && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-semibold">
                    responseFormat Active
                  </span>
                )}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground">
                createAgent({`{ responseFormat: ... }`})
              </p>
            </div>
          </div>

          <Switch
            checked={Boolean(rfConfig.enabled)}
            onCheckedChange={(enabled) => updateResponseFormat({ enabled })}
          />
        </div>

        {rfConfig.enabled && (
          <div className="flex flex-col gap-4 pt-2 border-t border-border/50">
            {/* Strategy Choice: Provider vs Tool vs Auto */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                Response Strategy
              </Label>
              <Select
                value={rfConfig.strategy || "auto"}
                onValueChange={(val: "auto" | "provider" | "tool") => updateResponseFormat({ strategy: val })}
              >
                <SelectTrigger className="h-7 text-xs bg-background font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="provider">Provider Strategy</SelectItem>
                  <SelectItem value="tool">Tool Strategy</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {rfConfig.strategy === "provider"
                  ? "Uses native model provider API (OpenAI, Gemini, Claude, Grok). High reliability."
                  : rfConfig.strategy === "tool"
                  ? "Emulates structured response via tool calling and state validation."
                  : "Automatically selects providerStrategy if model supports native output, fallback to toolStrategy."}
              </p>
            </div>

            {/* Schema Standard Selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                Schema Type
              </Label>
              <Select
                value={rfConfig.schemaType || "json_schema"}
                onValueChange={(val: "json_schema" | "zod" | "standard_schema") => {
                  const defaultContent =
                    val === "zod" ? DEFAULT_RESPONSE_FORMAT_ZOD_SCHEMA : DEFAULT_RESPONSE_FORMAT_JSON_SCHEMA;
                  updateResponseFormat({
                    schemaType: val,
                    schemaJson: rfConfig.schemaJson || defaultContent,
                  });
                }}
              >
                <SelectTrigger className="h-7 text-xs bg-background font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json_schema">JSON Schema Object (Record&lt;string, unknown&gt;)</SelectItem>
                  <SelectItem value="zod">Zod Schema (z.object(&#123;...&#125;))</SelectItem>
                  <SelectItem value="standard_schema">Standard Schema (Valibot / ArkType / TypeBox)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preset Schema Templates */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Preset Templates</Label>
              <div className="flex flex-wrap gap-1">
                {RESPONSE_FORMAT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const content =
                        rfConfig.schemaType === "zod" ? preset.zodSchema : preset.jsonSchema;
                      updateResponseFormat({
                        schemaName: preset.label,
                        schemaJson: content,
                      });
                    }}
                    title={preset.description}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-secondary/20 hover:bg-secondary/40 text-foreground border border-border/50 transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Definition Textarea */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Schema Definition</Label>
                <button
                  type="button"
                  onClick={() => {
                    const defaultContent =
                      rfConfig.schemaType === "zod" ? DEFAULT_RESPONSE_FORMAT_ZOD_SCHEMA : DEFAULT_RESPONSE_FORMAT_JSON_SCHEMA;
                    updateResponseFormat({ schemaJson: defaultContent });
                  }}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground underline"
                >
                  Reset Default
                </button>
              </div>
              <LocalTextarea
                value={rfConfig.schemaJson ?? DEFAULT_RESPONSE_FORMAT_JSON_SCHEMA}
                onChange={(e) => updateResponseFormat({ schemaJson: e.target.value })}
                className="text-xs min-h-[120px] resize-y bg-background font-mono leading-relaxed text-foreground"
                placeholder={
                  rfConfig.schemaType === "zod"
                    ? "z.object({ name: z.string(), email: z.string() })"
                    : '{"type": "object", "properties": { ... }}'
                }
              />
            </div>

            {/* Tool Strategy Specific Options */}
            {(rfConfig.strategy === "tool" || rfConfig.strategy === "auto" || !rfConfig.strategy) && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Tool Calling Strategy Options
                </span>

                {/* Custom Tool Message Content */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    Custom Tool Message Content
                  </Label>
                  <LocalInput
                    value={rfConfig.toolMessageContent || ""}
                    onChange={(e) => updateResponseFormat({ toolMessageContent: e.target.value })}
                    className="h-7 text-xs font-mono bg-background"
                    placeholder="Action item captured and added to state!"
                  />
                  <p className="text-[9px] text-muted-foreground">
                    Custom message in conversation history when structured output is generated.
                  </p>
                </div>

                {/* Error Handling Strategy */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                    Schema Error Handling
                  </Label>
                  <Select
                    value={rfConfig.handleErrorMode || "default"}
                    onValueChange={(val: "default" | "custom_message" | "disabled") =>
                      updateResponseFormat({ handleErrorMode: val })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs bg-background font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Auto-Retry (Catch validation errors and re-prompt model)</SelectItem>
                      <SelectItem value="custom_message">Custom Error Prompt (Retry with custom message)</SelectItem>
                      <SelectItem value="disabled">Disable Retry (Throw exception immediately on schema mismatch)</SelectItem>
                    </SelectContent>
                  </Select>

                  {rfConfig.handleErrorMode === "custom_message" && (
                    <LocalInput
                      value={rfConfig.customErrorMessage || ""}
                      onChange={(e) => updateResponseFormat({ customErrorMessage: e.target.value })}
                      className="h-7 text-xs font-mono bg-background mt-1"
                      placeholder="Please provide valid rating between 1-5..."
                    />
                  )}
                </div>
              </div>
            )}

            <div className="p-2 rounded bg-secondary/20 border border-border/50 text-[10px] font-mono text-muted-foreground">
              Output will be captured in <code className="text-foreground">result.structuredResponse</code> channel of agent state.
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Event Streaming Configuration ──────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-cyan-950/10 dark:bg-cyan-950/20 rounded-xl border border-cyan-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md border ${selectedAgentData.streamConfig?.enabled ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-500 animate-pulse" : "bg-secondary/30 border-border text-muted-foreground"}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                Event Streaming
                {selectedAgentData.streamConfig?.enabled && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                    v3 Active
                  </span>
                )}
              </h3>
              <p className="text-[10px] font-mono text-muted-foreground">
                streamEvents(..., version="v3")
              </p>
            </div>
          </div>

          <Switch
            checked={Boolean(selectedAgentData.streamConfig?.enabled)}
            onCheckedChange={(enabled) => {
              onUpdateAgent({
                streamConfig: {
                  version: "v3",
                  selectedEvents: DEFAULT_SELECTED_STREAM_EVENTS,
                  eventSignature: DEFAULT_EVENT_STREAM_SIGNATURE,
                  customTransformers: DEFAULT_STREAM_TRANSFORMERS,
                  ...selectedAgentData.streamConfig,
                  enabled,
                },
              });
            }}
          />
        </div>

        {selectedAgentData.streamConfig?.enabled && (
          <div className="flex flex-col gap-4 pt-2 border-t border-cyan-500/20">
            {/* Event Projections Selection */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Active Event Projections</Label>
              <div className="flex flex-wrap gap-1.5">
                {STREAM_EVENT_TYPES.map((ev) => {
                  const currentEvents = selectedAgentData.streamConfig?.selectedEvents || DEFAULT_SELECTED_STREAM_EVENTS;
                  const isSelected = currentEvents.includes(ev.id);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? currentEvents.filter((id) => id !== ev.id)
                          : [...currentEvents, ev.id];
                        onUpdateAgent({
                          streamConfig: {
                            ...selectedAgentData.streamConfig,
                            selectedEvents: updated,
                          },
                        });
                      }}
                      title={`${ev.label}: ${ev.description}`}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 font-semibold"
                          : "bg-background/60 border-border/50 text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-cyan-500 shrink-0" />}
                      <span>{ev.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Signature Schema (JSON Template) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-cyan-500" />
                  Event Signature Schema (JSON)
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateAgent({
                      streamConfig: {
                        ...selectedAgentData.streamConfig,
                        eventSignature: DEFAULT_EVENT_STREAM_SIGNATURE,
                      },
                    });
                  }}
                  className="text-[10px] font-mono text-muted-foreground hover:text-cyan-500 underline"
                >
                  Reset Default
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Specifies standard JSON envelope signature for frontend parsing.
              </p>
              <LocalTextarea
                value={selectedAgentData.streamConfig?.eventSignature ?? DEFAULT_EVENT_STREAM_SIGNATURE}
                onChange={(e) => {
                  onUpdateAgent({
                    streamConfig: {
                      ...selectedAgentData.streamConfig,
                      eventSignature: e.target.value,
                    },
                  });
                }}
                className="text-xs min-h-[110px] resize-y bg-background font-mono leading-relaxed text-cyan-600 dark:text-cyan-300"
                placeholder="Configure event signature JSON structure..."
              />
            </div>

            {/* Custom Stream Transformers / Handler Code */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-sky-500" />
                  Stream Transformers / Config
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateAgent({
                      streamConfig: {
                        ...selectedAgentData.streamConfig,
                        customTransformers: DEFAULT_STREAM_TRANSFORMERS,
                      },
                    });
                  }}
                  className="text-[10px] font-mono text-muted-foreground hover:text-sky-500 underline"
                >
                  Reset Default
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Configure stream projection transformers and options.
              </p>
              <LocalTextarea
                value={selectedAgentData.streamConfig?.customTransformers ?? DEFAULT_STREAM_TRANSFORMERS}
                onChange={(e) => {
                  onUpdateAgent({
                    streamConfig: {
                      ...selectedAgentData.streamConfig,
                      customTransformers: e.target.value,
                    },
                  });
                }}
                className="text-xs min-h-[110px] resize-y bg-background font-mono leading-relaxed text-sky-600 dark:text-sky-300"
                placeholder="Configure stream transformer code or options..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

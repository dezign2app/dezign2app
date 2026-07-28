import React from "react";
import { Bot, Trash2, Cpu, Wrench, Shield, Sparkles, AlertCircle } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import type { AgentNodeData, LangGraphLLMNode, ToolNode, MiddlewareNode } from "../../types";
import { LocalInput, LocalTextarea } from "../../../shared";

interface AgentNodeInspectorProps {
  selectedAgentData: AgentNodeData;
  onDeleteAgent: () => void;
  onUpdateAgent: (changes: Partial<AgentNodeData>) => void;
  availableLLMNodes?: LangGraphLLMNode[];
  availableToolNodes?: ToolNode[];
  availableMiddlewareNodes?: MiddlewareNode[];
  connectedLLMId?: string | null;
  connectedToolIds?: string[];
  connectedMiddlewareIds?: string[];
  onSelectLLM?: (llmId: string | null) => void;
  onToggleTool?: (toolId: string, connect: boolean) => void;
  onToggleMiddleware?: (mwId: string, connect: boolean) => void;
}

export function AgentNodeInspector({
  selectedAgentData,
  onDeleteAgent,
  onUpdateAgent,
  availableLLMNodes = [],
  availableToolNodes = [],
  availableMiddlewareNodes = [],
  connectedLLMId = null,
  connectedToolIds = [],
  connectedMiddlewareIds = [],
  onSelectLLM,
  onToggleTool,
  onToggleMiddleware,
}: AgentNodeInspectorProps) {
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

        <div className="flex gap-2 p-2 rounded bg-secondary/20 border border-border/50 items-start text-[10px] text-muted-foreground leading-tight">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Selecting nodes or toggling switches automatically draws and updates canvas edges to <code>llm_in</code>, <code>tool_in</code>, and <code>middleware_in</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

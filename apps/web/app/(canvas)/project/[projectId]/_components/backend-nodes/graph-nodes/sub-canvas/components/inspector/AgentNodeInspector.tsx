import React from "react";
import { Bot, Trash2, Cpu, Wrench, Shield, Sparkles, AlertCircle } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { AgentNodeData } from "../../types";
import { LocalInput, LocalTextarea } from "../../../shared";
import { LLM_PROVIDERS } from "../../constants";
import { LLM_PROVIDER_PRESETS } from "./constants";

interface AgentNodeInspectorProps {
  selectedAgentData: AgentNodeData;
  onDeleteAgent: () => void;
  onUpdateAgent: (changes: Partial<AgentNodeData>) => void;
  connectedToolsCount: number;
  connectedMiddlewareCount: number;
}

export function AgentNodeInspector({
  selectedAgentData,
  onDeleteAgent,
  onUpdateAgent,
  connectedToolsCount,
  connectedMiddlewareCount,
}: AgentNodeInspectorProps) {
  const currentModelConfig = selectedAgentData.modelConfig || {
    provider: LLM_PROVIDERS.GOOGLE,
    model: "gemini-2.5-flash",
    temperature: 0.2,
  };

  const handleModelConfigChange = (key: string, value: any) => {
    onUpdateAgent({
      modelConfig: {
        ...currentModelConfig,
        [key]: value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
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
          <Sparkles className="w-4 h-4 text-sky-500" />
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

      {/* ─── 2. Default Model Config ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-sky-500/5 rounded-xl border border-sky-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-sky-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-500">Model Config</h3>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">Provider</Label>
          <Select
            value={currentModelConfig.provider || LLM_PROVIDERS.GOOGLE}
            onValueChange={(val) => handleModelConfigChange("provider", val)}
          >
            <SelectTrigger className="h-7 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="ollama">Ollama</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">Model Identifier</Label>
          <LocalInput
            value={currentModelConfig.model || "gemini-2.5-flash"}
            onChange={(e) => handleModelConfigChange("model", e.target.value)}
            className="h-7 text-xs font-mono bg-background"
            placeholder="gemini-2.5-flash or gpt-4o"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold text-foreground">Temperature</Label>
          <LocalInput
            type="number"
            step="0.05"
            min="0"
            max="2"
            value={currentModelConfig.temperature ?? 0.2}
            onChange={(e) => handleModelConfigChange("temperature", parseFloat(e.target.value) || 0.2)}
            className="h-7 w-20 text-right text-xs font-mono bg-background"
          />
        </div>
      </div>

      {/* ─── 3. Attached Resources Summary ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attached Components</h3>

        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-foreground">Tools</span>
          </div>
          <span className="font-mono font-bold text-emerald-400">{connectedToolsCount} connected</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-foreground">Middleware</span>
          </div>
          <span className="font-mono font-bold text-purple-400">{connectedMiddlewareCount} active</span>
        </div>

        <div className="flex gap-2 p-2 rounded bg-sky-500/10 border border-sky-500/20 items-start text-[10px] text-sky-400 leading-tight">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Connect Tool Nodes to top handle <code>tool_in</code> and Middleware Nodes to <code>middleware_in</code>.
            They will automatically compile into <code>createAgent({`{ model, tools, middleware }`})</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Bot, Trash2, Sparkles } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalInput, LocalTextarea } from "../../../../../common/shared";
import type { AgentNodeData } from "../../../types";

interface AgentIdentitySectionProps {
  selectedAgentData: AgentNodeData;
  onDeleteAgent: () => void;
  onUpdateAgent: (changes: Partial<AgentNodeData>) => void;
}

export function AgentIdentitySection({
  selectedAgentData,
  onDeleteAgent,
  onUpdateAgent,
}: AgentIdentitySectionProps) {
  return (
    <>
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

      {/* ─── Identity & System Prompt ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Agent Identity
          </h3>
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
    </>
  );
}

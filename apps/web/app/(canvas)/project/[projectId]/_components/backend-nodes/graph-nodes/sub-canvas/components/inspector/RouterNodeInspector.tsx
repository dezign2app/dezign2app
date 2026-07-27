import React from "react";
import { GitBranch } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { StepNodeData } from "../../types";

interface RouterNodeInspectorProps {
  selectedStepData: StepNodeData;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
}

export function RouterNodeInspector({
  selectedStepData,
  onUpdateStep,
}: RouterNodeInspectorProps) {
  const branches = selectedStepData.routerConfig?.branches || [];
  const activeBranchIdx = Math.max(0, branches.findIndex((b) => b.id === selectedStepData.activeBranchId));
  const activeBranch = branches[activeBranchIdx];

  if (!activeBranch) {
    return (
      <div className="flex flex-col gap-2 p-4 rounded-xl border bg-card/50 text-xs text-muted-foreground italic text-center">
        No route selected for configuration.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" /> Route Configuration
        </span>
        {branches.length > 1 && (
          <Select
            value={activeBranch.id}
            onValueChange={(val) => onUpdateStep({ activeBranchId: val })}
          >
            <SelectTrigger className="h-7 text-xs bg-background border border-border/60 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b, idx) => (
                <SelectItem key={b.id || idx} value={b.id}>
                  {b.label || (b.isDefault ? "Default" : `Route ${idx + 1}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-3 text-xs">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Route Label</Label>
          <Input
            className="h-8 text-xs bg-background/50"
            placeholder="Route Label (e.g. If success)"
            value={activeBranch.label || ""}
            onChange={(e) => {
              const updated = [...branches];
              updated[activeBranchIdx] = { ...activeBranch, label: e.target.value };
              onUpdateStep({ routerConfig: { branches: updated } });
            }}
          />
        </div>

        <div className="flex flex-col gap-3 pt-3 border-t border-border/50">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Field / State Channel</Label>
            <Input
              className="h-8 text-xs bg-background/50 font-mono"
              placeholder="e.g. intent, messages, response"
              value={activeBranch.field || ""}
              onChange={(e) => {
                const updated = [...branches];
                updated[activeBranchIdx] = { ...activeBranch, field: e.target.value };
                onUpdateStep({ routerConfig: { branches: updated } });
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Comparison Operator</Label>
            <Select
              value={activeBranch.operator}
              onValueChange={(v: any) => {
                const updated = [...branches];
                updated[activeBranchIdx] = { ...activeBranch, operator: v };
                onUpdateStep({ routerConfig: { branches: updated } });
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background/50 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eq">== (equal)</SelectItem>
                <SelectItem value="neq">!= (not equal)</SelectItem>
                <SelectItem value="gt">&gt; (greater than)</SelectItem>
                <SelectItem value="gte">&gt;= (greater than or equal)</SelectItem>
                <SelectItem value="lt">&lt; (less than)</SelectItem>
                <SelectItem value="lte">&lt;= (less than or equal)</SelectItem>
                <SelectItem value="contains">contains</SelectItem>
                <SelectItem value="is_not_null">is not null</SelectItem>
                <SelectItem value="has_tool_calls">has tool calls</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Target Value</Label>
            <Input
              className="h-8 text-xs bg-background/50 font-mono"
              placeholder="e.g. success, support, true, 100"
              value={activeBranch.value || ""}
              onChange={(e) => {
                const updated = [...branches];
                updated[activeBranchIdx] = { ...activeBranch, value: e.target.value };
                onUpdateStep({ routerConfig: { branches: updated } });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

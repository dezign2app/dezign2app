import React, { useState } from "react";
import { GitBranch, Variable, Code2, Plus, Trash2 } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { StepNodeData } from "@workspace/canvas";

interface RouterNodeInspectorProps {
  selectedStepData: StepNodeData;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
  stateChannels?: LangGraphStateChannel[];
}

export function RouterNodeInspector({
  selectedStepData,
  onUpdateStep,
  stateChannels,
}: RouterNodeInspectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const branches = selectedStepData.routerConfig?.branches || [];
  const activeBranchIdx = Math.max(
    0,
    branches.findIndex((b) => b.id === selectedStepData.activeBranchId),
  );
  const activeBranch = branches[activeBranchIdx];

  const availableChannels =
    stateChannels && stateChannels.length > 0
      ? stateChannels
      : selectedStepData.availableStateChannels || [];

  const handleAddRoute = () => {
    const newBranchId = `b_${Date.now()}`;
    const newBranch = {
      id: newBranchId,
      label: `Route ${branches.length + 1}`,
      field: availableChannels[0]?.key || "messages",
      operator: "eq" as const,
      value: "",
      isDefault: false,
    };
    onUpdateStep({
      routerConfig: { branches: [...branches, newBranch] },
      activeBranchId: newBranchId,
    });
  };

  const handleDeleteRoute = (branchId: string) => {
    const updated = branches.filter((b) => b.id !== branchId);
    const nextActive = updated[0]?.id;
    onUpdateStep({
      routerConfig: { branches: updated },
      activeBranchId: nextActive,
    });
  };

  if (!activeBranch) {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-xl border bg-card/50 text-xs text-muted-foreground text-center">
        <span>No route defined for this router node.</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-sky-500/40 text-sky-400 hover:bg-sky-500/10 mx-auto"
          onClick={handleAddRoute}
        >
          <Plus className="w-3.5 h-3.5" /> Add First Route
        </Button>
      </div>
    );
  }

  const isMatchedChannel = availableChannels.some(
    (c) => c.key === activeBranch.field,
  );
  const currentSelectValue = isMatchedChannel ? activeBranch.field : "custom";

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-sky-400" /> Route Config
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] gap-1 border-sky-500/40 text-sky-400 hover:bg-sky-500/10 px-2"
            onClick={handleAddRoute}
          >
            <Plus className="w-3 h-3" /> Add Route
          </Button>
          {branches.length > 1 && (
            <Select
              value={activeBranch.id}
              onValueChange={(val) => onUpdateStep({ activeBranchId: val })}
            >
              <SelectTrigger className="h-6 text-xs bg-background border border-border/60 w-28">
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
          {branches.length > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => handleDeleteRoute(activeBranch.id)}
              title="Delete current route"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 text-xs">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">Route Label</Label>
          <Input
            className="h-8 text-xs bg-background/50"
            placeholder="Route Label (e.g. If success)"
            value={activeBranch.label || ""}
            onChange={(e) => {
              const updated = [...branches];
              updated[activeBranchIdx] = {
                ...activeBranch,
                label: e.target.value,
              };
              onUpdateStep({ routerConfig: { branches: updated } });
            }}
          />
        </div>

        <div className="flex flex-col gap-3 pt-3 border-t border-border/50">
          {/* Global State Variable Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                <Variable className="w-3.5 h-3.5 text-sky-400" /> Global State
                Variable
              </Label>
              <button
                type="button"
                className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 font-mono"
                onClick={() => setShowCustomInput(!showCustomInput)}
              >
                <Code2 className="w-3 h-3" />
                {showCustomInput ? "Use Dropdown" : "Custom Path"}
              </button>
            </div>

            {!showCustomInput && availableChannels.length > 0 ? (
              <Select
                value={currentSelectValue}
                onValueChange={(val) => {
                  if (val === "custom") {
                    setShowCustomInput(true);
                    return;
                  }
                  const updated = [...branches];
                  updated[activeBranchIdx] = { ...activeBranch, field: val };
                  onUpdateStep({ routerConfig: { branches: updated } });
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background/50 font-mono">
                  <SelectValue placeholder="Select State Variable..." />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((ch) => (
                    <SelectItem key={ch.key} value={ch.key}>
                      <span className="font-mono text-sky-400 font-semibold">
                        state.{ch.key}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        ({ch.type})
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <span className="italic text-muted-foreground">
                      Custom Property / Expression...
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : null}

            {(showCustomInput || availableChannels.length === 0) && (
              <Input
                className="h-8 text-xs bg-background/50 font-mono"
                placeholder="e.g. intent, messages, or messages[-1].content"
                value={activeBranch.field || ""}
                onChange={(e) => {
                  const updated = [...branches];
                  updated[activeBranchIdx] = {
                    ...activeBranch,
                    field: e.target.value,
                  };
                  onUpdateStep({ routerConfig: { branches: updated } });
                }}
              />
            )}
            <span className="text-[10px] text-muted-foreground font-mono">
              Comparing left side:{" "}
              <code className="text-sky-400">
                state.{activeBranch.field || "variable"}
              </code>
            </span>
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
                <SelectItem value="gte">
                  &gt;= (greater than or equal)
                </SelectItem>
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
                updated[activeBranchIdx] = {
                  ...activeBranch,
                  value: e.target.value,
                };
                onUpdateStep({ routerConfig: { branches: updated } });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

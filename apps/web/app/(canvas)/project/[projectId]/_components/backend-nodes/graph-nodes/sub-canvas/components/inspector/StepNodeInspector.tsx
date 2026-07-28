import React from "react";
import { Brain, Plus, Zap, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import type { LangGraphStepConfig, LangGraphStateChannel } from "@/types/canvas";
import type { StepNodeData } from "../../types";
import {
  STEP_TYPE_ROUTER,
  LLM_PROVIDER_GROQ,
  LLM_PROVIDER_OPENAI,
  LLM_PROVIDER_ANTHROPIC,
  LLM_PROVIDER_GOOGLE,
  LLM_PROVIDER_OTHER,
} from "../../constants";
import { RouterNodeInspector } from "./RouterNodeInspector";

interface StepNodeInspectorProps {
  selectedStepData: StepNodeData;
  onDeleteStep: () => void;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
  stateChannels: LangGraphStateChannel[];
}

export function StepNodeInspector({
  selectedStepData,
  onDeleteStep,
  onUpdateStep,
  stateChannels,
}: StepNodeInspectorProps) {
  const isRouter = selectedStepData.stepType === STEP_TYPE_ROUTER;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <span className="text-base font-semibold tracking-tight text-foreground">Configure Step</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onDeleteStep}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
        </Button>
      </div>

      {/* Label */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Label</Label>
        <Input
          className="h-8 text-xs bg-background/50"
          value={selectedStepData.label || ""}
          onChange={(e) => onUpdateStep({ label: e.target.value })}
        />
      </div>

      {/* Model Config Section - Only show for non-router nodes */}
      {!isRouter && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-muted-foreground" /> Model Config
            </span>
            <Switch
              checked={!!selectedStepData.modelConfig}
              onCheckedChange={(checked) => {
                if (checked) {
                  onUpdateStep({
                    modelConfig: {
                      provider: selectedStepData.modelConfig?.provider || LLM_PROVIDER_GROQ,
                      model: selectedStepData.modelConfig?.model || "llama-3.3-70b-versatile",
                    },
                  });
                } else {
                  onUpdateStep({ modelConfig: undefined });
                }
              }}
            />
          </div>

          {selectedStepData.modelConfig && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Provider</Label>
                <Select
                  value={selectedStepData.modelConfig?.provider || LLM_PROVIDER_GROQ}
                  onValueChange={(v: string) =>
                    onUpdateStep({
                      modelConfig: {
                        ...selectedStepData.modelConfig,
                        provider: v as NonNullable<LangGraphStepConfig["modelConfig"]>["provider"],
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LLM_PROVIDER_GROQ}>Groq</SelectItem>
                    <SelectItem value={LLM_PROVIDER_OPENAI}>OpenAI</SelectItem>
                    <SelectItem value={LLM_PROVIDER_ANTHROPIC}>Anthropic</SelectItem>
                    <SelectItem value={LLM_PROVIDER_GOOGLE}>Google</SelectItem>
                    <SelectItem value={LLM_PROVIDER_OTHER}>Other (Custom LLM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Model</Label>
                <Input
                  className="h-8 text-xs bg-background/50 font-mono"
                  value={selectedStepData.modelConfig?.model || ""}
                  onChange={(e) =>
                    onUpdateStep({
                      modelConfig: { ...selectedStepData.modelConfig, model: e.target.value },
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Router Node Specific Configuration */}
      {isRouter && (
        <RouterNodeInspector
          selectedStepData={selectedStepData}
          onUpdateStep={onUpdateStep}
        />
      )}

      {/* State Channel Updates Section - Only for non-router nodes */}
      {!isRouter && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-muted-foreground" /> State Channel Updates
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-border gap-1"
              onClick={() => {
                const current = selectedStepData.stateUpdates || [];
                const defaultKey = stateChannels[0]?.key || "summary";
                onUpdateStep({
                  stateUpdates: [...current, { channelKey: defaultKey, mode: "set", value: "" }],
                });
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Update
            </Button>
          </div>

          {(selectedStepData.stateUpdates || []).map((su, sIdx) => (
            <div key={sIdx} className="flex flex-col gap-2 p-3 rounded-lg border bg-background/50 text-xs">
              <div className="flex items-center justify-between gap-1.5">
                <Select
                  value={su.channelKey}
                  onValueChange={(v) => {
                    const updated = [...(selectedStepData.stateUpdates || [])];
                    const current = updated[sIdx];
                    if (current) {
                      updated[sIdx] = { ...current, channelKey: v };
                      onUpdateStep({ stateUpdates: updated });
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs bg-background font-mono flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stateChannels.map((ch) => (
                      <SelectItem key={ch.key} value={ch.key}>
                        {ch.key} ({ch.type})
                      </SelectItem>
                    ))}
                    {!stateChannels.some((c) => c.key === su.channelKey) && su.channelKey && (
                      <SelectItem value={su.channelKey}>{su.channelKey}</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={su.mode || "set"}
                  onValueChange={(v: "set" | "append" | "expression") => {
                    const updated = [...(selectedStepData.stateUpdates || [])];
                    const current = updated[sIdx];
                    if (current) {
                      updated[sIdx] = { ...current, mode: v };
                      onUpdateStep({ stateUpdates: updated });
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-[11px] w-24 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Set / Replace</SelectItem>
                    <SelectItem value="append">Append</SelectItem>
                    <SelectItem value="expression">Expression</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => {
                    const updated = (selectedStepData.stateUpdates || []).filter((_, i) => i !== sIdx);
                    onUpdateStep({ stateUpdates: updated });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Input
                className="h-7 text-[11px] bg-background font-mono"
                placeholder="Value / expression (e.g. state.messages + input)"
                value={su.value || ""}
                onChange={(e) => {
                  const updated = [...(selectedStepData.stateUpdates || [])];
                  const current = updated[sIdx];
                  if (current) {
                    updated[sIdx] = { ...current, value: e.target.value };
                    onUpdateStep({ stateUpdates: updated });
                  }
                }}
              />
            </div>
          ))}

          {(!selectedStepData.stateUpdates || selectedStepData.stateUpdates.length === 0) && (
            <span className="text-xs text-muted-foreground italic text-center py-1">
              No state updates configured for this step node.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

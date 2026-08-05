import React from "react";
import { Check, AlertCircle, Trash2 } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type {
  ToolNodeData,
  ToolReturnType,
  StateUpdateMode,
} from "@workspace/canvas";
import { LocalInput, LocalTextarea } from "../../../../../common";
import type { LangGraphStateChannel } from "@/types/canvas";

interface ToolReturnBehaviorSectionProps {
  selectedToolData: ToolNodeData;
  onUpdateTool: (changes: Partial<ToolNodeData>) => void;
  stateChannels: LangGraphStateChannel[];
  handleUpdateCommandConfig: (
    updates: Partial<NonNullable<ToolNodeData["commandConfig"]>>,
  ) => void;
}

export function ToolReturnBehaviorSection({
  selectedToolData,
  onUpdateTool,
  stateChannels,
  handleUpdateCommandConfig,
}: ToolReturnBehaviorSectionProps) {
  const isObjectReturn = selectedToolData.returnType === "object";
  const isCommandReturn = selectedToolData.returnType === "command";
  const isContentBlocksReturn =
    selectedToolData.returnType === "content_blocks";

  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Return Behavior
          </h3>
        </div>
        <div
          className="flex items-center gap-2"
          title="Return output directly, skipping further model processing"
        >
          <Label
            htmlFor="returnDirect"
            className="text-xs font-semibold cursor-pointer"
          >
            Return Direct
          </Label>
          <Switch
            id="returnDirect"
            checked={selectedToolData.returnDirect || false}
            onCheckedChange={(c: boolean) => onUpdateTool({ returnDirect: c })}
            className="scale-75 origin-right"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Return Type
        </Label>
        <Select
          value={selectedToolData.returnType || "string"}
          onValueChange={(val: ToolReturnType) =>
            onUpdateTool({ returnType: val })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">
              <span className="font-mono text-xs text-foreground">
                string
              </span>
            </SelectItem>
            <SelectItem value="object">
              <span className="font-mono text-xs text-amber-500">
                object (dict)
              </span>
            </SelectItem>
            <SelectItem value="content_blocks">
              <span className="font-mono text-xs text-sky-500">
                content_blocks (multimodal)
              </span>
            </SelectItem>
            <SelectItem value="command">
              <span className="font-mono text-xs text-purple-500">
                command (state updates)
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isContentBlocksReturn && (
        <div className="flex gap-2 p-2 rounded bg-sky-500/10 border border-sky-500/20 items-start">
          <AlertCircle className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-sky-500 leading-tight">
            Multimodal returns (images/audio) require a model that supports
            them. Check the step's model configuration.
          </p>
        </div>
      )}

      {isObjectReturn && (
        <div className="flex flex-col gap-2 mt-2">
          <Label className="text-xs font-semibold text-foreground">
            Output Schema (JSON Schema)
          </Label>
          <LocalTextarea
            value={selectedToolData.outputSchema || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onUpdateTool({ outputSchema: e.target.value })
            }
            className="text-[11px] min-h-[80px] resize-y bg-background font-mono"
            placeholder={'{\n  "type": "object",\n  "properties": {}\n}'}
          />
        </div>
      )}

      {isCommandReturn && (
        <div className="flex flex-col gap-2 mt-2 bg-purple-500/5 p-2 rounded border border-purple-500/10">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold text-purple-500 uppercase">
              State Updates
            </Label>
          </div>
          {(selectedToolData.commandConfig?.stateUpdates || []).map(
            (update, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1.5 p-2 bg-background border border-border/50 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={update.channelKey}
                    onValueChange={(val: string) => {
                      const newUpdates = [
                        ...(selectedToolData.commandConfig?.stateUpdates ||
                          []),
                      ];
                      if (newUpdates[idx]) {
                        newUpdates[idx].channelKey = val;
                        handleUpdateCommandConfig({
                          stateUpdates: newUpdates,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-6 text-[10px] flex-1 font-mono">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateChannels.map((c) => (
                        <SelectItem
                          key={c.key}
                          value={c.key}
                          className="text-[10px] font-mono"
                        >
                          {c.key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={update.mode || "set"}
                    onValueChange={(val: StateUpdateMode) => {
                      const newUpdates = [
                        ...(selectedToolData.commandConfig?.stateUpdates ||
                          []),
                      ];
                      if (newUpdates[idx]) {
                        newUpdates[idx].mode = val;
                        handleUpdateCommandConfig({
                          stateUpdates: newUpdates,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-6 text-[10px] w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set" className="text-[10px]">
                        set
                      </SelectItem>
                      <SelectItem value="append" className="text-[10px]">
                        append
                      </SelectItem>
                      <SelectItem
                        value="expression"
                        className="text-[10px] text-amber-500"
                      >
                        expression
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      const newUpdates = [
                        ...(selectedToolData.commandConfig?.stateUpdates ||
                          []),
                      ];
                      newUpdates.splice(idx, 1);
                      handleUpdateCommandConfig({ stateUpdates: newUpdates });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {update.mode === "expression" && (
                  <div className="flex flex-col gap-1 mt-1">
                    <LocalInput
                      value={update.value || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newUpdates = [
                          ...(selectedToolData.commandConfig?.stateUpdates ||
                            []),
                        ];
                        if (newUpdates[idx]) {
                          newUpdates[idx].value = e.target.value;
                          handleUpdateCommandConfig({
                            stateUpdates: newUpdates,
                          });
                        }
                      }}
                      className="h-6 text-[10px] font-mono bg-amber-500/5 border-amber-500/20 placeholder:text-amber-500/30 text-amber-500"
                      placeholder="e.g. priorState.count + toolResult.count"
                    />
                    <span className="text-[9px] text-amber-500 leading-tight">
                      Expressions run in a safe DSL. Available vars:
                      `priorState`, `toolResult`, `input`.
                    </span>
                  </div>
                )}
              </div>
            ),
          )}
          <button
            type="button"
            className="h-6 rounded bg-purple-500/10 hover:bg-purple-500/20 text-[10px] font-semibold text-purple-500 transition-colors mt-1 border border-purple-500/20"
            onClick={() => {
              const newUpdates = [
                ...(selectedToolData.commandConfig?.stateUpdates || []),
                {
                  channelKey: stateChannels[0]?.key || "messages",
                  mode: "set" as const,
                },
              ];
              handleUpdateCommandConfig({ stateUpdates: newUpdates });
            }}
          >
            + Add State Update
          </button>
        </div>
      )}
    </div>
  );
}

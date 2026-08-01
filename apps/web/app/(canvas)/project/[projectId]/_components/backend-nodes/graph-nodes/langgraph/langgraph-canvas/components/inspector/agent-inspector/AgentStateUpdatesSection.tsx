import React from "react";
import { Zap, Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { AgentNodeData } from "../../../types";

interface AgentStateUpdatesSectionProps {
  selectedAgentData: AgentNodeData;
  onUpdateAgent: (changes: Partial<AgentNodeData>) => void;
  stateChannels?: LangGraphStateChannel[];
}

type StateUpdateItem = NonNullable<AgentNodeData["stateUpdates"]>[number];

export function AgentStateUpdatesSection({
  selectedAgentData,
  onUpdateAgent,
  stateChannels = [],
}: AgentStateUpdatesSectionProps) {
  const stateUpdates: StateUpdateItem[] = selectedAgentData.stateUpdates || [];
  const stateUpdatesConfig = {
    enabled: selectedAgentData.stateUpdatesConfig?.enabled !== false,
  };
  const isEnabled = stateUpdatesConfig.enabled;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Graph State Updates
        </span>
        <div className="flex items-center gap-2">
          {isEnabled && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-border gap-1"
              onClick={() => {
                const defaultKey = stateChannels[0]?.key || "messages";
                onUpdateAgent({
                  stateUpdates: [
                    ...stateUpdates,
                    { channelKey: defaultKey, mode: "set", value: "" },
                  ],
                });
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Update
            </Button>
          )}
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked: boolean) => {
              onUpdateAgent({
                stateUpdatesConfig: {
                  ...stateUpdatesConfig,
                  enabled: checked,
                },
              });
            }}
            className="scale-90"
          />
        </div>
      </div>

      {isEnabled && (
        <>
          {stateUpdates.map((su: StateUpdateItem, sIdx: number) => (
            <div
              key={sIdx}
              className="flex flex-col gap-2 p-3 rounded-lg border bg-background/50 text-xs"
            >
              <div className="flex items-center justify-between gap-1.5">
                <Select
                  value={su.channelKey}
                  onValueChange={(v: string) => {
                    const updated = [...stateUpdates];
                    const current = updated[sIdx];
                    if (current) {
                      updated[sIdx] = { ...current, channelKey: v };
                      onUpdateAgent({ stateUpdates: updated });
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs bg-background font-mono flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stateChannels.map((ch: LangGraphStateChannel) => (
                      <SelectItem key={ch.key} value={ch.key}>
                        {ch.key}
                      </SelectItem>
                    ))}
                    {!stateChannels.some(
                      (c: LangGraphStateChannel) => c.key === su.channelKey,
                    ) &&
                      su.channelKey && (
                        <SelectItem value={su.channelKey}>
                          {su.channelKey}
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>

                <Select
                  value={su.mode || "set"}
                  onValueChange={(v: "set" | "append" | "expression") => {
                    const updated = [...stateUpdates];
                    const current = updated[sIdx];
                    if (current) {
                      updated[sIdx] = { ...current, mode: v };
                      onUpdateAgent({ stateUpdates: updated });
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
                    const updated = stateUpdates.filter(
                      (_: StateUpdateItem, i: number) => i !== sIdx,
                    );
                    onUpdateAgent({ stateUpdates: updated });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Input
                className="h-7 text-[11px] bg-background font-mono"
                placeholder="Value / expression (e.g. state.messages + input)"
                value={su.value || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const updated = [...stateUpdates];
                  const current = updated[sIdx];
                  if (current) {
                    updated[sIdx] = { ...current, value: e.target.value };
                    onUpdateAgent({ stateUpdates: updated });
                  }
                }}
              />
            </div>
          ))}

          {stateUpdates.length === 0 && (
            <span className="text-xs text-muted-foreground italic text-center py-1">
              No graph state updates configured for this Agent.
            </span>
          )}
        </>
      )}
    </div>
  );
}

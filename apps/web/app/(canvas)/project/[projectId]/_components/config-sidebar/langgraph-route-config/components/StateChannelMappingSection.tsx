import React from "react";
import { Layers, RefreshCw, Trash2, Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { CustomField } from "../types";

interface StateChannelMappingSectionProps {
  stateChannels: LangGraphStateChannel[];
  mapping: Record<string, string>;
  customFields: CustomField[];
  onAutoMap: () => void;
  onMappingChange: (stateKey: string, sourcePath: string) => void;
  onRemoveMapping: (stateKey: string) => void;
  onAddCustomField: () => void;
  onUpdateCustomField: (
    index: number,
    field: "key" | "value",
    val: string,
  ) => void;
  onRemoveCustomField: (index: number) => void;
}

export const StateChannelMappingSection: React.FC<
  StateChannelMappingSectionProps
> = ({
  stateChannels,
  mapping,
  customFields,
  onAutoMap,
  onMappingChange,
  onRemoveMapping,
  onAddCustomField,
  onUpdateCustomField,
  onRemoveCustomField,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            State Channels Payload Mapping
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAutoMap}
          className="h-7 text-xs font-semibold gap-1.5 border-border hover:bg-secondary"
          title="Auto-fill default mapping for state channels"
        >
          <RefreshCw className="w-3 h-3 text-primary" />
          Auto-map Fields
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Map incoming request body/headers (`req.body`, `req.headers`) to graph
        state channels defined on this LangGraph agent.
      </p>

      {/* Channels List */}
      <div className="flex flex-col gap-2 bg-secondary/20 p-3 rounded-xl border border-border/50">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          <span className="col-span-5">Graph State Channel</span>
          <span className="col-span-6">
            Source Payload Accessor (`req.body...`)
          </span>
          <span className="col-span-1 text-right">Clear</span>
        </div>

        {stateChannels.map((ch) => {
          return (
            <div
              key={ch.key}
              className="grid grid-cols-12 gap-2 items-center text-xs"
            >
              <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                <span className="font-mono font-bold text-primary truncate bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[11px]">
                  {ch.key}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono bg-background/80 px-1 py-0.5 rounded border border-border/30">
                  {ch.type}
                </span>
              </div>
              <div className="col-span-6">
                <Input
                  value={mapping[ch.key] ?? ""}
                  placeholder={`e.g. body.${ch.key} or headers.x-key`}
                  onChange={(e) =>
                    onMappingChange(ch.key, e.target.value)
                  }
                  className="h-8 text-xs font-mono bg-background/80"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                {mapping[ch.key] !== undefined && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveMapping(ch.key)}
                    title="Remove custom mapping"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Custom Additional Fields */}
        {customFields.map((cf, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 gap-2 items-center text-xs pt-1 border-t border-border/30"
          >
            <div className="col-span-5">
              <Input
                value={cf.key}
                placeholder="Custom state key"
                onChange={(e) =>
                  onUpdateCustomField(idx, "key", e.target.value)
                }
                className="h-8 text-xs font-mono bg-background/80"
              />
            </div>
            <div className="col-span-6">
              <Input
                value={cf.value}
                placeholder="Source accessor e.g. body.custom"
                onChange={(e) =>
                  onUpdateCustomField(idx, "value", e.target.value)
                }
                className="h-8 text-xs font-mono bg-background/80"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveCustomField(idx)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={onAddCustomField}
          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 mt-1 border border-dashed border-border/60 hover:bg-secondary/40"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Mapping Field
        </Button>
      </div>
    </div>
  );
};

import React from "react";
import { Zap } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { StateUpdatesConfigState } from "@workspace/canvas";

interface StateUpdatesPanelProps {
  stateUpdatesConfig: StateUpdatesConfigState;
  stateUpdates: Array<{ channelKey: string; mode?: string; value?: string }>;
  availableFields: string[];
  availableStateChannels?: Array<{ key: string; type: string }>;
  handleToggleStateUpdates: (enabled: boolean) => void;
}

export const StateUpdatesPanel: React.FC<StateUpdatesPanelProps> = ({
  stateUpdatesConfig,
  stateUpdates,
  availableFields,
  availableStateChannels = [],
  handleToggleStateUpdates,
}) => {
  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 nodrag">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`p-1 rounded shrink-0 ${stateUpdatesConfig.enabled !== false ? "bg-amber-500/20 text-amber-500" : "bg-muted/30 text-muted-foreground"}`}
          >
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
              State Updates
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono font-bold shrink-0">
                {stateUpdates.length}
              </span>
            </span>
            <span className="text-[9px] text-muted-foreground font-mono truncate">
              {stateUpdatesConfig.enabled !== false
                ? "Graph state mutation active"
                : "State updates disabled"}
            </span>
          </div>
        </div>

        <div
          className="nodrag shrink-0"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Switch
            checked={stateUpdatesConfig.enabled !== false}
            onCheckedChange={handleToggleStateUpdates}
            className="scale-90"
          />
        </div>
      </div>

      {stateUpdatesConfig.enabled !== false && (
        <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-amber-500/20">
          {stateUpdates.length > 0 ? (
            <div className="flex flex-col gap-1">
              {stateUpdates.map((su, idx) => {
                const matchedChannel = availableStateChannels.find(
                  (c) => c.key === su.channelKey,
                );
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-0.5 bg-amber-500/10 px-2 py-1 rounded text-[10px] font-mono border border-amber-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold truncate max-w-[140px]">
                        {su.channelKey}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase px-1 rounded bg-secondary/50 font-semibold">
                        {su.mode || "set"}
                      </span>
                    </div>
                    {su.value ? (
                      <span className="text-[9px] text-muted-foreground/90 truncate font-mono">
                        {su.value}
                      </span>
                    ) : (
                      matchedChannel && (
                        <span className="text-[9px] text-muted-foreground/70 font-mono">
                          type: {matchedChannel.type}
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-1 bg-secondary/20 p-1.5 rounded border border-border/30">
              <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                <span className="font-bold text-foreground">
                  Graph Fields:
                </span>
                <span className="truncate max-w-[180px]">
                  {availableFields.length > 0
                    ? availableFields.join(", ")
                    : "none"}
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

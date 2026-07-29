import React from "react";
import { NodeProps } from "@xyflow/react";
import { Database, Plus } from "lucide-react";
import type { StateGlobalNode } from "../types";

export const LangGraphCanvasStateNode = ({ data, selected }: NodeProps<StateGlobalNode>) => {
  const channels = data.stateChannels || [];

  const handleAdd = () => {
    if (data.onAddChannel) {
      data.onAddChannel();
    } else if (data.onOpenStateTab) {
      data.onOpenStateTab();
    }
  };

  return (
    <div
      className={`rounded-xl bg-card/95 backdrop-blur-md border-2 border-[#006ddd]/60 w-[260px] p-3 flex flex-col gap-2 transition-all duration-200 shadow-xl relative ${
        selected ? "ring-4 ring-[#006ddd]/20 shadow-[#006ddd]/10 scale-105 border-[#006ddd]" : "hover:border-[#006ddd]/90"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#006ddd]/10 text-[#006ddd] border border-[#006ddd]/20">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-foreground tracking-wide">{data.label || "Graph State"}</span>
            <span className="text-[9px] font-mono text-muted-foreground">{channels.length} state fields</span>
          </div>
        </div>
        <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#006ddd]/10 text-[#006ddd] border border-[#006ddd]/20 font-mono">
          State Schema
        </span>
      </div>

      <div className="flex flex-col gap-1.5 nodrag">
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 py-0.5 bg-secondary/30 rounded border border-border/30 group">
          <span>State Fields</span>
          {(data.onAddChannel || data.onOpenStateTab) && (
            <button
              type="button"
              className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all nodrag"
              onClick={handleAdd}
              title="Add State Field"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {channels.slice(0, 5).map((ch, idx) => (
          <div key={ch.key || idx} className="flex items-center justify-between bg-secondary/40 px-2 py-1 rounded text-[10px] font-mono border border-border/40">
            <span className="font-bold text-foreground truncate max-w-[110px]">{ch.key || "(unnamed)"}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground">{ch.type}</span>
              <span className="text-[9px] px-1 rounded bg-secondary text-[#006ddd] font-semibold">{ch.reducer}</span>
            </div>
          </div>
        ))}
        {channels.length > 5 && (
          <span className="text-[9px] text-muted-foreground text-center font-mono">+{channels.length - 5} more fields</span>
        )}
      </div>
    </div>
  );
};

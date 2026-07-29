import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";
import type { StartNode } from "../types";

export const LangGraphCanvasStartNode = ({ data, selected }: NodeProps<StartNode>) => {
  const channels = data.inputChannels || [];

  return (
    <div
      className={`px-4 py-2.5 rounded-xl bg-card border-2 border-primary text-primary font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-primary/10 transition-all cursor-pointer ${
        selected ? "ring-4 ring-primary/20 scale-105" : "hover:border-primary/80"
      }`}
    >
      <Zap className="w-4 h-4 text-primary animate-pulse shrink-0" />
      <span className="tracking-wide font-extrabold">START</span>
      <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 ml-1">
        {channels.length} inputs
      </span>
      <Handle type="source" position={Position.Right} id="out" className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform" />
    </div>
  );
};

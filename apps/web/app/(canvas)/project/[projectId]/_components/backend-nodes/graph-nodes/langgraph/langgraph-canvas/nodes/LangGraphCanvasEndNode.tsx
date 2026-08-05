import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";
import type { EndNode } from "@workspace/canvas";

export const LangGraphCanvasEndNode = ({
  data,
  selected,
}: NodeProps<EndNode>) => {
  return (
    <div
      className={`px-4 py-2.5 rounded-xl bg-card border-2 border-emerald-500 text-emerald-500 font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer ${
        selected
          ? "ring-4 ring-emerald-500/20 scale-105"
          : "hover:border-emerald-500/80"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
        title="Connect execution output to END"
      />
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      <span className="tracking-wide font-extrabold">END</span>
      <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 ml-1">
        __end__
      </span>
    </div>
  );
};

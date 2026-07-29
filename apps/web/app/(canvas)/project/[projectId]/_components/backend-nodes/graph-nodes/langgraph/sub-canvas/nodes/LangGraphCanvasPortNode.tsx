import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { Layers } from "lucide-react";
import type { PortNode } from "../types";

export const LangGraphCanvasPortNode = ({ data }: NodeProps<PortNode>) => (
  <div className="px-3 py-2 rounded-xl bg-card border-2 border-border text-foreground font-bold text-xs flex items-center gap-2 shadow-lg">
    <Handle type="target" position={Position.Left} id="in" className="!bg-primary !w-3.5 !h-3.5" />
    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
    <span>{data.label}</span>
  </div>
);

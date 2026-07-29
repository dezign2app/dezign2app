import React from "react";
import { Wrench, HelpCircle } from "lucide-react";
import type { LangGraphStepConfig } from "@/types/canvas";
import { TOOL_PALETTE_ITEMS } from "../types";
import { SUB_CANVAS_NODE_LLM, SUB_CANVAS_NODE_TOOL, SUB_CANVAS_NODE_MIDDLEWARE, SUB_CANVAS_NODE_AGENT } from "../constants";

interface ToolsSidebarProps {
  onAddStep: (type: LangGraphStepConfig["type"] | typeof SUB_CANVAS_NODE_LLM | typeof SUB_CANVAS_NODE_TOOL | typeof SUB_CANVAS_NODE_MIDDLEWARE | typeof SUB_CANVAS_NODE_AGENT, label: string) => void;
}

export function ToolsSidebar({ onAddStep }: ToolsSidebarProps) {
  return (
    <div className="w-60 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto p-3 gap-3">
      <div className="flex items-center justify-between px-1 pb-1 border-b border-border/40">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5" /> Tools Sidebar
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {TOOL_PALETTE_ITEMS.map((item) => (
          <button
            key={item.type}
            onClick={() => onAddStep(item.type, item.label)}
            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary border border-border/50 text-left transition-all duration-150 group"
          >
            <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <item.icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground transition-colors">
                {item.label}
              </span>
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                {item.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 px-1">
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span>Click Node to add a node to the canvas</span>
      </div>
    </div>
  );
}

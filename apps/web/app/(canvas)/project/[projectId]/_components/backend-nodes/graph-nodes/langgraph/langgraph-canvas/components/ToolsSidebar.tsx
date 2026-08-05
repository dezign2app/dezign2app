import {
  Brain,
  Cpu,
  GitBranch,
  Wrench,
  Shield,
  Bot,
  Database,
  CheckCircle2,
  Radio,
  HelpCircle,
} from "lucide-react";
import type { LangGraphCanvasNodeAddType } from "@workspace/canvas";
import {
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_END,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_OUTPUT,
  STEP_TYPE_ROUTER,
} from "../constants";

export type ToolPaletteItem = {
  type: LangGraphCanvasNodeAddType;
  label: string;
  desc: string;
  icon: typeof Brain;
};

export const TOOL_PALETTE_ITEMS: ToolPaletteItem[] = [
  {
    type: LANGGRAPH_CANVAS_NODE_NODE,
    label: "Node",
    desc: "LangGraph node with optional LLM, tools, middleware & memory",
    icon: Bot,
  },
  {
    type: STEP_TYPE_ROUTER,
    label: "Conditional Router",
    desc: "Routes execution dynamically based on comparison rules",
    icon: GitBranch,
  },
  {
    type: LANGGRAPH_CANVAS_NODE_END,
    label: "END Node",
    desc: "Terminal graph node representing __end__ execution",
    icon: CheckCircle2,
  },
  {
    type: LANGGRAPH_CANVAS_NODE_LLM,
    label: "LLM config",
    desc: "Configure an LLM provider or raw API endpoint",
    icon: Cpu,
  },
  {
    type: LANGGRAPH_CANVAS_NODE_TOOL,
    label: "Tool",
    desc: "Configure an executable tool for LLMs",
    icon: Wrench,
  },
  {
    type: LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
    label: "Middleware",
    desc: "Interceptors for Human-in-the-loop, rate limit & tracing",
    icon: Shield,
  },
  {
    type: LANGGRAPH_CANVAS_NODE_MEMORY,
    label: "Memory / DB Ref",
    desc: "Save chat history & state checkpoints per session",
    icon: Database,
  },
  {
    type: LANGGRAPH_CANVAS_NODE_OUTPUT,
    label: "Output Channel",
    desc: "Emit SSE, WebSocket, Event, or Webhook output",
    icon: Radio,
  },
];

interface ToolsSidebarProps {
  onAddStep: (type: LangGraphCanvasNodeAddType, label: string) => void;
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

import React from "react";
import { Wrench } from "lucide-react";
import { BackendNode } from "@/types/canvas";

interface LangGraphStepToolsBadgeProps {
  data: BackendNode["data"];
}

export const LangGraphStepToolsBadge: React.FC<
  LangGraphStepToolsBadgeProps
> = ({ data }) => {
  const toolsCount = data.tools?.length ?? 0;
  if (toolsCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/40 py-2 px-1 nodrag">
      <div className="flex items-center gap-1.5">
        <Wrench className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[10px] font-semibold text-emerald-500 uppercase">
          Tools
        </span>
      </div>
      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        {toolsCount} connected
      </span>
    </div>
  );
};

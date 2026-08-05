import React from "react";
import { Plug, Zap, ArrowRight } from "lucide-react";
import type { RouteKind } from "../types";

interface RouteOverviewProps {
  kind: RouteKind;
  sourceNodeLabel: string;
  targetNodeLabel: string;
  edgeId: string;
}

export const RouteOverview: React.FC<RouteOverviewProps> = ({
  kind,
  sourceNodeLabel,
  targetNodeLabel,
  edgeId,
}) => {
  return (
    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {kind === "event" ? (
          <Zap className="w-4 h-4 text-purple-400" />
        ) : (
          <Plug className="w-4 h-4 text-primary" />
        )}
        <span className="font-semibold text-foreground">
          {sourceNodeLabel}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-semibold text-primary">
          {targetNodeLabel}
        </span>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground bg-background/50 px-2 py-0.5 rounded border border-border/40">
        Edge: {edgeId.slice(0, 8)}
      </span>
    </div>
  );
};

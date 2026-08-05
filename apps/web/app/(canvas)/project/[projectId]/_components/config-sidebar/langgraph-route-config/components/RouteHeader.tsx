import React from "react";
import { Network } from "lucide-react";

interface RouteHeaderProps {
  method: string;
  routeLabel: string;
  targetNodeLabel: string;
}

export const RouteHeader: React.FC<RouteHeaderProps> = ({
  method,
  routeLabel,
  targetNodeLabel,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Route Invocation Config
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              {method}
            </span>
          </div>
          <h2 className="text-lg font-bold truncate text-foreground">
            {routeLabel}
          </h2>
          <p className="text-xs text-muted-foreground">
            Invokes agent:{" "}
            <span className="text-foreground font-semibold">
              {targetNodeLabel}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

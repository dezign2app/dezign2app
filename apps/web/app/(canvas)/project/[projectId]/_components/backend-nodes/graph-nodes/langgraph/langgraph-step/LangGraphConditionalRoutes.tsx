import React from "react";
import { Handle, Position } from "@xyflow/react";
import { GitBranch, Plus, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { BackendNode } from "@/types/canvas";

interface LangGraphConditionalRoutesProps {
  data: BackendNode["data"];
  onAddRoute: () => void;
  onDeleteRoute: (routeId: string) => void;
}

export const LangGraphConditionalRoutes: React.FC<
  LangGraphConditionalRoutesProps
> = ({ data, onAddRoute, onDeleteRoute }) => {
  const branches = data.routerConfig?.branches || [];

  return (
    <div className="flex flex-col border-t border-border/40 pt-2 mt-1">
      <div className="flex items-center justify-between text-[10px] font-bold text-sky-400 uppercase tracking-wider px-1 mb-1">
        <span className="flex items-center gap-1">
          <GitBranch className="w-3.5 h-3.5 text-sky-400" /> Routes
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-4 w-4 text-muted-foreground hover:text-foreground nodrag"
          onClick={(e) => {
            e.stopPropagation();
            onAddRoute();
          }}
          title="Add Route"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {branches.map((branch, bIdx) => {
          const routeId = branch.id || `b_${bIdx}`;
          return (
            <div
              key={routeId}
              className="flex items-center justify-between px-2 py-1 bg-background/50 border border-sky-500/30 rounded text-xs relative group/route nodrag"
            >
              <span className="font-medium text-foreground text-[11px] truncate max-w-[140px]">
                {branch.label || `Route ${bIdx + 1}`}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 text-muted-foreground hover:text-destructive opacity-0 group-hover/route:opacity-100 transition-opacity nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRoute(routeId);
                }}
                title="Delete Route"
              >
                <X className="w-3 h-3" />
              </Button>
              <Handle
                type="source"
                position={Position.Right}
                id={routeId}
                className="!w-3 !h-3 !bg-sky-400 !border-2 !border-background !-right-[6px] hover:!scale-125 transition-transform z-10"
                style={{ top: "50%" }}
                title={`Connect route: ${branch.label || `Route ${bIdx + 1}`}`}
              />
            </div>
          );
        })}

        {branches.length === 0 && (
          <span className="text-[10px] text-muted-foreground italic text-center py-1">
            No routes defined. Click + to add.
          </span>
        )}
      </div>
    </div>
  );
};

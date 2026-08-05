import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { GitBranch, Trash2 } from "lucide-react";
import type { StepNode } from "@workspace/canvas";

export function LangGraphCanvasRouterNode({
  data,
  selected,
}: NodeProps<StepNode>) {
  const branches = data.routerConfig?.branches || [];

  return (
    <div
      className={`min-w-[250px] rounded-xl border-2 bg-card shadow-lg transition-all ${selected ? "border-sky-400 ring-4 ring-sky-400/20" : "border-sky-500/50 hover:border-sky-400"}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background !-left-[7px]"
        title="Router input"
      />

      <div className="flex items-center gap-2 border-b border-sky-500/30 bg-sky-500/10 px-3 py-2.5 rounded-t-xl">
        <div className="rounded-md border border-sky-500/30 bg-sky-500/15 p-1.5 text-sky-400">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-sky-300">
            {data.label || "Conditional Router"}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400/70">
            Conditional Router
          </div>
        </div>
        <button
          className="nodrag text-muted-foreground hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            data.onDeleteStep?.();
          }}
          title="Delete router"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        {branches.length === 0 ? (
          <div className="rounded-md border border-dashed border-sky-500/30 px-2 py-3 text-center text-[10px] text-muted-foreground">
            No conditions configured
          </div>
        ) : (
          branches.map((branch, index) => {
            const branchId = branch.id || `branch_${index}`;
            const description = branch.isDefault
              ? "default"
              : `${branch.field || "state"} ${branch.operator} ${branch.value ?? ""}`;
            return (
              <div
                key={branchId}
                className="relative flex items-center gap-2 rounded-md border border-sky-500/20 bg-sky-500/5 px-2 py-1.5 pr-3"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span className="min-w-0 flex-1 truncate text-[10px] text-foreground">
                  {branch.label || `Route ${index + 1}`}
                </span>
                <span
                  className="max-w-[105px] truncate text-[9px] font-mono text-muted-foreground"
                  title={description}
                >
                  {description}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={branchId}
                  className="!bg-sky-400 !w-3 !h-3 !border-2 !border-background !-right-[7px]"
                  title={`Connect ${branch.label || branchId}`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

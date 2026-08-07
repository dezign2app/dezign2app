import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { CreditCard, Settings, PlugZap } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { NodeHeader } from "../../common";
import { Textarea } from "@workspace/ui/components/textarea";

export const PaymentsNode = ({
  id,
  data,
  selected,
}: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const setActiveConfigItem = useBackendCanvasStore(
    (s) => s.setActiveConfigItem,
  );
  const edges = useBackendCanvasStore((s) => s.edges);
  const nodes = useBackendCanvasStore((s) => s.nodes);

  const updateData = (changes: Partial<BackendNode["data"]>) =>
    updateNode(id, { data: { ...data, ...changes } });

  const plans = data.plans || [
    { id: "plan-free", name: "Free Tier", price: "$0", interval: "monthly" },
    { id: "plan-pro", name: "Pro Plan", price: "$29", interval: "monthly" },
    { id: "plan-enterprise", name: "Enterprise", price: "$199", interval: "monthly" },
  ];

  // Find connected AuthNode via injects-plugin edge
  const connectedAuthEdge = edges.find(
    (e) =>
      (e.source === id && e.targetHandle === "payments-plugin-in") ||
      (e.target === id && e.sourceHandle === "injects-plugin-out"),
  );
  const connectedAuthNode = connectedAuthEdge
    ? nodes.find(
        (n) =>
          n.id ===
          (connectedAuthEdge.source === id
            ? connectedAuthEdge.target
            : connectedAuthEdge.source),
      )
    : null;

  const isPluginInjected = Boolean(connectedAuthNode);

  return (
    <div
      className={cn(
        "shadow-xl rounded-xl bg-card border-2 min-w-[290px] max-w-[360px] flex flex-col relative overflow-hidden transition-all duration-200",
        selected ? "border-emerald-500" : "border-border",
      )}
    >
      {/* Source output handle (Code-injection edge into Better Auth) */}
      <Handle
        type="source"
        position={Position.Right}
        id="injects-plugin-out"
        className="w-3 h-3 !bg-emerald-500 rounded-full border-2 border-background -right-1.5"
        style={{ top: "18px" }}
        title="injects-plugin edge -> Connect to Auth Server to register Creem Better Auth plugin"
      />

      <NodeHeader
        id={id}
        data={data}
        icon={CreditCard}
        title="Payments Service"
        colorClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        selected={selected}
      />

      {/* Info Bar */}
      <div className="px-3 py-1.5 bg-muted/60 border-b flex items-center justify-between gap-2 nodrag text-[10px]">
        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          Creem.io
        </span>
        <span className="text-muted-foreground font-mono">
          {plans.length} {plans.length === 1 ? "Plan" : "Plans"} configured
        </span>
      </div>

      {/* Description */}
      <div className="px-3 py-2 bg-secondary/5 nodrag">
        <Textarea
          className="min-h-[20px] text-xs bg-transparent border-none shadow-none p-1 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          placeholder="Billing & subscription payments service..."
          value={data.description || ""}
          onChange={(e) => updateData({ description: e.target.value })}
        />
      </div>

      {/* Plugin Injection Indicator */}
      <div className="px-3 py-1.5 border-t border-border/50 bg-background/50 flex items-center justify-between text-[10px] nodrag">
        <span className="flex items-center gap-1 text-muted-foreground font-mono">
          <PlugZap className="w-3 h-3 text-emerald-500" /> Plugin Injection:
        </span>
        <span
          className={cn(
            "px-2 py-0.5 rounded font-medium border text-[10px]",
            isPluginInjected
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border/40",
          )}
        >
          {isPluginInjected
            ? `Wired to ${connectedAuthNode?.data?.label || "Auth"}`
            : "Not Wired to Auth"}
        </span>
      </div>

      {/* Footer Controls */}
      <div className="p-2 border-t border-border/50 flex items-center justify-between gap-2 bg-muted/20 nodrag">
        <span className="text-[10px] text-muted-foreground font-mono px-2">
          @creem_io/better-auth
        </span>

        <button
          onClick={() =>
            setActiveConfigItem({
              type: "payments",
              id,
              nodeId: id,
            })
          }
          className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors nodrag shrink-0"
          title="Configure Payments Details"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

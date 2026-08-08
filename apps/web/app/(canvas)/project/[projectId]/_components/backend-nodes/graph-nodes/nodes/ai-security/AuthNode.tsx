import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { ShieldCheck, Settings } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { NodeHeader } from "../../common";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  AUTH_FRAMEWORK_OPTIONS,
  BETTER_AUTH_VERSIONS,
  DEFAULT_AUTH_FRAMEWORK,
  DEFAULT_BETTER_AUTH_VERSION,
  AuthFramework,
} from "@workspace/canvas";

function isAuthFramework(val: string): val is AuthFramework {
  return AUTH_FRAMEWORK_OPTIONS.some((o) => o.value === val);
}

export const AuthNode = ({
  id,
  data,
  selected,
}: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const setActiveConfigItem = useBackendCanvasStore(
    (s) => s.setActiveConfigItem,
  );
  const edges = useBackendCanvasStore((s) => s.edges);

  const updateData = (changes: Partial<BackendNode["data"]>) =>
    updateNode(id, { data: { ...data, ...changes } });

  const framework = data.framework || DEFAULT_AUTH_FRAMEWORK;
  const version = data.version || DEFAULT_BETTER_AUTH_VERSION;

  // Calculate connected WebApp / service apps
  const connectedAppsCount = edges.filter(
    (e) => e.source === id || e.target === id,
  ).length;

  // Check if Payments node is connected via injects-plugin handle
  const isPaymentsPluginInjected = edges.some(
    (e) => e.target === id && e.targetHandle === "payments-plugin-in",
  );

  const enabledPlugins = data.plugins || ["bearer", "admin", "organization"];

  return (
    <div
      className={cn(
        "shadow-xl rounded-xl bg-card border-2 min-w-[300px] max-w-[370px] flex flex-col relative transition-all duration-200",
        selected ? "border-indigo-500" : "border-border",
      )}
    >
      {/* Target input handle from Payments node (Plugin injection) */}
      <Handle
        type="target"
        position={Position.Left}
        id="payments-plugin-in"
        className="w-3 h-3 !bg-emerald-500 rounded-full border-2 border-background -left-1.5"
        style={{ top: "18px" }}
        title="Connect Creem Payments node to inject plugin"
      />

      {/* Target input handle for standard request input */}
      <Handle
        type="target"
        position={Position.Left}
        id="auth-in"
        className="w-2.5 h-2.5 !bg-indigo-500 rounded-full border-2 border-background -left-1.5"
        style={{ top: "54px" }}
        title="Auth Request Input"
      />

      {/* Source output handle to WebApp / Services */}
      <Handle
        type="source"
        position={Position.Right}
        id="auth-out"
        className="w-3 h-3 !bg-indigo-500 rounded-full border-2 border-background -right-1.5"
        style={{ top: "50%" }}
        title="Auth Server Handle -> Connect to WebApp"
      />

      <NodeHeader
        id={id}
        data={data}
        icon={ShieldCheck}
        title="Auth Server"
        colorClass="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
        selected={selected}
      />

      {/* Info bar: Connected Apps Count */}
      <div className="px-3 py-1.5 bg-muted/60 border-b flex items-center justify-between gap-2 nodrag text-[10px]">
        <span className="text-muted-foreground font-mono">
          {connectedAppsCount} {connectedAppsCount === 1 ? "app" : "apps"} connected
        </span>
      </div>

      <div className="px-3 py-2 bg-secondary/5 nodrag">
        <Textarea
          className="min-h-[20px] text-xs bg-transparent border-none shadow-none p-1 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          placeholder="Auth service description..."
          value={data.description || ""}
          onChange={(e) => updateData({ description: e.target.value })}
        />
      </div>

      {/* Plugin Pills & Injections Bar */}
      <div className="px-3 py-2 border-t border-border/50 flex flex-wrap gap-1 bg-background/50 nodrag">
        {enabledPlugins.slice(0, 5).map((plugin) => (
          <span
            key={plugin}
            className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium capitalize"
          >
            {plugin}
          </span>
        ))}
        {isPaymentsPluginInjected && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium">
            + Creem Plugin
          </span>
        )}
      </div>

      <div className="p-2.5 border-t border-border/50 flex items-center justify-between gap-2 bg-muted/20 nodrag">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Select
            value={framework}
            onValueChange={(val: string) => {
              if (isAuthFramework(val)) {
                const option = AUTH_FRAMEWORK_OPTIONS.find((o) => o.value === val);
                updateData({
                  framework: val,
                  provider: option?.label || "Better Auth",
                });
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs font-medium px-2 py-1 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 nodrag focus:ring-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="nodrag">
              {AUTH_FRAMEWORK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {framework === "better_auth" && (
            <Select
              value={version}
              onValueChange={(val: string) => updateData({ version: val })}
            >
              <SelectTrigger className="h-7 w-[78px] text-[11px] font-mono px-1.5 py-1 bg-background/60 border border-border nodrag focus:ring-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="nodrag font-mono">
                {BETTER_AUTH_VERSIONS.map((ver) => (
                  <SelectItem key={ver.value} value={ver.value} className="text-xs font-mono">
                    {ver.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <button
          onClick={() =>
            setActiveConfigItem({
              type: "auth",
              id,
              nodeId: id,
            })
          }
          className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors nodrag shrink-0"
          title="Configure Auth Details"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

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
} from "@workspace/canvas";

export const AuthNode = ({
  id,
  data,
  selected,
}: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const setActiveConfigItem = useBackendCanvasStore(
    (s) => s.setActiveConfigItem,
  );

  const updateData = (changes: Partial<BackendNode["data"]>) =>
    updateNode(id, { data: { ...data, ...changes } });

  const framework = data.framework || DEFAULT_AUTH_FRAMEWORK;
  const version = data.version || DEFAULT_BETTER_AUTH_VERSION;

  return (
    <div
      className={cn(
        "shadow-md rounded-xl bg-card border-2 min-w-[290px] max-w-[360px] flex flex-col relative",
        selected ? "border-indigo-500" : "border-border",
      )}
    >
      <NodeHeader
        id={id}
        data={data}
        icon={ShieldCheck}
        title="Auth Framework"
        colorClass="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
        selected={selected}
      />

      {/* Target input handle from WebClient / API Gateway */}
      <Handle
        type="target"
        position={Position.Left}
        id="auth-in"
        className="w-2.5 h-2.5 !bg-indigo-500 rounded-full"
        title="Auth Request Input"
      />

      {/* Source output handle to Services / DB */}
      <Handle
        type="source"
        position={Position.Right}
        id="auth-out"
        className="w-2.5 h-2.5 !bg-indigo-500 rounded-full"
        title="Auth Context Output"
      />

      <div className="px-3 py-2 bg-secondary/5 nodrag">
        <Textarea
          className="min-h-[20px] text-xs bg-transparent border-none shadow-none p-1 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          placeholder="Auth service description..."
          value={data.description || ""}
          onChange={(e) => updateData({ description: e.target.value })}
        />
      </div>

      <div className="p-2.5 border-t border-border/50 flex items-center justify-between gap-2 bg-muted/20 nodrag">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Framework Select */}
          <Select
            value={framework}
            onValueChange={(val: any) => {
              const option = AUTH_FRAMEWORK_OPTIONS.find((o) => o.value === val);
              updateData({
                framework: val,
                provider: option?.label || "Better Auth",
              });
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

          {/* Version Select (for Better Auth) */}
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

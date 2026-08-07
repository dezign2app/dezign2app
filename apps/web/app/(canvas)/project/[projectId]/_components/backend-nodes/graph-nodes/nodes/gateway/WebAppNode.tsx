import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import {
  Globe,
  Lock,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { NodeHeader } from "../../common";

export const WebAppNode = ({
  id,
  data,
  selected,
}: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const setActiveConfigItem = useBackendCanvasStore(
    (s) => s.setActiveConfigItem,
  );
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const edges = useBackendCanvasStore((s) => s.edges);

  const appSlug =
    data.appSlug ||
    (data.label || "web-app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const port = data.port || "3000";

  // Find incoming AuthNode connection
  const isAuthConnected = edges.some(
    (e) =>
      (e.target === id && e.targetHandle === "auth-in") ||
      (e.source === id && e.sourceHandle === "auth-out"),
  );

  // Helper to find connected page nodes for each section handle
  const getConnectedPages = (sectionHandleId: string) => {
    const incomingEdges = edges.filter(
      (e) =>
        (e.target === id && e.targetHandle === sectionHandleId) ||
        (e.source === id && e.sourceHandle === sectionHandleId),
    );
    return incomingEdges
      .map((e) =>
        nodes.find((n) => n.id === (e.source === id ? e.target : e.source)),
      )
      .filter((n): n is BackendNode => Boolean(n));
  };

  const publicPages = getConnectedPages("public-in");
  const privatePages = getConnectedPages("private-in");
  const rolePages = getConnectedPages("role-in");
  const paymentPages = getConnectedPages("payment-in");
  const orgPages = getConnectedPages("org-in");

  return (
    <div
      className={cn(
        "shadow-xl rounded-xl bg-card border-2 min-w-[280px] max-w-[360px] flex flex-col transition-all duration-300 relative overflow-hidden",
        selected ? "border-indigo-500" : "border-border",
      )}
    >
      {/* Main Auth Target Handle (Top Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="auth-in"
        className="w-3 h-3 !bg-indigo-500 rounded-full border-2 border-background -left-1.5"
        style={{ top: "18px" }}
        title="Connect AuthNode to bind backend authentication service"
      />

      {/* Node Header */}
      <NodeHeader
        id={id}
        data={data}
        nodeType="webApp"
        icon={Globe}
        title="Web App"
        selected={selected}
      />

      {/* App Meta Info Bar */}
      <div className="px-3 py-1.5 bg-muted border-b flex items-center justify-between gap-2 nodrag">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono text-muted-foreground truncate">
            apps/{appSlug}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono border border-border/50 shrink-0">
            :{port}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border",
              isAuthConnected || (data.authMode || "better_auth") === "better_auth"
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                : "bg-muted text-muted-foreground border-border/40",
            )}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>
              {isAuthConnected
                ? "Auth Connected"
                : (data.authMode || "better_auth") === "better_auth"
                ? "Better Auth (Default)"
                : "No Auth"}
            </span>
          </div>

          <button
            onClick={() =>
              setActiveConfigItem({
                type: "webApp",
                id,
                nodeId: id,
              })
            }
            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
            title="App Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Protection Sections Container */}
      <div className="p-2.5 flex flex-col gap-2 bg-muted opacity-100 nodrag">
        {/* 🌐 Public Section */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-card border border-border/80 opacity-100 relative">
          <Handle
            type="target"
            position={Position.Right}
            id="public-in"
            className="w-2.5 h-2.5 !bg-muted-foreground rounded-full border-2 border-background -right-4 opacity-100"
            style={{ top: "50%" }}
            title="Connect Public Page nodes here"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground opacity-100 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-foreground opacity-100" /> Public Section
            </span>
            <span className="text-[10px] text-muted-foreground font-mono opacity-100">Open Access</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {publicPages.length === 0 ? (
              <span className="text-[10px] text-muted-foreground/70 italic opacity-100">
                Plug Public WebClient pages here
              </span>
            ) : (
              publicPages.map((p) => (
                <span
                  key={p.id}
                  className="text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground font-mono border border-border opacity-100"
                >
                  {p.data.label || "Page"}
                </span>
              ))
            )}
          </div>
        </div>

        {/* 🔒 Private Section Cluster */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-card border border-border/80 opacity-100 relative">
          <Handle
            type="target"
            position={Position.Right}
            id="private-in"
            className="w-2.5 h-2.5 !bg-indigo-400 rounded-full border-2 border-background -right-4 opacity-100"
            style={{ top: "50%" }}
            title="Connect Private Page cluster nodes here"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground opacity-100 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400 opacity-100" /> Private Section
            </span>
            <span className="text-[10px] text-muted-foreground font-mono opacity-100">Protected Cluster</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {privatePages.length === 0 ? (
              <span className="text-[10px] text-muted-foreground/70 italic opacity-100">
                Plug Private WebClient pages here
              </span>
            ) : (
              privatePages.map((p) => (
                <span
                  key={p.id}
                  className="text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground font-mono border border-border opacity-100"
                >
                  {p.data.label || "Page"}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

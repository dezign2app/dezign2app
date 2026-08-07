import React from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import {
  Globe,
  Lock,
  Settings,
  ShieldCheck,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { WebAppZone } from "@workspace/canvas/types";
import { cn } from "@workspace/ui/lib/utils";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { NodeHeader } from "../../common";

const DEFAULT_REDIRECTS = {
  "no-auth": "/login",
  "no-org": "/select-org",
  "wrong-role": "/unauthorized",
  "no-access": "/pricing",
  "wrong-plan": "/pricing",
  default: "/login",
};

const DEFAULT_ZONES: WebAppZone[] = [
  {
    id: "zone-public",
    name: "Public Section",
    handleId: "public-in",
    accessType: "public",
    rule: {
      id: "rule-public",
      scope: "zone",
      conditions: { kind: "leaf", condition: { type: "auth", op: "signedOut" } },
      redirects: { ...DEFAULT_REDIRECTS },
    },
  },
  {
    id: "zone-private",
    name: "Private Section",
    handleId: "private-in",
    accessType: "protected",
    rule: {
      id: "rule-private",
      scope: "zone",
      conditions: { kind: "leaf", condition: { type: "auth", op: "signedIn" } },
      redirects: { ...DEFAULT_REDIRECTS },
    },
  },
];

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

  // Find connected Auth Node
  const connectedAuthEdge = edges.find(
    (e) =>
      (e.target === id && e.targetHandle === "auth-in") ||
      (e.source === id && e.sourceHandle === "auth-out"),
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

  const isAuthConnected = Boolean(connectedAuthNode);
  const authNodeLabel = connectedAuthNode?.data?.label || "Auth";

  // User-defined zones or default zones
  const zones: WebAppZone[] = data.zones && data.zones.length > 0 ? data.zones : DEFAULT_ZONES;

  const handleAddZone = () => {
    const newZoneId = `zone-${Date.now()}`;
    const newZone: WebAppZone = {
      id: newZoneId,
      name: `Custom Zone ${zones.length + 1}`,
      handleId: `${newZoneId}-in`,
      accessType: "protected",
      rule: {
        id: `rule-${newZoneId}`,
        scope: "zone",
        conditions: { kind: "leaf", condition: { type: "auth", op: "signedIn" } },
        redirects: { ...DEFAULT_REDIRECTS },
      },
    };
    updateNode(id, { data: { ...data, zones: [...zones, newZone] } });
  };

  // Helper to find connected WebClient page nodes for a given section handle
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

  return (
    <div
      className={cn(
        "shadow-xl rounded-xl bg-card border-2 min-w-[290px] max-w-[370px] flex flex-col transition-all duration-300 relative",
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
          <button
            onClick={() => {
              if (connectedAuthNode) {
                setActiveConfigItem({
                  type: "auth",
                  id: connectedAuthNode.id,
                  nodeId: connectedAuthNode.id,
                });
              }
            }}
            className={cn(
              "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors",
              isAuthConnected
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer"
                : "bg-muted text-muted-foreground border-border/40",
            )}
            title={isAuthConnected ? `Wired to ${authNodeLabel}` : "No Auth connected"}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>
              {isAuthConnected ? `🔒 Auth → ${authNodeLabel}` : "⚠️ No Auth connected"}
            </span>
          </button>

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

      {/* Dynamic Protection Sections Container */}
      <div className="p-2.5 flex flex-col gap-2 bg-muted/60 opacity-100 nodrag">
        {zones.map((zone) => {
          const connectedPages = getConnectedPages(zone.handleId);
          const isPublic = zone.accessType === "public";

          return (
            <div
              key={zone.id}
              className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-card border border-border/80 opacity-100 relative group"
            >
              {/* Dynamic Section Handle (Right) */}
              <Handle
                type="source"
                position={Position.Right}
                id={zone.handleId}
                className={cn(
                  "w-2.5 h-2.5 rounded-full border-2 border-background -right-4 opacity-100 cursor-pointer",
                  isPublic ? "!bg-muted-foreground" : "!bg-indigo-500",
                )}
                style={{ top: "50%" }}
                title={`Connect WebClient pages to ${zone.name}`}
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  {isPublic ? (
                    <Globe className="w-3.5 h-3.5 text-foreground" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                  {zone.name}
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {isPublic ? "Open Access" : "Protected"}
                  </span>
                  <button
                    onClick={() =>
                      setActiveConfigItem({
                        type: "zone",
                        id: zone.id,
                        nodeId: id,
                      })
                    }
                    className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                    title={`Configure rules for ${zone.name}`}
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Connected Page Pills */}
              <div className="flex flex-wrap gap-1 mt-1">
                {connectedPages.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground/70 italic">
                    Plug WebClient pages here
                  </span>
                ) : (
                  connectedPages.map((p) => (
                    <span
                      key={p.id}
                      className="text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground font-mono border border-border"
                    >
                      {p.data.label || "Page"}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Add Custom Section Button */}
        <button
          onClick={handleAddZone}
          className="flex items-center justify-center gap-1.5 p-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-card/60 hover:bg-card border border-dashed border-border/80 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add Protected Section
        </button>
      </div>
    </div>
  );
};

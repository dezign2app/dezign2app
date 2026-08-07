import React from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Globe,
  Lock,
  Key,
  Layers,
  ShieldCheck,
  Plus,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import {
  BackendNode,
  WEB_CLIENT_TECH_OPTIONS,
  WebClientTechStack,
  WebClientTechVersion,
} from "@/types/canvas";
import { WebAppZone } from "@workspace/canvas";

function isWebClientTechStack(val: string): val is WebClientTechStack {
  return WEB_CLIENT_TECH_OPTIONS.some((t) => t.value === val);
}

function isWebClientTechVersion(val: string): val is WebClientTechVersion {
  return WEB_CLIENT_TECH_OPTIONS.some((t) => t.versions.some((v) => v.value === val));
}

export const WebAppConfig = ({
  id,
  nodeId,
}: {
  id: string;
  nodeId: string;
}) => {
  const node = useBackendCanvasStore((s) =>
    s.nodes.find((n) => n.id === nodeId),
  );
  const allNodes = useBackendCanvasStore((s) => s.nodes);
  const allEdges = useBackendCanvasStore((s) => s.edges);
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const setActiveConfigItem = useBackendCanvasStore(
    (s) => s.setActiveConfigItem,
  );

  if (!node) return null;

  const data = node.data;

  const updateData = (changes: Partial<typeof data>) => {
    updateNode(nodeId, { data: { ...data, ...changes } });
  };

  const appSlug =
    data.appSlug ||
    (data.label || "web-app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const port = data.port || "3000";
  const defaultLoginRoute = data.defaultLoginRoute || "/login";

  const authNodes = allNodes.filter((n) => n.type === "auth");
  const paymentsNodes = allNodes.filter((n) => n.type === "payments");

  const zones: WebAppZone[] = data.zones || [
    {
      id: "zone-public",
      name: "Public Section",
      handleId: "public-in",
      accessType: "public",
      rule: {
        id: "rule-public",
        scope: "zone",
        conditions: { kind: "leaf", condition: { type: "auth", op: "signedOut" } },
        redirects: { default: "/login" },
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
        redirects: { "no-auth": "/login", default: "/login" },
      },
    },
  ];

  const handleAddZone = () => {
    const newZoneId = `zone-${Date.now()}`;
    const newZone: WebAppZone = {
      id: newZoneId,
      name: `Custom Section ${zones.length + 1}`,
      handleId: `${newZoneId}-in`,
      accessType: "protected",
      rule: {
        id: `rule-${newZoneId}`,
        scope: "zone",
        conditions: { kind: "leaf", condition: { type: "auth", op: "signedIn" } },
        redirects: { "no-auth": "/login", default: "/login" },
      },
    };
    updateData({ zones: [...zones, newZone] });
  };

  const handleRemoveZone = (zoneId: string) => {
    const updated = zones.filter((z) => z.id !== zoneId);
    updateData({ zones: updated });
  };

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-500/15 text-indigo-500 rounded border border-indigo-500/20 shadow-sm flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> WEB APP GATEWAY
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {data.label || "Web Application"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure application monorepo settings, connected backend services, and dynamic protection sections.
        </p>
      </div>

      {/* App Identity Section */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>App Identity & Monorepo Configuration</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">App Name</Label>
            <Input
              value={data.label || ""}
              onChange={(e) => {
                const label = e.target.value;
                const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                updateData({ label, appSlug: slug });
              }}
              placeholder="e.g. Customer Portal"
              className="h-8 text-xs bg-background/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Monorepo Slug (apps/...)</Label>
            <Input
              value={appSlug}
              onChange={(e) => updateData({ appSlug: e.target.value })}
              placeholder="e.g. customer-portal"
              className="h-8 text-xs font-mono bg-background/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-1">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Dev Server Port</Label>
            <Input
              value={port}
              onChange={(e) => updateData({ port: e.target.value })}
              placeholder="3000"
              className="h-8 text-xs font-mono bg-background/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Default Auth Route</Label>
            <Input
              value={defaultLoginRoute}
              onChange={(e) => updateData({ defaultLoginRoute: e.target.value })}
              placeholder="/login"
              className="h-8 text-xs font-mono bg-background/50"
            />
          </div>
        </div>
      </div>

      {/* Framework & Version Selection */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Framework & Version</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Framework</Label>
            <Select
              value={data.techStack || "nextjs"}
              onValueChange={(val: string) => {
                if (isWebClientTechStack(val)) {
                  const selectedTech = WEB_CLIENT_TECH_OPTIONS.find((t) => t.value === val);
                  const defaultVer = selectedTech?.defaultVersion;
                  updateData({
                    techStack: val,
                    ...(defaultVer && isWebClientTechVersion(defaultVer)
                      ? { techVersion: defaultVer }
                      : {}),
                  });
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs font-medium bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEB_CLIENT_TECH_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Version</Label>
            <Select
              value={
                data.techVersion ||
                WEB_CLIENT_TECH_OPTIONS.find(
                  (t) => t.value === (data.techStack || "nextjs"),
                )?.defaultVersion ||
                "16.x"
              }
              onValueChange={(val: string) => {
                if (isWebClientTechVersion(val)) {
                  updateData({ techVersion: val });
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs font-mono bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-mono">
                {(
                  WEB_CLIENT_TECH_OPTIONS.find(
                    (t) => t.value === (data.techStack || "nextjs"),
                  )?.versions || [{ value: "16.x", label: "16.x" }]
                ).map((v) => (
                  <SelectItem key={v.value} value={v.value} className="text-xs font-mono">
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dynamic Protection Sections Manager */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Protected Sections / Clusters ({zones.length})</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs cursor-pointer" onClick={handleAddZone}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Section
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs"
            >
              <div className="flex items-center gap-2">
                {zone.accessType === "public" ? (
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span className="font-medium text-foreground">{zone.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">({zone.handleId})</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setActiveConfigItem({
                      type: "zone",
                      id: zone.id,
                      nodeId,
                    })
                  }
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Config Rules
                </Button>
                {zone.id !== "zone-public" && (
                  <button
                    onClick={() => handleRemoveZone(zone.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

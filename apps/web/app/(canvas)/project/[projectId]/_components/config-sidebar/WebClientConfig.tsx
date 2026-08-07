import React from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Globe, Lock, Layers, Key, ShieldCheck } from "lucide-react";

export const WebClientConfig = ({
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

  if (!node) return null;

  const data = node.data;

  const updateData = (changes: Partial<typeof data>) => {
    updateNode(nodeId, { data: { ...data, ...changes } });
  };

  const appName = data.appName || "Web App";
  const appSlug =
    data.appSlug ||
    appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const useZoneDefault = data.useZoneDefault !== false;
  const accessType = data.accessType || "public";
  const allowedRoles = data.allowedRoles || [];
  const requiredPlans = data.requiredPlans || [];
  const allowedOrgRoles = data.allowedOrgRoles || [];
  const redirectTo = data.redirectTo || (accessType === "payment-gated" ? "/pricing" : accessType === "org-gated" ? "/select-org" : "/login");

  const authNodes = allNodes.filter((n) => n.type === "auth");

  // Determine connected WebApp section name
  const incomingEdge = allEdges.find((e) => e.target === nodeId || e.source === nodeId);
  const connectedWebApp = incomingEdge
    ? allNodes.find(
        (n) => n.type === "webApp" && (n.id === incomingEdge.source || n.id === incomingEdge.target),
      )
    : null;

  let connectedZoneName: string | null = null;
  if (connectedWebApp && incomingEdge) {
    const handleId =
      incomingEdge.source === connectedWebApp.id
        ? incomingEdge.sourceHandle
        : incomingEdge.targetHandle;
    const zones = connectedWebApp.data?.zones || [];
    const matchedZone = zones.find((z) => z.handleId === handleId);
    if (matchedZone) {
      connectedZoneName = matchedZone.name;
    }
  }

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-500 rounded border border-emerald-500/20 shadow-sm flex items-center gap-1">
            <Globe className="w-3 h-3" /> WEB CLIENT (PAGE)
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {data.label || "Web Client Page"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure frontend page details, protection rule inheritance, and custom access overrides.
        </p>
      </div>

      {/* App & Zone Membership Section */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Page & Section Membership</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Page Route Name</Label>
            <Input
              value={data.label || ""}
              onChange={(e) => updateData({ label: e.target.value })}
              placeholder="e.g. /dashboard/settings"
              className="h-8 text-xs bg-background/50 font-mono"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Target Monorepo App</Label>
            <Input
              value={appSlug}
              onChange={(e) => updateData({ appSlug: e.target.value })}
              placeholder="e.g. customer-portal"
              className="h-8 text-xs font-mono bg-background/50"
            />
          </div>
        </div>

        <div className="p-3 bg-muted/40 rounded-lg border border-border/50 flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Connected WebApp Section:</span>
          <span className="font-mono font-semibold text-foreground">
            {connectedZoneName ? `🔒 ${connectedZoneName}` : "Unattached Page"}
          </span>
        </div>
      </div>

      {/* Protection Rule Inheritance / Override */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Protection Rules</span>
          </div>
          <Select
            value={useZoneDefault ? "zone" : "custom"}
            onValueChange={(val) => updateData({ useZoneDefault: val === "zone" })}
          >
            <SelectTrigger className="h-8 text-xs w-[180px] bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zone" className="text-xs">
                Inherit Section Default Rules
              </SelectItem>
              <SelectItem value="custom" className="text-xs">
                Custom Override for This Page
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {useZoneDefault ? (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
            <p className="font-semibold mb-1">Inheriting Section Rules:</p>
            <p className="text-[11px] text-muted-foreground">
              This page automatically inherits all access conditions and failure redirect routes configured on the parent WebApp Section.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2 border-t border-border/40">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Custom Access Type</Label>
              <Select
                value={accessType}
                onValueChange={(val: "public" | "private" | "role-gated" | "payment-gated" | "org-gated") => {
                  const defaultRedirect =
                    val === "payment-gated"
                      ? "/pricing"
                      : val === "org-gated"
                      ? "/select-org"
                      : "/login";
                  updateData({ accessType: val, redirectTo: defaultRedirect });
                }}
              >
                <SelectTrigger className="h-9 text-xs font-medium bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public" className="text-xs">
                    🌐 Public (Open to anyone)
                  </SelectItem>
                  <SelectItem value="private" className="text-xs">
                    🔒 Private (Authenticated user session required)
                  </SelectItem>
                  <SelectItem value="role-gated" className="text-xs">
                    🛡️ Role-Gated (Specific user roles required)
                  </SelectItem>
                  <SelectItem value="payment-gated" className="text-xs">
                    💳 Payment-Gated (Active paid plan tier required)
                  </SelectItem>
                  <SelectItem value="org-gated" className="text-xs">
                    🏢 Organization-Gated (Active Organization required)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessType === "role-gated" && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Allowed Roles (comma-separated)</Label>
                <Input
                  value={allowedRoles.join(", ")}
                  onChange={(e) =>
                    updateData({
                      allowedRoles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. admin, superadmin"
                  className="h-8 text-xs bg-background/50"
                />
              </div>
            )}

            {accessType === "payment-gated" && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Required Plan Tiers (comma-separated)</Label>
                <Input
                  value={requiredPlans.join(", ")}
                  onChange={(e) =>
                    updateData({
                      requiredPlans: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. pro, enterprise"
                  className="h-8 text-xs bg-background/50"
                />
              </div>
            )}

            {accessType !== "public" && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Unauthorized Redirect Target Route</Label>
                <Input
                  value={redirectTo}
                  onChange={(e) => updateData({ redirectTo: e.target.value })}
                  placeholder="e.g. /login, /pricing"
                  className="h-8 text-xs font-mono bg-background/50"
                />
              </div>
            )}
          </div>
        )}

        {/* Auth Page Checkbox */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-border/40">
          <Checkbox
            id="isAuthPage"
            checked={Boolean(data.isAuthPage)}
            onCheckedChange={(val) => updateData({ isAuthPage: Boolean(val) })}
          />
          <Label htmlFor="isAuthPage" className="text-xs font-normal cursor-pointer">
            This page is the Login / Authentication entry page (unauthenticated target)
          </Label>
        </div>
      </div>
    </div>
  );
};

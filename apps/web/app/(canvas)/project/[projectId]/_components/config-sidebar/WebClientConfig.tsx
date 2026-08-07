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
import { Globe, Lock, Shield, CreditCard, Building2, Layers, Key } from "lucide-react";

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
  const accessType = data.accessType || "public";
  const allowedRoles = data.allowedRoles || [];
  const requiredPlans = data.requiredPlans || [];
  const allowedOrgRoles = data.allowedOrgRoles || [];
  const redirectTo = data.redirectTo || (accessType === "payment-gated" ? "/pricing" : accessType === "org-gated" ? "/select-org" : "/login");

  const authNodes = allNodes.filter((n) => n.type === "auth");

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-500 rounded border border-emerald-500/20 shadow-sm flex items-center gap-1">
            <Globe className="w-3 h-3" /> WEB CLIENT (PAGE)
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {data.label || "Web Client"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure frontend page access control, multi-tenant organization requirements, subscription tier gating, and monorepo app grouping.
        </p>
      </div>

      {/* App Grouping Section */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>App Grouping</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">App Name</Label>
            <Input
              value={appName}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                updateData({ appName: name, appSlug: slug });
              }}
              placeholder="e.g. Customer Portal"
              className="h-8 text-xs bg-background/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">App Slug (Target App)</Label>
            <Input
              value={appSlug}
              onChange={(e) => updateData({ appSlug: e.target.value })}
              placeholder="e.g. customer-portal"
              className="h-8 text-xs font-mono bg-background/50"
            />
          </div>
        </div>
      </div>

      {/* Page Access Control Section */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Page Access Control</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Access Type</Label>
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

        {/* Dynamic Access Gating Details */}
        {accessType === "role-gated" && (
          <div className="flex flex-col gap-2 mt-2">
            <Label className="text-xs text-muted-foreground">Allowed Roles (comma-separated)</Label>
            <Input
              value={allowedRoles.join(", ")}
              onChange={(e) =>
                updateData({
                  allowedRoles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="e.g. admin, superadmin, editor"
              className="h-8 text-xs bg-background/50"
            />
          </div>
        )}

        {accessType === "payment-gated" && (
          <div className="flex flex-col gap-2 mt-2">
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

        {accessType === "org-gated" && (
          <div className="flex flex-col gap-2 mt-2">
            <Label className="text-xs text-muted-foreground">Allowed Org Roles (comma-separated)</Label>
            <Input
              value={allowedOrgRoles.join(", ")}
              onChange={(e) =>
                updateData({
                  allowedOrgRoles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="e.g. owner, admin, member"
              className="h-8 text-xs bg-background/50"
            />
          </div>
        )}

        {/* Redirect Target */}
        {accessType !== "public" && (
          <div className="flex flex-col gap-2 mt-2">
            <Label className="text-xs text-muted-foreground">Unauthorized Redirect Target Route</Label>
            <Input
              value={redirectTo}
              onChange={(e) => updateData({ redirectTo: e.target.value })}
              placeholder="e.g. /login, /pricing, /select-org"
              className="h-8 text-xs font-mono bg-background/50"
            />
          </div>
        )}

        {/* Auth Page Checkbox */}
        <div className="flex items-center gap-2.5 mt-2 pt-2 border-t border-border/40">
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

      {/* Connected Auth Node Section */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Key className="w-4 h-4 text-purple-400" />
          <span>Auth Provider Binding</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Associated Auth Service Node</Label>
          <Select
            value={data.authNodeId || "none"}
            onValueChange={(val) =>
              updateData({ authNodeId: val === "none" ? undefined : val })
            }
          >
            <SelectTrigger className="h-9 text-xs font-medium bg-background/50">
              <SelectValue placeholder="Select Auth Node..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">
                None (Use project default auth client)
              </SelectItem>
              {authNodes.map((an) => (
                <SelectItem key={an.id} value={an.id} className="text-xs">
                  🛡️ {an.data.label || "Auth Node"} ({an.data.framework || "better_auth"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

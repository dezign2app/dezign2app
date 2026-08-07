import React from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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
  Shield,
  CreditCard,
  Building2,
  Key,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { BackendNode, WEB_CLIENT_TECH_OPTIONS } from "@/types/canvas";

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

  if (!node) return null;

  const data = node.data;

  const updateData = (changes: Partial<typeof data>) => {
    updateNode(nodeId, { data: { ...data, ...changes } });
  };

  const appSlug =
    data.appSlug ||
    (data.label || "web-app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const port = data.port || "3000";
  const allowedRoles = data.allowedRoles || [];
  const requiredPlans = data.requiredPlans || [];
  const allowedOrgRoles = data.allowedOrgRoles || [];
  const defaultLoginRoute = data.defaultLoginRoute || "/login";

  const authNodes = allNodes.filter((n) => n.type === "auth");

  // Helper to query pages plugged into sections
  const getConnectedPages = (sectionHandleId: string) => {
    const incomingEdges = allEdges.filter(
      (e) => e.target === nodeId && e.targetHandle === sectionHandleId,
    );
    return incomingEdges
      .map((e) => allNodes.find((n) => n.id === e.source))
      .filter((n): n is BackendNode => Boolean(n));
  };

  const publicPages = getConnectedPages("public-in");
  const privatePages = getConnectedPages("private-in");
  const rolePages = getConnectedPages("role-in");
  const paymentPages = getConnectedPages("payment-in");
  const orgPages = getConnectedPages("org-in");

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-500/15 text-indigo-500 rounded border border-indigo-500/20 shadow-sm flex items-center gap-1">
            <Globe className="w-3 h-3" /> WEB APP GATEWAY
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {data.label || "Web Application"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure application details, framework selection, protection rules per section, and connected authentication backend services.
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
            <Label className="text-xs text-muted-foreground">Monorepo Target Slug (apps/...)</Label>
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
            <Label className="text-xs text-muted-foreground">Default Login / Auth Route</Label>
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
              onValueChange={(val) => {
                const selectedTech = WEB_CLIENT_TECH_OPTIONS.find((t) => t.value === val);
                updateData({
                  techStack: val as any,
                  techVersion: selectedTech?.defaultVersion as any,
                });
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
              onValueChange={(val) => updateData({ techVersion: val as any })}
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

      {/* Auth Binding Section */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Key className="w-4 h-4 text-purple-400" />
          <span>Backend Auth Service Binding</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Connected Auth Service Node</Label>
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
                Better Auth client
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

      {/* Protection Sections & Rule Parameters */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protection Section Parameters</span>
        </div>

        {/* Role-Gated Parameters */}
        <div className="flex flex-col gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Role-Gated Section Allowed Roles</span>
          </div>
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
          <div className="text-[10px] text-muted-foreground">
            Pages plugged into <span className="font-mono text-purple-400">ROLE-GATED SECTION</span> require these roles. Connected pages: {rolePages.map(p => p.data.label).join(", ") || "None"}
          </div>
        </div>

        {/* Paid-Only Parameters */}
        <div className="flex flex-col gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Paid-Only Section Required Plan Tiers</span>
          </div>
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
          <div className="text-[10px] text-muted-foreground">
            Pages plugged into <span className="font-mono text-amber-400">PAID-ONLY SECTION</span> redirect to /pricing if un-subscribed. Connected pages: {paymentPages.map(p => p.data.label).join(", ") || "None"}
          </div>
        </div>

        {/* Organization Parameters */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            <Building2 className="w-3.5 h-3.5" />
            <span>Organization Section Allowed Org Roles</span>
          </div>
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
          <div className="text-[10px] text-muted-foreground">
            Pages plugged into <span className="font-mono text-cyan-400">ORGANIZATION SECTION</span> require active Org membership. Connected pages: {orgPages.map(p => p.data.label).join(", ") || "None"}
          </div>
        </div>
      </div>
    </div>
  );
};

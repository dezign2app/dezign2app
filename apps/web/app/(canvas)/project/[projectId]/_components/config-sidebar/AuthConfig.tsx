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
import { ShieldCheck } from "lucide-react";
import {
  AUTH_FRAMEWORK_OPTIONS,
  BETTER_AUTH_VERSIONS,
  DEFAULT_AUTH_FRAMEWORK,
  DEFAULT_BETTER_AUTH_VERSION,
} from "@workspace/canvas";

export const AuthConfig = ({
  id,
  nodeId,
}: {
  id: string;
  nodeId: string;
}) => {
  const node = useBackendCanvasStore((s) =>
    s.nodes.find((n) => n.id === nodeId),
  );
  const updateNode = useBackendCanvasStore((s) => s.updateNode);

  if (!node) return null;

  const data = node.data;

  const updateData = (changes: Partial<typeof data>) => {
    updateNode(nodeId, { data: { ...data, ...changes } });
  };

  const selectedFramework = data.framework || DEFAULT_AUTH_FRAMEWORK;
  const selectedVersion = data.version || DEFAULT_BETTER_AUTH_VERSION;
  const enabledPlugins = data.plugins || ["bearer", "admin", "organization"];

  const togglePlugin = (plugin: string) => {
    const next = enabledPlugins.includes(plugin)
      ? enabledPlugins.filter((p) => p !== plugin)
      : [...enabledPlugins, plugin];
    updateData({ plugins: next });
  };

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-500/15 text-indigo-500 rounded border border-indigo-500/20 shadow-sm flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> AUTH FRAMEWORK NODE
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {data.label || "Auth Framework"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold">Auth Framework</Label>
          <Select
            value={selectedFramework}
            onValueChange={(val: any) => {
              const option = AUTH_FRAMEWORK_OPTIONS.find((o) => o.value === val);
              updateData({
                framework: val,
                provider: option?.label || "Better Auth",
              });
            }}
          >
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Select Auth Framework" />
            </SelectTrigger>
            <SelectContent>
              {AUTH_FRAMEWORK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFramework === "better_auth" && (
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Better Auth Version</Label>
            <Select
              value={selectedVersion}
              onValueChange={(val: string) => updateData({ version: val })}
            >
              <SelectTrigger className="w-full text-xs font-mono">
                <SelectValue placeholder="Select Better Auth Version" />
              </SelectTrigger>
              <SelectContent>
                {BETTER_AUTH_VERSIONS.map((ver) => (
                  <SelectItem key={ver.value} value={ver.value} className="font-mono">
                    {ver.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border/50 pt-4">
          <Label className="text-xs font-semibold">Enabled Plugins & Features</Label>

          <div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-md border border-border/40">
            {[
              { id: "bearer", label: "Bearer Tokens & JWTs" },
              { id: "admin", label: "Admin & User Management" },
              { id: "organization", label: "Multi-tenant Organizations / RBAC" },
              { id: "twoFactor", label: "Two-Factor Auth (2FA / TOTP)" },
              { id: "social", label: "Social OAuth Providers (Google, GitHub)" },
            ].map((item) => {
              const checked = enabledPlugins.includes(item.id);
              return (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`plugin-${item.id}`}
                    checked={checked}
                    onCheckedChange={() => togglePlugin(item.id)}
                  />
                  <Label
                    htmlFor={`plugin-${item.id}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {item.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
          <Label className="text-xs font-semibold">Base Auth URL</Label>
          <Input
            className="text-xs font-mono"
            placeholder="http://localhost:3000/api/auth"
            value={data.baseUrl || "http://localhost:3000/api/auth"}
            onChange={(e) => updateData({ baseUrl: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

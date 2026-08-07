import React from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { ShieldCheck, Plus, Trash2, Code2, Sparkles, Key, Users, Layers, SlidersHorizontal, Lock } from "lucide-react";
import {
  AUTH_FRAMEWORK_OPTIONS,
  BETTER_AUTH_VERSIONS,
  DEFAULT_AUTH_FRAMEWORK,
  DEFAULT_BETTER_AUTH_VERSION,
  OAuthProviderConfig,
  SessionClaimConfig,
  UserCustomField,
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
  const edges = useBackendCanvasStore((s) => s.edges);

  if (!node) return null;

  const data = node.data;

  const updateData = (changes: Partial<typeof data>) => {
    updateNode(nodeId, { data: { ...data, ...changes } });
  };

  const selectedFramework = data.framework || DEFAULT_AUTH_FRAMEWORK;
  const selectedVersion = data.version || DEFAULT_BETTER_AUTH_VERSION;
  const enabledPlugins = data.plugins || ["bearer", "admin", "organization", "jwt"];

  // Providers state
  const providers = data.providers || {
    emailPassword: { enabled: true, requireVerification: true, minLength: 8 },
    oauth: [
      { id: "oa-1", provider: "google", clientIdEnv: "GOOGLE_CLIENT_ID", clientSecretEnv: "GOOGLE_CLIENT_SECRET" },
      { id: "oa-2", provider: "github", clientIdEnv: "GITHUB_CLIENT_ID", clientSecretEnv: "GITHUB_CLIENT_SECRET" },
    ],
    magicLink: true,
    passkey: false,
  };

  // Claims state
  const claims: SessionClaimConfig[] = data.session?.claims || [
    { key: "orgRole", source: "orgRole", deliveryMode: "jwt" },
    { key: "hasAccess", source: "paymentsAccess", deliveryMode: "jwt" },
    { key: "subscriptionStatus", source: "paymentsAccess", deliveryMode: "cookie" },
  ];

  // Org state
  const org = data.organization || {
    enabled: true,
    roles: ["owner", "admin", "member"],
    teams: true,
    multiOrg: true,
    invitations: true,
  };

  // Custom schema fields
  const customFields: UserCustomField[] = data.customFields || [
    { name: "workspaceId", type: "string", required: false },
    { name: "onboarded", type: "boolean", default: "false", required: true },
  ];

  // Hooks
  const hooks = data.hooks || [
    { mode: "naturalLanguage", prompt: "After sign up, send a welcome email and create default workspace." },
  ];

  // Helper toggle plugin
  const togglePlugin = (plugin: string) => {
    const next = enabledPlugins.includes(plugin)
      ? enabledPlugins.filter((p) => p !== plugin)
      : [...enabledPlugins, plugin];
    updateData({ plugins: next });
  };

  // Creem Payments plugin injection check
  const isPaymentsInjected = edges.some(
    (e) => e.target === nodeId && e.targetHandle === "payments-plugin-in",
  );

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12 text-foreground">
      {/* Header matching EndpointConfig */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 shadow-sm flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> AUTH SERVER
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {data.label || "Auth Server"}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Configure authentication providers, session & claims delivery, RBAC organizations, user schema fields, and Better Auth plugins.
        </span>
      </div>

      {/* Top to Bottom Collapsible Sections matching EndpointConfig card theme */}
      <Accordion
        type="multiple"
        defaultValue={["providers", "session", "org", "schema", "hooks", "plugins", "preview"]}
        className="w-full flex flex-col gap-4 border-none"
      >
        {/* Section 1: Providers */}
        <AccordionItem
          value="providers"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left flex-1">
              <Key className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Providers
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                {providers.emailPassword?.enabled ? "Email" : ""}{providers.oauth?.length ? ` + ${providers.oauth.length} OAuth` : ""}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-4 pt-2">
              {/* Framework Selection */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Framework</Label>
                  <Select
                    value={selectedFramework}
                    onValueChange={(val: string) => {
                      const option = AUTH_FRAMEWORK_OPTIONS.find((o) => o.value === val);
                      if (option) {
                        updateData({ framework: option.value, provider: option.label });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_FRAMEWORK_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Version</Label>
                  <Select
                    value={selectedVersion}
                    onValueChange={(val: string) => updateData({ version: val })}
                  >
                    <SelectTrigger className="h-8 text-xs font-mono bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-mono">
                      {BETTER_AUTH_VERSIONS.map((ver) => (
                        <SelectItem key={ver.value} value={ver.value} className="text-xs font-mono">
                          {ver.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email / Password */}
              <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Email & Password Auth</Label>
                  <Checkbox
                    checked={providers.emailPassword?.enabled}
                    onCheckedChange={(checked) =>
                      updateData({
                        providers: {
                          ...providers,
                          emailPassword: {
                            enabled: Boolean(checked),
                            requireVerification: providers.emailPassword?.requireVerification ?? true,
                            minLength: providers.emailPassword?.minLength ?? 8,
                          },
                        },
                      })
                    }
                  />
                </div>
                {providers.emailPassword?.enabled && (
                  <div className="flex items-center gap-4 text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="require-verify"
                        checked={providers.emailPassword?.requireVerification}
                        onCheckedChange={(c) =>
                          updateData({
                            providers: {
                              ...providers,
                              emailPassword: {
                                enabled: providers.emailPassword?.enabled ?? true,
                                requireVerification: Boolean(c),
                                minLength: providers.emailPassword?.minLength ?? 8,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="require-verify" className="text-xs font-normal cursor-pointer">
                        Require Email Verification
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* OAuth Providers Table */}
              <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">OAuth 2.0 / Social Providers</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background"
                    onClick={() => {
                      const newOauth = [
                        ...(providers.oauth || []),
                        {
                          id: `oa-${Date.now()}`,
                          provider: "discord",
                          clientIdEnv: "DISCORD_CLIENT_ID",
                          clientSecretEnv: "DISCORD_CLIENT_SECRET",
                        },
                      ];
                      updateData({ providers: { ...providers, oauth: newOauth } });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Provider
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {providers.oauth?.map((oa: OAuthProviderConfig) => (
                    <div
                      key={oa.id}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-background border border-border/50 text-xs"
                    >
                      <div className="col-span-3">
                        <Select
                          value={oa.provider}
                          onValueChange={(val) => {
                            const updated = (providers.oauth || []).map((o) =>
                              o.id === oa.id ? { ...o, provider: val } : o,
                            );
                            updateData({ providers: { ...providers, oauth: updated } });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs font-medium capitalize bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["google", "github", "discord", "apple", "twitter", "microsoft"].map((p) => (
                              <SelectItem key={p} value={p} className="text-xs capitalize">
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Input
                          className="h-7 text-xs font-mono bg-background"
                          value={oa.clientIdEnv}
                          placeholder="CLIENT_ID_ENV"
                          onChange={(e) => {
                            const updated = (providers.oauth || []).map((o) =>
                              o.id === oa.id ? { ...o, clientIdEnv: e.target.value } : o,
                            );
                            updateData({ providers: { ...providers, oauth: updated } });
                          }}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          className="h-7 text-xs font-mono bg-background"
                          value={oa.clientSecretEnv}
                          placeholder="CLIENT_SECRET_ENV"
                          onChange={(e) => {
                            const updated = (providers.oauth || []).map((o) =>
                              o.id === oa.id ? { ...o, clientSecretEnv: e.target.value } : o,
                            );
                            updateData({ providers: { ...providers, oauth: updated } });
                          }}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => {
                            const updated = (providers.oauth || []).filter((o) => o.id !== oa.id);
                            updateData({ providers: { ...providers, oauth: updated } });
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Session & Claims */}
        <AccordionItem
          value="session"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left flex-1">
              <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Session & Claims
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                {claims.length} claims
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-4 pt-2">
              <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary dark:text-primary">
                <p className="font-semibold mb-1">Session Delivery Recommendations:</p>
                <ul className="list-disc list-inside gap-1 flex flex-col text-[11px] text-muted-foreground">
                  <li>
                    <strong className="text-foreground">JWT Plugin Mode</strong>: Tokens signed at issue time; middleware evaluates fast boolean gates in <code className="font-mono">proxy.ts</code> with 0 DB roundtrips (Edge runtime recommended).
                  </li>
                  <li>
                    <strong className="text-foreground">Cookie Session Mode</strong>: Live DB resolution per fetch; ideal for live accurate claims inside React layouts and Server Components.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Configured Claims</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background"
                    onClick={() => {
                      const updated = [
                        ...claims,
                        { key: `custom_${claims.length + 1}`, source: "customField" as const, deliveryMode: "jwt" as const },
                      ];
                      updateData({ session: { claims: updated } });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Claim
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {claims.map((claim, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-background border border-border/50 text-xs"
                    >
                      <div className="col-span-4">
                        <Input
                          className="h-7 text-xs font-mono bg-background"
                          value={claim.key}
                          onChange={(e) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, key: e.target.value } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        />
                      </div>
                      <div className="col-span-4">
                        <Select
                          value={claim.source}
                          onValueChange={(val: SessionClaimConfig["source"]) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, source: val } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="orgRole" className="text-xs">Org Role</SelectItem>
                            <SelectItem value="paymentsAccess" className="text-xs">Creem Payments</SelectItem>
                            <SelectItem value="customField" className="text-xs">Custom Field</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={claim.deliveryMode}
                          onValueChange={(val: SessionClaimConfig["deliveryMode"]) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, deliveryMode: val } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs font-mono bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jwt" className="text-xs font-mono">JWT</SelectItem>
                            <SelectItem value="cookie" className="text-xs font-mono">Cookie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => {
                            const updated = claims.filter((_, i) => i !== idx);
                            updateData({ session: { claims: updated } });
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: Organization & RBAC */}
        <AccordionItem
          value="org"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left flex-1">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Organization & RBAC
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                {org.enabled ? "Active" : "Disabled"}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Enable Organization Plugin (RBAC)</Label>
                    <p className="text-[11px] text-muted-foreground">Multi-tenant workspace memberships & roles.</p>
                  </div>
                  <Checkbox
                    checked={org.enabled}
                    onCheckedChange={(c) => updateData({ organization: { ...org, enabled: Boolean(c) } })}
                  />
                </div>

                {org.enabled && (
                  <div className="flex flex-col gap-3 pt-3 border-t border-border/40 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold">Organization Roles</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {org.roles?.map((role, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-primary/10 text-primary font-mono text-xs flex items-center gap-1 border border-primary/20"
                          >
                            {role}
                            {role !== "owner" && role !== "admin" && role !== "member" && (
                              <button
                                onClick={() => {
                                  const updated = (org.roles || []).filter((_, i) => i !== idx);
                                  updateData({ organization: { ...org, roles: updated } });
                                }}
                                className="hover:text-destructive"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="org-teams"
                          checked={org.teams}
                          onCheckedChange={(c) => updateData({ organization: { ...org, teams: Boolean(c) } })}
                        />
                        <Label htmlFor="org-teams" className="text-xs font-normal cursor-pointer">
                          Teams Sub-groups
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="org-multi"
                          checked={org.multiOrg}
                          onCheckedChange={(c) => updateData({ organization: { ...org, multiOrg: Boolean(c) } })}
                        />
                        <Label htmlFor="org-multi" className="text-xs font-normal cursor-pointer">
                          Multi-Org per user
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: User Schema Fields */}
        <AccordionItem
          value="schema"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left flex-1">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                User Schema Custom Fields
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                {customFields.length} fields
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Custom User Table Columns</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-background"
                  onClick={() => {
                    const updated = [
                      ...customFields,
                      { name: `field_${customFields.length + 1}`, type: "string", required: false },
                    ];
                    updateData({ customFields: updated });
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {customFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-background border border-border/50 text-xs"
                  >
                    <div className="col-span-4">
                      <Input
                        className="h-7 text-xs font-mono bg-background"
                        value={field.name}
                        placeholder="field_name"
                        onChange={(e) => {
                          const updated = customFields.map((f, i) => (i === idx ? { ...f, name: e.target.value } : f));
                          updateData({ customFields: updated });
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={field.type}
                        onValueChange={(val) => {
                          const updated = customFields.map((f, i) => (i === idx ? { ...f, type: val } : f));
                          updateData({ customFields: updated });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs font-mono bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["string", "number", "boolean", "date", "json"].map((t) => (
                            <SelectItem key={t} value={t} className="text-xs font-mono">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        className="h-7 text-xs font-mono bg-background"
                        value={field.default || ""}
                        placeholder="default value"
                        onChange={(e) => {
                          const updated = customFields.map((f, i) => (i === idx ? { ...f, default: e.target.value } : f));
                          updateData({ customFields: updated });
                        }}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(c) => {
                          const updated = customFields.map((f, i) => (i === idx ? { ...f, required: Boolean(c) } : f));
                          updateData({ customFields: updated });
                        }}
                      />
                      <button
                        onClick={() => {
                          const updated = customFields.filter((_, i) => i !== idx);
                          updateData({ customFields: updated });
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: Hooks */}
        <AccordionItem
          value="hooks"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left flex-1">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Auth Lifecycle Hooks
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-4 pt-2">
              <div className="p-3.5 bg-background/50 border border-border/40 rounded-lg flex flex-col gap-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Custom Lifecycle Prompt
                </Label>
                <Textarea
                  className="min-h-[90px] text-xs font-mono bg-background"
                  placeholder="e.g. After sign up, create a default workspace and send welcome email..."
                  value={hooks[0]?.prompt || ""}
                  onChange={(e) => {
                    const updated = [{ mode: "naturalLanguage" as const, prompt: e.target.value }];
                    updateData({ hooks: updated });
                  }}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: Plugins */}
        <AccordionItem
          value="plugins"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left flex-1">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Better Auth Plugins
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                {enabledPlugins.length} active
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Enabled Plugins List</Label>
                {isPaymentsInjected && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium">
                    + Creem Plugin Injected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 bg-background/50 p-3 rounded-lg border border-border/40">
                {[
                  { id: "twoFactor", label: "Two-Factor Auth (2FA)" },
                  { id: "organization", label: "Organization / RBAC" },
                  { id: "passkey", label: "Passkeys / WebAuthn" },
                  { id: "magicLink", label: "Magic Link Email" },
                  { id: "emailOtp", label: "Email OTP" },
                  { id: "username", label: "Username Login" },
                  { id: "phoneNumber", label: "Phone Number OTP" },
                  { id: "admin", label: "Admin Management" },
                  { id: "apiKey", label: "API Key Management" },
                  { id: "bearer", label: "Bearer Tokens" },
                  { id: "jwt", label: "JWT Token Plugin" },
                  { id: "multiSession", label: "Multi-Session Support" },
                  { id: "sso", label: "Enterprise SSO / SAML" },
                ].map((plugin) => {
                  const checked = enabledPlugins.includes(plugin.id);
                  return (
                    <div key={plugin.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-background/60">
                      <Checkbox
                        id={`plugin-${plugin.id}`}
                        checked={checked}
                        onCheckedChange={() => togglePlugin(plugin.id)}
                      />
                      <Label htmlFor={`plugin-${plugin.id}`} className="text-xs font-normal cursor-pointer">
                        {plugin.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 7: Generated Code Preview */}
        <AccordionItem
          value="preview"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-left flex-1">
              <Code2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Generated Code Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                auth.ts
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-3 pt-2">
              <Label className="text-xs font-semibold">Generated <code className="font-mono">auth.ts</code></Label>
              <pre className="p-3 bg-muted/80 rounded-lg text-[11px] font-mono border border-border/60 overflow-x-auto text-foreground">
{`import { betterAuth } from "better-auth";
import { sqliteAdapter } from "better-auth/adapters/sqlite";
${enabledPlugins.includes("jwt") ? 'import { jwt } from "better-auth/plugins";\n' : ''}${enabledPlugins.includes("organization") ? 'import { organization } from "better-auth/plugins";\n' : ''}${isPaymentsInjected ? 'import { creem } from "@creem_io/better-auth";\n' : ''}
export const auth = betterAuth({
  database: sqliteAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: ${providers.emailPassword?.enabled || false} },
  plugins: [
    ${enabledPlugins.map((p) => `${p}()`).join(",\n    ")}${isPaymentsInjected ? ',\n    creem({ apiKey: process.env.CREEM_API_KEY!, webhookSecret: process.env.CREEM_WEBHOOK_SECRET! })' : ''}
  ]
});`}
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};


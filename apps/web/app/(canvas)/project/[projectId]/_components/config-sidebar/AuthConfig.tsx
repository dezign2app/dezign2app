import React from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
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
import {
  ShieldCheck,
  Plus,
  Trash2,
  Code2,
  Sparkles,
  Key,
  Users,
  Layers,
  SlidersHorizontal,
  Lock,
  Database,
  User,
  UserCheck,
  AlertCircle,
  Table,
} from "lucide-react";
import {
  AUTH_FRAMEWORK_OPTIONS,
  BETTER_AUTH_VERSIONS,
  DEFAULT_AUTH_FRAMEWORK,
  DEFAULT_BETTER_AUTH_VERSION,
  OAuthProviderConfig,
  SessionClaimConfig,
  UserCustomField,
  AdditionalAuthTableConfig,
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
  const allNodes = useBackendCanvasStore((s) => s.nodes);

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

  const schemaEntities = allNodes.filter((n) => n.type === "entity");
  const selectedOrgSchemaId = org.schemaId || org.entityId;
  const selectedOrgEntity = schemaEntities.find((n) => n.id === selectedOrgSchemaId);

  const selectedUserSchemaId = data.userEntityId || data.userSchemaId;
  const selectedUserEntity = schemaEntities.find((n) => n.id === selectedUserSchemaId);

  // Additional tables state
  const additionalUserTables: AdditionalAuthTableConfig[] = data.additionalUserTables || [];
  const additionalOrgTables: AdditionalAuthTableConfig[] = org.additionalTables || [];
  const additionalTables: AdditionalAuthTableConfig[] = data.additionalTables || [];

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
        defaultValue={["core-entities", "providers", "session", "org", "schema", "hooks", "plugins", "preview"]}
        className="w-full flex flex-col gap-4 border-none"
      >
        {/* Section 1: User & Organization Schema Config */}
        <AccordionItem
          value="core-entities"
          className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden border-primary/30"
        >
          <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
            <div className="flex flex-col items-start gap-2 text-left flex-1">
              <div className="flex gap-2">
                <UserCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User & Organization Config
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full font-medium border",)}>
                  {selectedUserEntity ? `User: ${selectedUserEntity.data.label}` : "User Table Required"}
                </span>
                {org.enabled && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border-primary font-medium">
                    {selectedOrgEntity ? `Org: ${selectedOrgEntity.data.label}` : "Org: Enabled"}
                  </span>
                )}
                {additionalTables.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
                    +{additionalTables.length} table{additionalTables.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="flex flex-col gap-4 pt-2">
              {/* 1. Mandatory User Table Selection */}
              <div
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-lg border text-xs transition-colors",
                  selectedUserEntity
                    ? "bg-background/80 border-border/50"
                    : "bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <User className="w-3.5 h-3.5 text-primary" />
                    User Table Schema <span className="text-destructive font-bold">* (Mandatory)</span>
                  </Label>
                  {selectedUserEntity ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-medium bg-primary/15">
                      {selectedUserEntity.data.columns?.length || 0} fields
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Select Table
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Select the configured entity schema from your canvas to map as your primary User table.
                </p>
                <Select
                  value={selectedUserSchemaId || "none"}
                  onValueChange={(val) => {
                    const selectedId = val === "none" ? undefined : val;
                    updateData({
                      userEntityId: selectedId,
                      userSchemaId: selectedId,
                    });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select User Table entity..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-muted-foreground">
                      Select User Table entity...
                    </SelectItem>
                    {schemaEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id} className="text-xs">
                        {entity.data.label || "Untitled Entity"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedUserEntity ? (
                  <div className="mt-1 p-2 bg-muted/40 rounded border border-border/40 flex flex-col gap-1 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground font-mono">
                      <span>Bound User Schema:</span>
                      <span className="font-semibold text-foreground">{selectedUserEntity.data.label}</span>
                    </div>
                    {selectedUserEntity.data.columns && selectedUserEntity.data.columns.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedUserEntity.data.columns.map((col) => (
                          <span
                            key={col.name}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/60 text-muted-foreground"
                          >
                            {col.name}: <span className="text-primary">{col.type}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    ⚠️ User table is mandatory. Select an entity node from your canvas or create one in the Schema View.
                  </p>
                )}

                {/* Additional Related User Tables */}
                <div className="flex flex-col gap-2 pt-2.5 border-t border-border/40 mt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Related User Tables
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] px-2 bg-background shrink-0"
                      onClick={() => {
                        const newTable: AdditionalAuthTableConfig = {
                          id: `utbl-${Date.now()}`,
                          entityId: schemaEntities[0]?.id || "",
                          purpose: "user_profile",
                        };
                        updateData({ additionalUserTables: [...additionalUserTables, newTable] });
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Related User Table
                    </Button>
                  </div>
                  {additionalUserTables.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {additionalUserTables.map((tbl, idx) => {
                        const boundEntity = schemaEntities.find((e) => e.id === tbl.entityId);
                        return (
                          <div
                            key={tbl.id || idx}
                            className="flex flex-col gap-1.5 p-2 rounded bg-background border border-border/50 text-xs"
                          >
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-6">
                                <Select
                                  value={tbl.entityId || "none"}
                                  onValueChange={(val) => {
                                    const updated = additionalUserTables.map((t, i) =>
                                      i === idx ? { ...t, entityId: val === "none" ? "" : val } : t
                                    );
                                    updateData({ additionalUserTables: updated });
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-background">
                                    <SelectValue placeholder="Select Table..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-xs text-muted-foreground">
                                      Select Table...
                                    </SelectItem>
                                    {schemaEntities.map((entity) => (
                                      <SelectItem key={entity.id} value={entity.id} className="text-xs">
                                        {entity.data.label || "Untitled Entity"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-5">
                                <Select
                                  value={tbl.purpose || "user_profile"}
                                  onValueChange={(val) => {
                                    const updated = additionalUserTables.map((t, i) =>
                                      i === idx ? { ...t, purpose: val } : t
                                    );
                                    updateData({ additionalUserTables: updated });
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs font-mono bg-background">
                                    <SelectValue placeholder="Purpose..." />
                                  </SelectTrigger>
                                  <SelectContent className="font-mono">
                                    <SelectItem value="user_profile" className="text-xs font-mono">
                                      User Profile Table
                                    </SelectItem>
                                    <SelectItem value="user_settings" className="text-xs font-mono">
                                      User Settings / Config
                                    </SelectItem>
                                    <SelectItem value="user_metadata" className="text-xs font-mono">
                                      User Metadata
                                    </SelectItem>
                                    <SelectItem value="custom" className="text-xs font-mono">
                                      Custom User Table
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => {
                                    const updated = additionalUserTables.filter((_, i) => i !== idx);
                                    updateData({ additionalUserTables: updated });
                                  }}
                                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                  title="Remove Table"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {boundEntity && boundEntity.data.columns && boundEntity.data.columns.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1 border-t border-border/30">
                                {boundEntity.data.columns.map((col) => (
                                  <span
                                    key={col.name}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/40"
                                  >
                                    {col.name}: <span className="text-primary">{col.type}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Organization Management with Switch & Table Selector */}
              <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Organization Management
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Multi-tenant workspace memberships, teams & roles.
                    </p>
                  </div>
                  <Switch
                    checked={org.enabled}
                    onCheckedChange={(c) => {
                      const isChecked = Boolean(c);
                      const nextPlugins = isChecked
                        ? Array.from(new Set([...enabledPlugins, "organization"]))
                        : enabledPlugins.filter((p) => p !== "organization");
                      updateData({
                        organization: { ...org, enabled: isChecked },
                        plugins: nextPlugins,
                      });
                    }}
                  />
                </div>

                {org.enabled && (
                  <div className="flex flex-col gap-2 pt-3 border-t border-border/40 text-xs">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-primary" />
                        Select Organization Entity (Schema Table)
                      </Label>
                      {selectedOrgEntity && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 font-medium">
                          {selectedOrgEntity.data.columns?.length || 0} fields
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Choose a configured entity table from canvas to map for Organization management.
                    </p>
                    <Select
                      value={selectedOrgSchemaId || "none"}
                      onValueChange={(val) => {
                        const selectedId = val === "none" ? undefined : val;
                        updateData({
                          organization: {
                            ...org,
                            schemaId: selectedId,
                            entityId: selectedId,
                          },
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Choose an Organization table entity..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          None (Use default Better Auth Organization schema)
                        </SelectItem>
                        {schemaEntities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id} className="text-xs">
                            {entity.data.label || "Untitled Entity"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedOrgEntity ? (
                      <div className="mt-1 p-2 bg-muted/40 rounded border border-border/40 flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between text-muted-foreground font-mono">
                          <span>Bound Organization Schema:</span>
                          <span className="font-semibold text-foreground">{selectedOrgEntity.data.label}</span>
                        </div>
                        {selectedOrgEntity.data.columns && selectedOrgEntity.data.columns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedOrgEntity.data.columns.map((col) => (
                              <span
                                key={col.name}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/60 text-muted-foreground"
                              >
                                {col.name}: <span className="text-primary">{col.type}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : schemaEntities.length === 0 ? (
                      <p className="text-[10px] text-amber-500/90 dark:text-amber-400 font-mono mt-0.5">
                        ⓘ No entity nodes found on canvas. Add an Entity Node to canvas to select a custom schema.
                      </p>
                    ) : null}

                    {/* Additional Organization Tables (e.g. org_members, org_invitations) */}
                    <div className="flex flex-col gap-2 pt-2.5 border-t border-border/40 mt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Related Organization Tables
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] px-2 bg-background shrink-0"
                          onClick={() => {
                            const newTable: AdditionalAuthTableConfig = {
                              id: `orgtbl-${Date.now()}`,
                              entityId: schemaEntities[0]?.id || "",
                              purpose: "org_members",
                            };
                            updateData({
                              organization: {
                                ...org,
                                additionalTables: [...additionalOrgTables, newTable],
                              },
                            });
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Related Org Table
                        </Button>
                      </div>
                      {additionalOrgTables.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {additionalOrgTables.map((tbl, idx) => {
                            const boundEntity = schemaEntities.find((e) => e.id === tbl.entityId);
                            return (
                              <div
                                key={tbl.id || idx}
                                className="flex flex-col gap-1.5 p-2 rounded bg-background border border-border/50 text-xs"
                              >
                                <div className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-6">
                                    <Select
                                      value={tbl.entityId || "none"}
                                      onValueChange={(val) => {
                                        const updated = additionalOrgTables.map((t, i) =>
                                          i === idx ? { ...t, entityId: val === "none" ? "" : val } : t
                                        );
                                        updateData({
                                          organization: {
                                            ...org,
                                            additionalTables: updated,
                                          },
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-xs bg-background">
                                        <SelectValue placeholder="Select Table..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none" className="text-xs text-muted-foreground">
                                          Select Table...
                                        </SelectItem>
                                        {schemaEntities.map((entity) => (
                                          <SelectItem key={entity.id} value={entity.id} className="text-xs">
                                            {entity.data.label || "Untitled Entity"}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-5">
                                    <Select
                                      value={tbl.purpose || "org_members"}
                                      onValueChange={(val) => {
                                        const updated = additionalOrgTables.map((t, i) =>
                                          i === idx ? { ...t, purpose: val } : t
                                        );
                                        updateData({
                                          organization: {
                                            ...org,
                                            additionalTables: updated,
                                          },
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-xs font-mono bg-background">
                                        <SelectValue placeholder="Purpose..." />
                                      </SelectTrigger>
                                      <SelectContent className="font-mono">
                                        <SelectItem value="org_members" className="text-xs font-mono">
                                          Members (org_members)
                                        </SelectItem>
                                        <SelectItem value="org_invitations" className="text-xs font-mono">
                                          Invitations (org_invites)
                                        </SelectItem>
                                        <SelectItem value="teams" className="text-xs font-mono">
                                          Teams / Subgroups
                                        </SelectItem>
                                        <SelectItem value="org_roles" className="text-xs font-mono">
                                          Custom Roles
                                        </SelectItem>
                                        <SelectItem value="custom" className="text-xs font-mono">
                                          Custom Org Table
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-1 flex justify-end">
                                    <button
                                      onClick={() => {
                                        const updated = additionalOrgTables.filter((_, i) => i !== idx);
                                        updateData({
                                          organization: {
                                            ...org,
                                            additionalTables: updated,
                                          },
                                        });
                                      }}
                                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                      title="Remove Table"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                {boundEntity && boundEntity.data.columns && boundEntity.data.columns.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1 border-t border-border/30">
                                    {boundEntity.data.columns.map((col) => (
                                      <span
                                        key={col.name}
                                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/40"
                                      >
                                        {col.name}: <span className="text-primary">{col.type}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Multiple Additional Entity Tables */}
              <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-primary" />
                      Additional Auth Entity Tables
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Attach multiple additional database entity tables (Session, Account, Verification, Custom) to this Auth Server.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background shrink-0"
                    onClick={() => {
                      const newTable: AdditionalAuthTableConfig = {
                        id: `tbl-${Date.now()}`,
                        entityId: schemaEntities[0]?.id || "",
                        purpose: "custom",
                      };
                      updateData({ additionalTables: [...additionalTables, newTable] });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Table
                  </Button>
                </div>

                {additionalTables.length > 0 ? (
                  <div className="flex flex-col gap-2.5 pt-1">
                    {additionalTables.map((tbl, idx) => {
                      const boundEntity = schemaEntities.find((e) => e.id === tbl.entityId);
                      return (
                        <div
                          key={tbl.id || idx}
                          className="flex flex-col gap-2 p-2.5 rounded bg-background border border-border/50 text-xs"
                        >
                          <div className="grid grid-cols-12 gap-2 items-center">
                            {/* Entity Selector */}
                            <div className="col-span-6">
                              <Select
                                value={tbl.entityId || "none"}
                                onValueChange={(val) => {
                                  const updated = additionalTables.map((t, i) =>
                                    i === idx ? { ...t, entityId: val === "none" ? "" : val } : t
                                  );
                                  updateData({ additionalTables: updated });
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs bg-background">
                                  <SelectValue placeholder="Select Entity Table..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" className="text-xs text-muted-foreground">
                                    Select Entity Table...
                                  </SelectItem>
                                  {schemaEntities.map((entity) => (
                                    <SelectItem key={entity.id} value={entity.id} className="text-xs">
                                      {entity.data.label || "Untitled Entity"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Purpose Selector */}
                            <div className="col-span-5">
                              <Select
                                value={tbl.purpose || "custom"}
                                onValueChange={(val) => {
                                  const updated = additionalTables.map((t, i) =>
                                    i === idx ? { ...t, purpose: val } : t
                                  );
                                  updateData({ additionalTables: updated });
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs font-mono bg-background">
                                  <SelectValue placeholder="Purpose..." />
                                </SelectTrigger>
                                <SelectContent className="font-mono">
                                  <SelectItem value="session" className="text-xs font-mono">
                                    Session Table
                                  </SelectItem>
                                  <SelectItem value="account" className="text-xs font-mono">
                                    Account Table (OAuth)
                                  </SelectItem>
                                  <SelectItem value="verification" className="text-xs font-mono">
                                    Verification Tokens
                                  </SelectItem>
                                  <SelectItem value="rateLimit" className="text-xs font-mono">
                                    Rate Limiting
                                  </SelectItem>
                                  <SelectItem value="custom" className="text-xs font-mono">
                                    Custom Auth Table
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Delete Button */}
                            <div className="col-span-1 flex justify-end">
                              <button
                                onClick={() => {
                                  const updated = additionalTables.filter((_, i) => i !== idx);
                                  updateData({ additionalTables: updated });
                                }}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                title="Remove Table"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Field Pills Preview */}
                          {boundEntity && boundEntity.data.columns && boundEntity.data.columns.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1 border-t border-border/30">
                              {boundEntity.data.columns.map((col) => (
                                <span
                                  key={col.name}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/40"
                                >
                                  {col.name}: <span className="text-primary">{col.type}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    No additional tables attached yet. Click "+ Add Table" to attach session, OAuth account, or custom entity tables.
                  </p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: Providers */}
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
                    <Label className="text-xs font-semibold">Enable Organization Management</Label>
                    <p className="text-[11px] text-muted-foreground">Multi-tenant workspace memberships & roles.</p>
                  </div>
                  <Switch
                    checked={org.enabled}
                    onCheckedChange={(c) => {
                      const isChecked = Boolean(c);
                      const nextPlugins = isChecked
                        ? Array.from(new Set([...enabledPlugins, "organization"]))
                        : enabledPlugins.filter((p) => p !== "organization");
                      updateData({
                        organization: { ...org, enabled: isChecked },
                        plugins: nextPlugins,
                      });
                    }}
                  />
                </div>

                {org.enabled && (
                  <div className="flex flex-col gap-3 pt-3 border-t border-border/40 text-xs">
                    {/* Configured Entity (Schema) Selection */}
                    <div className="flex flex-col gap-2 p-3 bg-background/80 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-primary" />
                          Configured Organization Entity (Schema)
                        </Label>
                        {selectedOrgEntity && (
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 font-medium">
                            {selectedOrgEntity.data.columns?.length || 0} columns
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Select a configured entity schema from your canvas to map as the Organization data model.
                      </p>
                      <Select
                        value={selectedOrgSchemaId || "none"}
                        onValueChange={(val) => {
                          const selectedId = val === "none" ? undefined : val;
                          updateData({
                            organization: {
                              ...org,
                              schemaId: selectedId,
                              entityId: selectedId,
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Choose a schema entity..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs text-muted-foreground">
                            None (Use default Better Auth Organization schema)
                          </SelectItem>
                          {schemaEntities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id} className="text-xs">
                              {entity.data.label || "Untitled Entity"} ({entity.data.columns?.length || 0} columns)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedOrgEntity ? (
                        <div className="mt-1.5 p-2 bg-muted/40 rounded border border-border/40 flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center justify-between text-muted-foreground font-mono">
                            <span>Bound Entity Schema:</span>
                            <span className="font-semibold text-foreground">{selectedOrgEntity.data.label || "Untitled Entity"}</span>
                          </div>
                          {selectedOrgEntity.data.columns && selectedOrgEntity.data.columns.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedOrgEntity.data.columns.map((col) => (
                                <span
                                  key={col.name}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/60 text-muted-foreground"
                                >
                                  {col.name}: <span className="text-primary">{col.type}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : schemaEntities.length === 0 ? (
                        <p className="text-[10px] text-amber-500/90 dark:text-amber-400 font-mono mt-0.5">
                          ⓘ No entity nodes found on canvas. Add an Entity Node to canvas to select a custom schema.
                        </p>
                      ) : null}
                    </div>
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
  ${selectedUserEntity ? `user: { modelName: "${selectedUserEntity.data.label}" },\n  ` : ''}emailAndPassword: { enabled: ${providers.emailPassword?.enabled || false} },
  plugins: [
    ${enabledPlugins.map((p) => (p === "organization" && selectedOrgEntity ? `organization({ schema: "${selectedOrgEntity.data.label || "organization"}" })` : `${p}()`)).join(",\n    ")}${isPaymentsInjected ? ',\n    creem({ apiKey: process.env.CREEM_API_KEY!, webhookSecret: process.env.CREEM_WEBHOOK_SECRET! })' : ''}
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


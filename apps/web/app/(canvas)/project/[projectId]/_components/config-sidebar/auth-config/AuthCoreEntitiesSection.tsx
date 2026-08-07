import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
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
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  UserCheck,
  User,
  AlertCircle,
  Plus,
  Trash2,
  Users,
  Database,
  Table,
} from "lucide-react";
import { AdditionalAuthTableConfig } from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthCoreEntitiesSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
  allNodes,
}) => {
  const enabledPlugins = data.plugins || ["bearer", "admin", "organization", "jwt"];
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

  const additionalUserTables: AdditionalAuthTableConfig[] = data.additionalUserTables || [];
  const additionalOrgTables: AdditionalAuthTableConfig[] = org.additionalTables || [];
  const additionalTables: AdditionalAuthTableConfig[] = data.additionalTables || [];

  return (
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
            <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full font-medium border")}>
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
  );
};

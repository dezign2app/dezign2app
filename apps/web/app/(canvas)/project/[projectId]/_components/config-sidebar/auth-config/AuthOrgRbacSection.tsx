import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Switch } from "@workspace/ui/components/switch";
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
import { Users, Database } from "lucide-react";
import { AuthConfigSectionProps } from "./types";

export const AuthOrgRbacSection: React.FC<AuthConfigSectionProps> = ({
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

  return (
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
  );
};

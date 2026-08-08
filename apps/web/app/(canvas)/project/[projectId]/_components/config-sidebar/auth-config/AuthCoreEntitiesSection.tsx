import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
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
import {
  UserCheck,
  Plus,
  Trash2,
  Table,
  Code2,
  AlertCircle,
  Variable,
  Wand2,
  CheckCircle2,
  ShieldAlert,
  Building2,
  KeyRound,
  Sparkles,
  AlertTriangle,
  GitFork,
} from "lucide-react";
import {
  AuthFunctionRef,
  BetterAuthTableMapping,
  DbOperationFunction,
  BetterAuthTableDefinition,
  BETTER_AUTH_TABLE_DEFINITIONS,
} from "@workspace/canvas";
import { getEntityDbOperations } from "@/lib/utils/entityOperationsHelper";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { AuthConfigSectionProps } from "./types";

export const AuthCoreEntitiesSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
  allNodes,
  edges,
  nodeId,
}) => {
  const authFunctions: AuthFunctionRef[] = data.authFunctions || [];
  const tableMappings: BetterAuthTableMapping = data.tableMappings || {};
  const schemaEntities = allNodes.filter((n) => n.type === "entity");

  const orgConfig = data.organization || { enabled: true };
  const isOrgEnabled = orgConfig.enabled ?? true;

  const addNode = useBackendCanvasStore((s) => s.addNode);
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const addEdge = useBackendCanvasStore((s) => s.addEdge);

  const getEntityDbOps = (entityNodeId?: string): DbOperationFunction[] => {
    if (!entityNodeId) return [];
    const entity = schemaEntities.find((e) => e.id === entityNodeId);
    if (!entity) return [];
    return getEntityDbOperations(entity, allNodes).filter((op) => op.enabled !== false);
  };

  const addFunctionMapping = () => {
    const firstEntity = schemaEntities[0];
    const ops = getEntityDbOps(firstEntity?.id);
    const newRef: AuthFunctionRef = {
      id: `af-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      variableName: "",
      entityNodeId: firstEntity?.id || "",
      functionId: ops[0]?.id || "",
    };
    updateData({ authFunctions: [...authFunctions, newRef] });
  };

  const updateMapping = (index: number, changes: Partial<AuthFunctionRef>) => {
    const updated = authFunctions.map((fn, idx) => {
      if (idx !== index) return fn;
      const nextFn = { ...fn, ...changes };
      if (changes.entityNodeId && changes.entityNodeId !== fn.entityNodeId) {
        const ops = getEntityDbOps(changes.entityNodeId);
        nextFn.functionId = ops[0]?.id || "";
      }
      return nextFn;
    });
    updateData({ authFunctions: updated });
  };

  const removeMapping = (index: number) => {
    const updated = authFunctions.filter((_, idx) => idx !== index);
    updateData({ authFunctions: updated });
  };

  // Helper to link canvas FK edges between mapped Better Auth tables
  const syncForeignKeysForTable = (def: BetterAuthTableDefinition, currentTableId: string, currentMappings: BetterAuthTableMapping) => {
    def.defaultColumns.forEach((col) => {
      if (col.isForeignKey && col.references) {
        const targetTableName = col.references.table;
        const targetDef = BETTER_AUTH_TABLE_DEFINITIONS.find((d) => d.name === targetTableName);
        if (targetDef) {
          const targetNodeId = currentMappings[targetDef.key] || (targetDef.key === "userEntityId" ? (data.userEntityId || data.userSchemaId) : undefined);
          if (targetNodeId && targetNodeId !== currentTableId) {
            const hasEdge = edges.some(
              (e) =>
                (e.source === targetNodeId && e.target === currentTableId) ||
                (e.source === currentTableId && e.target === targetNodeId),
            );
            if (!hasEdge) {
              addEdge({
                id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                source: targetNodeId,
                target: currentTableId,
                type: "foreign-key",
              });
            }
          }
        }
      }
    });
  };

  const createEntityForTable = (def: BetterAuthTableDefinition) => {
    const authNode = allNodes.find((n) => n.id === nodeId);
    const baseX = (authNode?.position?.x || 100) + 320;
    const baseY = (authNode?.position?.y || 100) + schemaEntities.length * 90;

    const newEntityId = `entity-${Date.now()}-${def.name}`;
    addNode({
      id: newEntityId,
      type: "entity",
      position: { x: baseX, y: baseY },
      data: {
        label: def.name,
        description: def.description,
        columns: def.defaultColumns,
      },
    });

    const updatedMappings: BetterAuthTableMapping = {
      ...tableMappings,
      [def.key]: newEntityId,
    };

    updateData({
      tableMappings: updatedMappings,
      ...(def.key === "userEntityId" ? { userEntityId: newEntityId, userSchemaId: newEntityId } : {}),
    });

    syncForeignKeysForTable(def, newEntityId, updatedMappings);
  };

  const fixEntitySchema = (
    entityId: string,
    def: BetterAuthTableDefinition,
    missingColumns: BetterAuthTableDefinition["defaultColumns"],
  ) => {
    const entityNode = schemaEntities.find((e) => e.id === entityId);
    if (!entityNode || entityNode.type !== "entity") return;

    const currentCols = entityNode.data.columns || [];
    const updatedCols = [...currentCols, ...missingColumns];
    updateNode(entityId, {
      data: {
        ...entityNode.data,
        columns: updatedCols,
      },
    });

    syncForeignKeysForTable(def, entityId, tableMappings);
  };

  const autoCreateAllMissingTables = () => {
    const tablesToCreate = BETTER_AUTH_TABLE_DEFINITIONS.filter((def) => {
      if (def.category === "core") return !tableMappings[def.key];
      if (def.category === "organization") return isOrgEnabled && !tableMappings[def.key];
      if (def.key === "passkeyEntityId") return Boolean(data.providers?.passkey) && !tableMappings[def.key];
      if (def.key === "rateLimitEntityId") return Boolean(data.providers?.emailPassword?.rateLimit) && !tableMappings[def.key];
      return false;
    });

    const activeMappings: BetterAuthTableMapping = { ...tableMappings };

    tablesToCreate.forEach((def, index) => {
      const authNode = allNodes.find((n) => n.id === nodeId);
      const baseX = (authNode?.position?.x || 100) + 340;
      const baseY = (authNode?.position?.y || 100) + (schemaEntities.length + index) * 110;

      const newEntityId = `entity-${Date.now()}-${def.name}`;
      addNode({
        id: newEntityId,
        type: "entity",
        position: { x: baseX, y: baseY },
        data: {
          label: def.name,
          description: def.description,
          columns: def.defaultColumns,
        },
      });

      activeMappings[def.key] = newEntityId;
    });

    updateData({
      tableMappings: activeMappings,
      userEntityId: activeMappings.userEntityId || data.userEntityId,
    });

    BETTER_AUTH_TABLE_DEFINITIONS.forEach((def) => {
      const mappedId = activeMappings[def.key];
      if (mappedId) {
        syncForeignKeysForTable(def, mappedId, activeMappings);
      }
    });
  };

  const syncAllTableRelationships = () => {
    BETTER_AUTH_TABLE_DEFINITIONS.forEach((def) => {
      const mappedId = tableMappings[def.key] || (def.key === "userEntityId" ? (data.userEntityId || data.userSchemaId) : undefined);
      if (mappedId) {
        syncForeignKeysForTable(def, mappedId, tableMappings);
      }
    });
  };

  const categories = [
    {
      id: "core",
      title: "Core Auth Tables",
      icon: ShieldAlert,
      badgeText: "Required",
      badgeColor: "bg-primary/15 text-primary border-primary/20",
      description: "Mandatory database tables required for core authentication & sessions.",
      isToggleable: false,
    },
    {
      id: "organization",
      title: "Organization & Workspaces Tables",
      icon: Building2,
      badgeText: isOrgEnabled ? "Plugin Active" : "Disabled",
      badgeColor: isOrgEnabled
        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20"
        : "bg-muted text-muted-foreground border-border/40",
      description: "Multi-tenant workspaces, team memberships, and onboarding invitations.",
      isToggleable: true,
      isEnabled: isOrgEnabled,
      onToggle: (enabled: boolean) => {
        const enabledPlugins = data.plugins || ["bearer", "admin", "organization", "jwt"];
        const nextPlugins = enabled
          ? Array.from(new Set([...enabledPlugins, "organization"]))
          : enabledPlugins.filter((p) => p !== "organization");
        updateData({
          organization: { ...orgConfig, enabled },
          plugins: nextPlugins,
        });
      },
    },
    {
      id: "plugin",
      title: "Extension & Plugin Tables",
      icon: KeyRound,
      badgeText: "Optional Plugins",
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
      description: "WebAuthn Passkey, 2FA TOTP secrets, JWKS keys, and rate limit counters.",
      isToggleable: false,
    },
  ] satisfies Array<{
    id: "core" | "organization" | "plugin";
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeText: string;
    badgeColor: string;
    description: string;
    isToggleable: boolean;
    isEnabled?: boolean;
    onToggle?: (enabled: boolean) => void;
  }>;

  const mappedCount = BETTER_AUTH_TABLE_DEFINITIONS.filter((def) => Boolean(tableMappings[def.key])).length;

  return (
    <AccordionItem
      value="core-entities"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden border-primary/30"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex flex-col items-start gap-2 text-left flex-1">
          <div className="flex gap-2 items-center">
            <UserCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Better Auth Database Tables & Functions
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
              {mappedCount} / {BETTER_AUTH_TABLE_DEFINITIONS.length} Tables Mapped
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40 font-medium">
              {authFunctions.length} Functions
            </span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-6 pt-2">
          {/* Section 1: Better Auth Required Tables Grouped By Category */}
          <div className="flex flex-col gap-4 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-primary" /> Better Auth Schema Entity Mapping
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Map official Better Auth tables by feature category or auto-generate missing tables.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-background shrink-0 font-medium"
                  onClick={syncAllTableRelationships}
                  title="Connect FK edges between user, session, organization, member, etc."
                >
                  <GitFork className="w-3.5 h-3.5 mr-1 text-primary" /> Auto-Link FK Edges
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 shrink-0 font-medium"
                  onClick={autoCreateAllMissingTables}
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1" /> Auto-Create Missing Tables
                </Button>
              </div>
            </div>

            {/* Category Groups */}
            <div className="flex flex-col gap-5 pt-1">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const catTables = BETTER_AUTH_TABLE_DEFINITIONS.filter((def) => def.category === cat.id);
                const isCatDisabled = cat.isToggleable && cat.isEnabled === false;

                return (
                  <div
                    key={cat.id}
                    className={`flex flex-col gap-2.5 p-3 rounded-lg border transition-colors ${
                      isCatDisabled
                        ? "bg-background/30 border-border/30 opacity-70"
                        : "bg-background/70 border-border/60"
                    }`}
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wide">
                          {cat.title}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold font-mono border ${cat.badgeColor}`}>
                          {cat.badgeText}
                        </span>
                      </div>

                      {cat.isToggleable && cat.onToggle && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {cat.isEnabled ? "Plugin Enabled" : "Disabled"}
                          </span>
                          <Switch
                            checked={cat.isEnabled ?? false}
                            onCheckedChange={(checked: boolean) => cat.onToggle?.(checked)}
                          />
                        </div>
                      )}
                    </div>

                    <p className="text-[10.5px] text-muted-foreground">{cat.description}</p>

                    {/* Table Rows for this Category */}
                    {!isCatDisabled ? (
                      <div className="flex flex-col gap-2 pt-1">
                        {catTables.map((def) => {
                          const mappedId =
                            tableMappings[def.key] ||
                            (def.key === "userEntityId" ? (data.userEntityId || data.userSchemaId) : undefined);
                          const mappedEntity = schemaEntities.find((e) => e.id === mappedId);

                          const existingCols = mappedEntity?.type === "entity" ? mappedEntity.data.columns || [] : [];
                          const missingColumns = mappedEntity
                            ? def.defaultColumns.filter(
                                (reqCol) => !existingCols.some((c) => c.name.toLowerCase() === reqCol.name.toLowerCase()),
                              )
                            : [];

                          return (
                            <div key={def.key} className="flex flex-col gap-1.5">
                              <div className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-background border border-border/50 text-xs">
                                <div className="col-span-3 flex flex-col gap-0.5">
                                  <span className="font-mono font-bold text-foreground capitalize">{def.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate">{def.description}</span>
                                </div>

                                <div className="col-span-6">
                                  <Select
                                    value={mappedId || "none"}
                                    onValueChange={(val: string) => {
                                      const nextEntityId = val === "none" ? undefined : val;
                                      const updated = {
                                        ...tableMappings,
                                        [def.key]: nextEntityId,
                                      };
                                      updateData({
                                        tableMappings: updated,
                                        ...(def.key === "userEntityId"
                                          ? {
                                              userEntityId: nextEntityId,
                                              userSchemaId: nextEntityId,
                                            }
                                          : {}),
                                      });
                                      if (nextEntityId) {
                                        syncForeignKeysForTable(def, nextEntityId, updated);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs font-mono bg-background">
                                      <SelectValue placeholder="Select Entity Node..." />
                                    </SelectTrigger>
                                    <SelectContent className="font-mono">
                                      <SelectItem value="none" className="text-xs font-mono text-muted-foreground">
                                        Unmapped
                                      </SelectItem>
                                      {schemaEntities.map((entity) => (
                                        <SelectItem key={entity.id} value={entity.id} className="text-xs font-mono">
                                          {entity.data.label || "Untitled Entity"} ({entity.data.columns?.length || 0} cols)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="col-span-3 flex justify-end items-center gap-1.5">
                                  {mappedEntity ? (
                                    missingColumns.length === 0 ? (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Valid
                                      </span>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 font-medium"
                                        onClick={() => fixEntitySchema(mappedEntity.id, def, missingColumns)}
                                        title={`Add ${missingColumns.map((c) => c.name).join(", ")}`}
                                      >
                                        <Sparkles className="w-3 h-3 mr-1" /> Add {missingColumns.length} Cols
                                      </Button>
                                    )
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[11px] bg-background"
                                      onClick={() => createEntityForTable(def)}
                                    >
                                      <Plus className="w-3 h-3 mr-1 text-primary" /> Create Table
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Schema Missing Columns Banner */}
                              {mappedEntity && missingColumns.length > 0 && (
                                <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10.5px] text-amber-600 dark:text-amber-400 font-mono">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      Entity <strong>{mappedEntity.data.label}</strong> missing required fields:{" "}
                                      <span className="font-bold underline">
                                        {missingColumns.map((c) => c.name).join(", ")}
                                      </span>
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => fixEntitySchema(mappedEntity.id, def, missingColumns)}
                                    className="ml-2 font-bold underline hover:text-amber-500 text-[10px] shrink-0"
                                  >
                                    Inject Missing Columns & FKs
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded bg-background/20 font-mono">
                        Plugin disabled. Enable switch above to configure tables.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Associated DB Functions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/40">
              <div className="flex flex-col gap-0.5">
                <Label className="text-xs font-semibold">Associated DB Functions</Label>
                <p className="text-[11px] text-muted-foreground">
                  Add variables and map them to entity tables and their associated database functions.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background shrink-0 font-medium"
                onClick={addFunctionMapping}
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-primary" /> Add Function
              </Button>
            </div>

            {authFunctions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {authFunctions.map((af, idx) => {
                  const selectedEntity = schemaEntities.find((e) => e.id === af.entityNodeId);
                  const dbOps = getEntityDbOps(af.entityNodeId);
                  const matchedOp = dbOps.find((op) => op.id === af.functionId || op.name === af.functionId);
                  const currentFunctionId = matchedOp ? matchedOp.id : af.functionId || "none";

                  return (
                    <div
                      key={af.id || idx}
                      className="flex flex-col gap-2.5 p-3 rounded-lg bg-background/80 border border-border/50 text-xs shadow-sm"
                    >
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 flex flex-col gap-1">
                          <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            Variable
                          </Label>
                          <Input
                            placeholder="e.g. user, subscription"
                            value={af.variableName || ""}
                            onChange={(e) => updateMapping(idx, { variableName: e.target.value })}
                            className="h-7 text-xs font-mono bg-background"
                          />
                        </div>

                        <div className="col-span-4 flex flex-col gap-1">
                          <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Table className="w-3 h-3 text-primary" /> Entity
                          </Label>
                          <Select
                            value={af.entityNodeId || "none"}
                            onValueChange={(val: string) =>
                              updateMapping(idx, { entityNodeId: val === "none" ? "" : val })
                            }
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

                        <div className="col-span-4 flex flex-col gap-1">
                          <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-primary" /> Associated Function
                          </Label>
                          <Select
                            value={currentFunctionId}
                            onValueChange={(val: string) =>
                              updateMapping(idx, { functionId: val === "none" ? "" : val })
                            }
                            disabled={!selectedEntity || dbOps.length === 0}
                          >
                            <SelectTrigger className="h-7 text-xs font-mono bg-background">
                              <SelectValue
                                placeholder={
                                  !selectedEntity
                                    ? "Select Table first..."
                                    : dbOps.length === 0
                                    ? "No functions available"
                                    : "Select function..."
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="font-mono">
                              <SelectItem value="none" className="text-xs text-muted-foreground">
                                Select function...
                              </SelectItem>
                              {dbOps.map((op) => (
                                <SelectItem key={op.id} value={op.id} className="text-xs font-mono">
                                  {op.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1 flex justify-end items-end pt-4">
                          <button
                            onClick={() => removeMapping(idx)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove function mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {selectedEntity && dbOps.length === 0 && (
                        <div className="flex items-center gap-1.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>
                            No database functions defined on table <strong>{selectedEntity.data.label}</strong>. Add queries or CRUD ops on that Entity node.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-5 border border-dashed border-border/60 rounded-lg text-center bg-background/30 gap-2">
                <Variable className="w-5 h-5 text-muted-foreground/60" />
                <span className="text-xs font-medium text-foreground">No Function Mappings Added</span>
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

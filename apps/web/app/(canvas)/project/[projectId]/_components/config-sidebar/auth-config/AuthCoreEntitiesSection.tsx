import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
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
} from "lucide-react";
import { AuthFunctionRef, DbOperationFunction } from "@workspace/canvas";
import { getEntityDbOperations } from "@/lib/utils/entityOperationsHelper";
import { AuthConfigSectionProps } from "./types";

export const AuthCoreEntitiesSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
  allNodes,
}) => {
  const authFunctions: AuthFunctionRef[] = data.authFunctions || [];
  const schemaEntities = allNodes.filter((n) => n.type === "entity");

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
              Associated DB Functions
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
              {authFunctions.length === 0
                ? "No Functions Added"
                : `${authFunctions.length} Function Mapping${authFunctions.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          {/* Section Subheader with + Add Function button */}
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

          {/* List of Function Mappings */}
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
                    <div className="flex gap-3 items-center">
                      {/* Variable Name Input */}
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

                      {/* Select Entity Table */}
                      <div className="col-span-4 flex flex-col gap-1">
                        <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Table className="w-3 h-3 text-primary" /> Entity
                        </Label>
                        <Select
                          value={af.entityNodeId || "none"}
                          onValueChange={(val) =>
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

                      {/* Select Associated Function */}
                      <div className="col-span-4 flex flex-col gap-1">
                        <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Code2 className="w-3 h-3 text-primary" /> Associated Function
                        </Label>
                        <Select
                          value={currentFunctionId}
                          onValueChange={(val) =>
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

                      {/* Delete Button */}
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

                    {/* Hint if selected entity has no DB functions */}
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
            /* Empty State */
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border/60 rounded-lg text-center bg-background/30 gap-2">
              <Variable className="w-6 h-6 text-muted-foreground/60" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground">No Function Mappings Added</span>
                <p className="text-[11px] text-muted-foreground max-w-sm">
                  Click "+ Add Function" above to define variable aliases, select entity tables, and pick their associated database functions.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background mt-1"
                onClick={addFunctionMapping}
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-primary" /> Add Function
              </Button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

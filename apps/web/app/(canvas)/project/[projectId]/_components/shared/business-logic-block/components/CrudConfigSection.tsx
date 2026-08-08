import React from "react";
import { Database, Plus, Trash2, FunctionSquare, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { TableCrudConfig } from "../types";
import { BackendNode } from "@/types/canvas";
import { getEntityDbOperations } from "@/lib/utils/entityOperationsHelper";
import { DbOperationFunction } from "@workspace/canvas/types";

interface CrudConfigSectionProps {
  crudConfig: TableCrudConfig[];
  onCrudConfigChange: (config: TableCrudConfig[]) => void;
  availableTableNodes?: { id: string; label: string }[];
  allNodes?: BackendNode[];
}

export function CrudConfigSection({
  crudConfig,
  onCrudConfigChange,
  availableTableNodes = [],
  allNodes = [],
}: CrudConfigSectionProps) {
  return (
    <div className="flex flex-col gap-2.5 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider font-mono">
            Connected Database Operation Functions
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] gap-1 px-2 border-border"
          onClick={() => {
            const firstTableId = availableTableNodes[0]?.id || "";
            onCrudConfigChange([
              ...crudConfig,
              { tableNodeId: firstTableId, operations: ["read"] },
            ]);
          }}
        >
          <Plus className="w-3 h-3" />
          <span>Add Entity Ref</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {crudConfig.map((configItem, idx) => {
          const tableNode = allNodes.find((n) => n.id === configItem.tableNodeId);
          const label = tableNode?.data.label || availableTableNodes.find((t) => t.id === configItem.tableNodeId)?.label || "Table";
          const columns = tableNode?.data.columns || [];
          const indexes = tableNode?.data.indexes || [];

          const entityOps: DbOperationFunction[] = getEntityDbOperations(tableNode, allNodes);

          // Get selected operation names for this table
          const selectedOps = configItem.operations || [];

          return (
            <div
              key={`${configItem.tableNodeId || "table"}_${idx}`}
              className="flex flex-col gap-3 p-3 bg-background/60 rounded-xl border border-border/50 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                {/* Table Node Selector */}
                <Select
                  value={configItem.tableNodeId || "__none__"}
                  onValueChange={(tableId) => {
                    const next = [...crudConfig];
                    if (next[idx]) {
                      next[idx] = {
                        ...next[idx],
                        tableNodeId: tableId === "__none__" ? "" : tableId,
                      };
                      onCrudConfigChange(next);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1 font-mono bg-background">
                    <SelectValue placeholder="Select an Entity Node..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="__none__"
                      className="text-xs font-mono text-muted-foreground"
                    >
                      Select an Entity Table...
                    </SelectItem>
                    {availableTableNodes.map((t) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        className="text-xs font-mono"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Remove Table Config */}
                <button
                  type="button"
                  title="Remove Entity Reference"
                  onClick={() => {
                    const next = crudConfig.filter((_, i) => i !== idx);
                    onCrudConfigChange(next);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Entity DB Functions Selector List */}
              {configItem.tableNodeId && (
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono flex items-center gap-1">
                    <FunctionSquare size={11} /> Select DB Functions for {label}:
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {entityOps
                      .filter((op) => op.enabled !== false)
                      .map((op) => {
                        const isSelected = selectedOps.includes(op.name as any);

                        return (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => {
                              const curr = configItem.operations || [];
                              const nextOps = isSelected
                                ? curr.filter((o) => o !== op.name && o !== op.kind && o !== "read")
                                : [...curr, op.name];
                              const next = [...crudConfig];
                              if (next[idx]) {
                                next[idx] = { ...next[idx], operations: nextOps };
                                onCrudConfigChange(next);
                              }
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border ${
                              isSelected
                                ? "bg-primary/15 text-primary border-primary/40 font-semibold shadow-xs"
                                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
                            }`}
                            title={op.description || op.signature || op.name}
                          >
                            {isSelected && <Check size={11} />}
                            <span>{op.name}</span>
                            <span className="text-[9px] font-bold uppercase opacity-60 ml-0.5">
                              ({op.kind})
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {crudConfig.length === 0 && (
          <span className="text-[10px] text-muted-foreground italic px-1">
            No database functions selected. Click &quot;+ Add Entity Ref&quot; to link entity DB operations to this endpoint.
          </span>
        )}
      </div>
    </div>
  );
}

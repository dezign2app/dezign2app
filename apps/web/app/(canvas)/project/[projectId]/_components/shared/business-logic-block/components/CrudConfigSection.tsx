import React from "react";
import { Database, Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalTextarea } from "../../../backend-nodes/graph-nodes/shared";
import { CrudOperation, TableCrudConfig } from "../types";

const ALL_CRUD_OPS: CrudOperation[] = ["create", "read", "update", "delete"];

interface CrudConfigSectionProps {
  crudConfig: TableCrudConfig[];
  onCrudConfigChange: (config: TableCrudConfig[]) => void;
  availableTableNodes?: { id: string; label: string }[];
}

export function CrudConfigSection({
  crudConfig,
  onCrudConfigChange,
  availableTableNodes = [],
}: CrudConfigSectionProps) {
  return (
    <div className="flex flex-col gap-2.5 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Database Table Operations
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
          <span>Add Table Ref</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {crudConfig.map((configItem, idx) => (
          <div
            key={`${configItem.tableNodeId || "table"}_${idx}`}
            className="flex flex-col gap-3 p-2.5 bg-background/60 rounded-lg border border-border/50 shadow-sm"
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
                  <SelectValue placeholder="Select a Table Ref Node..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__none__"
                    className="text-xs font-mono text-muted-foreground"
                  >
                    Select a Table...
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

              {/* CRUD Operation Toggle Pills */}
              <div className="flex items-center gap-1">
                {ALL_CRUD_OPS.map((op) => {
                  const label =
                    op === "create"
                      ? "C"
                      : op === "read"
                        ? "R"
                        : op === "update"
                          ? "U"
                          : "D";
                  const isSelected = configItem.operations.includes(op);
                  return (
                    <button
                      key={op}
                      type="button"
                      title={op.toUpperCase()}
                      onClick={() => {
                        const curr = configItem.operations || [];
                        const nextOps = isSelected
                          ? curr.filter((o) => o !== op)
                          : [...curr, op];
                        const next = [...crudConfig];
                        if (next[idx]) {
                          next[idx] = { ...next[idx], operations: nextOps };
                          onCrudConfigChange(next);
                        }
                      }}
                      className={`w-6 h-6 rounded text-[10px] font-bold font-mono transition-all flex items-center justify-center border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                {/* Remove Table Config */}
                <button
                  type="button"
                  title="Remove Table Reference"
                  onClick={() => {
                    const next = crudConfig.filter((_, i) => i !== idx);
                    onCrudConfigChange(next);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Operation Explanations */}
            {configItem.operations.length > 0 && configItem.tableNodeId && (
              <div className="flex flex-col gap-2 mt-1 px-1">
                {configItem.operations.map((op) => (
                  <div key={op} className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                      {op} Explanation
                    </Label>
                    <LocalTextarea
                      value={configItem.explanations?.[op] || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        const next = [...crudConfig];
                        if (next[idx]) {
                          const newExplanations = {
                            ...(next[idx].explanations || {}),
                            [op]: e.target.value,
                          };
                          next[idx] = {
                            ...next[idx],
                            explanations: newExplanations as Record<
                              CrudOperation,
                              string
                            >,
                          };
                          onCrudConfigChange(next);
                        }
                      }}
                      placeholder={`Explain why and how the data is ${op === "read" ? "fetched from" : op === "create" ? "inserted into" : op === "update" ? "updated in" : "deleted from"} this table...`}
                      className="text-[11px] min-h-[60px] resize-y bg-background leading-relaxed placeholder:text-muted-foreground/40 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {crudConfig.length === 0 && (
          <span className="text-[10px] text-muted-foreground italic px-1">
            No database table operations configured. Click "+ Add Table Ref"
            to link database access.
          </span>
        )}
      </div>
    </div>
  );
}


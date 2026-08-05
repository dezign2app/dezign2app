import React, { useEffect } from "react";
import { Plus, X, Sparkles, Check, Database } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalInput } from "../backend-nodes/graph-nodes/common";
import { BackendNode } from "@/types/canvas";

export interface ResponseField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  selectedColumns?: string[];
}

export type ResponseMode = "schema_builder" | "custom_expression" | "inferred";

interface ResponseSchemaEditorProps {
  mode?: ResponseMode;
  onModeChange: (mode: ResponseMode) => void;
  fields?: ResponseField[];
  onFieldsChange: (fields: ResponseField[]) => void;
  expression?: string;
  onExpressionChange: (expr: string) => void;
  availableTableNodes?: { id: string; label: string }[];
  allNodes?: BackendNode[];
  endpointMethod?: string;
}

function generateId() {
  return "rf_" + Math.random().toString(36).substring(2, 9);
}

export const ResponseSchemaEditor: React.FC<ResponseSchemaEditorProps> = ({
  mode = "schema_builder",
  onModeChange,
  fields = [],
  onFieldsChange,
  expression = "",
  onExpressionChange,
  availableTableNodes = [],
  allNodes = [],
  endpointMethod = "GET",
}) => {
  // Ensure default envelope fields (status, message, data) are populated if empty
  useEffect(() => {
    if (mode === "schema_builder" && fields.length === 0) {
      const defaultTableId = availableTableNodes[0]?.id;
      const isListMethod = endpointMethod?.toUpperCase() === "GET";
      const defaultDbType = defaultTableId
        ? isListMethod
          ? `db:${defaultTableId}:array`
          : `db:${defaultTableId}:single`
        : "object";

      const initialFields: ResponseField[] = [
        {
          id: generateId(),
          name: "status",
          type: "number",
          required: true,
          description: "HTTP response status code",
        },
        {
          id: generateId(),
          name: "message",
          type: "string",
          required: true,
          description: "Response status message",
        },
        {
          id: generateId(),
          name: "data",
          type: defaultDbType,
          required: true,
          description: "Response data payload",
        },
      ];
      onFieldsChange(initialFields);
    }
  }, [mode, fields.length, availableTableNodes, endpointMethod, onFieldsChange]);

  const addField = () => {
    onFieldsChange([
      ...fields,
      {
        id: generateId(),
        name: "",
        type: "string",
        required: true,
      },
    ]);
  };

  const updateField = (id: string, changes: Partial<ResponseField>) => {
    onFieldsChange(
      fields.map((f) => (f.id === id ? { ...f, ...changes } : f)),
    );
  };

  const removeField = (id: string) => {
    onFieldsChange(fields.filter((f) => f.id !== id));
  };

  // Helper to extract table columns from allNodes for a specific tableNodeId
  const getTableColumns = (tableNodeId: string): string[] => {
    const node = allNodes.find((n) => n.id === tableNodeId);
    if (!node?.data?.columns || !Array.isArray(node.data.columns)) {
      return ["id", "created_at"];
    }
    return node.data.columns.map((c: any) => c.name || "field");
  };

  const toggleColumnSelection = (fieldId: string, colName: string) => {
    const targetField = fields.find((f) => f.id === fieldId);
    if (!targetField) return;

    const currentCols = targetField.selectedColumns || [];
    const newCols = currentCols.includes(colName)
      ? currentCols.filter((c) => c !== colName)
      : [...currentCols, colName];

    updateField(fieldId, { selectedColumns: newCols });
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-secondary/10 rounded-xl border border-border/60 shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Response Payload Configuration
          </span>
          <span className="text-[10px] text-muted-foreground">
            Configure dynamic return payload and type contract for microservices
          </span>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex items-center justify-between gap-1 bg-background/60 p-1 rounded-lg border border-border/50">
        <button
          type="button"
          onClick={() => onModeChange("schema_builder")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-[11px] font-medium transition-all ${
            mode === "schema_builder"
              ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Database className="w-3.5 h-3.5 text-primary" />
          <span>Schema Builder</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("custom_expression")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-[11px] font-medium transition-all ${
            mode === "custom_expression"
              ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <span>Expression</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("inferred")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-[11px] font-medium transition-all ${
            mode === "inferred"
              ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Inferred</span>
        </button>
      </div>

      {/* Mode 1: Schema Builder */}
      {mode === "schema_builder" && (
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Response Envelope & Data Fields
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-6 text-[10px] gap-1 rounded-full px-2.5"
              onClick={addField}
            >
              <Plus size={11} /> Add Field
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {fields.map((f) => {
              const isDbPartial = f.type.includes(":partial");
              const dbTableId = f.type.startsWith("db:")
                ? f.type.split(":")[1]
                : undefined;
              const allTableCols = dbTableId ? getTableColumns(dbTableId) : [];

              return (
                <div
                  key={f.id}
                  className="flex flex-col gap-2 rounded-lg border bg-background/60 p-2.5 group/field transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <LocalInput
                      className="h-7 text-xs flex-1 nodrag bg-background font-mono border-none shadow-none focus-visible:ring-1 placeholder:font-sans"
                      placeholder="Field name (e.g. data)"
                      value={f.name || ""}
                      onBlur={(e) => updateField(f.id, { name: e.target.value })}
                    />

                    {/* Type Selector Dropdown */}
                    <Select
                      value={f.type}
                      onValueChange={(v) =>
                        updateField(f.id, {
                          type: v,
                          selectedColumns: v.includes(":partial")
                            ? allTableCols
                            : undefined,
                        })
                      }
                    >
                      <SelectTrigger className="h-7 w-[165px] text-xs py-0 nodrag bg-secondary/50 border-none font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Primitives
                        </div>
                        <SelectItem value="string" className="text-xs font-mono">
                          string
                        </SelectItem>
                        <SelectItem value="number" className="text-xs font-mono">
                          number
                        </SelectItem>
                        <SelectItem value="boolean" className="text-xs font-mono">
                          boolean
                        </SelectItem>
                        <SelectItem value="UUID" className="text-xs font-mono">
                          UUID
                        </SelectItem>
                        <SelectItem value="timestamp" className="text-xs font-mono">
                          timestamp
                        </SelectItem>
                        <SelectItem value="object" className="text-xs font-mono">
                          object
                        </SelectItem>
                        <SelectItem value="array" className="text-xs font-mono">
                          array
                        </SelectItem>

                        {availableTableNodes.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-[10px] font-bold text-primary uppercase tracking-wider border-t border-border/40 mt-1">
                              Connected Database Entities
                            </div>
                            {availableTableNodes.map((tbl) => (
                              <React.Fragment key={tbl.id}>
                                <SelectItem
                                  value={`db:${tbl.id}:single`}
                                  className="text-xs font-mono"
                                >
                                  DB: {tbl.label} (Full)
                                </SelectItem>
                                <SelectItem
                                  value={`db:${tbl.id}:array`}
                                  className="text-xs font-mono"
                                >
                                  DB: {tbl.label}[] (Full)
                                </SelectItem>
                                <SelectItem
                                  value={`db:${tbl.id}:partial_single`}
                                  className="text-xs font-mono"
                                >
                                  DB: {tbl.label} (Partial Pick)
                                </SelectItem>
                                <SelectItem
                                  value={`db:${tbl.id}:partial_array`}
                                  className="text-xs font-mono"
                                >
                                  DB: {tbl.label}[] (Partial Pick)
                                </SelectItem>
                              </React.Fragment>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 text-[10px] nodrag rounded-full transition-colors ${
                        f.required
                          ? "text-primary font-bold bg-primary/10 hover:bg-primary/20"
                          : "text-muted-foreground bg-secondary/50 hover:bg-secondary"
                      }`}
                      onClick={() => updateField(f.id, { required: !f.required })}
                    >
                      {f.required ? "REQUIRED" : "OPTIONAL"}
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover/field:opacity-100 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 transition-all rounded-full"
                      onClick={() => removeField(f.id)}
                    >
                      <X size={14} />
                    </Button>
                  </div>

                  {/* Partial Column Picker Pills */}
                  {isDbPartial && dbTableId && (
                    <div className="flex flex-col gap-1.5 p-2 bg-secondary/20 rounded border border-border/40 mt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                        Select Columns to Include (Partial Pick):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {allTableCols.map((col) => {
                          const isSelected = (
                            f.selectedColumns || allTableCols
                          ).includes(col);
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() =>
                                toggleColumnSelection(f.id, col)
                              }
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all border ${
                                isSelected
                                  ? "bg-primary/20 text-primary border-primary/40 font-bold"
                                  : "bg-background/60 text-muted-foreground border-border/50 hover:bg-secondary"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                              <span>{col}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Custom Expression */}
      {mode === "custom_expression" && (
        <div className="flex flex-col gap-2 mt-1">
          <Label className="text-[11px] font-semibold text-muted-foreground">
            Custom Expression / Variable
          </Label>
          <Input
            className="bg-background font-mono text-xs"
            placeholder="e.g. result, dbData, or { success: true, user }"
            value={expression}
            onChange={(e) => onExpressionChange(e.target.value)}
          />
          <span className="text-[10px] text-muted-foreground">
            Specify a custom variable or JS object expression to return directly in <code>res.json(...)</code>.
          </span>
        </div>
      )}

      {/* Mode 3: AI Inferred */}
      {mode === "inferred" && (
        <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground bg-secondary/20 p-2.5 rounded-lg border border-border/40 mt-1">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Dynamic Response Inference</span>
          </div>
          <span>
            The microservice compiler will infer the return payload dynamically from the Business Logic prompt or connected Database operations.
          </span>
        </div>
      )}
    </div>
  );
};

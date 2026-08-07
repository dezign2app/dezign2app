import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import { COLUMN_TYPES } from "@/lib/schema/columnTypes";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";

export type ColumnItem = NonNullable<BackendNode["data"]["columns"]>[0];

export interface ColumnRowProps {
  nodeId?: string;
  col: ColumnItem;
  index: number;
  isEditing: boolean;
  setEditingIndex: (idx: number | null) => void;
  editingName: string;
  setEditingName: (name: string) => void;
  editingType: string;
  setEditingType: (type: string) => void;
  handleUpdate: (index: number, changes: Partial<ColumnItem>) => void;
  handleDelete: (index: number) => void;
  isVector: boolean;
  nameError: boolean;
  setNameError: (err: boolean) => void;
}

export const ColumnRow = ({
  nodeId,
  col,
  index,
  isEditing,
  setEditingIndex,
  editingName,
  setEditingName,
  editingType,
  setEditingType,
  handleUpdate,
  handleDelete,
  isVector,
  nameError,
  setNameError,
}: ColumnRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const nodes = useBackendCanvasStore((s) => s.nodes);

  const entityNodes = nodes.filter((n) => n.type === "entity");

  const availableTables = Array.from(
    new Set([
      ...entityNodes
        .map((n) => n.data.label)
        .filter((label): label is string => Boolean(label && label.trim() !== "")),
      ...(col.references?.table ? [col.references.table] : []),
    ]),
  );

  const selectedTableNode = entityNodes.find(
    (n) => n.data.label === col.references?.table,
  );

  const availableColumns = Array.from(
    new Set([
      ...(selectedTableNode?.data.columns
        ?.map((c) => c.name)
        .filter((name): name is string => Boolean(name && name.trim() !== "")) || []),
      ...(col.references?.column ? [col.references.column] : []),
    ]),
  );

  const saveInlineEdit = () => {
    if (!editingName.trim()) {
      handleDelete(index);
      setEditingIndex(null);
      return;
    }
    handleUpdate(index, { name: editingName.trim(), type: editingType });
    setEditingIndex(null);
  };

  const isKeyColumn = col.isPrimaryKey || col.isUnique || col.isForeignKey;
  const isTargetAllowed = col.isPrimaryKey || col.isUnique || col.name === "_id";

  return (
    <div className="flex flex-col px-3 py-1.5 border-b last:border-b-0 text-xs relative group/row hover:bg-secondary/20 nodrag">
      <Handle
        type="source"
        position={Position.Right}
        id={`source-${index}`}
        className={cn(
          "w-3.5 h-3.5 !bg-zinc-200 dark:!bg-zinc-100 hover:!bg-sky-400 border-none shadow-md transition-all hover:scale-125 rounded-full z-30 cursor-crosshair",
          isKeyColumn ? "opacity-100" : "opacity-0 group-hover/row:opacity-100",
        )}
      />
      {isTargetAllowed && (
        <Handle
          type="target"
          position={Position.Left}
          id={`target-${index}`}
          className="w-3.5 h-3.5 !bg-zinc-200 dark:!bg-zinc-100 hover:!bg-sky-400 border-none shadow-md transition-all hover:scale-125 rounded-full z-30 cursor-crosshair"
        />
      )}

      {isEditing ? (
        <div className="flex items-center gap-1 w-full nodrag">
          <Input
            value={editingName}
            onChange={(e) => {
              setEditingName(e.target.value);
              setNameError(false);
            }}
            className={cn(
              "h-6 text-xs flex-1 nodrag",
              nameError && "border-destructive",
            )}
            placeholder="Name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") saveInlineEdit();
              if (e.key === "Escape") setEditingIndex(null);
            }}
          />
          <Select value={editingType} onValueChange={setEditingType}>
            <SelectTrigger className="h-6 text-[10px] px-1.5 w-[80px] py-0 nodrag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMN_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={saveInlineEdit}
          >
            <Check size={14} />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center justify-between w-full cursor-pointer"
          onClick={() => {
            setEditingIndex(index);
            setEditingName(col.name);
            setEditingType(col.type || "VARCHAR");
            setNameError(false);
          }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {col.isPrimaryKey && (
              <Badge
                className="text-[9px] px-1 rounded font-bold"
                variant="secondary"
              >
                PK
              </Badge>
            )}
            {col.isForeignKey && (
              <Badge
                className="text-[9px] px-1 rounded font-bold"
                variant="secondary"
              >
                FK
              </Badge>
            )}
            <span className="font-medium truncate max-w-[120px]">
              {col.name}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2 opacity-100 group-hover/row:opacity-100 transition-all">
            <span className="text-muted-foreground truncate max-w-[60px]">
              {col.type}
            </span>
            {col.isNotNull && (
              <Badge
                className="text-[9px] px-1 rounded font-bold"
                variant="outline"
              >
                NN
              </Badge>
            )}
            {col.isUnique && (
              <Badge
                className="text-[9px] px-1 rounded font-bold"
                variant="outline"
              >
                UQ
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <div
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              <div
                className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(index);
                }}
              >
                <X size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {expanded && !isEditing && (
        <div
          className="flex flex-col gap-3 pt-3 mt-2 border-t cursor-default nodrag"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              Primary Key
            </Label>
            <Switch
              checked={!!col.isPrimaryKey}
              onCheckedChange={(val) =>
                handleUpdate(index, { isPrimaryKey: val })
              }
              className="scale-75 origin-right"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              Not Null
            </Label>
            <Switch
              checked={!!col.isNotNull}
              onCheckedChange={(val) => handleUpdate(index, { isNotNull: val })}
              className="scale-75 origin-right"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
              Unique
            </Label>
            <Switch
              checked={!!col.isUnique}
              onCheckedChange={(val) => handleUpdate(index, { isUnique: val })}
              className="scale-75 origin-right"
            />
          </div>
          <div className="flex flex-col gap-1.5 border-t pt-2 mt-1">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                Foreign Key
              </Label>
              <Switch
                checked={!!col.isForeignKey}
                onCheckedChange={(val) => {
                  if (val) {
                    let refTable = col.references?.table || "";
                    let refCol = col.references?.column || "";

                    if (!refTable) {
                      const otherTable =
                        entityNodes.find((n) => n.id !== nodeId) ||
                        entityNodes[0];
                      if (otherTable && otherTable.data.label) {
                        refTable = otherTable.data.label;
                        const targetCols = otherTable.data.columns || [];
                        refCol =
                          targetCols.find((c) => c.isPrimaryKey)?.name ||
                          targetCols.find((c) => c.name === "_id")?.name ||
                          targetCols[0]?.name ||
                          "_id";
                      }
                    }

                    handleUpdate(index, {
                      isForeignKey: true,
                      references: {
                        table: refTable,
                        column: refCol,
                      },
                    });
                  } else {
                    handleUpdate(index, {
                      isForeignKey: false,
                    });
                  }
                }}
                className="scale-75 origin-right"
              />
            </div>
            {col.isForeignKey && (
              <div className="flex items-center gap-1 mt-1">
                <Select
                  value={col.references?.table || ""}
                  onValueChange={(newTable) => {
                    const targetNode = entityNodes.find(
                      (n) => n.data.label === newTable,
                    );
                    const targetCols = targetNode?.data.columns || [];
                    const defaultCol =
                      targetCols.find((c) => c.isPrimaryKey)?.name ||
                      targetCols.find((c) => c.name === "_id")?.name ||
                      targetCols[0]?.name ||
                      "";
                    handleUpdate(index, {
                      references: {
                        table: newTable,
                        column:
                          col.references?.table === newTable &&
                          col.references?.column
                            ? col.references.column
                            : defaultCol,
                      },
                    });
                  }}
                >
                  <SelectTrigger className="h-6 text-[10px] px-1.5 flex-1 py-0 nodrag truncate">
                    <SelectValue placeholder="Ref Table" />
                  </SelectTrigger>
                  <SelectContent className="nodrag">
                    {availableTables.length === 0 ? (
                      <div className="px-2 py-1 text-[10px] text-muted-foreground">
                        No tables available
                      </div>
                    ) : (
                      availableTables.map((tbl) => (
                        <SelectItem key={tbl} value={tbl} className="text-xs">
                          {tbl}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={col.references?.column || ""}
                  disabled={
                    !col.references?.table || availableColumns.length === 0
                  }
                  onValueChange={(newCol) => {
                    handleUpdate(index, {
                      references: {
                        table: col.references?.table || "",
                        column: newCol,
                      },
                    });
                  }}
                >
                  <SelectTrigger className="h-6 text-[10px] px-1.5 flex-1 py-0 nodrag truncate">
                    <SelectValue placeholder="Ref Column" />
                  </SelectTrigger>
                  <SelectContent className="nodrag">
                    {availableColumns.length === 0 ? (
                      <div className="px-2 py-1 text-[10px] text-muted-foreground">
                        No columns available
                      </div>
                    ) : (
                      availableColumns.map((colName) => (
                        <SelectItem key={colName} value={colName} className="text-xs">
                          {colName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

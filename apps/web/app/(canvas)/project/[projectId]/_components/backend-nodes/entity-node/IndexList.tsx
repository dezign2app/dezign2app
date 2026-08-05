import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { ColumnItem } from "./ColumnRow";

export interface IndexListProps {
  id: string;
  indexes?: NonNullable<BackendNode["data"]["indexes"]>;
  columns?: ColumnItem[];
  data: BackendNode["data"];
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
}

export const IndexList = ({
  id,
  indexes = [],
  columns = [],
  data,
  updateNode,
}: IndexListProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addIndex = () => {
    updateNode(id, {
      data: {
        ...data,
        indexes: [...indexes, { name: "", columns: "" }],
      },
    });
    setEditingIndex(indexes.length);
  };

  const updateIndexObj = (
    idx: number,
    changes: Partial<NonNullable<BackendNode["data"]["indexes"]>[0]>,
  ) => {
    const newIndexes = [...indexes];
    newIndexes[idx] = { ...newIndexes[idx], ...changes } as NonNullable<
      BackendNode["data"]["indexes"]
    >[0];
    updateNode(id, { data: { ...data, indexes: newIndexes } });
  };

  const deleteIndex = (i: number) => {
    const newIdxs = [...indexes];
    newIdxs.splice(i, 1);
    updateNode(id, { data: { ...data, indexes: newIdxs } });
  };

  return (
    <>
      <div className="px-3 py-1 bg-secondary/40 border-t border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center group">
        Indexes
        <div
          className="opacity-0 group-hover:opacity-100 cursor-pointer text-muted-foreground hover:text-foreground transition-all"
          onClick={addIndex}
        >
          <Plus size={12} />
        </div>
      </div>
      <div className="flex flex-col">
        {indexes.map((idxObj, i) => {
          const isEditing = editingIndex === i;
          return (
            <div
              key={i}
              className="flex flex-col px-3 py-1.5 border-b last:border-b-0 text-xs relative group/row hover:bg-secondary/20"
            >
              {isEditing ? (
                <div
                  className="flex flex-col gap-1 w-full"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      const newIdxs = [...indexes];
                      if (newIdxs[i]?.name.trim() === "") {
                        newIdxs.splice(i, 1);
                        updateNode(id, { data: { ...data, indexes: newIdxs } });
                      }
                      setEditingIndex(null);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={idxObj.name}
                      onChange={(e) =>
                        updateIndexObj(i, { name: e.target.value })
                      }
                      className="h-6 text-xs flex-1"
                      placeholder="Index name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") {
                          const newIdxs = [...indexes];
                          if (newIdxs[i]?.name.trim() === "") {
                            newIdxs.splice(i, 1);
                            updateNode(id, {
                              data: { ...data, indexes: newIdxs },
                            });
                          }
                          setEditingIndex(null);
                        }
                      }}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="checkbox"
                        id={`unique-${i}`}
                        checked={!!idxObj.isUnique}
                        onChange={(e) =>
                          updateIndexObj(i, { isUnique: e.target.checked })
                        }
                        className="w-3 h-3"
                      />
                      <label htmlFor={`unique-${i}`} className="text-[10px]">
                        UQ
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto pr-1">
                    {columns
                      .filter((c) => c.name.trim() !== "")
                      .map((col) => {
                        const selectedCols = (idxObj.columns || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const isSelected = selectedCols.includes(col.name);
                        return (
                          <div
                            key={col.name}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              let newCols = [...selectedCols];
                              if (isSelected) {
                                newCols = newCols.filter((c) => c !== col.name);
                              } else {
                                newCols.push(col.name);
                              }
                              updateIndexObj(i, {
                                columns: newCols.join(", "),
                              });
                            }}
                            className={cn(
                              "nodrag px-1.5 py-0.5 rounded text-[10px] cursor-pointer border transition-colors select-none",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary text-muted-foreground border-border hover:border-primary",
                            )}
                          >
                            {col.name}
                          </div>
                        );
                      })}
                    {columns.filter((c) => c.name.trim() !== "").length ===
                      0 && (
                      <span className="text-[10px] text-muted-foreground italic px-1">
                        Add columns to table first
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col w-full cursor-pointer"
                  onClick={() => setEditingIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-medium truncate max-w-[120px]">
                        {idxObj.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {idxObj.isUnique && (
                        <span className="text-[9px] bg-purple-500/10 text-purple-600 px-1 rounded font-bold">
                          UQ
                        </span>
                      )}
                      <div
                        className="opacity-0 group-hover/row:opacity-100 flex items-center justify-center p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteIndex(i);
                        }}
                      >
                        <X size={12} />
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
                    ({idxObj.columns || "no columns"})
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

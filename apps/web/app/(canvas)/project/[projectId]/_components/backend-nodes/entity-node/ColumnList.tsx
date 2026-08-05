import React, { useState } from "react";
import { Plus } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { ColumnItem, ColumnRow } from "./ColumnRow";

export interface ColumnListProps {
  nodeId: string;
  items?: ColumnItem[];
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
  data: BackendNode["data"];
  isVector: boolean;
}

export const ColumnList = ({
  nodeId,
  items = [],
  updateNode,
  data,
  isVector,
}: ColumnListProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingType, setEditingType] = useState("VARCHAR");
  const [nameError, setNameError] = useState(false);

  const handleAdd = () => {
    const newItems = [...items, { name: "", type: "VARCHAR" }];
    updateNode(nodeId, { data: { ...data, columns: newItems } });
    setEditingIndex(newItems.length - 1);
    setEditingName("");
    setEditingType("VARCHAR");
    setNameError(false);
  };

  const handleUpdate = (index: number, changes: Partial<ColumnItem>) => {
    let newCols = [...items];
    if (
      changes.name &&
      changes.name.trim() !== "" &&
      changes.name !== items[index]?.name
    ) {
      const isDuplicate = newCols.some(
        (c, idx) =>
          idx !== index && c.name.toLowerCase() === changes.name!.toLowerCase(),
      );
      if (isDuplicate) {
        setNameError(true);
        return;
      }
    }
    newCols[index] = { ...newCols[index]!, ...changes };
    updateNode(nodeId, { data: { ...data, columns: newCols } });
  };

  const handleDelete = (index: number) => {
    let newCols = [...items];
    newCols.splice(index, 1);
    updateNode(nodeId, { data: { ...data, columns: newCols } });
  };

  return (
    <div className="flex flex-col">
      <div className="px-3 py-1 bg-secondary/40 border-t border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center group">
        Columns
        <div
          className="opacity-0 group-hover:opacity-100 cursor-pointer text-muted-foreground hover:text-foreground transition-all"
          onClick={handleAdd}
        >
          <Plus size={12} />
        </div>
      </div>
      <div className="flex flex-col">
        {items.map((col, i) => (
          <ColumnRow
            key={i}
            col={col}
            index={i}
            isEditing={editingIndex === i}
            setEditingIndex={setEditingIndex}
            editingName={editingName}
            setEditingName={setEditingName}
            editingType={editingType}
            setEditingType={setEditingType}
            handleUpdate={handleUpdate}
            handleDelete={handleDelete}
            isVector={isVector}
            nameError={nameError && editingIndex === i}
            setNameError={setNameError}
          />
        ))}
      </div>
    </div>
  );
};

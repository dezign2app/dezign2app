import React, { useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Database, Table2, Trash2 } from "lucide-react";
import {
  BackendNode,
  DATABASE_ENGINE_OPTIONS,
  DatabaseEngine,
} from "@/types/canvas";

function isDatabaseEngine(val: string): val is DatabaseEngine {
  return DATABASE_ENGINE_OPTIONS.some((e) => e.value === val);
}
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { ColumnList } from "./ColumnList";
import { IndexList } from "./IndexList";
import { VectorConfig } from "./VectorConfig";

export const EntityNode = ({ id, data, selected }: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const setNodesPendingDeletion = useBackendCanvasStore(
    (s) => s.setNodesPendingDeletion,
  );
  const [editingName, setEditingName] = useState(data.label);
  const [isEditingName, setIsEditingName] = useState(data.label === "");
  const [nameError, setNameError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditingName) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isEditingName]);

  const columns = data.columns || [];
  const indexes = data.indexes || [];

  const saveName = (e?: React.FocusEvent | React.KeyboardEvent) => {
    let finalName = editingName.trim();
    if (!finalName) {
      if (!data.label) {
        const isBlur = e?.type === "blur";
        if (isBlur) {
          const relatedTarget = (e as React.FocusEvent)
            .relatedTarget as Node | null;
          if (nodeRef.current?.contains(relatedTarget)) {
            const defaultName = "Untitled_Table";
            const latestNode = useBackendCanvasStore
              .getState()
              .nodes.find((n) => n.id === id);
            if (latestNode) {
              updateNode(id, {
                data: { ...latestNode.data, label: defaultName },
              });
            }
            setEditingName(defaultName);
            setNameError(false);
            setIsEditingName(false);
            return;
          }
        }

        const latestNode = useBackendCanvasStore
          .getState()
          .nodes.find((n) => n.id === id);
        if (!latestNode) return;

        const latestCols = latestNode.data.columns || [];
        const latestIdxs = latestNode.data.indexes || [];

        const isEmpty = latestCols.length === 0 && latestIdxs.length === 0;
        const isInitial =
          latestCols.length === 1 &&
          latestCols[0]?.name === "_id" &&
          latestIdxs.length === 0;

        if (isEmpty || isInitial) {
          useBackendCanvasStore.getState().deleteNode(id);
        } else {
          const defaultName = "Untitled_Table";
          updateNode(id, { data: { ...latestNode.data, label: defaultName } });
          setEditingName(defaultName);
          setNameError(false);
          setIsEditingName(false);
        }
        return;
      }
      finalName = data.label; // revert to original valid name
      setEditingName(finalName);
      setNameError(false);
      setIsEditingName(false);
      return;
    }

    // Check global uniqueness for entities
    const allNodes = useBackendCanvasStore.getState().nodes;
    const exists = allNodes.some(
      (n) =>
        n.id !== id &&
        n.type === "entity" &&
        n.data.label.toLowerCase() === finalName.toLowerCase(),
    );

    if (exists) {
      setNameError(true);
      if (e?.type === "blur") {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return;
    }

    setNameError(false);
    const latestNode = useBackendCanvasStore
      .getState()
      .nodes.find((n) => n.id === id);
    if (latestNode) {
      updateNode(id, { data: { ...latestNode.data, label: finalName } });
    } else {
      updateNode(id, { data: { ...data, label: finalName } });
    }
    setEditingName(finalName);
    setIsEditingName(false);
  };

  const currentDbEngine = data.dbEngine || "sqlite";

  return (
    <div
      ref={nodeRef}
      tabIndex={-1}
      className={cn(
        "shadow-md rounded-xl bg-card border-2 min-w-[250px] max-w-[350px] focus:outline-none",
        selected ? "border-primary" : "border-border",
      )}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div
        className={cn(
          "px-3 py-2 border-b flex flex-col gap-1.5 group rounded-t-[10px]",
          data.dbType === "vector"
            ? "bg-violet-500/10 text-violet-700 dark:text-violet-400"
            : "bg-secondary/80",
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center flex-1">
            {data.dbType === "vector" ? (
              <Database size={14} className="mr-2 shrink-0" />
            ) : (
              <Table2
                size={14}
                className="mr-2 text-muted-foreground shrink-0"
              />
            )}
            {isEditingName ? (
              <div className="flex flex-1 items-center gap-1">
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => {
                    setEditingName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  className={cn(
                    "h-6 text-xs px-1",
                    nameError &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName(e);
                    if (e.key === "Escape") {
                      setEditingName(data.label);
                      setNameError(false);
                      setIsEditingName(false);
                    }
                  }}
                  onBlur={saveName}
                />
              </div>
            ) : (
              <span
                className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors flex-1 truncate"
                onClick={() => setIsEditingName(true)}
              >
                {data.label}
              </span>
            )}
          </div>
          <div
            className="opacity-0 group-hover:opacity-100 flex items-center justify-center p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer ml-2 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              const cols = data.columns || [];
              const idxs = data.indexes || [];
              const isEmpty = cols.length === 0 && idxs.length === 0;
              const isInitial =
                cols.length === 1 &&
                cols[0]?.name === "_id" &&
                idxs.length === 0;

              if (!isEmpty && !isInitial) {
                const node = useBackendCanvasStore
                  .getState()
                  .nodes.find((n) => n.id === id);
                if (node) setNodesPendingDeletion([node]);
              } else {
                useBackendCanvasStore.getState().deleteNode(id);
              }
            }}
          >
            <Trash2 size={14} />
          </div>
        </div>

        {data.dbType !== "vector" && (
          <div className="flex items-center gap-1.5 nodrag pt-0.5 border-t border-border/40">
            <Select
              value={currentDbEngine}
              onValueChange={(val: string) => {
                if (isDatabaseEngine(val)) {
                  updateNode(id, {
                    data: {
                      ...data,
                      dbEngine: val,
                    },
                  });
                }
              }}
            >
              <SelectTrigger className="h-5 text-[10px] font-semibold bg-background/60 hover:bg-background border-border/40 px-1.5 py-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATABASE_ENGINE_OPTIONS.map((e) => (
                  <SelectItem key={e.value} value={e.value} className="text-xs">
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="px-3 py-2 bg-secondary/5 border-b nodrag">
        <Textarea
          className="min-h-[20px] text-xs bg-transparent border-none shadow-none p-1 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          placeholder="description"
          value={data.description || ""}
          onChange={(e) =>
            updateNode(id, { data: { ...data, description: e.target.value } })
          }
        />
      </div>

      {/* Vector Collection Settings */}
      {data.dbType === "vector" && (
        <VectorConfig id={id} data={data} updateNode={updateNode} />
      )}

      <ColumnList
        nodeId={id}
        items={columns}
        updateNode={updateNode}
        data={data}
        isVector={data.dbType === "vector"}
      />

      <IndexList
        id={id}
        indexes={indexes}
        columns={columns}
        data={data}
        updateNode={updateNode}
      />

      <div className="h-2 w-full border-t border-transparent rounded-b-[10px]" />

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
};

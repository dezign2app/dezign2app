import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import {
  BackendNode,
  SERVICE_TECH_OPTIONS,
  WEB_CLIENT_TECH_OPTIONS,
  TechOption,
} from "@/types/canvas";
import { LocalInput } from "./LocalInput";

export interface NodeHeaderProps {
  id: string;
  data: BackendNode["data"];
  nodeType?: string;
  icon: React.ElementType;
  title?: string;
  colorClass?: string;
  selected?: boolean;
}

export const NodeHeader = ({
  id,
  data,
  nodeType,
  icon: Icon,
  title,
  colorClass,
  selected,
}: NodeHeaderProps) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const deleteNode = useBackendCanvasStore((s) => s.deleteNode);
  const [isEditing, setIsEditing] = useState(
    data.label === "" || data.label === "Untitled",
  );
  const [name, setName] = useState(data.label);

  const handleSave = () => {
    updateNode(id, { data: { ...data, label: name || "Untitled" } });
    setIsEditing(false);
  };

  let techOptions: readonly TechOption[] | null = null;
  if (nodeType === "service") techOptions = SERVICE_TECH_OPTIONS;
  if (nodeType === "webClient") techOptions = WEB_CLIENT_TECH_OPTIONS;

  const currentTech =
    data.techStack ||
    (nodeType === "service"
      ? "express"
      : nodeType === "webClient"
        ? "nextjs"
        : undefined);
  const currentTechObj =
    techOptions?.find((t) => t.value === currentTech) || techOptions?.[0];
  const versionOptions = currentTechObj?.versions || [];
  const currentVersion =
    data.techVersion ||
    currentTechObj?.defaultVersion ||
    versionOptions[0]?.value;

  return (
    <div
      className={cn(
        "px-3 py-2 border-b flex flex-col gap-1.5 group rounded-t-xl",
        colorClass,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center flex-1 min-w-0">
          <Icon size={14} className="mr-2 shrink-0" />
          {isEditing ? (
            <LocalInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-6 text-xs px-1 bg-background/50"
              autoFocus
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setIsEditing(false);
              }}
              onBlur={handleSave}
            />
          ) : (
            <div
              className="flex flex-col cursor-pointer flex-1 min-w-0"
              onClick={() => setIsEditing(true)}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-70 truncate">
                {title}
              </span>
              <span className="font-semibold text-sm truncate">
                {data.label || "Untitled"}
              </span>
            </div>
          )}
        </div>
        <div
          className="opacity-0 group-hover:opacity-100 flex items-center justify-center p-1 rounded hover:bg-black/10 transition-all cursor-pointer ml-1 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
        >
          <Trash2 size={14} />
        </div>
      </div>

      {techOptions && (
        <div className="flex items-center gap-1.5 nodrag pt-0.5 border-t border-black/5 dark:border-white/5">
          <Select
            value={currentTech}
            onValueChange={(val) => {
              const selectedTech = techOptions.find((t) => t.value === val);
              updateNode(id, {
                data: {
                  ...data,
                  techStack: val as BackendNode["data"]["techStack"],
                  techVersion:
                    selectedTech?.defaultVersion as BackendNode["data"]["techVersion"],
                },
              });
            }}
          >
            <SelectTrigger className="h-5 text-[10px] font-semibold bg-background/60 hover:bg-background border-black/10 dark:border-white/10 px-1.5 py-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {techOptions.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {versionOptions.length > 0 && (
            <Select
              value={currentVersion}
              onValueChange={(val) => {
                updateNode(id, {
                  data: {
                    ...data,
                    techVersion: val as BackendNode["data"]["techVersion"],
                  },
                });
              }}
            >
              <SelectTrigger className="h-5 text-[10px] font-mono font-medium bg-background/60 hover:bg-background border-black/10 dark:border-white/10 px-1.5 py-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versionOptions.map((v) => (
                  <SelectItem
                    key={v.value}
                    value={v.value}
                    className="text-xs font-mono"
                  >
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
};

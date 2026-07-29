import React from "react";
import { FolderGit2 } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { LocalInput, LocalTextarea } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function FilesystemConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <FolderGit2 className="w-4 h-4 text-fuchsia-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filesystem Memory Config</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Backend Storage Mode</Label>
        <Select
          value={data.filesystemConfig?.backend || "composite"}
          onValueChange={(val: any) =>
            onUpdate({
              filesystemConfig: {
                ...data.filesystemConfig,
                backend: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="state">StateBackend (Short-term ephemeral)</SelectItem>
            <SelectItem value="store">StoreBackend (Persistent store)</SelectItem>
            <SelectItem value="composite">CompositeBackend (Hybrid /memories/)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Memories Directory Path</Label>
        <LocalInput
          value={data.filesystemConfig?.memoriesPath ?? "/memories/"}
          onChange={(e) =>
            onUpdate({
              filesystemConfig: {
                ...data.filesystemConfig,
                memoriesPath: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Custom System Prompt Override</Label>
        <LocalTextarea
          value={data.filesystemConfig?.systemPrompt || ""}
          onChange={(e) =>
            onUpdate({
              filesystemConfig: {
                ...data.filesystemConfig,
                systemPrompt: e.target.value,
              },
            })
          }
          className="text-xs min-h-[50px] bg-background font-mono"
          placeholder="Write to filesystem when saving key facts..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Custom Tool Descriptions</Label>
        <LocalTextarea
          value={data.filesystemConfig?.customToolDescriptions || ""}
          onChange={(e) =>
            onUpdate({
              filesystemConfig: {
                ...data.filesystemConfig,
                customToolDescriptions: e.target.value,
              },
            })
          }
          className="text-xs min-h-[50px] bg-background font-mono"
          placeholder="Override descriptions for ls, read_file, write_file, edit_file..."
        />
      </div>
    </div>
  );
}

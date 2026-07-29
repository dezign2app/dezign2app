import React from "react";
import { UserCheck } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { LocalInput, LocalTextarea } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function HumanInTheLoopConfig({ data, onUpdate }: MiddlewareConfigProps) {
  const handleInterruptToggle = (key: string, enabled: boolean) => {
    const currentConfig = data.humanInTheLoopConfig || {};
    const currentFlags = currentConfig.interruptOn || { writeFile: true };
    onUpdate({
      humanInTheLoopConfig: {
        ...currentConfig,
        interruptOn: {
          ...currentFlags,
          [key]: enabled,
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Human-in-the-Loop Config</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Interrupt On Actions</Label>
        <div className="flex flex-col gap-2 p-2 bg-background border border-border/50 rounded-lg">
          {[
            { key: "writeFile", label: "File System Modifications (writeFile)" },
            { key: "executeCode", label: "Arbitrary Code Execution (executeCode)" },
            { key: "deleteData", label: "Database Deletions / Mutating Queries" },
            { key: "apiCall", label: "External API Endpoint Calls" },
          ].map(({ key, label }) => {
            const checked = data.humanInTheLoopConfig?.interruptOn?.[key] ?? (key === "writeFile");
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <Label htmlFor={`interrupt-${key}`} className="text-xs cursor-pointer">{label}</Label>
                <Switch
                  id={`interrupt-${key}`}
                  checked={checked}
                  onCheckedChange={(c) => handleInterruptToggle(key, c)}
                  className="scale-75 origin-right"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Approval Prompt</Label>
        <LocalTextarea
          value={data.humanInTheLoopConfig?.approvalPrompt || ""}
          onChange={(e) =>
            onUpdate({
              humanInTheLoopConfig: {
                ...data.humanInTheLoopConfig,
                approvalPrompt: e.target.value,
              },
            })
          }
          className="text-xs min-h-[50px] bg-background"
          placeholder="Requires admin approval before executing side effects..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Required Role</Label>
        <LocalInput
          value={data.humanInTheLoopConfig?.requiredRole || ""}
          onChange={(e) =>
            onUpdate({
              humanInTheLoopConfig: {
                ...data.humanInTheLoopConfig,
                requiredRole: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="admin, supervisor"
        />
      </div>
    </div>
  );
}

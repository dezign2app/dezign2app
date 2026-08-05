import React from "react";
import { Network } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import type { ToolNodeData } from "@workspace/canvas";
import { LocalInput } from "../../../../../common";

interface ToolAdvancedServerSectionProps {
  selectedToolData: ToolNodeData;
  onUpdateTool: (changes: Partial<ToolNodeData>) => void;
}

export function ToolAdvancedServerSection({
  selectedToolData,
  onUpdateTool,
}: ToolAdvancedServerSectionProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <Network className="w-4 h-4 text-emerald-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Advanced Server Config
        </h3>
      </div>

      <div className="flex flex-col gap-3 p-2 bg-background/50 rounded-lg border border-border/50">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">
            Context Access
          </Label>
          <Switch
            checked={selectedToolData.contextAccess?.enabled || false}
            onCheckedChange={(c: boolean) =>
              onUpdateTool({
                contextAccess: {
                  ...selectedToolData.contextAccess,
                  enabled: c,
                },
              })
            }
            className="scale-75 origin-right"
          />
        </div>
        {selectedToolData.contextAccess?.enabled && (
          <div className="flex flex-col gap-1.5 mt-1">
            <Label className="text-[10px] text-muted-foreground">
              Whitelisted Fields (comma-separated)
            </Label>
            <LocalInput
              value={selectedToolData.contextAccess?.fields?.join(", ") || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const fields = e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean);
                onUpdateTool({
                  contextAccess: {
                    ...selectedToolData.contextAccess,
                    fields,
                    enabled: true,
                  },
                });
              }}
              className="h-6 text-[10px] font-mono"
              placeholder="userId, tenantId"
            />
            <span className="text-[9px] text-muted-foreground">
              Fields will be passed via scoped `config.context`.
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-2 bg-background/50 rounded-lg border border-border/50">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">
            Store Access
          </Label>
          <Switch
            checked={selectedToolData.storeAccess?.enabled || false}
            onCheckedChange={(c: boolean) =>
              onUpdateTool({
                storeAccess: {
                  ...selectedToolData.storeAccess,
                  enabled: c,
                },
              })
            }
            className="scale-75 origin-right"
          />
        </div>
        {selectedToolData.storeAccess?.enabled && (
          <div className="flex flex-col gap-3 mt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-muted-foreground">
                Store Namespace
              </Label>
              <LocalInput
                value={selectedToolData.storeAccess?.namespace || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateTool({
                    storeAccess: {
                      ...selectedToolData.storeAccess,
                      namespace: e.target.value,
                      enabled: true,
                    },
                  })
                }
                className="h-6 text-[10px] font-mono"
                placeholder="users"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-muted-foreground mb-1">
                Allowed Operations
              </Label>
              <div className="flex flex-wrap gap-2">
                {(["get", "put", "delete", "list"] as const).map((op) => {
                  const checked =
                    selectedToolData.storeAccess?.operations?.includes(op);
                  return (
                    <div key={op} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`store-op-${op}`}
                        checked={checked || false}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const curr =
                            selectedToolData.storeAccess?.operations || [];
                          const next = e.target.checked
                            ? [...curr, op]
                            : curr.filter((o) => o !== op);
                          onUpdateTool({
                            storeAccess: {
                              ...selectedToolData.storeAccess,
                              operations: next,
                              enabled: true,
                            },
                          });
                        }}
                        className="w-3 h-3 rounded border-border"
                      />
                      <Label
                        htmlFor={`store-op-${op}`}
                        className="text-[10px] font-mono cursor-pointer"
                      >
                        {op}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground">
              Injected as scoped store wrapper avoiding global access.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/50">
        <div className="flex flex-col gap-0.5">
          <Label className="text-xs font-semibold text-foreground">
            Stream Writer
          </Label>
          <span className="text-[9px] text-muted-foreground">
            Enable real-time custom chunk streaming
          </span>
        </div>
        <Switch
          checked={selectedToolData.streamWriter || false}
          onCheckedChange={(c: boolean) => onUpdateTool({ streamWriter: c })}
          className="scale-75 origin-right"
        />
      </div>
    </div>
  );
}

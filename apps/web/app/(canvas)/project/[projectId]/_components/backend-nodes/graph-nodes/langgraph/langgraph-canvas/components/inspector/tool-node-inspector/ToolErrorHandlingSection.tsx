import React from "react";
import { AlertCircle } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import type { ToolNodeData } from "@workspace/canvas";
import { LocalInput, LocalTextarea } from "../../../../../common";

interface ToolErrorHandlingSectionProps {
  selectedToolData: ToolNodeData;
  onUpdateTool: (changes: Partial<ToolNodeData>) => void;
}

export function ToolErrorHandlingSection({
  selectedToolData,
  onUpdateTool,
}: ToolErrorHandlingSectionProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Error Handling
          </h3>
        </div>
        <Switch
          checked={selectedToolData.errorHandling?.enabled || false}
          onCheckedChange={(c: boolean) =>
            onUpdateTool({
              errorHandling: {
                ...selectedToolData.errorHandling,
                enabled: c,
              },
            })
          }
          className="scale-75 origin-right"
        />
      </div>

      {selectedToolData.errorHandling?.enabled && (
        <>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">
              Retry Count
            </Label>
            <LocalInput
              type="number"
              min="0"
              max="10"
              className="h-6 text-xs w-20 text-right bg-background"
              placeholder="3"
              value={selectedToolData.errorHandling?.retryCount ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onUpdateTool({
                  errorHandling: {
                    ...selectedToolData.errorHandling,
                    retryCount: parseInt(e.target.value) || 0,
                    enabled: true,
                  },
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">
              Custom Error Message
            </Label>
            <LocalTextarea
              className="min-h-[40px] text-xs bg-background p-2 resize-y"
              placeholder="Tool error: Please check your input and try again."
              value={selectedToolData.errorHandling?.customErrorMessage || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onUpdateTool({
                  errorHandling: {
                    ...selectedToolData.errorHandling,
                    customErrorMessage: e.target.value,
                    enabled: true,
                  },
                })
              }
            />
            <span className="text-[9px] text-muted-foreground leading-tight">
              Generates a per-tool scoped middleware to wrap calls and inject
              this message on failure.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

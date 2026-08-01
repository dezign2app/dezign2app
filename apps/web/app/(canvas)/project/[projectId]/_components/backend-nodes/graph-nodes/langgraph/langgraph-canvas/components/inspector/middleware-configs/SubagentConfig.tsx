import React from "react";
import { Users } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalInput, LocalTextarea } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function SubagentConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-emerald-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Subagent Middleware Config
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Default Subagent Model
        </Label>
        <LocalInput
          value={data.subagentConfig?.defaultModel || "claude-3-7-sonnet"}
          onChange={(e) =>
            onUpdate({
              subagentConfig: {
                ...data.subagentConfig,
                defaultModel: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="claude-3-7-sonnet"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Default Subagent Tools
        </Label>
        <LocalInput
          value={data.subagentConfig?.defaultTools?.join(", ") || ""}
          onChange={(e) =>
            onUpdate({
              subagentConfig: {
                ...data.subagentConfig,
                defaultTools: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="search_tool, code_runner (comma-separated)"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Subagents Definitions (JSON)
        </Label>
        <LocalTextarea
          value={data.subagentConfig?.subagentsJson || ""}
          onChange={(e) =>
            onUpdate({
              subagentConfig: {
                ...data.subagentConfig,
                subagentsJson: e.target.value,
              },
            })
          }
          className="text-[11px] min-h-[90px] font-mono bg-background"
          placeholder={`[\n  {\n    "name": "researcher",\n    "description": "Performs web searches",\n    "model": "gpt-5.5"\n  }\n]`}
        />
      </div>
    </div>
  );
}

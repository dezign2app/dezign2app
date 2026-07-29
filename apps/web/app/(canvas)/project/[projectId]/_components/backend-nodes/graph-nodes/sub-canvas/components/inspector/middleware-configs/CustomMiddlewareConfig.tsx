import React from "react";
import { Code2 } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalTextarea } from "../../../../shared";
import type { MiddlewareConfigProps } from "./types";

export function CustomMiddlewareConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom JS Middleware</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground flex justify-between">
          <span>Middleware Function Body</span>
          <span className="text-[9px] text-muted-foreground">({`{ request, state }, next`})</span>
        </Label>
        <LocalTextarea
          value={data.customBody || ""}
          onChange={(e) => onUpdate({ customBody: e.target.value })}
          className="text-[11px] min-h-[140px] resize-y bg-background font-mono leading-relaxed"
          placeholder={'async ({ request, state }, next) => {\n  console.log("Before request:", request);\n  const response = await next();\n  console.log("After response:", response);\n  return response;\n}'}
        />
      </div>
    </div>
  );
}

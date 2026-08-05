import React from "react";
import { Globe, AlertCircle } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { ToolNodeData } from "@workspace/canvas";

interface ToolHeadlessConfigSectionProps {
  isHeadless: boolean;
  onUpdateTool: (changes: Partial<ToolNodeData>) => void;
}

export function ToolHeadlessConfigSection({
  isHeadless,
  onUpdateTool,
}: ToolHeadlessConfigSectionProps) {
  return (
    <div
      className={`flex flex-col gap-3 p-3 rounded-xl border transition-colors ${
        isHeadless
          ? "bg-purple-500/10 border-purple-500/30"
          : "bg-secondary/10 border-border/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe
            className={`w-4 h-4 ${
              isHeadless ? "text-purple-500" : "text-muted-foreground"
            }`}
          />
          <h3
            className={`text-xs font-bold uppercase tracking-wider ${
              isHeadless ? "text-purple-500" : "text-muted-foreground"
            }`}
          >
            Headless Tool
          </h3>
        </div>
        <Switch
          checked={isHeadless}
          onCheckedChange={(c) => onUpdateTool({ headless: c })}
          className="scale-75 origin-right"
        />
      </div>
      {isHeadless && (
        <div className="flex items-start gap-2 text-[10px] text-purple-500/80 leading-tight bg-purple-500/5 p-2 rounded">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Headless tools are defined on the server but implemented entirely
            on the client.
            <strong>
              {" "}
              Function Body and Server Context settings are disabled.
            </strong>
            <br />
            <br />
            Use <code>.implement(async (args) =&gt; ...)</code> on the client
            to bind logic.
          </p>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Terminal } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalInput } from "../../../../../common/shared";
import type { MiddlewareConfigProps } from "./types";

export function LlmToolEmulatorConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LLM Tool Emulator Config</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Emulator LLM Model</Label>
        <LocalInput
          value={data.toolEmulatorConfig?.model || ""}
          onChange={(e) =>
            onUpdate({
              toolEmulatorConfig: {
                ...data.toolEmulatorConfig,
                model: e.target.value,
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="e.g. gemini-2.5-flash (Defaults to agent model)"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Emulated Tool Names</Label>
        <LocalInput
          value={data.toolEmulatorConfig?.emulatedTools?.join(", ") || ""}
          onChange={(e) =>
            onUpdate({
              toolEmulatorConfig: {
                ...data.toolEmulatorConfig,
                emulatedTools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              },
            })
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="get_weather, send_email (Leave empty to emulate ALL tools)"
        />
      </div>
    </div>
  );
}

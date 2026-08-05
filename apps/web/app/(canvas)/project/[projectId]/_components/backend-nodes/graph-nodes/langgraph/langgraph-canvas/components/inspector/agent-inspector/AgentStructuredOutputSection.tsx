import React from "react";
import {
  FileJson,
  Settings2,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { LocalInput, LocalTextarea } from "../../../../../common";
import type { LangGraphAgentResponseFormatConfig } from "../../../types";

interface AgentStructuredOutputSectionProps {
  rfConfig: LangGraphAgentResponseFormatConfig;
  updateResponseFormat: (
    changes: Partial<LangGraphAgentResponseFormatConfig>,
  ) => void;
}

export function AgentStructuredOutputSection({
  rfConfig,
  updateResponseFormat,
}: AgentStructuredOutputSectionProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md border ${
              rfConfig.enabled
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary/30 border-border text-muted-foreground"
            }`}
          >
            <FileJson className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              Structured Output
            </h3>
            <p className="text-[10px] font-mono text-muted-foreground">
              createAgent({`{ responseFormat: ... }`})
            </p>
          </div>
        </div>

        <Switch
          checked={Boolean(rfConfig.enabled)}
          onCheckedChange={(enabled) => updateResponseFormat({ enabled })}
        />
      </div>

      {rfConfig.enabled && (
        <div className="flex flex-col gap-4 pt-2 border-t border-border/50">
          {/* Strategy Choice: Provider vs Tool vs Auto */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
              Response Strategy
            </Label>
            <Select
              value={rfConfig.strategy || "auto"}
              onValueChange={(val: "auto" | "provider" | "tool") =>
                updateResponseFormat({ strategy: val })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="provider">Provider Strategy</SelectItem>
                <SelectItem value="tool">Tool Strategy</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {rfConfig.strategy === "provider"
                ? "Uses native model provider API (OpenAI, Gemini, Claude, Grok). High reliability."
                : rfConfig.strategy === "tool"
                  ? "Emulates structured response via tool calling and state validation."
                  : "Automatically selects providerStrategy if model supports native output, fallback to toolStrategy."}
            </p>
          </div>

          {/* Schema Definition Textarea */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Schema Definition
              </Label>
              {rfConfig.schemaJson && (
                <button
                  type="button"
                  onClick={() => {
                    updateResponseFormat({ schemaJson: "" });
                  }}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground underline"
                >
                  Clear
                </button>
              )}
            </div>
            <LocalTextarea
              value={rfConfig.schemaJson ?? ""}
              onChange={(e) =>
                updateResponseFormat({ schemaJson: e.target.value })
              }
              className="text-xs min-h-[120px] resize-y bg-background font-mono leading-relaxed text-foreground"
              placeholder='{"type": "object", "properties": { ... }}'
            />
          </div>

          {/* Tool Strategy Specific Options */}
          {(rfConfig.strategy === "tool" ||
            rfConfig.strategy === "auto" ||
            !rfConfig.strategy) && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Tool Calling Strategy Options
              </span>

              {/* Custom Tool Message Content */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  Custom Tool Message Content
                </Label>
                <LocalInput
                  value={rfConfig.toolMessageContent || ""}
                  onChange={(e) =>
                    updateResponseFormat({ toolMessageContent: e.target.value })
                  }
                  className="h-7 text-xs font-mono bg-background"
                  placeholder="Action item captured and added to state!"
                />
                <p className="text-[9px] text-muted-foreground">
                  Custom message in conversation history when structured output
                  is generated.
                </p>
              </div>

              {/* Error Handling Strategy */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                  Schema Error Handling
                </Label>
                <Select
                  value={rfConfig.handleErrorMode || "default"}
                  onValueChange={(
                    val: "default" | "custom_message" | "disabled",
                  ) => updateResponseFormat({ handleErrorMode: val })}
                >
                  <SelectTrigger className="h-7 text-xs bg-background font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Auto-Retry</SelectItem>
                    <SelectItem value="custom_message">
                      Custom Error Prompt
                    </SelectItem>
                    <SelectItem value="disabled">Disable Retry</SelectItem>
                  </SelectContent>
                </Select>

                {rfConfig.handleErrorMode === "custom_message" && (
                  <LocalInput
                    value={rfConfig.customErrorMessage || ""}
                    onChange={(e) =>
                      updateResponseFormat({
                        customErrorMessage: e.target.value,
                      })
                    }
                    className="h-7 text-xs font-mono bg-background mt-1"
                    placeholder="Please provide valid rating between 1-5..."
                  />
                )}
              </div>
            </div>
          )}

          <div className="p-2 rounded bg-secondary/20 border border-border/50 text-[10px] font-mono text-muted-foreground">
            Output will be captured in{" "}
            <code className="text-foreground">result.structuredResponse</code>{" "}
            channel of agent state.
          </div>
        </div>
      )}
    </div>
  );
}

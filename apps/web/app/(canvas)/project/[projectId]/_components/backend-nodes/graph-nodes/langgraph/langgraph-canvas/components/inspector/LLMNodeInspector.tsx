import React from "react";
import { Trash2, Globe, Key, Code, Shield } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { LangGraphLLMNodeData } from "../../types";
import { LocalTextarea } from "../../../../common";
import { LLM_PROVIDER_PRESETS } from "./constants";

interface LLMNodeInspectorProps {
  selectedLLMData: LangGraphLLMNodeData;
  onDeleteStep: () => void;
  onUpdateLLM?: (changes: Partial<LangGraphLLMNodeData>) => void;
}

export function LLMNodeInspector({
  selectedLLMData,
  onDeleteStep,
  onUpdateLLM,
}: LLMNodeInspectorProps) {
  const activeProviderKey = selectedLLMData.provider || "openai";
  const activePreset =
    LLM_PROVIDER_PRESETS[activeProviderKey] || LLM_PROVIDER_PRESETS.custom;
  const currentModels = activePreset?.models || [];

  const defaultBody = JSON.stringify(
    {
      model:
        selectedLLMData.model || activePreset?.defaultModel || "gpt-4o-mini",
      messages: [{ role: "user", content: "{{input}}" }],
      temperature: selectedLLMData.temperature ?? 0.7,
    },
    null,
    2,
  );

  const defaultHeaders = JSON.stringify(
    {
      "Content-Type": "application/json",
      Authorization: selectedLLMData.apiKeyHeader
        ? `Bearer ${selectedLLMData.apiKeyHeader}`
        : "Bearer YOUR_API_KEY",
    },
    null,
    2,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 shadow-sm uppercase">
            {activeProviderKey}
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            LLM Config
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onDeleteStep}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
        </Button>
      </div>

      {/* Label */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Node Label</Label>
        <Input
          className="h-8 text-xs bg-background/50"
          value={selectedLLMData.label || ""}
          onChange={(e) => onUpdateLLM?.({ label: e.target.value })}
        />
      </div>

      {/* Provider Preset */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Provider Preset</Label>
        <Select
          value={activeProviderKey}
          onValueChange={(val: string) => {
            const preset = LLM_PROVIDER_PRESETS[val];
            if (preset) {
              onUpdateLLM?.({
                provider: val,
                url: preset.defaultUrl,
                baseUrl: preset.defaultUrl,
                model: preset.defaultModel,
              });
            } else {
              onUpdateLLM?.({ provider: val });
            }
          }}
        >
          <SelectTrigger className="h-8 text-xs bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LLM_PROVIDER_PRESETS).map(([key, preset]) => (
              <SelectItem key={key} value={key}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Identifier */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">Model Identifier</Label>
        {currentModels.length > 0 ? (
          <Select
            value={selectedLLMData.model || activePreset?.defaultModel}
            onValueChange={(val: string) => onUpdateLLM?.({ model: val })}
          >
            <SelectTrigger className="h-8 text-xs bg-background/50 font-mono">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {currentModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="h-8 text-xs bg-background/50 font-mono"
            placeholder="e.g. gpt-4o, claude-3-5-sonnet, llama3:8b"
            value={selectedLLMData.model || ""}
            onChange={(e) => onUpdateLLM?.({ model: e.target.value })}
          />
        )}
      </div>

      {/* System Prompt */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium">
          System Prompt / Instructions
        </Label>
        <LocalTextarea
          className="min-h-[90px] text-xs bg-background/50 p-2 font-mono leading-relaxed resize-y placeholder:text-muted-foreground/50"
          placeholder="You are a helpful AI assistant..."
          value={selectedLLMData.systemPrompt || ""}
          onChange={(e) => onUpdateLLM?.({ systemPrompt: e.target.value })}
        />
      </div>

      {/* Method & URL - Only show for custom provider */}
      {activeProviderKey === "custom" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Base URL /
            Endpoint
          </Label>
          <div className="flex items-center gap-1.5">
            <Select
              value={selectedLLMData.method || "POST"}
              onValueChange={(val: string) => onUpdateLLM?.({ method: val })}
            >
              <SelectTrigger className="h-8 w-20 text-xs font-mono bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="h-8 text-xs bg-background/50 font-mono flex-1"
              placeholder="https://api.openai.com/v1/chat/completions"
              value={
                selectedLLMData.url ||
                selectedLLMData.baseUrl ||
                activePreset?.defaultUrl ||
                ""
              }
              onChange={(e) =>
                onUpdateLLM?.({ url: e.target.value, baseUrl: e.target.value })
              }
            />
          </div>
        </div>
      )}

      {/* Auth Key */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" /> Secret API
          Key (Optional)
        </Label>
        <Input
          type="password"
          className="h-8 text-xs bg-background/50 font-mono"
          placeholder="Bearer sk-... or secret token"
          value={selectedLLMData.apiKeyHeader || ""}
          onChange={(e) => onUpdateLLM?.({ apiKeyHeader: e.target.value })}
        />
      </div>

      {/* Headers & Body JSON - Only show for custom provider */}
      {activeProviderKey === "custom" && (
        <>
          <div className="flex flex-col gap-2.5 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-muted-foreground" /> Headers
              (JSON)
            </span>
            <LocalTextarea
              className="min-h-[80px] max-h-[140px] text-xs bg-background/50 focus-visible:ring-1 font-mono resize-none p-2.5 rounded-md"
              placeholder='{\n  "Content-Type": "application/json"\n}'
              rows={4}
              value={
                selectedLLMData.headersJson !== undefined
                  ? selectedLLMData.headersJson
                  : defaultHeaders
              }
              onChange={(e) => onUpdateLLM?.({ headersJson: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2.5 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-muted-foreground" /> Request
              Payload (JSON Body)
            </span>
            <LocalTextarea
              className="min-h-[110px] max-h-[200px] text-xs bg-background/50 focus-visible:ring-1 font-mono resize-none p-2.5 rounded-md"
              placeholder='{\n  "model": "gpt-4o",\n  "messages": [{"role": "user", "content": "{{input}}"}]\n}'
              rows={6}
              value={
                selectedLLMData.bodyJson !== undefined
                  ? selectedLLMData.bodyJson
                  : defaultBody
              }
              onChange={(e) => onUpdateLLM?.({ bodyJson: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}

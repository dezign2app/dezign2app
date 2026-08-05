import React, { useState } from "react";
import {
  Wrench,
  Trash2,
  Box,
  Server,
  Globe,
  BoxSelect,
  AlertCircle,
  Database,
  Check,
  Network,
  ShieldAlert,
} from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type {
  ToolNodeData,
  ToolSource,
  ToolReturnType,
  StateUpdateMode,
  StoreOperation,
} from "@workspace/canvas";
import { LocalInput, LocalTextarea } from "../../../../common";
import {
  TOOL_SOURCE_INLINE,
  TOOL_SOURCE_MCP_SERVER,
  TOOL_SOURCE_API_ENDPOINT,
} from "../../constants";
import type { LangGraphStateChannel } from "@/types/canvas";
import { BusinessLogicBlock } from "../../../../../../shared/BusinessLogicBlock";

interface ToolNodeInspectorProps {
  selectedToolData: ToolNodeData;
  onDeleteTool: () => void;
  onUpdateTool: (changes: Partial<ToolNodeData>) => void;
  stateChannels: LangGraphStateChannel[];
}

export function ToolNodeInspector({
  selectedToolData,
  onDeleteTool,
  onUpdateTool,
  stateChannels,
}: ToolNodeInspectorProps) {
  const [schemaText, setSchemaText] = useState(
    selectedToolData.inputSchema || "",
  );
  const [bodyText, setBodyText] = useState(selectedToolData.functionBody || "");

  // Helpers
  const isHeadless = !!selectedToolData.headless;
  const isObjectReturn = selectedToolData.returnType === "object";
  const isCommandReturn = selectedToolData.returnType === "command";
  const isContentBlocksReturn =
    selectedToolData.returnType === "content_blocks";

  const handleNameChange = (val: string) => {
    const snake = val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    onUpdateTool({ name: snake });
  };

  const handleUpdateCommandConfig = (
    updates: Partial<NonNullable<ToolNodeData["commandConfig"]>>,
  ) => {
    onUpdateTool({
      commandConfig: {
        stateUpdates: selectedToolData.commandConfig?.stateUpdates || [],
        ...updates,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-mono truncate max-w-[150px]">
                {selectedToolData.name || "Tool Node"}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground opacity-70">
                {selectedToolData.toolId}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDeleteTool}
            title="Delete Tool Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── 1. Core Config ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <BoxSelect className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Core Config
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Name (snake_case)
          </Label>
          <LocalInput
            value={selectedToolData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-7 text-xs font-mono bg-background"
            placeholder="my_awesome_tool"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Description
          </Label>
          <LocalTextarea
            value={selectedToolData.description || ""}
            onChange={(e) => onUpdateTool({ description: e.target.value })}
            className="text-xs min-h-[60px] resize-y bg-background"
            placeholder="Describe what the tool does for the LLM..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Source
          </Label>
          <Select
            value={selectedToolData.source || TOOL_SOURCE_INLINE}
            onValueChange={(val: ToolSource) => onUpdateTool({ source: val })}
          >
            <SelectTrigger className="h-7 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TOOL_SOURCE_INLINE}>
                <div className="flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-emerald-400" /> Inline Code
                </div>
              </SelectItem>
              <SelectItem value={TOOL_SOURCE_MCP_SERVER}>
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-orange-400" /> MCP Server
                </div>
              </SelectItem>
              <SelectItem value={TOOL_SOURCE_API_ENDPOINT}>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> API Endpoint
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedToolData.source === TOOL_SOURCE_API_ENDPOINT && (
          <div className="flex flex-col gap-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <Label className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
              Endpoint URL
            </Label>
            <LocalInput
              value={selectedToolData.endpointUrl || ""}
              onChange={(e) => onUpdateTool({ endpointUrl: e.target.value })}
              className="h-7 text-xs font-mono bg-background"
              placeholder="https://api.example.com/v1/tool"
            />
          </div>
        )}

        {selectedToolData.source === TOOL_SOURCE_MCP_SERVER && (
          <div className="flex flex-col gap-2 p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
            <Label className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">
              MCP Connection ID
            </Label>
            <LocalInput
              value={selectedToolData.mcpConnectionId || ""}
              onChange={(e) =>
                onUpdateTool({ mcpConnectionId: e.target.value })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="conn_12345"
            />
            <Label className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mt-2">
              Remote Tool Name
            </Label>
            <LocalInput
              value={selectedToolData.remoteToolName || ""}
              onChange={(e) => onUpdateTool({ remoteToolName: e.target.value })}
              className="h-7 text-xs font-mono bg-background"
              placeholder="search_files"
            />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <Label className="text-xs font-semibold text-foreground flex justify-between items-center">
            <span>Input Schema (JSON Schema)</span>
            <span className="text-[9px] font-normal text-muted-foreground">
              Zod compatible
            </span>
          </Label>
          <LocalTextarea
            value={schemaText}
            onChange={(e) => {
              setSchemaText(e.target.value);
              onUpdateTool({ inputSchema: e.target.value });
            }}
            className="text-[11px] min-h-[100px] resize-y bg-background font-mono leading-relaxed"
            placeholder={
              '{\n  "type": "object",\n  "properties": {\n    "query": { "type": "string" }\n  }\n}'
            }
          />
        </div>
      </div>

      {/* ─── 2. Return Behavior ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Return Behavior
            </h3>
          </div>
          <div
            className="flex items-center gap-2"
            title="Return output directly, skipping further model processing"
          >
            <Label
              htmlFor="returnDirect"
              className="text-xs font-semibold cursor-pointer"
            >
              Return Direct
            </Label>
            <Switch
              id="returnDirect"
              checked={selectedToolData.returnDirect || false}
              onCheckedChange={(c) => onUpdateTool({ returnDirect: c })}
              className="scale-75 origin-right"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Return Type
          </Label>
          <Select
            value={selectedToolData.returnType || "string"}
            onValueChange={(val: ToolReturnType) =>
              onUpdateTool({ returnType: val })
            }
          >
            <SelectTrigger className="h-7 text-xs bg-background font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">
                <span className="font-mono text-xs text-foreground">
                  string
                </span>
              </SelectItem>
              <SelectItem value="object">
                <span className="font-mono text-xs text-amber-500">
                  object (dict)
                </span>
              </SelectItem>
              <SelectItem value="content_blocks">
                <span className="font-mono text-xs text-sky-500">
                  content_blocks (multimodal)
                </span>
              </SelectItem>
              <SelectItem value="command">
                <span className="font-mono text-xs text-purple-500">
                  command (state updates)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isContentBlocksReturn && (
          <div className="flex gap-2 p-2 rounded bg-sky-500/10 border border-sky-500/20 items-start">
            <AlertCircle className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-sky-500 leading-tight">
              Multimodal returns (images/audio) require a model that supports
              them. Check the step's model configuration.
            </p>
          </div>
        )}

        {isObjectReturn && (
          <div className="flex flex-col gap-2 mt-2">
            <Label className="text-xs font-semibold text-foreground">
              Output Schema (JSON Schema)
            </Label>
            <LocalTextarea
              value={selectedToolData.outputSchema || ""}
              onChange={(e) => onUpdateTool({ outputSchema: e.target.value })}
              className="text-[11px] min-h-[80px] resize-y bg-background font-mono"
              placeholder={'{\n  "type": "object",\n  "properties": {}\n}'}
            />
          </div>
        )}

        {isCommandReturn && (
          <div className="flex flex-col gap-2 mt-2 bg-purple-500/5 p-2 rounded border border-purple-500/10">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-purple-500 uppercase">
                State Updates
              </Label>
            </div>
            {(selectedToolData.commandConfig?.stateUpdates || []).map(
              (update, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1.5 p-2 bg-background border border-border/50 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Select
                      value={update.channelKey}
                      onValueChange={(val) => {
                        const newUpdates = [
                          ...(selectedToolData.commandConfig?.stateUpdates ||
                            []),
                        ];
                        if (newUpdates[idx]) {
                          newUpdates[idx].channelKey = val;
                          handleUpdateCommandConfig({
                            stateUpdates: newUpdates,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-6 text-[10px] flex-1 font-mono">
                        <SelectValue placeholder="Channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {stateChannels.map((c) => (
                          <SelectItem
                            key={c.key}
                            value={c.key}
                            className="text-[10px] font-mono"
                          >
                            {c.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={update.mode || "set"}
                      onValueChange={(val: StateUpdateMode) => {
                        const newUpdates = [
                          ...(selectedToolData.commandConfig?.stateUpdates ||
                            []),
                        ];
                        if (newUpdates[idx]) {
                          newUpdates[idx].mode = val;
                          handleUpdateCommandConfig({
                            stateUpdates: newUpdates,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-6 text-[10px] w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="set" className="text-[10px]">
                          set
                        </SelectItem>
                        <SelectItem value="append" className="text-[10px]">
                          append
                        </SelectItem>
                        <SelectItem
                          value="expression"
                          className="text-[10px] text-amber-500"
                        >
                          expression
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        const newUpdates = [
                          ...(selectedToolData.commandConfig?.stateUpdates ||
                            []),
                        ];
                        newUpdates.splice(idx, 1);
                        handleUpdateCommandConfig({ stateUpdates: newUpdates });
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {update.mode === "expression" && (
                    <div className="flex flex-col gap-1 mt-1">
                      <LocalInput
                        value={update.value || ""}
                        onChange={(e) => {
                          const newUpdates = [
                            ...(selectedToolData.commandConfig?.stateUpdates ||
                              []),
                          ];
                          if (newUpdates[idx]) {
                            newUpdates[idx].value = e.target.value;
                            handleUpdateCommandConfig({
                              stateUpdates: newUpdates,
                            });
                          }
                        }}
                        className="h-6 text-[10px] font-mono bg-amber-500/5 border-amber-500/20 placeholder:text-amber-500/30 text-amber-500"
                        placeholder="e.g. priorState.count + toolResult.count"
                      />
                      <span className="text-[9px] text-amber-500 leading-tight">
                        Expressions run in a safe DSL. Available vars:
                        `priorState`, `toolResult`, `input`.
                      </span>
                    </div>
                  )}
                </div>
              ),
            )}
            <button
              type="button"
              className="h-6 rounded bg-purple-500/10 hover:bg-purple-500/20 text-[10px] font-semibold text-purple-500 transition-colors mt-1 border border-purple-500/20"
              onClick={() => {
                const newUpdates = [
                  ...(selectedToolData.commandConfig?.stateUpdates || []),
                  {
                    channelKey: stateChannels[0]?.key || "messages",
                    mode: "set" as const,
                  },
                ];
                handleUpdateCommandConfig({ stateUpdates: newUpdates });
              }}
            >
              + Add State Update
            </button>
          </div>
        )}
      </div>

      {/* ─── 3. Headless Mode ──────────────────────────────────────────────── */}
      <div
        className={`flex flex-col gap-3 p-3 rounded-xl border transition-colors ${isHeadless ? "bg-purple-500/10 border-purple-500/30" : "bg-secondary/10 border-border/50"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe
              className={`w-4 h-4 ${isHeadless ? "text-purple-500" : "text-muted-foreground"}`}
            />
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${isHeadless ? "text-purple-500" : "text-muted-foreground"}`}
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

      {/* ─── 4. Implementation & Advanced (Server Only) ────────────────────── */}
      {!isHeadless && (
        <>
          <BusinessLogicBlock
            mode={selectedToolData.implementationMode || "natural_language"}
            onModeChange={(implementationMode) =>
              onUpdateTool({ implementationMode })
            }
            prompt={selectedToolData.prompt || ""}
            onPromptChange={(prompt) => onUpdateTool({ prompt })}
            code={bodyText}
            onCodeChange={(val) => {
              setBodyText(val);
              onUpdateTool({ functionBody: val });
            }}
            title="Tool Business Logic"
            description="Define tool behavior in natural language or write a custom function"
            onGenerateCode={() => {
              const specText =
                selectedToolData.prompt || selectedToolData.description;
              if (specText && !selectedToolData.functionBody) {
                const generatedCode = `// Tool: ${selectedToolData.name}\n// Spec: ${specText.split("\n").join("\n// ")}\nreturn { success: true, result: "Tool executed successfully" };`;
                setBodyText(generatedCode);
                onUpdateTool({
                  functionBody: generatedCode,
                  implementationMode: "code",
                });
              }
            }}
          />

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
                  onCheckedChange={(c) =>
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
                    value={
                      selectedToolData.contextAccess?.fields?.join(", ") || ""
                    }
                    onChange={(e) => {
                      const fields = e.target.value
                        .split(",")
                        .map((s) => s.trim())
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
                  onCheckedChange={(c) =>
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
                      onChange={(e) =>
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
                          selectedToolData.storeAccess?.operations?.includes(
                            op,
                          );
                        return (
                          <div key={op} className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id={`store-op-${op}`}
                              checked={checked || false}
                              onChange={(e) => {
                                const curr =
                                  selectedToolData.storeAccess?.operations ||
                                  [];
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
                onCheckedChange={(c) => onUpdateTool({ streamWriter: c })}
                className="scale-75 origin-right"
              />
            </div>
          </div>
        </>
      )}

      {/* ─── 5. Error Handling ─────────────────────────────────────────────── */}
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
            onCheckedChange={(c) =>
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
                onChange={(e) =>
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
                onChange={(e) =>
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
    </div>
  );
}

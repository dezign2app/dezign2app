import React from "react";
import {
  Shield,
  Trash2,
  UserCheck,
  Gauge,
  Activity,
  Code2,
  FileText,
  Cpu,
  Wrench,
  GitFork,
  Lock,
  ListTodo,
  Filter,
  RotateCcw,
  RefreshCw,
  Terminal,
  Scissors,
  Search,
  FolderGit2,
  Users,
} from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { MiddlewareNodeData } from "../../types";
import { DEFAULT_MIDDLEWARE_TYPE } from "../../constants";
import { LocalInput, LocalTextarea } from "../../../shared";

interface MiddlewareNodeInspectorProps {
  selectedMiddlewareData: MiddlewareNodeData;
  onDeleteMiddleware: () => void;
  onUpdateMiddleware: (changes: Partial<MiddlewareNodeData>) => void;
}

export function MiddlewareNodeInspector({
  selectedMiddlewareData,
  onDeleteMiddleware,
  onUpdateMiddleware,
}: MiddlewareNodeInspectorProps) {
  const currentType = selectedMiddlewareData.type || DEFAULT_MIDDLEWARE_TYPE;

  const handleNameChange = (val: string) => {
    onUpdateMiddleware({ name: val });
  };

  const handleInterruptToggle = (key: string, enabled: boolean) => {
    const currentConfig = selectedMiddlewareData.humanInTheLoopConfig || {};
    const currentFlags = currentConfig.interruptOn || { writeFile: true };
    onUpdateMiddleware({
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
    <div className="flex flex-col gap-6 pb-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md border border-border bg-secondary/30 text-foreground">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-mono truncate max-w-[150px]">
                {selectedMiddlewareData.name || "Middleware"}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground opacity-70">
                {selectedMiddlewareData.middlewareId || selectedMiddlewareData.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDeleteMiddleware}
            title="Delete Middleware Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── 1. General Config ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Middleware Type</h3>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">Name</Label>
          <LocalInput
            value={selectedMiddlewareData.name || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-7 text-xs font-mono bg-background"
            placeholder="middleware_name"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">Type</Label>
          <Select
            value={currentType}
            onValueChange={(val: any) => onUpdateMiddleware({ type: val })}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              <SelectItem value="human_in_the_loop">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Human in the Loop (interrupt)</span>
                </div>
              </SelectItem>
              <SelectItem value="summarization">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Summarization (Token Limiter)</span>
                </div>
              </SelectItem>
              <SelectItem value="model_call_limit">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-rose-400" />
                  <span>Model Call Limit</span>
                </div>
              </SelectItem>
              <SelectItem value="tool_call_limit">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-orange-400" />
                  <span>Tool Call Limit</span>
                </div>
              </SelectItem>
              <SelectItem value="model_fallback">
                <div className="flex items-center gap-2">
                  <GitFork className="w-3.5 h-3.5 text-blue-400" />
                  <span>Model Fallback</span>
                </div>
              </SelectItem>
              <SelectItem value="pii_detection">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>PII Detection & Sanitization</span>
                </div>
              </SelectItem>
              <SelectItem value="todo_list">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-3.5 h-3.5 text-teal-400" />
                  <span>To-do List (Task Planner)</span>
                </div>
              </SelectItem>
              <SelectItem value="llm_tool_selector">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span>LLM Tool Selector</span>
                </div>
              </SelectItem>
              <SelectItem value="tool_retry">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Tool Retry (Exponential Backoff)</span>
                </div>
              </SelectItem>
              <SelectItem value="model_retry">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Model Retry (Exponential Backoff)</span>
                </div>
              </SelectItem>
              <SelectItem value="llm_tool_emulator">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LLM Tool Emulator</span>
                </div>
              </SelectItem>
              <SelectItem value="context_editing">
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-pink-400" />
                  <span>Context Editing (Clear Tool Uses)</span>
                </div>
              </SelectItem>
              <SelectItem value="provider_tool_search">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-violet-400" />
                  <span>Provider Tool Search</span>
                </div>
              </SelectItem>
              <SelectItem value="filesystem">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Filesystem (Short & Long Memory)</span>
                </div>
              </SelectItem>
              <SelectItem value="subagent">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Subagent Middleware</span>
                </div>
              </SelectItem>
              <SelectItem value="rate_limit">
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rate Limiter</span>
                </div>
              </SelectItem>
              <SelectItem value="logging_tracing">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>Logging & Tracing (LangSmith)</span>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Custom JS Middleware</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── 2. Type-Specific Configs ───────────────────────────────────────── */}

      {/* Human in the loop */}
      {currentType === "human_in_the_loop" && (
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
                const checked = selectedMiddlewareData.humanInTheLoopConfig?.interruptOn?.[key] ?? (key === "writeFile");
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
              value={selectedMiddlewareData.humanInTheLoopConfig?.approvalPrompt || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  humanInTheLoopConfig: {
                    ...selectedMiddlewareData.humanInTheLoopConfig,
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
              value={selectedMiddlewareData.humanInTheLoopConfig?.requiredRole || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  humanInTheLoopConfig: {
                    ...selectedMiddlewareData.humanInTheLoopConfig,
                    requiredRole: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="admin, supervisor"
            />
          </div>
        </div>
      )}

      {/* Summarization */}
      {currentType === "summarization" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Summarization Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Summarization Model</Label>
            <LocalInput
              value={selectedMiddlewareData.summarizationConfig?.model || "gpt-5.4-mini"}
              onChange={(e) =>
                onUpdateMiddleware({
                  summarizationConfig: {
                    ...selectedMiddlewareData.summarizationConfig,
                    model: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="gpt-5.4-mini or openai:gpt-4o-mini"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Trigger Tokens</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.summarizationConfig?.triggerTokens ?? 4000}
                onChange={(e) =>
                  onUpdateMiddleware({
                    summarizationConfig: {
                      ...selectedMiddlewareData.summarizationConfig,
                      triggerTokens: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Messages to Keep</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.summarizationConfig?.keepMessages ?? 20}
                onChange={(e) =>
                  onUpdateMiddleware({
                    summarizationConfig: {
                      ...selectedMiddlewareData.summarizationConfig,
                      keepMessages: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Trim Tokens To Summarize</Label>
            <LocalInput
              type="number"
              value={selectedMiddlewareData.summarizationConfig?.trimTokensToSummarize ?? 4000}
              onChange={(e) =>
                onUpdateMiddleware({
                  summarizationConfig: {
                    ...selectedMiddlewareData.summarizationConfig,
                    trimTokensToSummarize: parseInt(e.target.value) || 4000,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Summary Prefix</Label>
            <LocalInput
              value={selectedMiddlewareData.summarizationConfig?.summaryPrefix ?? "Summary of previous conversation:"}
              onChange={(e) =>
                onUpdateMiddleware({
                  summarizationConfig: {
                    ...selectedMiddlewareData.summarizationConfig,
                    summaryPrefix: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Custom Summary Prompt</Label>
            <LocalTextarea
              value={selectedMiddlewareData.summarizationConfig?.summaryPrompt || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  summarizationConfig: {
                    ...selectedMiddlewareData.summarizationConfig,
                    summaryPrompt: e.target.value,
                  },
                })
              }
              className="text-xs min-h-[60px] bg-background font-mono"
              placeholder="Summarize key info preserving facts. History: {messages}"
            />
          </div>
        </div>
      )}

      {/* Model Call Limit */}
      {currentType === "model_call_limit" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Call Limit Config</h3>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold text-foreground">Thread Limit (Total Calls)</Label>
            <LocalInput
              type="number"
              min="1"
              value={selectedMiddlewareData.modelCallLimitConfig?.threadLimit ?? 10}
              onChange={(e) =>
                onUpdateMiddleware({
                  modelCallLimitConfig: {
                    ...selectedMiddlewareData.modelCallLimitConfig,
                    threadLimit: parseInt(e.target.value) || 10,
                  },
                })
              }
              className="h-7 w-24 text-right text-xs font-mono bg-background"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold text-foreground">Run Limit (Per Invoc.)</Label>
            <LocalInput
              type="number"
              min="1"
              value={selectedMiddlewareData.modelCallLimitConfig?.runLimit ?? 5}
              onChange={(e) =>
                onUpdateMiddleware({
                  modelCallLimitConfig: {
                    ...selectedMiddlewareData.modelCallLimitConfig,
                    runLimit: parseInt(e.target.value) || 5,
                  },
                })
              }
              className="h-7 w-24 text-right text-xs font-mono bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Exit Behavior</Label>
            <Select
              value={selectedMiddlewareData.modelCallLimitConfig?.exitBehavior || "end"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  modelCallLimitConfig: {
                    ...selectedMiddlewareData.modelCallLimitConfig,
                    exitBehavior: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="end">end (Graceful termination)</SelectItem>
                <SelectItem value="error">error (Throw exception)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Tool Call Limit */}
      {currentType === "tool_call_limit" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tool Call Limit Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Tool Name (Optional)</Label>
            <LocalInput
              value={selectedMiddlewareData.toolCallLimitConfig?.toolName || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  toolCallLimitConfig: {
                    ...selectedMiddlewareData.toolCallLimitConfig,
                    toolName: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="e.g. search (Leave empty for all tools)"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Thread Limit</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.toolCallLimitConfig?.threadLimit ?? 20}
                onChange={(e) =>
                  onUpdateMiddleware({
                    toolCallLimitConfig: {
                      ...selectedMiddlewareData.toolCallLimitConfig,
                      threadLimit: parseInt(e.target.value) || 20,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Run Limit</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.toolCallLimitConfig?.runLimit ?? 10}
                onChange={(e) =>
                  onUpdateMiddleware({
                    toolCallLimitConfig: {
                      ...selectedMiddlewareData.toolCallLimitConfig,
                      runLimit: parseInt(e.target.value) || 10,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Exit Behavior</Label>
            <Select
              value={selectedMiddlewareData.toolCallLimitConfig?.exitBehavior || "continue"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  toolCallLimitConfig: {
                    ...selectedMiddlewareData.toolCallLimitConfig,
                    exitBehavior: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">continue (Return error message & allow LLM recovery)</SelectItem>
                <SelectItem value="error">error (Throw ToolCallLimitExceededError)</SelectItem>
                <SelectItem value="end">end (Stop execution with AI message)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Model Fallback */}
      {currentType === "model_fallback" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Fallback Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Fallback Models (In Priority Order)</Label>
            <LocalTextarea
              value={selectedMiddlewareData.modelFallbackConfig?.fallbackModels?.join(", ") || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  modelFallbackConfig: {
                    fallbackModels: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="text-xs min-h-[60px] font-mono bg-background"
              placeholder="gpt-5.4-mini, claude-3-5-sonnet-20241022, gemini-2.5-flash"
            />
            <p className="text-[10px] text-muted-foreground">
              Comma-separated list of fallback models tried sequentially when the primary model fails.
            </p>
          </div>
        </div>
      )}

      {/* PII Detection */}
      {currentType === "pii_detection" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PII Detection & Sanitization</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">PII Type</Label>
            <Select
              value={selectedMiddlewareData.piiConfig?.piiType || "email"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  piiConfig: {
                    ...selectedMiddlewareData.piiConfig,
                    piiType: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Address</SelectItem>
                <SelectItem value="credit_card">Credit Card Number</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="mac_address">MAC Address</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="ssn">Social Security Number (SSN)</SelectItem>
                <SelectItem value="phone_number">Phone Number</SelectItem>
                <SelectItem value="api_key">API Secret Keys</SelectItem>
                <SelectItem value="custom">Custom Pattern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Sanitization Strategy</Label>
            <Select
              value={selectedMiddlewareData.piiConfig?.strategy || "redact"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  piiConfig: {
                    ...selectedMiddlewareData.piiConfig,
                    strategy: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redact">redact (Replace with [REDACTED_TYPE])</SelectItem>
                <SelectItem value="mask">mask (Partially mask ****-1234)</SelectItem>
                <SelectItem value="hash">hash (Replace with deterministic hash)</SelectItem>
                <SelectItem value="block">block (Throw error on detection)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedMiddlewareData.piiConfig?.piiType === "custom" && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Detector Regex Pattern</Label>
              <LocalInput
                value={selectedMiddlewareData.piiConfig?.detectorPattern || ""}
                onChange={(e) =>
                  onUpdateMiddleware({
                    piiConfig: {
                      ...selectedMiddlewareData.piiConfig,
                      detectorPattern: e.target.value,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
                placeholder="sk-[a-zA-Z0-9]{32}"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 p-2 bg-background border border-border/50 rounded-lg">
            <Label className="text-[11px] font-semibold text-foreground mb-1">Enforcement Scope</Label>
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="pii-input" className="text-[11px] cursor-pointer">Apply to User Input</Label>
              <Switch
                id="pii-input"
                checked={selectedMiddlewareData.piiConfig?.applyToInput ?? true}
                onCheckedChange={(c) =>
                  onUpdateMiddleware({
                    piiConfig: { ...selectedMiddlewareData.piiConfig, applyToInput: c },
                  })
                }
                className="scale-75 origin-right"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="pii-output" className="text-[11px] cursor-pointer">Apply to AI Output</Label>
              <Switch
                id="pii-output"
                checked={selectedMiddlewareData.piiConfig?.applyToOutput ?? false}
                onCheckedChange={(c) =>
                  onUpdateMiddleware({
                    piiConfig: { ...selectedMiddlewareData.piiConfig, applyToOutput: c },
                  })
                }
                className="scale-75 origin-right"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="pii-tools" className="text-[11px] cursor-pointer">Apply to Tool Results</Label>
              <Switch
                id="pii-tools"
                checked={selectedMiddlewareData.piiConfig?.applyToToolResults ?? false}
                onCheckedChange={(c) =>
                  onUpdateMiddleware({
                    piiConfig: { ...selectedMiddlewareData.piiConfig, applyToToolResults: c },
                  })
                }
                className="scale-75 origin-right"
              />
            </div>
          </div>
        </div>
      )}

      {/* To-do List */}
      {currentType === "todo_list" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To-do List Planner</h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="todo-write" className="text-xs cursor-pointer">Enable write_todos Tool</Label>
            <Switch
              id="todo-write"
              checked={selectedMiddlewareData.todoListConfig?.enableWriteTodos ?? true}
              onCheckedChange={(c) =>
                onUpdateMiddleware({
                  todoListConfig: { ...selectedMiddlewareData.todoListConfig, enableWriteTodos: c },
                })
              }
              className="scale-75 origin-right"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="todo-prompt" className="text-xs cursor-pointer">Auto-Inject Planning System Prompt</Label>
            <Switch
              id="todo-prompt"
              checked={selectedMiddlewareData.todoListConfig?.autoInjectPrompt ?? true}
              onCheckedChange={(c) =>
                onUpdateMiddleware({
                  todoListConfig: { ...selectedMiddlewareData.todoListConfig, autoInjectPrompt: c },
                })
              }
              className="scale-75 origin-right"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Initial Tasks / Instructions</Label>
            <LocalTextarea
              value={selectedMiddlewareData.todoListConfig?.initialTasks || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  todoListConfig: {
                    ...selectedMiddlewareData.todoListConfig,
                    initialTasks: e.target.value,
                  },
                })
              }
              className="text-xs min-h-[60px] bg-background"
              placeholder="e.g. 1. Fetch requirements 2. Process data 3. Generate summary"
            />
          </div>
        </div>
      )}

      {/* LLM Tool Selector */}
      {currentType === "llm_tool_selector" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LLM Tool Selector Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Selector Model</Label>
            <LocalInput
              value={selectedMiddlewareData.llmToolSelectorConfig?.model || "gpt-5.4-mini"}
              onChange={(e) =>
                onUpdateMiddleware({
                  llmToolSelectorConfig: {
                    ...selectedMiddlewareData.llmToolSelectorConfig,
                    model: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="gpt-5.4-mini"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold text-foreground">Max Tools to Select</Label>
            <LocalInput
              type="number"
              min="1"
              value={selectedMiddlewareData.llmToolSelectorConfig?.maxTools ?? 3}
              onChange={(e) =>
                onUpdateMiddleware({
                  llmToolSelectorConfig: {
                    ...selectedMiddlewareData.llmToolSelectorConfig,
                    maxTools: parseInt(e.target.value) || 3,
                  },
                })
              }
              className="h-7 w-24 text-right text-xs font-mono bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Always Include Tools</Label>
            <LocalInput
              value={selectedMiddlewareData.llmToolSelectorConfig?.alwaysInclude?.join(", ") || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  llmToolSelectorConfig: {
                    ...selectedMiddlewareData.llmToolSelectorConfig,
                    alwaysInclude: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="search, calculator (comma-separated)"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Selector Prompt Override</Label>
            <LocalTextarea
              value={selectedMiddlewareData.llmToolSelectorConfig?.systemPrompt || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  llmToolSelectorConfig: {
                    ...selectedMiddlewareData.llmToolSelectorConfig,
                    systemPrompt: e.target.value,
                  },
                })
              }
              className="text-xs min-h-[50px] bg-background"
              placeholder="Select relevant tools for query..."
            />
          </div>
        </div>
      )}

      {/* Tool Retry */}
      {currentType === "tool_retry" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tool Retry Config</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Max Retries</Label>
              <LocalInput
                type="number"
                min="0"
                value={selectedMiddlewareData.toolRetryConfig?.maxRetries ?? 3}
                onChange={(e) =>
                  onUpdateMiddleware({
                    toolRetryConfig: {
                      ...selectedMiddlewareData.toolRetryConfig,
                      maxRetries: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Backoff Factor</Label>
              <LocalInput
                type="number"
                step="0.1"
                value={selectedMiddlewareData.toolRetryConfig?.backoffFactor ?? 2.0}
                onChange={(e) =>
                  onUpdateMiddleware({
                    toolRetryConfig: {
                      ...selectedMiddlewareData.toolRetryConfig,
                      backoffFactor: parseFloat(e.target.value) || 1.0,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Initial Delay (ms)</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.toolRetryConfig?.initialDelayMs ?? 1000}
                onChange={(e) =>
                  onUpdateMiddleware({
                    toolRetryConfig: {
                      ...selectedMiddlewareData.toolRetryConfig,
                      initialDelayMs: parseInt(e.target.value) || 1000,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Max Delay (ms)</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.toolRetryConfig?.maxDelayMs ?? 60000}
                onChange={(e) =>
                  onUpdateMiddleware({
                    toolRetryConfig: {
                      ...selectedMiddlewareData.toolRetryConfig,
                      maxDelayMs: parseInt(e.target.value) || 60000,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="retry-jitter" className="text-xs cursor-pointer">Add Jitter (±25%)</Label>
            <Switch
              id="retry-jitter"
              checked={selectedMiddlewareData.toolRetryConfig?.jitter ?? true}
              onCheckedChange={(c) =>
                onUpdateMiddleware({
                  toolRetryConfig: { ...selectedMiddlewareData.toolRetryConfig, jitter: c },
                })
              }
              className="scale-75 origin-right"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">On Exhausted Retries</Label>
            <Select
              value={selectedMiddlewareData.toolRetryConfig?.onFailure || "continue"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  toolRetryConfig: {
                    ...selectedMiddlewareData.toolRetryConfig,
                    onFailure: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">continue (Return error ToolMessage)</SelectItem>
                <SelectItem value="error">error (Throw exception)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Apply to Specific Tools</Label>
            <LocalInput
              value={selectedMiddlewareData.toolRetryConfig?.tools?.join(", ") || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  toolRetryConfig: {
                    ...selectedMiddlewareData.toolRetryConfig,
                    tools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="e.g. search_db, fetch_api (Leave empty for all)"
            />
          </div>
        </div>
      )}

      {/* Model Retry */}
      {currentType === "model_retry" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Retry Config</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Max Retries</Label>
              <LocalInput
                type="number"
                min="0"
                value={selectedMiddlewareData.modelRetryConfig?.maxRetries ?? 3}
                onChange={(e) =>
                  onUpdateMiddleware({
                    modelRetryConfig: {
                      ...selectedMiddlewareData.modelRetryConfig,
                      maxRetries: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Backoff Factor</Label>
              <LocalInput
                type="number"
                step="0.1"
                value={selectedMiddlewareData.modelRetryConfig?.backoffFactor ?? 2.0}
                onChange={(e) =>
                  onUpdateMiddleware({
                    modelRetryConfig: {
                      ...selectedMiddlewareData.modelRetryConfig,
                      backoffFactor: parseFloat(e.target.value) || 1.0,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Initial Delay (ms)</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.modelRetryConfig?.initialDelayMs ?? 1000}
                onChange={(e) =>
                  onUpdateMiddleware({
                    modelRetryConfig: {
                      ...selectedMiddlewareData.modelRetryConfig,
                      initialDelayMs: parseInt(e.target.value) || 1000,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Max Delay (ms)</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.modelRetryConfig?.maxDelayMs ?? 60000}
                onChange={(e) =>
                  onUpdateMiddleware({
                    modelRetryConfig: {
                      ...selectedMiddlewareData.modelRetryConfig,
                      maxDelayMs: parseInt(e.target.value) || 60000,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="model-retry-jitter" className="text-xs cursor-pointer">Add Jitter (±25%)</Label>
            <Switch
              id="model-retry-jitter"
              checked={selectedMiddlewareData.modelRetryConfig?.jitter ?? true}
              onCheckedChange={(c) =>
                onUpdateMiddleware({
                  modelRetryConfig: { ...selectedMiddlewareData.modelRetryConfig, jitter: c },
                })
              }
              className="scale-75 origin-right"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">On Failure</Label>
            <Select
              value={selectedMiddlewareData.modelRetryConfig?.onFailure || "continue"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  modelRetryConfig: {
                    ...selectedMiddlewareData.modelRetryConfig,
                    onFailure: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">continue (Return AIMessage with error)</SelectItem>
                <SelectItem value="error">error (Throw exception)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* LLM Tool Emulator */}
      {currentType === "llm_tool_emulator" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LLM Tool Emulator Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Emulator LLM Model</Label>
            <LocalInput
              value={selectedMiddlewareData.toolEmulatorConfig?.model || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  toolEmulatorConfig: {
                    ...selectedMiddlewareData.toolEmulatorConfig,
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
              value={selectedMiddlewareData.toolEmulatorConfig?.emulatedTools?.join(", ") || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  toolEmulatorConfig: {
                    ...selectedMiddlewareData.toolEmulatorConfig,
                    emulatedTools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="get_weather, send_email (Leave empty to emulate ALL tools)"
            />
          </div>
        </div>
      )}

      {/* Context Editing */}
      {currentType === "context_editing" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Context Editing (Clear Tool Uses)</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Trigger Tokens</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.contextEditingConfig?.triggerTokens ?? 100000}
                onChange={(e) =>
                  onUpdateMiddleware({
                    contextEditingConfig: {
                      ...selectedMiddlewareData.contextEditingConfig,
                      triggerTokens: parseInt(e.target.value) || 100000,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold text-foreground">Keep Recent Tools</Label>
              <LocalInput
                type="number"
                value={selectedMiddlewareData.contextEditingConfig?.keep ?? 3}
                onChange={(e) =>
                  onUpdateMiddleware({
                    contextEditingConfig: {
                      ...selectedMiddlewareData.contextEditingConfig,
                      keep: parseInt(e.target.value) || 3,
                    },
                  })
                }
                className="h-7 text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="clear-inputs" className="text-xs cursor-pointer">Clear Tool Call Inputs</Label>
            <Switch
              id="clear-inputs"
              checked={selectedMiddlewareData.contextEditingConfig?.clearToolInputs ?? false}
              onCheckedChange={(c) =>
                onUpdateMiddleware({
                  contextEditingConfig: { ...selectedMiddlewareData.contextEditingConfig, clearToolInputs: c },
                })
              }
              className="scale-75 origin-right"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Excluded Tools</Label>
            <LocalInput
              value={selectedMiddlewareData.contextEditingConfig?.excludeTools?.join(", ") || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  contextEditingConfig: {
                    ...selectedMiddlewareData.contextEditingConfig,
                    excludeTools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="e.g. user_memory, system_config"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Cleared Placeholder Text</Label>
            <LocalInput
              value={selectedMiddlewareData.contextEditingConfig?.placeholder ?? "[cleared]"}
              onChange={(e) =>
                onUpdateMiddleware({
                  contextEditingConfig: {
                    ...selectedMiddlewareData.contextEditingConfig,
                    placeholder: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
            />
          </div>
        </div>
      )}

      {/* Provider Tool Search */}
      {currentType === "provider_tool_search" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Provider Tool Search Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Searchable / Deferred Tools</Label>
            <LocalTextarea
              value={selectedMiddlewareData.providerToolSearchConfig?.searchableTools?.join(", ") || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  providerToolSearchConfig: {
                    searchableTools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="text-xs min-h-[60px] font-mono bg-background"
              placeholder="lookup_order_status, search_kb, query_db (comma-separated)"
            />
            <p className="text-[10px] text-muted-foreground">
              Tools deferred behind model provider's server-side tool search (Anthropic Claude Sonnet 4+ or OpenAI GPT-5.5+).
            </p>
          </div>
        </div>
      )}

      {/* Filesystem */}
      {currentType === "filesystem" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-fuchsia-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filesystem Memory Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Backend Storage Mode</Label>
            <Select
              value={selectedMiddlewareData.filesystemConfig?.backend || "composite"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  filesystemConfig: {
                    ...selectedMiddlewareData.filesystemConfig,
                    backend: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="state">StateBackend (Short-term ephemeral)</SelectItem>
                <SelectItem value="store">StoreBackend (Persistent store)</SelectItem>
                <SelectItem value="composite">CompositeBackend (Hybrid /memories/)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Memories Directory Path</Label>
            <LocalInput
              value={selectedMiddlewareData.filesystemConfig?.memoriesPath ?? "/memories/"}
              onChange={(e) =>
                onUpdateMiddleware({
                  filesystemConfig: {
                    ...selectedMiddlewareData.filesystemConfig,
                    memoriesPath: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Custom System Prompt Override</Label>
            <LocalTextarea
              value={selectedMiddlewareData.filesystemConfig?.systemPrompt || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  filesystemConfig: {
                    ...selectedMiddlewareData.filesystemConfig,
                    systemPrompt: e.target.value,
                  },
                })
              }
              className="text-xs min-h-[50px] bg-background font-mono"
              placeholder="Write to filesystem when saving key facts..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Custom Tool Descriptions</Label>
            <LocalTextarea
              value={selectedMiddlewareData.filesystemConfig?.customToolDescriptions || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  filesystemConfig: {
                    ...selectedMiddlewareData.filesystemConfig,
                    customToolDescriptions: e.target.value,
                  },
                })
              }
              className="text-xs min-h-[50px] bg-background font-mono"
              placeholder="Override descriptions for ls, read_file, write_file, edit_file..."
            />
          </div>
        </div>
      )}

      {/* Subagent */}
      {currentType === "subagent" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subagent Middleware Config</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Default Subagent Model</Label>
            <LocalInput
              value={selectedMiddlewareData.subagentConfig?.defaultModel || "claude-3-7-sonnet"}
              onChange={(e) =>
                onUpdateMiddleware({
                  subagentConfig: {
                    ...selectedMiddlewareData.subagentConfig,
                    defaultModel: e.target.value,
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="claude-3-7-sonnet"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Default Subagent Tools</Label>
            <LocalInput
              value={selectedMiddlewareData.subagentConfig?.defaultTools?.join(", ") || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  subagentConfig: {
                    ...selectedMiddlewareData.subagentConfig,
                    defaultTools: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="h-7 text-xs font-mono bg-background"
              placeholder="search_tool, code_runner (comma-separated)"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Subagents Definitions (JSON)</Label>
            <LocalTextarea
              value={selectedMiddlewareData.subagentConfig?.subagentsJson || ""}
              onChange={(e) =>
                onUpdateMiddleware({
                  subagentConfig: {
                    ...selectedMiddlewareData.subagentConfig,
                    subagentsJson: e.target.value,
                  },
                })
              }
              className="text-[11px] min-h-[90px] font-mono bg-background"
              placeholder={`[\n  {\n    "name": "researcher",\n    "description": "Performs web searches",\n    "model": "gpt-5.5"\n  }\n]`}
            />
          </div>
        </div>
      )}

      {/* Rate Limiter */}
      {currentType === "rate_limit" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rate Limiter Config</h3>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold text-foreground">Requests Per Minute</Label>
            <LocalInput
              type="number"
              min="1"
              max="10000"
              value={selectedMiddlewareData.rateLimitConfig?.requestsPerMinute ?? 60}
              onChange={(e) =>
                onUpdateMiddleware({
                  rateLimitConfig: {
                    ...selectedMiddlewareData.rateLimitConfig,
                    requestsPerMinute: parseInt(e.target.value) || 60,
                  },
                })
              }
              className="h-7 w-24 text-right text-xs font-mono bg-background"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-semibold text-foreground">Sliding Window (ms)</Label>
            <LocalInput
              type="number"
              min="1000"
              step="1000"
              value={selectedMiddlewareData.rateLimitConfig?.windowMs ?? 60000}
              onChange={(e) =>
                onUpdateMiddleware({
                  rateLimitConfig: {
                    requestsPerMinute: selectedMiddlewareData.rateLimitConfig?.requestsPerMinute ?? 60,
                    windowMs: parseInt(e.target.value) || 60000,
                  },
                })
              }
              className="h-7 w-28 text-right text-xs font-mono bg-background"
            />
          </div>
        </div>
      )}

      {/* Logging & Tracing */}
      {currentType === "logging_tracing" && (
        <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logging & Tracing</h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Log Level</Label>
            <Select
              value={selectedMiddlewareData.loggingConfig?.logLevel || "info"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  loggingConfig: {
                    ...selectedMiddlewareData.loggingConfig,
                    logLevel: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debug">debug (verbose)</SelectItem>
                <SelectItem value="info">info (standard)</SelectItem>
                <SelectItem value="warn">warn (warnings only)</SelectItem>
                <SelectItem value="error">error (failures only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-foreground">Tracing Target</Label>
            <Select
              value={selectedMiddlewareData.loggingConfig?.tracingTarget || "langsmith"}
              onValueChange={(val: any) =>
                onUpdateMiddleware({
                  loggingConfig: {
                    logLevel: selectedMiddlewareData.loggingConfig?.logLevel || "info",
                    tracingTarget: val,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-background font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="langsmith">LangSmith</SelectItem>
                <SelectItem value="opentelemetry">OpenTelemetry (OTEL)</SelectItem>
                <SelectItem value="convex">Convex Internal Database</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Custom JS */}
      {currentType === "custom" && (
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
              value={selectedMiddlewareData.customBody || ""}
              onChange={(e) => onUpdateMiddleware({ customBody: e.target.value })}
              className="text-[11px] min-h-[140px] resize-y bg-background font-mono leading-relaxed"
              placeholder={'async ({ request, state }, next) => {\n  console.log("Before request:", request);\n  const response = await next();\n  console.log("After response:", response);\n  return response;\n}'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

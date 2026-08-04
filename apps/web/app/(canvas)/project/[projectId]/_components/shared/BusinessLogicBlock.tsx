import React, { useState } from "react";
import {
  Sparkles,
  Code2,
  FileText,
  Loader2,
  Info,
  Database,
  Plus,
  Trash2,
  Radio,
  Zap,
  Terminal,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalTextarea } from "../backend-nodes/graph-nodes/shared";

export type LogicMode = "natural_language" | "code";

export type CrudOperation = "create" | "read" | "update" | "delete";

export interface TableCrudConfig {
  tableNodeId: string;
  operations: CrudOperation[];
  explanations?: Record<CrudOperation, string>;
}

export interface PublishedEventInfo {
  id?: string;
  name?: string;
  topic?: string;
}

export interface BusinessLogicBlockProps {
  mode?: LogicMode;
  onModeChange?: (mode: LogicMode) => void;
  prompt?: string;
  onPromptChange?: (val: string) => void;
  code?: string;
  onCodeChange?: (val: string) => void;
  onGenerateCode?: () => Promise<void> | void;
  isGenerating?: boolean;
  title?: string;
  description?: string;
  promptPlaceholder?: string;
  codePlaceholder?: string;
  codeLanguageLabel?: string;
  className?: string;

  // CRUD Operations Props
  crudConfig?: TableCrudConfig[];
  onCrudConfigChange?: (config: TableCrudConfig[]) => void;
  availableTableNodes?: { id: string; label: string }[];

  // Messaging & Endpoint Context Props
  publishedEvents?: PublishedEventInfo[];
  endpointMethod?: string;
  endpointPath?: string;
}

const ALL_CRUD_OPS: CrudOperation[] = ["create", "read", "update", "delete"];

function toVarName(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, "_");
  const camel = clean.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return "item";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

function toPascalCase(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, "_");
  const camel = clean.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return "Item";
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toTopicKey(name: string): string {
  return (name || "EVENT")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
}

export function BusinessLogicBlock({
  mode = "natural_language",
  onModeChange,
  prompt = "",
  onPromptChange,
  code = "",
  onCodeChange,
  onGenerateCode,
  isGenerating = false,
  title = "Business Logic",
  description,
  promptPlaceholder = "Describe the business logic in natural language (e.g., 'Validate user input, query the users table for active status, calculate discount, and return JSON summary')...",
  codePlaceholder = "// Write ONLY the function body statements (do not include outer function signature)\n// e.g.:\nconst result = await db.users.findMany();\nreturn res.json(result);",
  codeLanguageLabel = "TypeScript / JavaScript",
  className = "",
  crudConfig = [],
  onCrudConfigChange,
  availableTableNodes = [],
  publishedEvents = [],
  endpointMethod = "POST",
  endpointPath = "/",
}: BusinessLogicBlockProps) {
  const [internalMode, setInternalMode] = useState<LogicMode>(mode);
  const activeMode = onModeChange ? mode : internalMode;

  const handleModeSwitch = (newMode: LogicMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 p-3.5 bg-secondary/10 rounded-xl border border-border/60 shadow-sm ${className}`}
    >
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
              {title}
            </span>
            {description && (
              <span className="text-[10px] text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        </div>

        {/* Generate Code Action Button */}
        {onGenerateCode && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={onGenerateCode}
            className="h-7 text-[11px] font-semibold shadow-xs gap-1.5 px-2.5 border-border hover:bg-secondary transition-all"
            title="Use AI to transform your natural language description into executable code logic"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Code</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Mode Switch Tabs (Segmented Control) */}
      <div className="flex items-center justify-between gap-2 bg-background/60 p-1 rounded-lg border border-border/50">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => handleModeSwitch("natural_language")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
              activeMode === "natural_language"
                ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Natural Language</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("code")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
              activeMode === "code"
                ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeMode === "natural_language" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <span>Natural Language Prompt / Spec</span>
            </Label>
            <span className="text-[9px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
              ✨ AI Transformation
            </span>
          </div>

          <LocalTextarea
            value={prompt}
            onChange={(e) => onPromptChange?.(e.target.value)}
            placeholder={promptPlaceholder}
            className="text-xs min-h-[120px] resize-y bg-background leading-relaxed placeholder:text-muted-foreground/50 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight bg-secondary/20 p-2 rounded border border-border/40">
            <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            <span>
              Write instructions in plain language. The AI compiler will
              automatically convert this into production code when generating
              the microservice.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold text-muted-foreground font-mono">
              {codeLanguageLabel}
            </Label>
            <span className="text-[9px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
              {"</> Direct Logic"}
            </span>
          </div>

          <LocalTextarea
            value={code}
            onChange={(e) => onCodeChange?.(e.target.value)}
            placeholder={codePlaceholder}
            className="text-[11px] min-h-[140px] resize-y bg-background font-mono leading-relaxed placeholder:text-muted-foreground/40 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight bg-secondary/20 p-2 rounded border border-border/40 font-mono">
            <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            <span>
              Write ONLY inner function body statements. Do not include outer
              function signatures or declarations (e.g.{" "}
              <code>async function...</code>).
            </span>
          </div>
        </div>
      )}

      {/* Database CRUD Operations Section */}
      {onCrudConfigChange && (
        <div className="flex flex-col gap-2.5 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Database Table Operations
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] gap-1 px-2 border-border"
              onClick={() => {
                const firstTableId = availableTableNodes[0]?.id || "";
                onCrudConfigChange([
                  ...crudConfig,
                  { tableNodeId: firstTableId, operations: ["read"] },
                ]);
              }}
            >
              <Plus className="w-3 h-3" />
              <span>Add Table Ref</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {crudConfig.map((configItem, idx) => (
              <div
                key={`${configItem.tableNodeId || "table"}_${idx}`}
                className="flex flex-col gap-3 p-2.5 bg-background/60 rounded-lg border border-border/50 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  {/* Table Node Selector */}
                  <Select
                    value={configItem.tableNodeId || "__none__"}
                    onValueChange={(tableId) => {
                      const next = [...crudConfig];
                      if (next[idx]) {
                        next[idx] = {
                          ...next[idx],
                          tableNodeId: tableId === "__none__" ? "" : tableId,
                        };
                        onCrudConfigChange(next);
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1 font-mono bg-background">
                      <SelectValue placeholder="Select a Table Ref Node..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="__none__"
                        className="text-xs font-mono text-muted-foreground"
                      >
                        Select a Table...
                      </SelectItem>
                      {availableTableNodes.map((t) => (
                        <SelectItem
                          key={t.id}
                          value={t.id}
                          className="text-xs font-mono"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* CRUD Operation Toggle Pills */}
                  <div className="flex items-center gap-1">
                    {ALL_CRUD_OPS.map((op) => {
                      const label =
                        op === "create"
                          ? "C"
                          : op === "read"
                            ? "R"
                            : op === "update"
                              ? "U"
                              : "D";
                      const isSelected = configItem.operations.includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          title={op.toUpperCase()}
                          onClick={() => {
                            const curr = configItem.operations || [];
                            const nextOps = isSelected
                              ? curr.filter((o) => o !== op)
                              : [...curr, op];
                            const next = [...crudConfig];
                            if (next[idx]) {
                              next[idx] = { ...next[idx], operations: nextOps };
                              onCrudConfigChange(next);
                            }
                          }}
                          className={`w-6 h-6 rounded text-[10px] font-bold font-mono transition-all flex items-center justify-center border ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}

                    {/* Remove Table Config */}
                    <button
                      type="button"
                      title="Remove Table Reference"
                      onClick={() => {
                        const next = crudConfig.filter((_, i) => i !== idx);
                        onCrudConfigChange(next);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Operation Explanations */}
                {configItem.operations.length > 0 && configItem.tableNodeId && (
                  <div className="flex flex-col gap-2 mt-1 px-1">
                    {configItem.operations.map((op) => (
                      <div key={op} className="flex flex-col gap-1.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                          {op} Explanation
                        </Label>
                        <LocalTextarea
                          value={configItem.explanations?.[op] || ""}
                          onChange={(e) => {
                            const next = [...crudConfig];
                            if (next[idx]) {
                              const newExplanations = {
                                ...(next[idx].explanations || {}),
                                [op]: e.target.value,
                              };
                              next[idx] = {
                                ...next[idx],
                                explanations: newExplanations as Record<
                                  CrudOperation,
                                  string
                                >,
                              };
                              onCrudConfigChange(next);
                            }
                          }}
                          placeholder={`Explain why and how the data is ${op === "read" ? "fetched from" : op === "create" ? "inserted into" : op === "update" ? "updated in" : "deleted from"} this table...`}
                          className="text-[11px] min-h-[60px] resize-y bg-background leading-relaxed placeholder:text-muted-foreground/40 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {crudConfig.length === 0 && (
              <span className="text-[10px] text-muted-foreground italic px-1">
                No database table operations configured. Click "+ Add Table Ref"
                to link database access.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Auto-Generated Infrastructure Code Executions Preview */}
      {(crudConfig.some((c) => c.tableNodeId && c.operations.length > 0) ||
        (publishedEvents && publishedEvents.length > 0)) && (
        <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Auto-Generated Code Executions
              </span>
            </div>
            <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
              Compiler Output Preview
            </span>
          </div>

          <div className="flex flex-col gap-2.5 bg-background/90 p-3 rounded-lg border border-border/60 font-mono text-[11px] leading-relaxed shadow-inner">
            {/* Database Prepared Statements Preview */}
            {crudConfig.map((configItem, idx) => {
              if (
                !configItem.tableNodeId ||
                configItem.operations.length === 0
              )
                return null;

              const tableObj = availableTableNodes.find(
                (t) => t.id === configItem.tableNodeId,
              );
              const rawLabel = tableObj?.label || "table";
              const tableName = rawLabel
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_");
              const Pascal = toPascalCase(tableName);
              const varName = toVarName(tableName);

              return (
                <div
                  key={`${configItem.tableNodeId}_${idx}`}
                  className="flex flex-col gap-1.5 pb-2 border-b border-border/30 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                    <Database className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>import &#123; ... &#125; from "@workspace/db/helpers/{varName}"</span>
                  </div>

                  {configItem.operations.map((op) => {
                    let snippet = "";
                    if (op === "create") snippet = `create${Pascal}(body);`;
                    else if (op === "read")
                      snippet = `const result = findAll${Pascal}();`;
                    else if (op === "update")
                      snippet = `update${Pascal}(req.params.id, body);`;
                    else if (op === "delete")
                      snippet = `delete${Pascal}ById(req.params.id);`;

                    return (
                      <div
                        key={op}
                        className="flex items-center gap-2 pl-2 border-l-2 border-blue-500/40 text-foreground"
                      >
                        <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                          {op}
                        </span>
                        <code className="text-blue-600 dark:text-blue-300 font-semibold">
                          {snippet}
                        </code>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Kafka Event Publisher Preview */}
            {publishedEvents && publishedEvents.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30 first:border-0 first:pt-0">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                  <Radio className="w-3 h-3 text-purple-500 shrink-0" />
                  <span>import &#123; publishKafkaEvent, KAFKA_TOPICS &#125; from "@workspace/messaging/publishers"</span>
                </div>
                {publishedEvents.map((ev, idx) => {
                  const eventName = ev.name || ev.topic || "EVENT";
                  const topicKey = toTopicKey(eventName);
                  return (
                    <div
                      key={ev.id || idx}
                      className="flex items-center gap-2 pl-2 border-l-2 border-purple-500/40 text-foreground"
                    >
                      <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                        PUB
                      </span>
                      <code className="text-purple-600 dark:text-purple-300 font-semibold">
                        await publishKafkaEvent(KAFKA_TOPICS.{topicKey}, &#123; action: "{endpointMethod.toLowerCase()}", payload: body &#125;);
                      </code>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


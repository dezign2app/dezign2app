import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
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
import type { MiddlewareNode, LangGraphCanvasNode } from "@workspace/canvas";
import {
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  HANDLE_MIDDLEWARE_OUT,
  MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP,
  MIDDLEWARE_TYPE_RATE_LIMIT,
  MIDDLEWARE_TYPE_LOGGING_TRACING,
  MIDDLEWARE_TYPE_SUMMARIZATION,
  MIDDLEWARE_TYPE_MODEL_CALL_LIMIT,
  MIDDLEWARE_TYPE_TOOL_CALL_LIMIT,
  MIDDLEWARE_TYPE_MODEL_FALLBACK,
  MIDDLEWARE_TYPE_PII_DETECTION,
  MIDDLEWARE_TYPE_TODO_LIST,
  MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR,
  MIDDLEWARE_TYPE_TOOL_RETRY,
  MIDDLEWARE_TYPE_MODEL_RETRY,
  MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR,
  MIDDLEWARE_TYPE_CONTEXT_EDITING,
  MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH,
  MIDDLEWARE_TYPE_FILESYSTEM,
  MIDDLEWARE_TYPE_SUBAGENT,
  MIDDLEWARE_TYPE_CUSTOM,
} from "../constants";
import { LocalInput } from "../../../common";

export const LangGraphCanvasMiddlewareNode = ({
  id,
  data,
  selected,
}: NodeProps<MiddlewareNode>) => {
  const { setNodes } = useReactFlow<LangGraphCanvasNode>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name || "Middleware");

  useEffect(() => {
    setNameValue(data.name || "Middleware");
  }, [data.name]);

  const updateMiddlewareData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id && n.type === LANGGRAPH_CANVAS_NODE_MIDDLEWARE
          ? { ...n, data: { ...n.data, ...changes } }
          : n,
      ),
    );
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    let trimmed = nameValue.trim();
    if (!trimmed) trimmed = "Middleware";
    setNameValue(trimmed);
    if (trimmed !== data.name) {
      updateMiddlewareData({ name: trimmed });
    }
  };

  const getTypeIcon = () => {
    switch (data.type) {
      case MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP:
        return <UserCheck className="w-3.5 h-3.5 text-purple-400" />;
      case MIDDLEWARE_TYPE_RATE_LIMIT:
        return <Gauge className="w-3.5 h-3.5 text-amber-400" />;
      case MIDDLEWARE_TYPE_LOGGING_TRACING:
        return <Activity className="w-3.5 h-3.5 text-sky-400" />;
      case MIDDLEWARE_TYPE_SUMMARIZATION:
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case MIDDLEWARE_TYPE_MODEL_CALL_LIMIT:
        return <Cpu className="w-3.5 h-3.5 text-rose-400" />;
      case MIDDLEWARE_TYPE_TOOL_CALL_LIMIT:
        return <Wrench className="w-3.5 h-3.5 text-orange-400" />;
      case MIDDLEWARE_TYPE_MODEL_FALLBACK:
        return <GitFork className="w-3.5 h-3.5 text-blue-400" />;
      case MIDDLEWARE_TYPE_PII_DETECTION:
        return <Lock className="w-3.5 h-3.5 text-red-400" />;
      case MIDDLEWARE_TYPE_TODO_LIST:
        return <ListTodo className="w-3.5 h-3.5 text-teal-400" />;
      case MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR:
        return <Filter className="w-3.5 h-3.5 text-indigo-400" />;
      case MIDDLEWARE_TYPE_TOOL_RETRY:
        return <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />;
      case MIDDLEWARE_TYPE_MODEL_RETRY:
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
      case MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR:
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      case MIDDLEWARE_TYPE_CONTEXT_EDITING:
        return <Scissors className="w-3.5 h-3.5 text-pink-400" />;
      case MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH:
        return <Search className="w-3.5 h-3.5 text-violet-400" />;
      case MIDDLEWARE_TYPE_FILESYSTEM:
        return <FolderGit2 className="w-3.5 h-3.5 text-fuchsia-400" />;
      case MIDDLEWARE_TYPE_SUBAGENT:
        return <Users className="w-3.5 h-3.5 text-emerald-500" />;
      case MIDDLEWARE_TYPE_CUSTOM:
      default:
        return <Code2 className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (data.type) {
      case MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP:
        return "Human in the Loop";
      case MIDDLEWARE_TYPE_RATE_LIMIT:
        return "Rate Limiter";
      case MIDDLEWARE_TYPE_LOGGING_TRACING:
        return "Logging & Tracing";
      case MIDDLEWARE_TYPE_SUMMARIZATION:
        return "Summarization";
      case MIDDLEWARE_TYPE_MODEL_CALL_LIMIT:
        return "Model Call Limit";
      case MIDDLEWARE_TYPE_TOOL_CALL_LIMIT:
        return "Tool Call Limit";
      case MIDDLEWARE_TYPE_MODEL_FALLBACK:
        return "Model Fallback";
      case MIDDLEWARE_TYPE_PII_DETECTION:
        return "PII Detection";
      case MIDDLEWARE_TYPE_TODO_LIST:
        return "To-do List";
      case MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR:
        return "LLM Tool Selector";
      case MIDDLEWARE_TYPE_TOOL_RETRY:
        return "Tool Retry";
      case MIDDLEWARE_TYPE_MODEL_RETRY:
        return "Model Retry";
      case MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR:
        return "LLM Tool Emulator";
      case MIDDLEWARE_TYPE_CONTEXT_EDITING:
        return "Context Editing";
      case MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH:
        return "Provider Tool Search";
      case MIDDLEWARE_TYPE_FILESYSTEM:
        return "Filesystem Memory";
      case MIDDLEWARE_TYPE_SUBAGENT:
        return "Subagent Middleware";
      case MIDDLEWARE_TYPE_CUSTOM:
      default:
        return "Custom Middleware";
    }
  };

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[240px] max-w-[320px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10"
          : "border-border hover:border-purple-500/40 hover:shadow-purple-500/5"
      }`}
    >
      {/* Outbound Middleware handle connecting to Agent */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={HANDLE_MIDDLEWARE_OUT}
        style={{ left: "50%" }}
        className="!bg-purple-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-bottom-[7px]"
        title="Connect to Agent Node (middleware_in)"
      />
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-500 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {isEditingName ? (
              <div
                className="nodrag"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <LocalInput
                  autoFocus
                  className="h-6 text-xs bg-background p-1 font-bold font-mono text-purple-500 flex-1 nodrag"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setNameValue(data.name || "Middleware");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <span
                className="font-bold text-sm text-foreground truncate max-w-[130px] font-mono cursor-pointer hover:text-purple-500 transition-colors nodrag flex items-center gap-1 group/title"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                title="Click to edit middleware name"
              >
                {data.name || "Middleware"}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              {getTypeIcon()}
              {getTypeLabel()}
            </span>
          </div>
        </div>

        {data.onDeleteMiddleware && (
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 nodrag"
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteMiddleware?.();
            }}
            title="Delete Middleware"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 text-xs">
        {data.type === "human_in_the_loop" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>Approval Interceptor</span>
            {data.humanInTheLoopConfig?.requiredRole && (
              <span className="text-[10px] text-muted-foreground">
                Role: {data.humanInTheLoopConfig.requiredRole}
              </span>
            )}
          </div>
        )}

        {data.type === "rate_limit" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>Rate Limit</span>
            <span className="font-bold">
              {data.rateLimitConfig?.requestsPerMinute || 60} req/min
            </span>
          </div>
        )}

        {data.type === "logging_tracing" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>Tracing Level</span>
            <span className="uppercase font-bold">
              {data.loggingConfig?.logLevel || "info"}
            </span>
          </div>
        )}

        {data.type === "summarization" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-emerald-500 font-bold">
              Auto Summarization
            </span>
            <span className="text-[10px] text-muted-foreground">
              Model: {data.summarizationConfig?.model || "gpt-5.4-mini"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Keep: {data.summarizationConfig?.keepMessages ?? 20} msgs
            </span>
          </div>
        )}

        {data.type === "model_call_limit" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>Model Limit</span>
            <span className="font-bold">
              {data.modelCallLimitConfig?.runLimit ?? 5} / run
            </span>
          </div>
        )}

        {data.type === "tool_call_limit" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>
              Tool Limit: {data.toolCallLimitConfig?.toolName || "All Tools"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Max {data.toolCallLimitConfig?.runLimit ?? 10} calls/run
            </span>
          </div>
        )}

        {data.type === "model_fallback" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-blue-400 font-bold">Fallback Models</span>
            <span className="text-[10px] text-muted-foreground truncate">
              {data.modelFallbackConfig?.fallbackModels?.join(", ") ||
                "gpt-5.4-mini, claude-3-5-sonnet"}
            </span>
          </div>
        )}

        {data.type === "pii_detection" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="capitalize">
              PII: {data.piiConfig?.piiType || "email"}
            </span>
            <span className="uppercase text-[10px] px-1 bg-red-500/20 text-red-400 rounded font-bold">
              {data.piiConfig?.strategy || "redact"}
            </span>
          </div>
        )}

        {data.type === "todo_list" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-teal-400 font-bold">Task Planning</span>
            <span className="text-[10px] text-muted-foreground">
              write_todos tool
            </span>
          </div>
        )}

        {data.type === "llm_tool_selector" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-indigo-400 font-bold">LLM Tool Selector</span>
            <span className="text-[10px] text-muted-foreground">
              Max tools: {data.llmToolSelectorConfig?.maxTools ?? 3}
            </span>
          </div>
        )}

        {data.type === "tool_retry" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>Tool Retry</span>
            <span className="font-bold text-yellow-500">
              {data.toolRetryConfig?.maxRetries ?? 3} retries
            </span>
          </div>
        )}

        {data.type === "model_retry" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>Model Retry</span>
            <span className="font-bold text-amber-500">
              {data.modelRetryConfig?.maxRetries ?? 3} retries
            </span>
          </div>
        )}

        {data.type === "llm_tool_emulator" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-cyan-400 font-bold">Tool Emulator</span>
            <span className="text-[10px] text-muted-foreground">
              AI response
            </span>
          </div>
        )}

        {data.type === "context_editing" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span>Context Clear</span>
            <span className="text-[10px] text-muted-foreground">
              Keep recent {data.contextEditingConfig?.keep ?? 3}
            </span>
          </div>
        )}

        {data.type === "provider_tool_search" && (
          <div className="flex items-center justify-between text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-violet-400 font-bold">Tool Search</span>
            <span className="text-[10px] text-muted-foreground">
              Server-side
            </span>
          </div>
        )}

        {data.type === "filesystem" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-fuchsia-400 font-bold">
              Filesystem Memory
            </span>
            <span className="text-[10px] text-muted-foreground">
              Mode: {data.filesystemConfig?.backend || "composite"}
            </span>
          </div>
        )}

        {data.type === "subagent" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-emerald-500 font-bold">Subagent Router</span>
            <span className="text-[10px] text-muted-foreground">
              Task isolation
            </span>
          </div>
        )}

        {data.type === "custom" && (
          <div className="flex flex-col gap-1 text-[11px] text-foreground bg-secondary/20 p-2 rounded border border-border/50 font-mono">
            <span className="text-indigo-400 font-bold">Custom JS</span>
            <span className="text-[10px] text-muted-foreground">
              User logic
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

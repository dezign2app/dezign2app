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
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { MiddlewareNodeData } from "../../../types";
import { DEFAULT_MIDDLEWARE_TYPE } from "../../../constants";
import { LocalInput } from "../../../../shared";

interface GeneralMiddlewareConfigProps {
  selectedMiddlewareData: MiddlewareNodeData;
  onDeleteMiddleware: () => void;
  onUpdateMiddleware: (changes: Partial<MiddlewareNodeData>) => void;
}

export function GeneralMiddlewareConfig({
  selectedMiddlewareData,
  onDeleteMiddleware,
  onUpdateMiddleware,
}: GeneralMiddlewareConfigProps) {
  const currentType = selectedMiddlewareData.type || DEFAULT_MIDDLEWARE_TYPE;

  const handleNameChange = (val: string) => {
    onUpdateMiddleware({ name: val });
  };

  return (
    <>
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

      {/* ─── General Config ────────────────────────────────────────────── */}
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
    </>
  );
}

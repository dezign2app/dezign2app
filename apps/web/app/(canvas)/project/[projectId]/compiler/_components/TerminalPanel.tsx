"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Trash2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Resizable } from "re-resizable";

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "system";
  text: string;
}

interface TerminalPanelProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function TerminalPanel({
  logs,
  onClearLogs,
  isOpen,
  onToggleOpen,
}: TerminalPanelProps) {
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  const handleCopyLogs = () => {
    const content = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`)
      .join("\n");
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <div className="h-7 bg-[#161b22] border-t border-border/40 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
        <div
          onClick={onToggleOpen}
          className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span>Terminal Output ({logs.length} logs)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleOpen}
          className="h-5 px-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Resizable
      defaultSize={{ width: "100%", height: 210 }}
      minHeight={80}
      maxHeight={500}
      enable={{ top: true }}
      handleClasses={{
        top: "h-1.5 bg-border/40 hover:bg-primary/60 cursor-row-resize transition-colors z-20",
      }}
      className="border-t border-border/50 flex flex-col shrink-0 font-mono text-xs text-slate-200 select-none bg-[#0a0d12] relative"
    >
      {/* Header */}
      <div className="h-7 bg-[#161b22] px-3 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
            Terminal / Console Log
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
            Local Dev Server
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLogs}
            className="h-5 px-1.5 text-[10px] gap-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearLogs}
            className="h-5 px-1.5 text-[10px] gap-1 text-slate-400 hover:text-red-400 hover:bg-slate-800"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleOpen}
            className="h-5 px-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Log Output Body */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text">
        {logs.length === 0 ? (
          <div className="text-slate-500 italic py-2">
            Terminal idle. Click "Run Localhost" to simulate dev server startup logs.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0 select-none">
                [{log.timestamp}]
              </span>
              <span
                className={`font-semibold shrink-0 select-none uppercase text-[10px] px-1 rounded ${
                  log.type === "error"
                    ? "bg-red-500/20 text-red-400"
                    : log.type === "warning"
                      ? "bg-amber-500/20 text-amber-400"
                      : log.type === "success"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : log.type === "system"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {log.type}
              </span>
              <span
                className={
                  log.type === "error"
                    ? "text-red-300"
                    : log.type === "warning"
                      ? "text-amber-300"
                      : log.type === "success"
                        ? "text-emerald-300"
                        : log.type === "system"
                          ? "text-purple-300"
                          : "text-slate-200"
                }
              >
                {log.text}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </Resizable>
  );
}

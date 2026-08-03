"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Copy, Check, Download, FileCode, Lock } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { CompiledFile } from "@/lib/compiler";
import { getLanguageFromFilename } from "../_lib/editorUtils";

export interface MonacoEditorPaneProps {
  activeFile: CompiledFile | undefined;
  onMount: (editor: any, monaco: any) => void;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}

/**
 * The center Monaco editor panel of the Compiler IDE.
 * Displays file header (name, lock badge, copy/download buttons)
 * and the Monaco editor itself.
 */
export function MonacoEditorPane({
  activeFile,
  onMount,
  onCopy,
  onDownload,
  copied,
}: MonacoEditorPaneProps) {

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border/40 text-xs font-mono select-none">
        <div className="flex items-center gap-2 text-slate-300 truncate">
          <FileCode className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate font-semibold">{activeFile?.filename}</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700 font-mono flex items-center gap-1 shrink-0">
            <Lock className="w-3 h-3 text-slate-400" /> Read-Only · Edit via System Design
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-7 px-2 text-xs gap-1.5 text-slate-300 hover:text-white"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="h-7 px-2 text-xs gap-1.5 text-slate-300 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-0 relative">
        {activeFile ? (
          <Editor
            height="100%"
            path={activeFile.filename}
            defaultLanguage={getLanguageFromFilename(activeFile.filename)}
            language={getLanguageFromFilename(activeFile.filename)}
            defaultValue={activeFile.content}
            theme="vs-dark"
            onMount={onMount}
            options={{
              fontSize: 13,
              fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              lineNumbers: "on",
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              readOnly: true,
              readOnlyMessage: { value: "Edit via the System Design canvas" },
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

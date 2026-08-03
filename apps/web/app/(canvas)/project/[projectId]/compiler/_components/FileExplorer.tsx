"use client";

import React from "react";
import { Resizable } from "re-resizable";
import { FileTreeItem, FileTreeNode } from "../../_components/compiler";

export interface FileExplorerProps {
  fileCount: number;
  fileTree: FileTreeNode[];
  activePath: string;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onSelectFile: (filename: string) => void;
}

/**
 * VS Code-style resizable file explorer sidebar for the Compiler IDE.
 */
export function FileExplorer({
  fileCount,
  fileTree,
  activePath,
  expandedPaths,
  onToggleExpand,
  onSelectFile,
}: FileExplorerProps) {
  return (
    <Resizable
      defaultSize={{ width: 250, height: "100%" }}
      minWidth={180}
      maxWidth={500}
      enable={{ right: true }}
      handleClasses={{
        right:
          "w-1.5 bg-border/40 hover:bg-primary/60 cursor-col-resize transition-colors z-20",
      }}
      className="bg-[#161b22]/60 border-r border-border/40 flex flex-col shrink-0 select-none relative"
    >
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase border-b border-border/40 flex items-center justify-between shrink-0">
        <span>Explorer</span>
        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">
          {fileCount} files
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0">
        {fileTree.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            activePath={activePath}
            expandedPaths={expandedPaths}
            onToggleExpand={onToggleExpand}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </Resizable>
  );
}

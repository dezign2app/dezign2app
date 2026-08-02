import React from "react";
import { CompiledFile } from "@/lib/compiler";
import {
  FileCode,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";

export interface FileTreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileTreeNode[];
}

export function buildFileTree(files: CompiledFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  files.forEach((f) => {
    const parts = f.filename.split("/");
    let current = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const currentPath = parts.slice(0, idx + 1).join("/");
      let node = current.find((n) => n.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          children: isLast ? undefined : [],
        };
        current.push(node);
      }

      if (!isLast && node.children) {
        current = node.children;
      }
    });
  });

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.children) sortNodes(n.children);
    });
  };

  sortNodes(root);
  return root;
}

export function getParentPaths(filePath: string): string[] {
  const parts = filePath.split("/");
  const parents: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join("/"));
  }
  return parents;
}

export interface FileTreeItemProps {
  node: FileTreeNode;
  depth?: number;
  activePath: string;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onSelectFile: (path: string) => void;
}

export function FileTreeItem({
  node,
  depth = 0,
  activePath,
  expandedPaths,
  onToggleExpand,
  onSelectFile,
}: FileTreeItemProps) {
  const isExpanded = expandedPaths.has(node.path);
  const isActive = activePath === node.path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isFolder) {
      onToggleExpand(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  const getFileIcon = (name: string) => {
    if (name === "package.json")
      return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (name.endsWith(".ts") || name.endsWith(".tsx"))
      return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    if (name.endsWith(".json") || name.endsWith(".yaml"))
      return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (name.endsWith(".md"))
      return <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    return <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`flex items-center gap-1.5 py-1 px-2 text-xs font-mono rounded cursor-pointer transition-colors ${
          isActive
            ? "bg-primary/20 text-primary font-medium border-l-2 border-primary"
            : "hover:bg-accent/40 text-muted-foreground hover:text-foreground"
        }`}
      >
        {node.isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {node.isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface FileTreeExplorerProps {
  fileTree: FileTreeNode[];
  activeFilename: string;
  expandedPaths: Set<string>;
  totalFiles: number;
  onToggleExpand: (path: string) => void;
  onSelectFile: (path: string) => void;
  className?: string;
}

export function FileTreeExplorer({
  fileTree,
  activeFilename,
  expandedPaths,
  totalFiles,
  onToggleExpand,
  onSelectFile,
  className = "",
}: FileTreeExplorerProps) {
  return (
    <div className={`w-64 bg-muted/20 border-r border-border/60 flex flex-col shrink-0 select-none ${className}`}>
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase border-b border-border/40 flex items-center justify-between shrink-0">
        <span>Explorer</span>
        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
          {totalFiles} files
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0">
        {fileTree.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            activePath={activeFilename}
            expandedPaths={expandedPaths}
            onToggleExpand={onToggleExpand}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import {
  compileMonorepo,
  CompiledMonorepoResult,
  CompiledFile,
} from "@/lib/compiler";
import {
  Copy,
  Check,
  Download,
  Server,
  FileCode,
  Cpu,
  ExternalLink,
  Code,
  Archive,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { toast } from "sonner";
import sdk from "@stackblitz/sdk";

interface CompilerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  projectId?: string;
  overrideFiles?: CompiledFile[];
  overrideTitle?: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileTreeNode[];
}

function buildFileTree(files: CompiledFile[]): FileTreeNode[] {
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

function getParentPaths(filePath: string): string[] {
  const parts = filePath.split("/");
  const parents: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join("/"));
  }
  return parents;
}

function FileTreeItem({
  node,
  depth = 0,
  activePath,
  expandedPaths,
  onToggleExpand,
  onSelectFile,
}: {
  node: FileTreeNode;
  depth?: number;
  activePath: string;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onSelectFile: (path: string) => void;
}) {
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
    if (name === "package.json") return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    if (name.endsWith(".json") || name.endsWith(".yaml")) return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (name.endsWith(".md")) return <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
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

export function CompilerModal({ open, onOpenChange, projectName, projectId, overrideFiles, overrideTitle }: CompilerModalProps) {
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const events = useBackendCanvasStore((s) => s.events);
  const edges = useBackendCanvasStore((s) => s.edges);
  const testCases = useSimulationStore((s) => s.testCases);

  const serviceNodes = nodes.filter((n) => n.type === "service");
  const entityNodes = nodes.filter((n) => n.type === "entity" || n.type === "db_ref");

  const [selectedFilename, setSelectedFilename] = useState<string>("README.md");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

  const formattedProjectName = useMemo(() => {
    const raw = (projectName || "Blueprint").trim();
    if (raw.toLowerCase().endsWith("monorepo")) {
      return raw;
    }
    return `${raw} Monorepo`;
  }, [projectName]);

  const monorepoResult: CompiledMonorepoResult = useMemo(
    () =>
      compileMonorepo(
        nodes,
        endpoints,
        events,
        edges,
        testCases,
        formattedProjectName
      ),
    [nodes, endpoints, events, edges, testCases, formattedProjectName]
  );

  const files = overrideFiles || monorepoResult.files;
  const displayTitle = overrideTitle || (overrideFiles ? (projectName || "Compiled Code Workspace") : "Monorepo Compiler Engine");

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // Restore last opened file and expanded folder structure when modal opens
  React.useEffect(() => {
    if (!open) return;
    const storageKey = projectId ? `compiler_modal_state_${projectId}` : "compiler_modal_state";
    let restoredFile: string | null = null;
    let restoredExpanded: string[] = [];

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedFilename && typeof parsed.selectedFilename === "string") {
          restoredFile = parsed.selectedFilename;
        }
        if (Array.isArray(parsed.expandedPaths)) {
          restoredExpanded = parsed.expandedPaths;
        }
      }
    } catch (e) {
      console.error("Failed to restore compiler modal state", e);
    }

    const fileExists = restoredFile && files.some((f) => f.filename === restoredFile);
    let targetFile = fileExists ? restoredFile! : "";

    if (!targetFile) {
      const readme = files.find((f) => f.filename.toLowerCase() === "readme.md");
      targetFile = readme ? readme.filename : files[0]?.filename || "README.md";
    }

    setSelectedFilename(targetFile);

    const parents = getParentPaths(targetFile);
    const newExpandedSet = new Set<string>([...restoredExpanded, ...parents]);
    setExpandedPaths(newExpandedSet);
  }, [open, projectId, files]);

  const handleSelectFile = (filename: string) => {
    setSelectedFilename(filename);
    const parents = getParentPaths(filename);
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      parents.forEach((p) => next.add(p));
      try {
        const storageKey = projectId ? `compiler_modal_state_${projectId}` : "compiler_modal_state";
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            selectedFilename: filename,
            expandedPaths: Array.from(next),
          })
        );
      } catch (e) {
        console.error("Failed to save compiler modal state", e);
      }
      return next;
    });
  };

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      try {
        const storageKey = projectId ? `compiler_modal_state_${projectId}` : "compiler_modal_state";
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            selectedFilename,
            expandedPaths: Array.from(next),
          })
        );
      } catch (e) {
        console.error("Failed to save compiler modal state", e);
      }
      return next;
    });
  };

  const activeFile = files.find((f) => f.filename === selectedFilename) || files[0];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    toast.success(`Copied ${activeFile.filename} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.filename.split("/").pop() || activeFile.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${activeFile.filename}`);
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    setDownloadingZip(true);
    toast.info("Compressing project into ZIP...");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      files.forEach((file) => {
        zip.file(file.filename, file.content);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const zipName = `${displayTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.zip`;
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${zipName}!`);
    } catch (err) {
      console.error("Failed to generate ZIP archive:", err);
      toast.error("Failed to generate ZIP archive");
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleRunInCloud = () => {
    if (files.length === 0) return;

    const fileMap: Record<string, string> = {};
    files.forEach((f) => {
      fileMap[f.filename] = f.content;
    });

    const defaultOpenFile =
      files.find((f) => f.filename.endsWith("index.ts") || f.filename.endsWith("index.js"))?.filename ||
      files[0]?.filename ||
      "README.md";

    sdk.openProject(
      {
        title: displayTitle,
        description: `Generated project workspace`,
        template: "node",
        files: fileMap,
        settings: {
          compile: {
            trigger: "auto",
            clearConsole: false,
          },
        },
      },
      {
        newWindow: true,
        openFile: defaultOpenFile,
      }
    );
    toast.success(`Opening project workspace live in StackBlitz Cloud IDE!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 pt-4 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  {displayTitle}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 text-orange-500">
                  NOTICE: 🚧 Automated AI Business logic implementation,Testing & Deployment is under construction🚧
                  <span className="block text-yellow-500"> Now download the repo and continue with your AI Coding Agents..!</span>
                </DialogDescription>
              </div>
            </div>

            {files.length > 0 && (
              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadZip} disabled={downloadingZip} variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Archive className="w-4 h-4 text-primary" />
                  {downloadingZip ? "Zipping..." : "Download ZIP"}
                </Button>
                <Button onClick={handleRunInCloud} size="sm" className="gap-1.5 text-xs">
                  <Code className="w-4 h-4" />
                  Open IDE
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {files.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Server className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No Nodes Found</p>
            <p className="text-xs text-muted-foreground/70 max-w-sm">
              Add Service, Database Entity, or LangGraph nodes on the canvas to generate backend code templates.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* VS Code Style File Explorer Sidebar */}
            <div className="w-64 bg-muted/20 border-r border-border/60 flex flex-col shrink-0 select-none">
              <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase border-b border-border/40 flex items-center justify-between">
                <span>Explorer</span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                  {monorepoResult.files.length} files
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                {fileTree.map((node) => (
                  <FileTreeItem
                    key={node.path}
                    node={node}
                    activePath={activeFile?.filename || ""}
                    expandedPaths={expandedPaths}
                    onToggleExpand={handleToggleExpand}
                    onSelectFile={handleSelectFile}
                  />
                ))}
              </div>
            </div>

            {/* Code Editor View */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
              {/* File Header Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border/40 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300 truncate">
                  <FileCode className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{activeFile?.filename}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs gap-1.5 text-slate-300 hover:text-white">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 px-2 text-xs gap-1.5 text-slate-300 hover:text-white">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Code Pre Box */}
              <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-200">
                {activeFile ? (
                  <pre className="whitespace-pre">
                    <code>{activeFile.content}</code>
                  </pre>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



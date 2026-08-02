"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import {
  compileMonorepo,
  CompiledMonorepoResult,
  CompiledFile,
} from "@/lib/compiler";
import {
  Copy,
  Check,
  Download,
  FileCode,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import sdk from "@stackblitz/sdk";
import Editor from "@monaco-editor/react";
import { IdeToolbar } from "./_components/IdeToolbar";
import { TerminalPanel, TerminalLog } from "./_components/TerminalPanel";
import { AiChatPanel } from "./_components/AiChatPanel";
import { Resizable } from "re-resizable";

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

function getLanguageFromFilename(filename: string): string {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) return "yaml";
  if (filename.endsWith(".md")) return "markdown";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".py")) return "python";
  if (filename.endsWith(".sh")) return "shell";
  return "plaintext";
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

export default function CompilerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);

  // Store state
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const events = useBackendCanvasStore((s) => s.events);
  const edges = useBackendCanvasStore((s) => s.edges);
  const updateEndpoint = useBackendCanvasStore((s) => s.updateEndpoint);
  const testCases = useSimulationStore((s) => s.testCases);

  // Convex project query
  const project = useQuery(api.projects.getProjectById, {
    projectId: projectId as Id<"projects">,
  });

  const projectName = project?.name || "Blueprint";

  const formattedProjectName = useMemo(() => {
    const raw = projectName.trim();
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
        formattedProjectName,
      ),
    [nodes, endpoints, events, edges, testCases, formattedProjectName],
  );

  const files = monorepoResult.files;
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  const [selectedFilename, setSelectedFilename] = useState<string>("README.md");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

  // IDE Shell panels state
  const [aiChatOpen, setAiChatOpen] = useState<boolean>(false);
  const [terminalOpen, setTerminalOpen] = useState<boolean>(true);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: "1",
      timestamp: new Date().toLocaleTimeString(),
      type: "system",
      text: "Compiler Engine initialized successfully.",
    },
    {
      id: "2",
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      text: `Monorepo workspace parsed: ${files.length} compiled files generated.`,
    },
  ]);

  // Restore file selection state from local storage
  useEffect(() => {
    const storageKey = `compiler_page_state_${projectId}`;
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
      console.error("Failed to restore compiler page state", e);
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
  }, [projectId, files]);

  const handleSelectFile = (filename: string) => {
    setSelectedFilename(filename);
    const parents = getParentPaths(filename);
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      parents.forEach((p) => next.add(p));
      try {
        const storageKey = `compiler_page_state_${projectId}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            selectedFilename: filename,
            expandedPaths: Array.from(next),
          }),
        );
      } catch (e) {
        console.error("Failed to save compiler page state", e);
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
        const storageKey = `compiler_page_state_${projectId}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            selectedFilename,
            expandedPaths: Array.from(next),
          }),
        );
      } catch (e) {
        console.error("Failed to save compiler page state", e);
      }
      return next;
    });
  };

  const activeFile = files.find((f) => f.filename === selectedFilename) || files[0];

  // Handle Monaco code edit
  const handleEditorChange = (newContent: string | undefined) => {
    if (newContent === undefined || !activeFile) return;

    // Find if this file corresponds to an endpoint or service node logic
    const activeFn = activeFile.filename;

    // Search endpoints for a match by filename or endpoint name
    const matchedEndpoint = endpoints.find((ep) => {
      const nameSanitized = (ep.name || ep.id).toLowerCase().replace(/[^a-z0-9]/g, "");
      const fnSanitized = activeFn.toLowerCase().replace(/[^a-z0-9]/g, "");
      return nameSanitized && fnSanitized.includes(nameSanitized);
    });

    if (matchedEndpoint) {
      updateEndpoint(matchedEndpoint.id, {
        body: newContent,
        code: newContent,
      });
      setTerminalLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          text: `Updated function logic for endpoint [${matchedEndpoint.name}] (${matchedEndpoint.id})`,
        },
      ]);
    }
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    toast.success(`Copied ${activeFile.filename} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], {
      type: "text/plain;charset=utf-8",
    });
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
      const zipName = `${formattedProjectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.zip`;
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
      files.find((f) => f.filename.endsWith("index.ts") || f.filename.endsWith("index.js"))
        ?.filename ||
      files[0]?.filename ||
      "README.md";

    sdk.openProject(
      {
        title: formattedProjectName,
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
      },
    );
    toast.success(`Opening project workspace live in StackBlitz Cloud IDE!`);
  };

  const handleRunLocalhost = () => {
    setTerminalOpen(true);
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: "info",
        text: "Starting local development server on http://localhost:8080...",
      },
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: "success",
        text: "⚡ Localhost server listening & watching for endpoint logic changes.",
      },
    ]);
    toast.success("Simulated local server running! Check terminal output.");
  };

  if (project === undefined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d1117]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117]">
      {/* IDE Top Toolbar */}
      <IdeToolbar
        projectName={projectName}
        projectId={projectId}
        displayTitle={formattedProjectName}
        downloadingZip={downloadingZip}
        onDownloadZip={handleDownloadZip}
        onRunInCloud={handleRunInCloud}
        onRunLocalhost={handleRunLocalhost}
        aiChatOpen={aiChatOpen}
        onToggleAiChat={() => setAiChatOpen(!aiChatOpen)}
        terminalOpen={terminalOpen}
        onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
      />

      {/* Main IDE Workspace (File Explorer + Monaco Editor + Terminal + AI Chat) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* VS Code Style File Explorer Sidebar (Resizable) */}
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
              {files.length} files
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0">
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
        </Resizable>

        {/* Center Panel (Monaco Editor + Terminal Panel) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
          {/* File Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border/40 text-xs font-mono select-none">
            <div className="flex items-center gap-2 text-slate-300 truncate">
              <FileCode className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{activeFile?.filename}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
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
                onClick={handleDownload}
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
                value={activeFile.content}
                theme="vs-dark"
                onChange={handleEditorChange}
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
                }}
              />
            ) : null}
          </div>

          {/* Collapsible Terminal Panel at Bottom of Center */}
          <TerminalPanel
            logs={terminalLogs}
            onClearLogs={() => setTerminalLogs([])}
            isOpen={terminalOpen}
            onToggleOpen={() => setTerminalOpen(!terminalOpen)}
          />
        </div>

        {/* Right-side AI Chat Agent Panel */}
        <AiChatPanel
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          activeFile={activeFile}
          onApplyCode={(suggestedCode) => {
            handleEditorChange(suggestedCode);
            toast.success("Applied code to function body & updated canvas!");
          }}
        />
      </div>
    </div>
  );
}

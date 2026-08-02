"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id, Doc } from "@workspace/backend/_generated/dataModel";
import {
  useBackendCanvasStore,
  parseResourceHandle,
} from "@/lib/stores/backendCanvasStore";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import {
  endpointSchema,
  publishedEventSchema,
  consumedEventSchema,
  identityProviderSchema,
} from "@workspace/canvas/schemas";
import { z } from "zod";
import {
  BackendNode,
  BackendEdge,
} from "@/types/canvas";
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
import { AiChatPanel } from "./_components/AiChatPanel";
import { Resizable } from "re-resizable";
import {
  FileTreeNode,
  buildFileTree,
  getParentPaths,
  FileTreeItem,
} from "../_components/compiler";

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

export default function CompilerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);

  // Store state
  const storeProjectId = useBackendCanvasStore((s) => s.projectId);
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const events = useBackendCanvasStore((s) => s.events);
  const edges = useBackendCanvasStore((s) => s.edges);
  const updateEndpoint = useBackendCanvasStore((s) => s.updateEndpoint);
  const testCases = useSimulationStore((s) => s.testCases);

  // Convex queries
  const project = useQuery(api.projects.getProjectById, {
    projectId: projectId as Id<"projects">,
  });

  // Query canvas elements — needed to hydrate the store when the compiler
  // page is opened via direct URL or hard refresh (useBackendSync only runs
  // on the canvas page, so the Zustand store can be empty here).
  const canvasElements = useQuery(api.canvas.getBackendElements, {
    projectId: projectId as Id<"projects">,
  });

  // Hydrate the store from Convex if it hasn't been populated for this project
  useEffect(() => {
    if (canvasElements === undefined) return; // still loading
    if (storeProjectId === projectId) return;  // already hydrated for this project

    const rawNodes: BackendNode[] = (canvasElements.nodes ?? []).map(
      (row: Doc<"canvas_backend_nodes">) => {
        const pos = row.data?.position ?? row.position;
        return {
          id: row.nodeId,
          type: row.type as BackendNode["type"],
          position: pos,
          data: { ...row.data, position: pos },
          fractionalIndex: row.fractionalIndex,
          parentId: row.data?.parentId,
        } as BackendNode;
      }
    );

    const rawEdges: BackendEdge[] = (canvasElements.edges ?? []).map(
      (row: Doc<"canvas_backend_edges">) => {
        const src = parseResourceHandle(row.sourceHandle);
        const tgt = parseResourceHandle(row.targetHandle);
        return {
          id: row.edgeId,
          source: row.source,
          target: row.target,
          type: row.type as BackendEdge["type"],
          sourceHandle: row.sourceHandle ?? undefined,
          targetHandle: row.targetHandle ?? undefined,
          sourceResourceId: src?.resourceId,
          targetResourceId: tgt?.resourceId,
          resourceType: tgt?.resourceType ?? src?.resourceType,
          data: row.data,
          fractionalIndex: row.fractionalIndex,
        };
      }
    );

    const fullEndpointSchema = endpointSchema.extend({ nodeId: z.string() });
    const fullEventSchema = z.union([
      publishedEventSchema.extend({ nodeId: z.string(), variant: z.literal("publish") }),
      consumedEventSchema.extend({ nodeId: z.string(), variant: z.literal("consume") }),
    ]);
    const fullIdpSchema = identityProviderSchema.extend({ nodeId: z.string() });

    const parsedEndpoints = z.array(fullEndpointSchema).parse(canvasElements.endpoints || []);
    const parsedEvents = z.array(fullEventSchema).parse(canvasElements.events || []);
    const parsedProviders = z.array(fullIdpSchema).parse(canvasElements.identityProviders || []);

    useBackendCanvasStore.getState().setNodesAndEdges(
      rawNodes,
      rawEdges,
      parsedEndpoints,
      parsedEvents,
      parsedProviders,
      projectId,
    );

    useSimulationStore
      .getState()
      .setTestCases((canvasElements.testCases || []) as any);
  }, [canvasElements, storeProjectId, projectId]);


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
      toast.success(`Updated logic for endpoint [${matchedEndpoint.name}]`);
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
    handleRunInCloud();
  };

  // Show spinner while Convex data is loading OR while store hydration hasn't
  // kicked in yet (storeProjectId !== projectId means useEffect hasn't run).
  const isHydrating =
    project === undefined ||
    canvasElements === undefined ||
    storeProjectId !== projectId;

  if (isHydrating) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d1117] flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-slate-400 font-mono">
          {canvasElements === undefined ? "Loading project canvas..." : "Compiling monorepo..."}
        </span>
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

        {/* Center Panel: Monaco Editor */}
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

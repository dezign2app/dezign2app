"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { compileMonorepo, CompiledMonorepoResult } from "@/lib/compiler";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import sdk from "@stackblitz/sdk";
import { IdeToolbar } from "./_components/IdeToolbar";
import { AiChatPanel } from "./_components/AiChatPanel";
import { MonacoEditorPane } from "./_components/MonacoEditorPane";
import { FileExplorer } from "./_components/FileExplorer";
import { buildFileTree, getParentPaths } from "../_components/compiler";
import { useBackendSync } from "../_components/hooks/useBackendSync";
import { useStoreHydration } from "./_lib/useStoreHydration";
import { useMonacoEditor } from "./_lib/useMonacoEditor";
import { findEndpointForFile } from "./_lib/editorUtils";

export default function CompilerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);

  // Flush canvas store changes to DB
  useBackendSync(projectId, "graph");

  // Store selectors
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
  const canvasElements = useQuery(api.canvas.getBackendElements, {
    projectId: projectId as Id<"projects">,
  });

  // Hydrate Zustand store from Convex on direct URL open / hard refresh
  useStoreHydration(projectId, canvasElements);

  // Compile the monorepo file tree
  const projectName = project?.name || "Blueprint";
  const formattedProjectName = useMemo(() => {
    const raw = projectName.trim();
    return raw.toLowerCase().endsWith("monorepo") ? raw : `${raw} Monorepo`;
  }, [projectName]);

  const monorepoResult: CompiledMonorepoResult = useMemo(
    () => compileMonorepo(nodes, endpoints, events, edges, testCases, formattedProjectName),
    [nodes, endpoints, events, edges, testCases, formattedProjectName],
  );

  const files = monorepoResult.files;
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // UI state
  const [selectedFilename, setSelectedFilename] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(`compiler_page_state_${projectId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.selectedFilename === "string" && parsed.selectedFilename) {
            return parsed.selectedFilename;
          }
        }
      } catch (e) {}
    }
    return "README.md";
  });
  
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(`compiler_page_state_${projectId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.expandedPaths)) {
            return new Set(parsed.expandedPaths);
          }
        }
      } catch (e) {}
    }
    return new Set();
  });

  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const hasRestoredRef = React.useRef<string | null>(null);

  const savePageState = (filename: string, expanded: Set<string>) => {
    try {
      localStorage.setItem(
        `compiler_page_state_${projectId}`,
        JSON.stringify({ selectedFilename: filename, expandedPaths: Array.from(expanded) }),
      );
    } catch (e) {
      console.error("Failed to save compiler page state", e);
    }
  };

  // Validate selected file & expand parent paths once Convex & store finish hydration
  React.useEffect(() => {
    if (!files || files.length === 0) return;
    if (project === undefined || canvasElements === undefined || storeProjectId !== projectId) return;
    if (hasRestoredRef.current === projectId) return;
    hasRestoredRef.current = projectId;

    const fileExists = selectedFilename && files.some((f) => f.filename === selectedFilename);
    const targetFile = fileExists
      ? selectedFilename
      : files.find((f) => f.filename.toLowerCase() === "readme.md")?.filename ??
        files[0]?.filename ??
        "README.md";

    let changed = false;
    if (targetFile !== selectedFilename) {
      setSelectedFilename(targetFile);
      changed = true;
    }

    const targetParents = getParentPaths(targetFile);
    const nextExpanded = new Set(expandedPaths);
    let expandedChanged = false;
    
    targetParents.forEach(p => {
      if (!nextExpanded.has(p)) {
        nextExpanded.add(p);
        expandedChanged = true;
      }
    });

    if (expandedChanged) {
      setExpandedPaths(nextExpanded);
    }
    
    if (changed || expandedChanged) {
      savePageState(targetFile, nextExpanded);
    }
  }, [projectId, files, project, canvasElements, storeProjectId, selectedFilename, expandedPaths]);

  const handleSelectFile = (filename: string) => {
    setSelectedFilename(filename);
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      getParentPaths(filename).forEach((p) => next.add(p));
      savePageState(filename, next);
      return next;
    });
  };

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        for (const p of Array.from(next)) {
          if (p === path || p.startsWith(`${path}/`)) {
            next.delete(p);
          }
        }
      } else {
        next.add(path);
      }
      savePageState(selectedFilename, next);
      return next;
    });
  };

  const activeFile = files.find((f) => f.filename === selectedFilename) ?? files[0];

  // Monaco editor state + all bug fixes encapsulated in the hook
  const { editorRef, handleEditorMount, handleEditorChange } = useMonacoEditor({
    activeFile,
    endpoints,
    updateEndpoint,
  });

  // File action handlers
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
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: activeFile.filename.split("/").pop() || activeFile.filename,
    });
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${activeFile.filename}`);
  };

  const handleDownloadZip = async () => {
    if (!files.length) return;
    setDownloadingZip(true);
    toast.info("Compressing project into ZIP...");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      files.forEach((f) => zip.file(f.filename, f.content));
      const blob = await zip.generateAsync({ type: "blob" });
      const zipName = `${formattedProjectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.zip`;
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: zipName });
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
    if (!files.length) return;
    const fileMap: Record<string, string> = {};
    files.forEach((f) => (fileMap[f.filename] = f.content));
    const openFile =
      files.find((f) => f.filename.endsWith("index.ts") || f.filename.endsWith("index.js"))
        ?.filename ?? files[0]?.filename ?? "README.md";
    sdk.openProject(
      { title: formattedProjectName, description: "Generated project workspace", template: "node", files: fileMap, settings: { compile: { trigger: "auto", clearConsole: false } } },
      { newWindow: true, openFile },
    );
    toast.success("Opening project workspace live in StackBlitz Cloud IDE!");
  };

  // Loading state
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
      <IdeToolbar
        projectName={projectName}
        projectId={projectId}
        displayTitle={formattedProjectName}
        downloadingZip={downloadingZip}
        onDownloadZip={handleDownloadZip}
        onRunInCloud={handleRunInCloud}
        onRunLocalhost={handleRunInCloud}
        aiChatOpen={aiChatOpen}
        onToggleAiChat={() => setAiChatOpen(!aiChatOpen)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <FileExplorer
          fileCount={files.length}
          fileTree={fileTree}
          activePath={activeFile?.filename ?? ""}
          expandedPaths={expandedPaths}
          onToggleExpand={handleToggleExpand}
          onSelectFile={handleSelectFile}
        />

        <MonacoEditorPane
          activeFile={activeFile}
          onMount={handleEditorMount}
          onCopy={handleCopy}
          onDownload={handleDownload}
          copied={copied}
        />

        <AiChatPanel
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          activeFile={activeFile}
          onApplyCode={(suggestedCode) => {
            const ep = findEndpointForFile(activeFile?.filename ?? "", endpoints);
            if (ep) {
              updateEndpoint(ep.id, { body: suggestedCode, code: suggestedCode });
              toast.success("Applied code to function body & updated canvas!");
            } else {
              toast.info("Could not match active file to a canvas endpoint");
            }
          }}
        />
      </div>
    </div>
  );
}

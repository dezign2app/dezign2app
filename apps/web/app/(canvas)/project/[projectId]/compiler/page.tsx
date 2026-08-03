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
import { Endpoint } from "@workspace/canvas/types";
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
  Lock,
  Unlock,
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
import { useBackendSync } from "../_components/hooks/useBackendSync";

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

function getEditableLineRange(
  content: string,
): { startMarkerLine: number; endMarkerLine: number } | null {
  if (!content) return null;
  const lines = content.split("\n");

  let startMarkerLine = -1;
  let endMarkerLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1; // 1-indexed Monaco line number

    if (
      line.includes("// --- EDITABLE FUNCTION BODY START ---") ||
      line.includes("// editable area")
    ) {
      startMarkerLine = lineNumber;
    } else if (
      startMarkerLine === -1 &&
      (line.includes("// --- Business Logic Code Execution ---") ||
        line.includes("// STEP 3:") ||
        line.includes("// STEP 2:") ||
        line.includes("// STEP 1:"))
    ) {
      startMarkerLine = lineNumber - 1;
    }

    if (
      startMarkerLine !== -1 &&
      endMarkerLine === -1 &&
      (line.includes("// --- EDITABLE FUNCTION BODY END ---") ||
        line.includes("// END of editable area") ||
        line.includes("logger.debug(") ||
        line.includes("return res.status(") ||
        line.includes("return res.json(") ||
        line.includes("} catch (error)"))
    ) {
      endMarkerLine = lineNumber;
      break;
    }
  }

  if (
    startMarkerLine !== -1 &&
    endMarkerLine !== -1 &&
    startMarkerLine < endMarkerLine
  ) {
    return { startMarkerLine, endMarkerLine };
  }
  return null;
}

function isEditingKey(e: any): boolean {
  const key = e.browserEvent?.key;
  const isCtrlOrCmd = e.browserEvent?.ctrlKey || e.browserEvent?.metaKey;

  if (key === "Backspace" || key === "Delete" || key === "Enter") {
    return true;
  }
  if (isCtrlOrCmd && (key === "v" || key === "x" || key === "z" || key === "y")) {
    return true;
  }
  if (key && key.length === 1 && !isCtrlOrCmd) {
    return true;
  }
  return false;
}

function extractBusinessLogic(content: string): string {
  if (!content) return "";

  const startMarker = "// --- EDITABLE FUNCTION BODY START ---";
  const endMarker = "// --- EDITABLE FUNCTION BODY END ---";

  if (content.includes(startMarker) && content.includes(endMarker)) {
    let section = content.split(startMarker)[1]?.split(endMarker)[0] || "";
    if (section.startsWith("\r\n")) {
      section = section.slice(2);
    } else if (section.startsWith("\n")) {
      section = section.slice(1);
    }
    if (section.endsWith("\r\n")) {
      section = section.slice(0, -2);
    } else if (section.endsWith("\n")) {
      section = section.slice(0, -1);
    }
    return section;
  }

  const marker = "// --- Business Logic Code Execution ---";
  if (content.includes(marker)) {
    const afterMarker = content.split(marker)[1] || "";
    const endMarkers = [
      "logger.debug(",
      "return res.status(",
      "return res.json(",
      "} catch (error)",
    ];

    let lowestEndIndex = afterMarker.length;
    for (const em of endMarkers) {
      const idx = afterMarker.indexOf(em);
      if (idx !== -1 && idx < lowestEndIndex) {
        lowestEndIndex = idx;
      }
    }

    return afterMarker.substring(0, lowestEndIndex).trim();
  }

  return content;
}

/**
 * Returns true for any comment line that was auto-generated by the route
 * generator (directive headers, STEP N: labels, trace annotations, etc.).
 * These must never be written back into the endpoint's businessLogic/prompt
 * field, otherwise the generator will re-wrap them in new STEP N: blocks on
 * every compile pass, causing exponential comment growth.
 */
function isGeneratorTemplateComment(commentContent: string): boolean {
  // STEP N: … labels produced by the promptText loop
  if (/^STEP\s+\d+:/i.test(commentContent)) return true;
  // Trace section headers and inline annotations
  if (
    commentContent.startsWith("📥 INBOUND TRIGGER") ||
    commentContent.startsWith("🔗 RESOURCE DEPENDENCIES") ||
    commentContent.startsWith("🗄️ DATABASE OPERATIONS REQUIRED") ||
    commentContent.startsWith("Goal:") ||
    commentContent.startsWith("Data Context:") ||
    // Bullet-point trace lines:  "- WebClient Page: …", "- Message Broker: …"
    /^-\s+\w/.test(commentContent) ||
    // Indented continuation lines like "  Broker topic/queue …"
    /^\s{2,}/.test(commentContent)
  ) return true;
  return false;
}

function parseEditableSection(section: string): {
  code: string;
  businessLogic: string;
  fullSection: string;
} {
  const lines = section.split("\n");
  const codeLines: string[] = [];
  const instructionLines: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Skip generator-emitted block headers (===, directive label, etc.)
    if (
      trimmed.startsWith("// ===") ||
      trimmed.startsWith("// 🤖 AI CODING AGENT DIRECTIVE") ||
      trimmed.startsWith("// 💡 Write custom business logic below:") ||
      trimmed.startsWith("// --- Business Logic Code Execution ---") ||
      trimmed.startsWith("// --- Natural Language Instructions ---")
    ) {
      continue;
    }

    if (trimmed.startsWith("//")) {
      const commentContent = trimmed.replace(/^\/\/\s*/, "");
      // Skip any line that the generator itself produced — these must not be
      // persisted back as businessLogic or they will be re-expanded into more
      // STEP N: comments on the next compile pass.
      if (commentContent && !isGeneratorTemplateComment(commentContent)) {
        instructionLines.push(commentContent);
      }
    } else if (trimmed === "") {
      codeLines.push("");
    } else {
      let cleanedLine = rawLine;
      if (cleanedLine.startsWith("    ")) {
        cleanedLine = cleanedLine.slice(4);
      }
      codeLines.push(cleanedLine);
    }
  }

  // Trim trailing empty lines but preserve internal ones
  let code = codeLines.join("\n").trimEnd();
  const businessLogic = instructionLines.join("\n");

  return {
    code,
    businessLogic,
    fullSection: section,
  };
}

function checkIsRouteFile(filename?: string): boolean {
  if (!filename) return false;
  return (
    filename.includes("/src/routes/") ||
    filename.startsWith("src/routes/") ||
    filename.includes("routes/")
  );
}

function findEndpointForFile(
  filename: string,
  endpoints: (Endpoint & { nodeId: string })[]
) {
  if (!checkIsRouteFile(filename)) return null;

  const routeFileName =
    filename.split(/[\/\\]routes[\/\\]/).pop()?.replace(/\.ts$/, "").toLowerCase().replace(/[^a-z0-9]/g, "") || "";

  for (const ep of endpoints) {
    const method = (ep.type || "GET").toLowerCase();
    const rawName = (ep.name || ep.id || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (
      rawName &&
      (routeFileName === rawName || routeFileName === `${method}${rawName}`)
    ) {
      return ep;
    }
    if (ep.id && routeFileName.includes(ep.id.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
      return ep;
    }
  }

  return null;
}

export default function CompilerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);

  // Mount Convex backend sync hook so editor changes are automatically flushed to DB
  useBackendSync(projectId, "graph");

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

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const activeFileRef = React.useRef(activeFile);
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const decorationsRef = React.useRef<string[]>([]);
  // Tracks which filename was last pushed into Monaco so we only reset the
  // editor model when the user SWITCHES files, not on every recompile of the
  // same file (which would reset the cursor and trigger the locked-zone toast).
  const lastAppliedFilenameRef = React.useRef<string | null>(null);
  // Tracks the last content string pushed into Monaco for the current file.
  // Used to detect external changes (e.g. BusinessLogicBlock sidebar edits)
  // so we can push them into Monaco without fighting in-Monaco user edits.
  const lastAppliedContentRef = React.useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    activeFileRef.current = activeFile;
    if (editorRef.current && monacoRef.current && activeFile) {
      const isRouteFile = checkIsRouteFile(activeFile.filename);

      if (lastAppliedFilenameRef.current !== activeFile.filename) {
        // User switched to a different file — always reset the editor model.
        editorRef.current.getModel()?.setValue(activeFile.content);
        lastAppliedFilenameRef.current = activeFile.filename;
        lastAppliedContentRef.current = activeFile.content;
      } else if (
        // Same file but content was changed externally (e.g. BusinessLogicBlock
        // sidebar edit) AND the user is NOT currently mid-keystroke in Monaco
        // (debounce timer inactive). Push the external update so the compiler
        // view stays in sync with sidebar changes in real-time.
        lastAppliedContentRef.current !== activeFile.content &&
        debounceTimerRef.current === null
      ) {
        const monacoValue = editorRef.current.getModel()?.getValue();
        if (monacoValue !== activeFile.content) {
          editorRef.current.getModel()?.setValue(activeFile.content);
          lastAppliedContentRef.current = activeFile.content;
        }
      }

      const liveContent =
        editorRef.current.getModel()?.getValue() || activeFile.content;
      const range = isRouteFile ? getEditableLineRange(liveContent) : null;

      if (
        range &&
        isRouteFile &&
        range.startMarkerLine + 1 <= range.endMarkerLine - 1
      ) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          [
            {
              range: new monacoRef.current.Range(
                range.startMarkerLine + 1,
                1,
                range.endMarkerLine - 1,
                1,
              ),
              options: {
                isWholeLine: true,
                className: "bg-emerald-500/10 border-l-2 border-emerald-500",
              },
            },
          ],
        );
      } else {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          [],
        );
      }
    }
  }, [activeFile]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onKeyDown((e: any) => {
      const currentFile = activeFileRef.current;
      if (!currentFile) return;

      const isRouteFile = checkIsRouteFile(currentFile.filename);
      if (!isRouteFile) {
        if (isEditingKey(e)) {
          e.preventDefault();
          e.stopPropagation();
          toast.info("🔒 Generated project configuration & server files are read-only.");
        }
        return;
      }

      // Live model content query to prevent stale range calculations during typing/Enters
      const liveContent = editor.getModel()?.getValue() || currentFile.content;
      const range = getEditableLineRange(liveContent);
      if (!range) return;

      const selection = editor.getSelection();
      if (!selection) return;

      const isInsideZone =
        selection.startLineNumber > range.startMarkerLine &&
        selection.endLineNumber < range.endMarkerLine;

      if (!isInsideZone && isEditingKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning(
          "🔒 Function signature, types, and return handlers are locked. Edit only inside the function body.",
        );
      }
    });
  };

  // Handle Monaco code edit
  const handleEditorChange = (newContent: string | undefined) => {
    if (newContent === undefined || !activeFile) {
      return;
    }

    const matchedEndpoint = findEndpointForFile(activeFile.filename, endpoints);
    if (!matchedEndpoint) {
      return;
    }

    const extractedLogic = extractBusinessLogic(newContent);
    const parsed = parseEditableSection(extractedLogic);

    if (
      parsed.fullSection === matchedEndpoint.body ||
      parsed.code === matchedEndpoint.code
    ) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const updatedCode = parsed.code || parsed.fullSection;
      
      // If parsed.businessLogic is empty string, it means they deleted the comments.
      // We should only fallback if it was actually undefined, but here we can just sync what they typed.
      // However, if they just haven't typed comments, we might not want to delete the prompt.
      // Wait, if they are editing the file, parsed.businessLogic contains what's in the file.
      // If they deleted it, it should be empty!
      const updatedLogic = parsed.businessLogic;

      updateEndpoint(matchedEndpoint.id, {
        body: updatedCode,
        code: updatedCode,
        businessLogic: updatedLogic,
        prompt: updatedLogic,
      });

      // Mark the debounce as settled so the activeFile useEffect can push any
      // subsequent external changes (e.g. further sidebar edits) into Monaco.
      debounceTimerRef.current = null;
      // Record what Monaco has now so the useEffect doesn't immediately
      // re-push the same content on the next recompile triggered by this update.
      lastAppliedContentRef.current = editorRef.current?.getModel()?.getValue() ?? null;
    }, 800);
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
              <span className="truncate font-semibold">{activeFile?.filename}</span>
              {checkIsRouteFile(activeFile?.filename) ? (
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3 text-amber-400" /> Signature & Types Locked • 🔓 Body Editable
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700 font-mono flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3 text-slate-400" /> Read-Only Generated File
                </span>
              )}
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
                defaultValue={activeFile.content}
                theme="vs-dark"
                onMount={handleEditorMount}
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
            const matchedEndpoint = findEndpointForFile(
              activeFile?.filename || "",
              endpoints,
            );
            if (matchedEndpoint) {
              updateEndpoint(matchedEndpoint.id, {
                body: suggestedCode,
                code: suggestedCode,
              });
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

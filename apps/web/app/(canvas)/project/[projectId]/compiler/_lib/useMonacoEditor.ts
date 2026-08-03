"use client";

import React, { useEffect } from "react";
import { toast } from "sonner";
import { CompiledFile } from "@/lib/compiler";
import { Endpoint } from "@workspace/canvas/types";
import {
  getEditableLineRange,
  isEditingKey,
  extractBusinessLogic,
  parseEditableSection,
  checkIsRouteFile,
  findEndpointForFile,
} from "./editorUtils";

export interface UseMonacoEditorOptions {
  activeFile: CompiledFile | undefined;
  endpoints: (Endpoint & { nodeId: string })[];
  updateEndpoint: (id: string, patch: Partial<Endpoint>) => void;
}

export interface UseMonacoEditorReturn {
  editorRef: React.MutableRefObject<any>;
  monacoRef: React.MutableRefObject<any>;
  handleEditorMount: (editor: any, monaco: any) => void;
  handleEditorChange: (newContent: string | undefined) => void;
}

/**
 * Encapsulates all Monaco editor state management:
 * - Ref tracking (editor, monaco, decorations, debounce)
 * - Syncing activeFile content into Monaco when switching files or receiving
 *   external updates (e.g. sidebar BusinessLogicBlock changes)
 * - Keydown guard: blocks edits outside the editable zone in route files
 * - Debounced onChange: extracts businessLogic + code and writes to store
 *
 * Bug fixes baked in:
 * 1. isExternalPushRef: suppresses onChange when we push content programmatically
 * 2. Normalised early-exit: compares trimmed businessLogic/code, not fullSection
 * 3. parseEditableSection strips STEP N: prefix before saving (see editorUtils)
 */
export function useMonacoEditor({
  activeFile,
  endpoints,
  updateEndpoint,
}: UseMonacoEditorOptions): UseMonacoEditorReturn {
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

  // FIX (Bug 3): When we programmatically push content into Monaco (external
  // update), this flag is set to true so handleEditorChange can immediately
  // return without scheduling a store write, breaking the feedback loop:
  //   external push -> onChange fires -> store write -> recompile -> push again
  const isExternalPushRef = React.useRef(false);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Sync Monaco content when activeFile changes
  useEffect(() => {
    activeFileRef.current = activeFile;
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const isRouteFile = checkIsRouteFile(activeFile.filename);

    if (lastAppliedFilenameRef.current !== activeFile.filename) {
      // User switched to a different file — always reset the editor model.
      isExternalPushRef.current = true;
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
        isExternalPushRef.current = true;
        editorRef.current.getModel()?.setValue(activeFile.content);
        lastAppliedContentRef.current = activeFile.content;
      }
    }

    // Update editable-zone decorations
    const liveContent =
      editorRef.current.getModel()?.getValue() || activeFile.content;
    const range = isRouteFile ? getEditableLineRange(liveContent) : null;

    if (range && isRouteFile && range.startMarkerLine + 1 <= range.endMarkerLine - 1) {
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

  const handleEditorChange = (newContent: string | undefined) => {
    // FIX (Bug 3): Skip onChange events triggered by our own programmatic pushes.
    if (isExternalPushRef.current) {
      isExternalPushRef.current = false;
      return;
    }

    if (newContent === undefined || !activeFile) return;

    const matchedEndpoint = findEndpointForFile(activeFile.filename, endpoints);
    if (!matchedEndpoint) return;

    const extractedLogic = extractBusinessLogic(newContent);
    const parsed = parseEditableSection(extractedLogic);

    // FIX (Bug 2): Compare normalised fields, not raw fullSection vs body.
    const storedLogic = (matchedEndpoint.businessLogic ?? matchedEndpoint.prompt ?? "").trim();
    const storedCode = (matchedEndpoint.body ?? matchedEndpoint.code ?? "").trim();

    if (
      parsed.businessLogic.trim() === storedLogic &&
      parsed.code.trim() === storedCode
    ) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const updatedCode = parsed.code || parsed.fullSection;
      const updatedLogic = parsed.businessLogic;

      updateEndpoint(matchedEndpoint.id, {
        body: updatedCode,
        code: updatedCode,
        businessLogic: updatedLogic,
        prompt: updatedLogic,
      });

      // Mark the debounce as settled so the activeFile useEffect can push
      // subsequent external changes into Monaco.
      debounceTimerRef.current = null;
      // Record Monaco's current content so the useEffect doesn't re-push it.
      lastAppliedContentRef.current = editorRef.current?.getModel()?.getValue() ?? null;
    }, 800);
  };

  return { editorRef, monacoRef, handleEditorMount, handleEditorChange };
}

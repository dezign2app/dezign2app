"use client";

import React from "react";
import { CircleAlert, CircleCheckBig } from "lucide-react";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { WorkflowSaveState } from "../workflow-editor-types";

import { useWorkflowEditorContext } from "../workflow-editor-context";

const saveStateLabel: Record<WorkflowSaveState, string> = {
  idle: "Idle",
  saving: "Autosaving",
  saved: "Saved",
  error: "Save failed",
};

export const ValidationTab = () => {
  const {
    compileStatus,
    compileErrors,
    saveState,
    nodes,
    edges,
  } = useWorkflowEditorContext();

  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const terminalIntro =
    compileStatus === "valid"
      ? "$ workflow compile --draft --validate"
      : "$ workflow compile --draft --validate --verbose";

  return (
    <ScrollArea className="h-full text-xs overflow-y-auto">
      <div className="space-y-1 px-4 py-3 font-mono leading-6">
        <div className="flex items-start gap-3 text-sidebar-foreground">
          <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
            1
          </span>
          <span>{terminalIntro}</span>
        </div>

        <div className="flex items-start gap-3 text-sidebar-foreground/70">
          <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
            2
          </span>
          <span>{`[graph] nodes=${nodeCount} edges=${edgeCount}`}</span>
        </div>

        {compileErrors.length === 0 ? (
          <>
            <div className="flex items-start gap-3 text-primary">
              <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                3
              </span>
              <span className="inline-flex items-center gap-2">
                <CircleCheckBig className="size-3.5" />
                Validation passed. Draft is structurally valid.
              </span>
            </div>
            <div className="flex items-start gap-3 text-sidebar-foreground/70">
              <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                4
              </span>
              <span>{`[status] ${saveStateLabel[saveState].toLowerCase()} | compile=valid`}</span>
            </div>
          </>
        ) : (
          compileErrors.map((error, index) => (
            <div
              key={error}
              className="flex items-start gap-3 text-destructive"
            >
              <span className="w-10 shrink-0 text-right text-sidebar-foreground/35">
                {index + 3}
              </span>
              <span className="inline-flex items-start gap-2">
                <CircleAlert className="mt-1 size-3.5 shrink-0" />
                <span>{error}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

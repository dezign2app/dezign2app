"use client";

import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Undo2, Redo2 } from "lucide-react";
import { useWorkflowEditorContext } from "./workflow-editor-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

export const WorkflowHistoryControls = () => {
  const { undo, redo, canUndo, canRedo } = useWorkflowEditorContext();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Shift+Z)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

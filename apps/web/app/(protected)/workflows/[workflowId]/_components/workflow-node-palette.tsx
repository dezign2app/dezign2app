"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Shapes } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import {
  WORKFLOW_NODE_MIME_TYPE,
  type WorkflowNodeKind,
} from "./workflow-editor-types";
import {
  WORKFLOW_NODE_ORDER,
  WORKFLOW_NODE_REGISTRY,
} from "./workflow-node-registry";

import { useWorkflowEditorContext } from "./workflow-editor-context";

interface WorkflowNodePaletteProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const WorkflowNodePalette = ({
  isCollapsed,
  onToggleCollapse,
}: WorkflowNodePaletteProps) => {
  const {
    isReadOnly,
    handleBlockedAction: onBlockedAction,
    handleAddNode: onQuickAddNode,
  } = useWorkflowEditorContext();
  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: WorkflowNodeKind,
  ) => {
    if (isReadOnly) {
      event.preventDefault();
      onBlockedAction();
      return;
    }

    event.dataTransfer.setData(WORKFLOW_NODE_MIME_TYPE, nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      <div
        className={cn(
          "border-b",
          isCollapsed
            ? "flex items-center justify-center px-2 py-3"
            : "px-4 py-4",
        )}
      >
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label="Expand node palette"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Node Palette</p>
              <p className="text-xs text-muted-foreground">
                Drag onto the canvas or click to insert a node into the draft.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              aria-label="Collapse node palette"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {isCollapsed ? (
          <motion.div
            key="palette-collapsed"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex flex-1 flex-col items-center gap-3 px-2 py-4"
          >
            <div className="flex size-8 items-center justify-center rounded-xl border bg-card">
              <Shapes className="size-4 text-muted-foreground" />
            </div>
            <span className="rotate-180 text-xs font-medium tracking-[0.24em] text-muted-foreground [writing-mode:vertical-rl]">
              NODES
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="palette-expanded"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-h-0 flex-1"
          >
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {WORKFLOW_NODE_ORDER.map((nodeType) => {
                  const definition = WORKFLOW_NODE_REGISTRY[nodeType];
                  const Icon = definition.icon;

                  return (
                    <div
                      key={nodeType}
                      draggable={!isReadOnly}
                      onDragStart={(event) => handleDragStart(event, nodeType)}
                      className={cn(
                        "rounded-2xl border bg-card p-3 transition-colors",
                        isReadOnly
                          ? "opacity-80"
                          : "cursor-grab hover:border-primary/40",
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex p-1.5 items-center justify-center rounded-xl border bg-muted/30">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {definition.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {definition.paletteDescription}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            isReadOnly
                              ? onBlockedAction()
                              : onQuickAddNode(nodeType)
                          }
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

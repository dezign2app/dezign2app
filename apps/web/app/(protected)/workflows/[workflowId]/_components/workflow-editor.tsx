"use client";

import React, { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { Resizable } from "re-resizable";
import { Separator } from "@workspace/ui/components/separator";
import { Spinner } from "@workspace/ui/components/spinner";
import { WorkflowBottomTab } from "./workflow-editor-types";
import { WorkflowBottomPanel } from "./workflow-bottom-panel";
import { WorkflowCanvas } from "./workflow-canvas";
import { WorkflowNodeInspector } from "./workflow-node-inspector";
import { WorkflowNodePalette } from "./workflow-node-palette";
import { WorkflowEditorProvider, useWorkflowEditorContext } from "./workflow-editor-context";
import { WorkflowRunDialog } from "./workflow-run-dialog";

interface WorkflowEditorPlaceholderProps {
  workflowId: string;
}

const COLLAPSED_BOTTOM_PANEL_HEIGHT = 42;
const COLLAPSED_LEFT_PANEL_WIDTH = 52;
const STORAGE_KEY = "workflow-editor-layout-v1";

interface WorkflowEditorLayout {
  leftPanelWidth: number;
  lastExpandedLeftPanelWidth: number;
  isLeftPanelCollapsed: boolean;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  lastExpandedBottomPanelHeight: number;
  isBottomPanelCollapsed: boolean;
}

const DEFAULT_LAYOUT: WorkflowEditorLayout = {
  leftPanelWidth: 280,
  lastExpandedLeftPanelWidth: 280,
  isLeftPanelCollapsed: false,
  rightPanelWidth: 360,
  bottomPanelHeight: 220,
  lastExpandedBottomPanelHeight: 220,
  isBottomPanelCollapsed: false,
};

export const WorkflowEditorPlaceholder = (
  props: WorkflowEditorPlaceholderProps,
) => {
  return (
    <ReactFlowProvider>
      <WorkflowEditorProvider workflowId={props.workflowId}>
        <WorkflowEditorContent {...props} />
      </WorkflowEditorProvider>
    </ReactFlowProvider>
  );
};

const WorkflowEditorContent = ({
  workflowId,
}: WorkflowEditorPlaceholderProps) => {
  const {
    selectedNode,
    compileStatus,
    isRunDialogOpen,
    runInputValue,
    isStartingRun,
    canRunWorkflow,
    setIsRunDialogOpen,
    setRunInputValue,
    handleRunWorkflow,
    isLoading,
  } = useWorkflowEditorContext();

  const [layout, setLayout] = useState<WorkflowEditorLayout>(DEFAULT_LAYOUT);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [isLeftPanelResizing, setIsLeftPanelResizing] = useState(false);
  const [isBottomPanelResizing, setIsBottomPanelResizing] = useState(false);

  // Initialize layout from localStorage with hydration safety
  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLayout(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse workflow editor layout", e);
      }
    }
    setIsLayoutReady(true);
  }, []);

  // Sync layout to localStorage
  React.useEffect(() => {
    if (!isLayoutReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout, isLayoutReady]);

  const {
    leftPanelWidth,
    lastExpandedLeftPanelWidth,
    isLeftPanelCollapsed,
    rightPanelWidth,
    bottomPanelHeight,
    lastExpandedBottomPanelHeight,
    isBottomPanelCollapsed,
  } = layout;

  const handleToggleBottomPanel = () => {
    if (isBottomPanelCollapsed) {
      setLayout((prev) => ({
        ...prev,
        bottomPanelHeight: prev.lastExpandedBottomPanelHeight,
        isBottomPanelCollapsed: false,
      }));
      return;
    }

    setLayout((prev) => ({
      ...prev,
      lastExpandedBottomPanelHeight: prev.bottomPanelHeight,
      bottomPanelHeight: COLLAPSED_BOTTOM_PANEL_HEIGHT,
      isBottomPanelCollapsed: true,
    }));
  };

  const handleToggleLeftPanel = () => {
    if (isLeftPanelCollapsed) {
      setLayout((prev) => ({
        ...prev,
        leftPanelWidth: prev.lastExpandedLeftPanelWidth,
        isLeftPanelCollapsed: false,
      }));
      return;
    }

    setLayout((prev) => ({
      ...prev,
      lastExpandedLeftPanelWidth: prev.leftPanelWidth,
      leftPanelWidth: COLLAPSED_LEFT_PANEL_WIDTH,
      isLeftPanelCollapsed: true,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  const leftPanelShellWidth = isLeftPanelCollapsed
    ? COLLAPSED_LEFT_PANEL_WIDTH
    : leftPanelWidth;
  const bottomPanelShellHeight = isBottomPanelCollapsed
    ? COLLAPSED_BOTTOM_PANEL_HEIGHT
    : bottomPanelHeight;
  const inspectorShellWidth = rightPanelWidth + 1;

  return (
    <>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex min-h-0 flex-1 overflow-hidden bg-card">
            <motion.div
              animate={{ width: leftPanelShellWidth }}
              transition={
                isLeftPanelResizing
                  ? { duration: 0 }
                  : { duration: 0.24, ease: "easeInOut" }
              }
              className="flex h-full shrink-0 overflow-hidden"
            >
              <Resizable
                size={{
                  width: leftPanelShellWidth,
                  height: "100%",
                }}
                minWidth={
                  isLeftPanelCollapsed ? COLLAPSED_LEFT_PANEL_WIDTH : 240
                }
                maxWidth={
                  isLeftPanelCollapsed ? COLLAPSED_LEFT_PANEL_WIDTH : 380
                }
                enable={{
                  top: false,
                  right: !isLeftPanelCollapsed,
                  bottom: false,
                  left: false,
                  topRight: false,
                  bottomRight: false,
                  bottomLeft: false,
                  topLeft: false,
                }}
                onResizeStart={() => setIsLeftPanelResizing(true)}
                onResize={(_, __, ref) => {
                  const nextWidth = ref.offsetWidth;
                  setLayout((prev) => ({
                    ...prev,
                    leftPanelWidth: nextWidth,
                    lastExpandedLeftPanelWidth: nextWidth,
                  }));
                }}
                onResizeStop={(_, __, ref) => {
                  const nextWidth = ref.offsetWidth;
                  setLayout((prev) => ({
                    ...prev,
                    leftPanelWidth: nextWidth,
                    lastExpandedLeftPanelWidth: nextWidth,
                  }));
                  setIsLeftPanelResizing(false);
                }}
                className="shrink-0 overflow-hidden"
              >
                <WorkflowNodePalette
                  isCollapsed={isLeftPanelCollapsed}
                  onToggleCollapse={handleToggleLeftPanel}
                />
              </Resizable>
            </motion.div>

            <Separator orientation="vertical" />

            <div className="min-h-0 min-w-0 flex-1">
              <WorkflowCanvas />
            </div>

            <AnimatePresence initial={false}>
              {selectedNode ? (
                <motion.div
                  key="workflow-inspector"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: inspectorShellWidth, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{
                    width: { duration: 0.2, ease: "easeInOut" },
                    opacity: { duration: 0.16, ease: "easeOut" },
                  }}
                  className="flex h-full shrink-0 overflow-hidden"
                >
                  <Separator orientation="vertical" />

                  <Resizable
                    size={{ width: rightPanelWidth, height: "100%" }}
                    minWidth={300}
                    maxWidth={460}
                    enable={{
                      top: false,
                      right: false,
                      bottom: false,
                      left: true,
                      topRight: false,
                      bottomRight: false,
                      bottomLeft: false,
                      topLeft: false,
                    }}
                    onResize={(_, __, ref) =>
                      setLayout((prev) => ({
                        ...prev,
                        rightPanelWidth: ref.offsetWidth,
                      }))
                    }
                    onResizeStop={(_, __, ref) =>
                      setLayout((prev) => ({
                        ...prev,
                        rightPanelWidth: ref.offsetWidth,
                      }))
                    }
                    className="shrink-0"
                  >
                    <WorkflowNodeInspector />
                  </Resizable>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <motion.div
            animate={{ height: bottomPanelShellHeight }}
            transition={
              isBottomPanelResizing
                ? { duration: 0 }
                : { duration: 0.24, ease: "easeInOut" }
            }
            className="shrink-0 overflow-hidden border-t border-border/80 bg-sidebar"
          >
            <Resizable
              size={{
                width: "100%",
                height: bottomPanelShellHeight,
              }}
              minHeight={
                isBottomPanelCollapsed ? COLLAPSED_BOTTOM_PANEL_HEIGHT : 180
              }
              maxHeight={
                isBottomPanelCollapsed ? COLLAPSED_BOTTOM_PANEL_HEIGHT : 420
              }
              enable={{
                top: !isBottomPanelCollapsed,
                right: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: false,
                bottomLeft: false,
                topLeft: false,
              }}
              onResizeStart={() => setIsBottomPanelResizing(true)}
              onResize={(_, __, ref) => {
                const nextHeight = ref.offsetHeight;
                setLayout((prev) => ({
                  ...prev,
                  bottomPanelHeight: nextHeight,
                  lastExpandedBottomPanelHeight: nextHeight,
                }));
              }}
              onResizeStop={(_, __, ref) => {
                const nextHeight = ref.offsetHeight;
                setLayout((prev) => ({
                  ...prev,
                  bottomPanelHeight: nextHeight,
                  lastExpandedBottomPanelHeight: nextHeight,
                }));
                setIsBottomPanelResizing(false);
              }}
              className="overflow-hidden"
            >
              <WorkflowBottomPanel
                isCollapsed={isBottomPanelCollapsed}
                onToggleCollapse={handleToggleBottomPanel}
              />
            </Resizable>
          </motion.div>
        </div>
      </div>

      <WorkflowRunDialog
        isOpen={isRunDialogOpen}
        onOpenChange={setIsRunDialogOpen}
        runInputValue={runInputValue}
        onRunInputChange={setRunInputValue}
        isStartingRun={isStartingRun}
        canRunWorkflow={canRunWorkflow}
        onRunWorkflow={handleRunWorkflow}
      />
    </>
  );
};

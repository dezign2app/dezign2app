"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Dot,
  PlayCircle,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { Doc, Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

import { cn } from "@workspace/ui/lib/utils";
import type {
  WorkflowCompileStatus,
  WorkflowSaveState,
  WorkflowSecret,
  WorkflowBottomTab,
} from "./workflow-editor-types";

// Sub-components
import { ValidationTab } from "./bottom-panel/validation-tab";
import { TerminalTab } from "./bottom-panel/terminal-tab";
import { SecretsTab } from "./bottom-panel/secrets-tab";
import { VersionsTab } from "./bottom-panel/versions-tab";
import { SecretEditDialog } from "./bottom-panel/secret-edit-dialog";
import { useWorkflowEditorContext } from "./workflow-editor-context";
import { useChatStore, TOGGLE_POPUP } from "@/app/(protected)/_components/chat/chat-store";

interface WorkflowBottomPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const saveStateLabel: Record<WorkflowSaveState, string> = {
  idle: "Idle",
  saving: "Autosaving",
  saved: "Saved",
  error: "Save failed",
};

const saveStateTone: Record<WorkflowSaveState, string> = {
  idle: "text-sidebar-foreground/60",
  saving: "text-primary",
  saved: "text-foreground",
  error: "text-destructive",
};

const runStatusTone: Record<Doc<"workflow_runs">["status"], string> = {
  queued: "text-orange-400/70",
  running: "text-yellow-400/70",
  completed: "text-green-400/70",
  failed: "text-red-400/70",
  cancelled: "text-yellow-400/70",
};

const eventLevelTone: Record<Doc<"workflow_run_events">["level"], string> = {
  debug: "text-sidebar-foreground/55",
  info: "text-sidebar-foreground",
  warn: "text-chart-3",
  error: "text-destructive",
};

const formatTimestamp = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);

export const WorkflowBottomPanel = ({
  isCollapsed,
  onToggleCollapse,
}: WorkflowBottomPanelProps) => {
  const {
    activeBottomTab: activeTab,
    setActiveBottomTab: onActiveTabChange,
    setIsRunDialogOpen,
    nodes,
    edges,
    saveState,
    isReadOnly,
    canRunWorkflow,
    isStartingRun,
    upsertWorkflowSecret: onUpsertSecret,
  } = useWorkflowEditorContext();

  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const onOpenRunDialog = () => setIsRunDialogOpen(true);
  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingSecret, setEditingSecret] = React.useState<WorkflowSecret | null>(
    null,
  );

  const handleStartEdit = (secret: WorkflowSecret) => {
    setEditingSecret(secret);
    setIsEditDialogOpen(true);
  };

  const handleSaveSecret = async (
    name: string,
    value: string | undefined,
    description?: string,
    secretId?: Id<"workflow_secrets">,
  ) => {
    await onUpsertSecret(name, value, undefined, description, secretId);
    setEditingSecret(null);
  };

  const { setShowAIPopup } = useChatStore();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        onActiveTabChange(value as WorkflowBottomTab)
      }
      className="flex h-full flex-col gap-0 bg-sidebar text-sidebar-foreground"
    >
      <div className="flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar-accent/70 px-4 py-2.5">
        <div
          className="flex items-center gap-3"
          onClick={() => {
            if (isCollapsed) onToggleCollapse();
          }}
        >
          <TerminalSquare className="size-4 text-sidebar-foreground/60" />
          <TabsList
            variant="line"
            className="h-auto gap-0 rounded-none bg-transparent p-0 text-sidebar-foreground/60"
          >
            <TabsTrigger
              value="validation"
              className="h-auto rounded-none border-x border-transparent px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sidebar-foreground/70 data-[state=active]:border-sidebar-border data-[state=active]:bg-sidebar data-[state=active]:text-sidebar-foreground data-[state=active]:after:bg-sidebar-primary"
            >
              Problems
            </TabsTrigger>
            <TabsTrigger
              value="runs"
              className="h-auto rounded-none border-x border-transparent px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sidebar-foreground/70 data-[state=active]:border-sidebar-border data-[state=active]:bg-sidebar data-[state=active]:text-sidebar-foreground data-[state=active]:after:bg-sidebar-primary"
            >
              Terminal
            </TabsTrigger>
            <TabsTrigger
              value="secrets"
              className="h-auto rounded-none border-x border-transparent px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sidebar-foreground/70 data-[state=active]:border-sidebar-border data-[state=active]:bg-sidebar data-[state=active]:text-sidebar-foreground data-[state=active]:after:bg-sidebar-primary"
            >
              Secrets
            </TabsTrigger>
            <TabsTrigger
              value="versions"
              className="h-auto rounded-none border-x border-transparent px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sidebar-foreground/70 data-[state=active]:border-sidebar-border data-[state=active]:bg-sidebar data-[state=active]:text-sidebar-foreground data-[state=active]:after:bg-sidebar-primary"
            >
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-sidebar-foreground/60">
          <Button
              variant="outline"
              size="sm"
              className="h-7 rounded border-sidebar-border bg-sidebar px-3 text-xs uppercase tracking-[0.14em]"
              onClick={() => setShowAIPopup(TOGGLE_POPUP)}
            >
            <Sparkles className="mr-1.5 size-3" />
            Ask AI
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded border-sidebar-border bg-sidebar px-3 text-xs uppercase tracking-[0.14em]"
            disabled={!canRunWorkflow}
            onClick={onOpenRunDialog}
          >
            {isStartingRun ? (
              <Spinner className="size-3.5" />
            ) : (
              <PlayCircle className="size-3.5" />
            )}
            {isStartingRun ? "Starting" : "Run test"}
          </Button>
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              saveStateTone[saveState],
            )}
          >
            <Dot className="size-4" />
            {saveStateLabel[saveState]}
          </span>
          <span>{nodeCount} nodes</span>
          <span>{edgeCount} edges</span>
          {isReadOnly ? <span className="text-primary">READ ONLY</span> : null}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sidebar-foreground/60 transition-colors hover:bg-sidebar hover:text-sidebar-foreground"
          >
            {isCollapsed ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isCollapsed ? null : (
          <motion.div
            key="terminal-body"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-h-0 flex flex-1 flex-col"
          >
            <TabsContent
              value="validation"
              className="min-h-0 flex-1 outline-none"
            >
              <ValidationTab />
            </TabsContent>

            <TabsContent value="runs" className="min-h-0 flex-1 outline-none">
              <TerminalTab />
            </TabsContent>

            <TabsContent value="secrets" className="min-h-0 flex-1 outline-none">
              <SecretsTab onStartEdit={handleStartEdit} />
            </TabsContent>

            <TabsContent
              value="versions"
              className="min-h-0 flex-1 outline-none"
            >
              <VersionsTab />
            </TabsContent>
          </motion.div>
        )}
      </AnimatePresence>
      <SecretEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingSecret={editingSecret}
        onSave={handleSaveSecret}
      />
    </Tabs>
  );
};

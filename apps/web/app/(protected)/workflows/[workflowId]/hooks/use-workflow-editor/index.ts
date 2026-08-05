"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@workspace/backend/_generated/api";
import type { Id } from "@workspace/backend/_generated/dataModel";
import { useSubscriptionAccess } from "@/providers/subscription-access-context";
import { useHistory } from "../use-history";
import type {
  WorkflowBottomTab,
  WorkflowCompileStatus,
  WorkflowEditorEdge,
  WorkflowEditorNode,
  WorkflowSaveState,
} from "../../_components/workflow-editor-types";
import {
  serializeWorkflowGraph,
  toWorkflowEditorEdge,
  toWorkflowEditorNodeWithData,
} from "../../_components/workflow-node-registry";
import { useWorkflowActions } from "./use-workflow-actions";
import { useWorkflowExecution } from "./use-workflow-execution";
import { useWorkflowVersionsSecrets } from "./use-workflow-versions-secrets";

export const useWorkflowEditor = (workflowId: string) => {
  const { isReadOnly, showPaywall } = useSubscriptionAccess();
  const { getToken } = useAuth();

  const data = useQuery(api.workflows.crud.getWorkflowEditorData, {
    workflowId: workflowId as Id<"workflows">,
  });
  const recentRuns = useQuery(api.workflows.runs.listRecentRuns, {
    workflowId: workflowId as Id<"workflows">,
    limit: 12,
  });
  const saveDraftGraph = useMutation(api.workflows.crud.saveDraftGraph);

  const workflowSecrets = useQuery(api.workflows.secrets.listWorkflowSecrets, {
    workflowId: workflowId as Id<"workflows">,
  });
  const workflowVersions = useQuery(
    api.workflows.versions.listWorkflowVersions,
    {
      workflowId: workflowId as Id<"workflows">,
    },
  );

  const [nodes, setNodes] = useState<WorkflowEditorNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEditorEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] =
    useState<Id<"workflow_runs"> | null>(null);
  const [compileStatus, setCompileStatus] =
    useState<WorkflowCompileStatus>("invalid");
  const [compileErrors, setCompileErrors] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<WorkflowSaveState>("idle");
  const [activeBottomTab, setActiveBottomTab] =
    useState<WorkflowBottomTab>("validation");

  const history = useHistory({ nodes, edges });

  const initializedWorkflowIdRef = useRef<string | null>(null);
  const lastPersistedGraphSignatureRef = useRef("");
  const lastRunEventSignatureRef = useRef("");
  const lastRecordTimeRef = useRef(0);
  const saveTimeoutRef = useRef<number | null>(null);

  const selectedRunEvents = useQuery(
    api.workflows.runs.listRunEvents,
    selectedRunId ? { runId: selectedRunId } : "skip",
  );

  useEffect(() => {
    if (!data) return;

    const nextNodes = data.nodes.map((node) =>
      toWorkflowEditorNodeWithData(node),
    );
    const nextEdges = data.edges.map((edge) => toWorkflowEditorEdge(edge));
    const serverSignature = JSON.stringify(
      serializeWorkflowGraph(nextNodes, nextEdges),
    );

    if (initializedWorkflowIdRef.current !== workflowId) {
      initializedWorkflowIdRef.current = workflowId;
      lastPersistedGraphSignatureRef.current = serverSignature;

      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(nextNodes[0]?.id ?? null);
      setCompileStatus(
        (data.draftVersion?.compileStatus ??
          "invalid") as WorkflowCompileStatus,
      );
      setCompileErrors(data.draftVersion?.compileErrors ?? []);
      setSaveState("idle");
      history.clear();
      return;
    }

    if (serverSignature !== lastPersistedGraphSignatureRef.current) {
      console.log("🔄 Remote change detected, syncing canvas...");
      lastPersistedGraphSignatureRef.current = serverSignature;

      setNodes(nextNodes);
      setEdges(nextEdges);
      setCompileStatus(
        (data.draftVersion?.compileStatus ??
          "invalid") as WorkflowCompileStatus,
      );
      setCompileErrors(data.draftVersion?.compileErrors ?? []);
      setSaveState("idle");
    }
  }, [data, workflowId]);

  const persistDraftGraph = useEffectEvent(
    async (
      nextNodes: WorkflowEditorNode[],
      nextEdges: WorkflowEditorEdge[],
    ) => {
      const serializedGraph = serializeWorkflowGraph(nextNodes, nextEdges);
      const signature = JSON.stringify(serializedGraph);

      try {
        const result = await saveDraftGraph({
          workflowId: workflowId as Id<"workflows">,
          nodes: serializedGraph.nodes,
          edges: serializedGraph.edges,
        });

        lastPersistedGraphSignatureRef.current = signature;
        setCompileStatus(result.compileStatus as WorkflowCompileStatus);
        setCompileErrors(result.compileErrors);
        setSaveState("saved");
        return result;
      } catch (error) {
        console.error(error);
        setSaveState("error");
        toast.error("Failed to autosave workflow draft");
        return null;
      }
    },
  );

  const flushDraftSave = useEffectEvent(async () => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const serializedGraph = serializeWorkflowGraph(nodes, edges);
    const signature = JSON.stringify(serializedGraph);

    if (signature === lastPersistedGraphSignatureRef.current) {
      return { compileStatus, compileErrors };
    }

    setSaveState("saving");
    return await persistDraftGraph(nodes, edges);
  });

  useEffect(() => {
    if (initializedWorkflowIdRef.current !== workflowId || isReadOnly) return;

    const serializedGraph = serializeWorkflowGraph(nodes, edges);
    const signature = JSON.stringify(serializedGraph);

    if (signature === lastPersistedGraphSignatureRef.current) return;

    setSaveState("saving");
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = window.setTimeout(() => {
      void persistDraftGraph(nodes, edges);
    }, 900);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [edges, isReadOnly, nodes, persistDraftGraph, workflowId]);

  useEffect(() => {
    if (!recentRuns || recentRuns.length === 0) return;
    setSelectedRunId(
      (currentRunId) => currentRunId || (recentRuns[0]?._id ?? null),
    );
  }, [recentRuns]);

  useEffect(() => {
    if (!selectedRunEvents || selectedRunEvents.length === 0) return;
    const latestEvent = selectedRunEvents[selectedRunEvents.length - 1];
    if (!latestEvent) return;

    const signature = `${latestEvent._id}:${latestEvent.seq}`;
    if (signature === lastRunEventSignatureRef.current) return;
    lastRunEventSignatureRef.current = signature;

    if (
      latestEvent.level === "error" &&
      latestEvent.nodeKey &&
      nodes.some((node) => node.id === latestEvent.nodeKey)
    ) {
      setSelectedNodeId(latestEvent.nodeKey);
      setActiveBottomTab("runs");
    }
  }, [nodes, selectedRunEvents]);

  const throttledRecord = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordTimeRef.current < 50) return;
    lastRecordTimeRef.current = now;
    history.record({ nodes, edges });
  }, [history, nodes, edges]);

  const undo = useCallback(() => {
    const previous = history.undo({ nodes, edges });
    if (previous) {
      setNodes(previous.nodes);
      setEdges(previous.edges);
    }
  }, [history, nodes, edges]);

  const redo = useCallback(() => {
    const next = history.redo({ nodes, edges });
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
    }
  }, [history, nodes, edges]);

  const handleDragStart = useCallback(() => {
    throttledRecord();
  }, [throttledRecord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === "z";
      const isY = e.key.toLowerCase() === "y";
      const isMod = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isMod && isZ && isShift) {
        e.preventDefault();
        redo();
      } else if (isMod && isZ) {
        e.preventDefault();
        undo();
      } else if (isMod && isY) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const actions = useWorkflowActions({
    isReadOnly,
    nodes,
    selectedNodeId,
    setNodes,
    setEdges,
    setSelectedNodeId,
    throttledRecord,
    showPaywall,
  });

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedRun =
    recentRuns?.find((run) => run._id === selectedRunId) ?? null;

  const execution = useWorkflowExecution({
    workflowId,
    isReadOnly,
    nodes,
    edges,
    selectedRunId,
    selectedRunEvents,
    selectedRun,
    getToken,
    flushDraftSave,
    setActiveBottomTab,
    setSelectedRunId,
    handleBlockedAction: actions.handleBlockedAction,
  });

  const versionsSecrets = useWorkflowVersionsSecrets({
    workflowId,
    isReadOnly,
    flushDraftSave,
    setActiveBottomTab,
    handleBlockedAction: actions.handleBlockedAction,
  });

  const canPublish = useMemo(() => {
    if (compileStatus !== "valid") return false;
    const startNode = nodes.find((node) => node.data.nodeType === "start");
    return (startNode?.data.config as any)?.triggerType !== "manual";
  }, [compileStatus, nodes]);

  const canRunWorkflow =
    !isReadOnly && compileStatus === "valid" && !execution.isStartingRun;

  return {
    nodes: execution.nodesWithExecutionStatus,
    edges: execution.edgesWithExecutionStatus,
    selectedNode,
    selectedRun,
    recentRuns,
    workflowSecrets,
    workflowVersions,
    publishedVersionId: data?.workflow.publishedVersionId,
    compileStatus,
    canPublish,
    compileErrors,
    saveState,
    activeBottomTab,
    isRunDialogOpen: execution.isRunDialogOpen,
    runInputValue: execution.runInputValue,
    isStartingRun: execution.isStartingRun,
    isPublishing: versionsSecrets.isPublishing,
    isUnpublishing: versionsSecrets.isUnpublishing,
    isReadOnly,
    selectedRunEvents,
    selectedRunId,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setSelectedRunId,
    setActiveBottomTab,
    setIsRunDialogOpen: execution.setIsRunDialogOpen,
    setRunInputValue: execution.setRunInputValue,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    handleDragStart,
    handleAddNode: actions.handleAddNode,
    handleNodesChange: actions.handleNodesChange,
    handleEdgesChange: actions.handleEdgesChange,
    handleConnect: actions.handleConnect,
    handleLabelChange: actions.handleLabelChange,
    handleConfigChange: actions.handleConfigChange,
    handleDeleteNode: actions.handleDeleteNode,
    handleRunWorkflow: execution.handleRunWorkflow,
    handlePublish: versionsSecrets.handlePublish,
    handleUnpublish: versionsSecrets.handleUnpublish,
    handleRestoreVersion: versionsSecrets.handleRestoreVersion,
    handleDeleteVersion: versionsSecrets.handleDeleteVersion,
    handleUpdateVersionMessage: versionsSecrets.handleUpdateVersionMessage,
    handleBlockedAction: actions.handleBlockedAction,
    upsertWorkflowSecret: versionsSecrets.upsertWorkflowSecret,
    deleteWorkflowSecret: versionsSecrets.deleteWorkflowSecret,
    isLoading: data === undefined,
    canRunWorkflow,
  };
};

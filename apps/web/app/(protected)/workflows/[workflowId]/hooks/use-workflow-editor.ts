"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { useSubscriptionAccess } from "@/providers/subscription-access-context";
import { useHistory } from "./use-history";
import type {
  WorkflowCompileStatus,
  WorkflowEditorEdge,
  WorkflowEditorNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
  WorkflowNodeStatus,
  WorkflowSaveState,
  WorkflowBottomTab,
} from "../_components/workflow-editor-types";
import {
  WORKFLOW_NODE_REGISTRY,
  createWorkflowEdgeFromConnection,
  createWorkflowNode,
  createWorkflowNodeKey,
  getEdgePresentation,
  serializeWorkflowGraph,
  toWorkflowEditorEdge,
  toWorkflowEditorNodeWithData,
} from "../_components/workflow-node-registry";

const WORKFLOW_ENGINE_BASE_URL =
  process.env.NEXT_PUBLIC_WORKFLOW_ENGINE_BASE_URL;

const getQuickAddPosition = (
  nodes: WorkflowEditorNode[],
  center: XYPosition,
): XYPosition => {
  const nodeCount = nodes.length;
  return {
    x: center.x + (nodeCount % 5) * 20,
    y: center.y + (nodeCount % 5) * 20,
  };
};

const sanitizeNodeDefinition = (node: WorkflowEditorNode): WorkflowEditorNode => {
  if (node.data.status) {
    const { status: _status, ...cleanData } = node.data;
    return { ...node, data: cleanData };
  }
  return node;
};

export const useWorkflowEditor = (workflowId: string) => {
  const { screenToFlowPosition } = useReactFlow();
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
  const publishWorkflow = useMutation(api.workflows.versions.publishWorkflow);
  const unpublishWorkflow = useMutation(api.workflows.versions.unpublishWorkflow);
  const restoreWorkflowVersion = useMutation(
    api.workflows.versions.restoreWorkflowVersion,
  );
  const deleteWorkflowVersion = useMutation(
    api.workflows.versions.deleteWorkflowVersion,
  );
  const updateVersionMessage = useMutation(
    api.workflows.versions.updateVersionMessage,
  );
  const upsertWorkflowSecret = useMutation(api.workflows.secrets.upsertWorkflowSecret);
  const deleteWorkflowSecretMutation = useMutation(api.workflows.secrets.deleteWorkflowSecret);
  const workflowSecrets = useQuery(api.workflows.secrets.listWorkflowSecrets, {
    workflowId: workflowId as Id<"workflows">,
  });
  const workflowVersions = useQuery(api.workflows.versions.listWorkflowVersions, {
    workflowId: workflowId as Id<"workflows">,
  });

  const [nodes, setNodes] = useState<WorkflowEditorNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEditorEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<Id<"workflow_runs"> | null>(
    null,
  );
  const [compileStatus, setCompileStatus] =
    useState<WorkflowCompileStatus>("invalid");
  const [compileErrors, setCompileErrors] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<WorkflowSaveState>("idle");
  const [activeBottomTab, setActiveBottomTab] =
    useState<WorkflowBottomTab>("validation");
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [runInputValue, setRunInputValue] = useState("{\n  \n}");
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

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

    const nextNodes = data.nodes.map((node) => toWorkflowEditorNodeWithData(node));
    const nextEdges = data.edges.map((edge) => toWorkflowEditorEdge(edge));
    const serverSignature = JSON.stringify(
      serializeWorkflowGraph(nextNodes, nextEdges),
    );

    // 1. If we are just initializing a NEW workflow (switching pages)
    if (initializedWorkflowIdRef.current !== workflowId) {
      initializedWorkflowIdRef.current = workflowId;
      lastPersistedGraphSignatureRef.current = serverSignature;

      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(nextNodes[0]?.id ?? null);
      setCompileStatus(
        (data.draftVersion?.compileStatus ?? "invalid") as WorkflowCompileStatus,
      );
      setCompileErrors(data.draftVersion?.compileErrors ?? []);
      setSaveState("idle");
      history.clear();
      return;
    }

    // 2. If we are already on this workflow, check for REMOTE changes (e.g. AI Agent updates)
    // We only sync if the server's signature is different from our last PERSISTED signature.
    // This allows us to ignore echoes of our own autosaves.
    if (serverSignature !== lastPersistedGraphSignatureRef.current) {
      console.log("🔄 Remote change detected, syncing canvas...");
      lastPersistedGraphSignatureRef.current = serverSignature;

      setNodes(nextNodes);
      setEdges(nextEdges);
      setCompileStatus(
        (data.draftVersion?.compileStatus ?? "invalid") as WorkflowCompileStatus,
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
    setSelectedRunId((currentRunId) => currentRunId || (recentRuns[0]?._id ?? null));
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

  const handleBlockedAction = () => showPaywall(true);

  const handleAddNode = (nodeType: WorkflowNodeKind, position?: XYPosition) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    if (nodeType === "start" && nodes.some((node) => node.data.nodeType === "start")) {
      toast.error("Workflow can only contain one start node");
      return;
    }

    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const nextNode = createWorkflowNode({
      nodeKey: createWorkflowNodeKey(nodeType),
      nodeType,
      position: position ?? getQuickAddPosition(nodes, center),
    });

    throttledRecord();
    setNodes((currentNodes) => [...currentNodes, nextNode]);
    setSelectedNodeId(nextNode.id);
  };

  const handleNodesChange = (changes: NodeChange<WorkflowEditorNode>[]) => {
    const mutableChangeTypes = new Set(["add", "remove", "position", "replace"]);

    if (isReadOnly) {
      if (changes.some((change) => mutableChangeTypes.has(change.type))) {
        handleBlockedAction();
      }
      setNodes((currentNodes) =>
        applyNodeChanges<WorkflowEditorNode>(
          changes.filter((change) => change.type === "select" || change.type === "dimensions"),
          currentNodes,
        ),
      );
      return;
    }

    const filteredChanges = changes.filter((change) => {
      if (change.type !== "remove") return true;
      const targetNode = nodes.find((node) => node.id === change.id);
      return targetNode ? WORKFLOW_NODE_REGISTRY[targetNode.data.nodeType].deletable : true;
    });

    const removedNodeIds = filteredChanges
      .filter((change) => change.type === "remove")
      .map((change) => change.id);

    if (removedNodeIds.length > 0) {
      throttledRecord();
    }

    setNodes((currentNodes) => {
      const nextNodes = applyNodeChanges<WorkflowEditorNode>(
        filteredChanges,
        currentNodes,
      );
      return nextNodes.map(sanitizeNodeDefinition);
    });

    if (removedNodeIds.length > 0) {
      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) => !removedNodeIds.includes(edge.source) && !removedNodeIds.includes(edge.target),
        ),
      );

      if (selectedNodeId && removedNodeIds.includes(selectedNodeId)) {
        setSelectedNodeId(null);
      }
    }
  };

  const handleEdgesChange = (changes: EdgeChange<WorkflowEditorEdge>[]) => {
    const mutableChangeTypes = new Set(["add", "remove", "replace"]);

    if (isReadOnly) {
      if (changes.some((change) => mutableChangeTypes.has(change.type))) {
        handleBlockedAction();
      }
      setEdges((currentEdges) =>
        applyEdgeChanges(
          changes.filter((change) => change.type === "select"),
          currentEdges,
        ),
      );
      return;
    }
    if (changes.some((change) => change.type === "remove")) {
      throttledRecord();
    }
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  };

  const handleConnect = (connection: Connection) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    const nextEdge = createWorkflowEdgeFromConnection(connection);
    if (!nextEdge) return;

    const sourceNode = nodes.find((node) => node.id === nextEdge.source);
    if (!sourceNode) return;

    throttledRecord();
    setEdges((currentEdges) => {
      const retainedEdges = currentEdges.filter((edge) => {
        if (edge.source !== nextEdge.source) return true;
        if (sourceNode.data.nodeType === "condition") {
          return edge.sourceHandle !== nextEdge.sourceHandle;
        }
        return false;
      });
      return [...retainedEdges, nextEdge];
    });
  };

  const handleLabelChange = (nodeId: string, label: string) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }
    throttledRecord();
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? sanitizeNodeDefinition({ ...node, data: { ...node.data, label } })
          : node,
      ),
    );
  };

  const handleConfigChange = (nodeId: string, config: WorkflowNodeConfig) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }
    throttledRecord();
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? sanitizeNodeDefinition({ ...node, data: { ...node.data, config } })
          : node,
      ),
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }
    const node = nodes.find((entry) => entry.id === nodeId);
    if (!node || !WORKFLOW_NODE_REGISTRY[node.data.nodeType].deletable) return;

    throttledRecord();
    setNodes((currentNodes) => currentNodes.filter((entry) => entry.id !== nodeId));
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodeId((currentId) => (currentId === nodeId ? null : currentId));
  };

  const handleRunWorkflow = async () => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    if (!WORKFLOW_ENGINE_BASE_URL) {
      toast.error("Workflow engine URL is not configured");
      return;
    }

    let parsedInput: unknown = undefined;
    const trimmedInput = runInputValue.trim();

    if (trimmedInput) {
      try {
        parsedInput = JSON.parse(trimmedInput);
      } catch {
        toast.error("Run payload must be valid JSON");
        return;
      }
    }

    setIsStartingRun(true);

    try {
      const saveResult = await flushDraftSave();

      if (!saveResult || saveResult.compileStatus !== "valid") {
        setActiveBottomTab("validation");
        toast.error("Fix workflow errors before running a manual test");
        return;
      }

      const token = (await getToken({ template: "convex" })) ?? undefined;

      if (!token) {
        toast.error("Failed to generate the workflow execution token");
        return;
      }

      const response = await fetch(`${WORKFLOW_ENGINE_BASE_URL}/workflows/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, input: parsedInput, sessionToken: token }),
      });

      const payload = await response
        .json()
        .catch(() => ({ error: "Failed to read workflow run response" }));

      if (!response.ok) {
        toast.error(payload.error ?? "Failed to start workflow run");
        return;
      }

      if (payload.runId) {
        setSelectedRunId(payload.runId as Id<"workflow_runs">);
      }

      setActiveBottomTab("runs");
      setIsRunDialogOpen(false);
      toast.success("Workflow run queued");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start workflow run");
    } finally {
      setIsStartingRun(false);
    }
  };

  const handlePublish = async (message?: string) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    setIsPublishing(true);
    try {
      const saveResult = await flushDraftSave();

      if (!saveResult || saveResult.compileStatus !== "valid") {
        setActiveBottomTab("validation");
        toast.error("Workflow has validation errors. Fix them before publishing.");
        return;
      }

      await publishWorkflow({
        workflowId: workflowId as Id<"workflows">,
        message,
      });

      toast.success("Workflow published successfully");
      setActiveBottomTab("versions");
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish workflow");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }
    setIsUnpublishing(true);
    try {
      await unpublishWorkflow({ workflowId: workflowId as Id<"workflows"> });
      toast.success("Workflow unpublished successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to unpublish workflow");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleRestoreVersion = async (versionId: Id<"workflow_versions">) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    try {
      await restoreWorkflowVersion({
        workflowId: workflowId as Id<"workflows">,
        versionId,
      });

      toast.success("Workflow restored to version");
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore workflow version");
    }
  };

  const handleDeleteVersion = async (versionId: Id<"workflow_versions">) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    try {
      await deleteWorkflowVersion({
        workflowId: workflowId as Id<"workflows">,
        versionId,
      });

      toast.success("Workflow version deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete workflow version");
    }
  };

  const handleUpdateVersionMessage = async (
    versionId: Id<"workflow_versions">,
    message: string,
  ) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    try {
      await updateVersionMessage({
        workflowId: workflowId as Id<"workflows">,
        versionId,
        message,
      });

      toast.success("Version message updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update version message");
    }
  };
  const throttledRecord = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordTimeRef.current < 50) return;
    lastRecordTimeRef.current = now;
    history.record({ nodes, edges });
  }, [history, nodes, edges, lastRecordTimeRef]);

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

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedRun = recentRuns?.find((run) => run._id === selectedRunId) ?? null;

  const nodesWithExecutionStatus = useMemo(() => {
    if (!selectedRunId || !selectedRunEvents || selectedRunEvents.length === 0) {
      return nodes.map((node) => {
        if (node.data.status) {
          const { status: _status, ...cleanData } = node.data;
          return { ...node, data: cleanData };
        }
        return node;
      });
    }

    const statusMap = new Map<string, WorkflowNodeStatus>();

    for (const event of selectedRunEvents) {
      if (!event.nodeKey) continue;

      if (event.type === "node_started") {
        statusMap.set(event.nodeKey, "running");
      } else if (event.type === "node_completed") {
        statusMap.set(event.nodeKey, "completed");
      } else if (event.level === "error") {
        statusMap.set(event.nodeKey, "failed");
      }
    }

    // Fallback: If the run itself is finished, no node should be "running"
    if (selectedRun && (selectedRun.status === "completed" || selectedRun.status === "failed")) {
      for (const [nodeKey, status] of statusMap.entries()) {
        if (status === "running") {
          statusMap.set(nodeKey, "completed");
        }
      }
    }

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        status: statusMap.get(node.id) || undefined,
      },
    }));
  }, [nodes, selectedRunEvents, selectedRunId, selectedRun]);

  const canPublish = useMemo(() => {
    if (compileStatus !== "valid") return false;
    const startNode = nodes.find((node) => node.data.nodeType === "start");
    // Cast to any to check triggerType across union types
    return (startNode?.data.config as any)?.triggerType !== "manual";
  }, [compileStatus, nodes]);

  const edgesWithExecutionStatus = useMemo(() => {
    if (
      !selectedRunId ||
      !selectedRunEvents ||
      selectedRunEvents.length === 0 ||
      edges.length === 0
    ) {
      return edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          kind: edge.data?.kind ?? "default",
          active: false,
        },
        ...getEdgePresentation(
          edge.data?.kind ?? "default",
          typeof edge.label === "string" ? edge.label : undefined,
          false,
        ),
      }));
    }

    const nodeStatusMap = new Map<string, WorkflowNodeStatus>();
    let lastCompletedNodeId: string | null = null;

    for (const event of selectedRunEvents) {
      if (!event.nodeKey) continue;

      if (event.type === "node_started") {
        nodeStatusMap.set(event.nodeKey, "running");
      } else if (event.type === "node_completed") {
        nodeStatusMap.set(event.nodeKey, "completed");
        lastCompletedNodeId = event.nodeKey;
      } else if (event.level === "error") {
        nodeStatusMap.set(event.nodeKey, "failed");
      }
    }

    const activeEdgeIds = new Set<string>();

    // Identify the edge leading from the last completed node to the currently running node
    for (const [nodeId, status] of nodeStatusMap.entries()) {
      if (status === "running") {
        const incomingEdge = edges.find(
          (e) => e.target === nodeId && (lastCompletedNodeId ? e.source === lastCompletedNodeId : true)
        );
        if (incomingEdge) {
          activeEdgeIds.add(incomingEdge.id);
        }
      }
    }

    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        kind: edge.data?.kind ?? "default",
        active: activeEdgeIds.has(edge.id),
      },
      ...getEdgePresentation(
        edge.data?.kind ?? "default",
        typeof edge.label === "string" ? edge.label : undefined,
        activeEdgeIds.has(edge.id),
      ),
    }));
  }, [edges, nodes, selectedRunEvents, selectedRunId]);

  const canRunWorkflow = !isReadOnly && compileStatus === "valid" && !isStartingRun;

  return {
    nodes: nodesWithExecutionStatus,
    edges: edgesWithExecutionStatus,
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
    isRunDialogOpen,
    runInputValue,
    isStartingRun,
    isPublishing,
    isUnpublishing,
    isReadOnly,
    selectedRunEvents,
    selectedRunId,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setSelectedRunId,
    setActiveBottomTab,
    setIsRunDialogOpen,
    setRunInputValue,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    handleDragStart,
    handleAddNode,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleLabelChange,
    handleConfigChange,
    handleDeleteNode,
    handleRunWorkflow,
    handlePublish,
    handleUnpublish,
    handleRestoreVersion,
    handleDeleteVersion,
    handleUpdateVersionMessage,
    handleBlockedAction,
    upsertWorkflowSecret: (
      name: string,
      value: string | undefined,
      provider?: string,
      description?: string,
      secretId?: Id<"workflow_secrets">,
    ) =>
      upsertWorkflowSecret({
        workflowId: workflowId as Id<"workflows">,
        name,
        value,
        provider,
        description,
        secretId,
      }).then(() => {
        toast.success(`Secret ${name} saved`);
      }),
    deleteWorkflowSecret: (secretId: Id<"workflow_secrets">) =>
      deleteWorkflowSecretMutation({ workflowId: workflowId as Id<"workflows">, secretId }).then(() => {
        toast.success("Secret deleted");
      }),
    isLoading: data === undefined,
    canRunWorkflow,
  };
};

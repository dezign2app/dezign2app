import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Id } from "@workspace/backend/_generated/dataModel";
import type {
  WorkflowBottomTab,
  WorkflowEditorEdge,
  WorkflowEditorNode,
  WorkflowNodeStatus,
} from "../../_components/workflow-editor-types";
import { getEdgePresentation } from "../../_components/workflow-node-registry";

const WORKFLOW_ENGINE_BASE_URL =
  process.env.NEXT_PUBLIC_WORKFLOW_ENGINE_BASE_URL;

interface UseWorkflowExecutionOptions {
  workflowId: string;
  isReadOnly: boolean;
  nodes: WorkflowEditorNode[];
  edges: WorkflowEditorEdge[];
  selectedRunId: Id<"workflow_runs"> | null;
  selectedRunEvents: any[] | undefined;
  selectedRun: any;
  getToken: (options?: { template?: string }) => Promise<string | null>;
  flushDraftSave: () => Promise<{
    compileStatus: string;
    compileErrors: string[];
  } | null>;
  setActiveBottomTab: (tab: WorkflowBottomTab) => void;
  setSelectedRunId: (runId: Id<"workflow_runs"> | null) => void;
  handleBlockedAction: () => void;
}

export const useWorkflowExecution = ({
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
  handleBlockedAction,
}: UseWorkflowExecutionOptions) => {
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [runInputValue, setRunInputValue] = useState("{\n  \n}");
  const [isStartingRun, setIsStartingRun] = useState(false);

  const nodesWithExecutionStatus = useMemo(() => {
    if (
      !selectedRunId ||
      !selectedRunEvents ||
      selectedRunEvents.length === 0
    ) {
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

    if (
      selectedRun &&
      (selectedRun.status === "completed" || selectedRun.status === "failed")
    ) {
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

    for (const [nodeId, status] of nodeStatusMap.entries()) {
      if (status === "running") {
        const incomingEdge = edges.find(
          (e) =>
            e.target === nodeId &&
            (lastCompletedNodeId ? e.source === lastCompletedNodeId : true),
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

      const response = await fetch(
        `${WORKFLOW_ENGINE_BASE_URL}/workflows/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId,
            input: parsedInput,
            sessionToken: token,
          }),
        },
      );

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

  return {
    isRunDialogOpen,
    setIsRunDialogOpen,
    runInputValue,
    setRunInputValue,
    isStartingRun,
    nodesWithExecutionStatus,
    edgesWithExecutionStatus,
    handleRunWorkflow,
  };
};

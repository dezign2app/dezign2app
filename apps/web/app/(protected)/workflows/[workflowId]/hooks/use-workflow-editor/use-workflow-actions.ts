import {
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { toast } from "sonner";
import type {
  WorkflowEditorEdge,
  WorkflowEditorNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
} from "../../_components/workflow-editor-types";
import {
  WORKFLOW_NODE_REGISTRY,
  createWorkflowEdgeFromConnection,
  createWorkflowNode,
  createWorkflowNodeKey,
} from "../../_components/workflow-node-registry";
import { getQuickAddPosition, sanitizeNodeDefinition } from "./utils";

interface UseWorkflowActionsOptions {
  isReadOnly: boolean;
  nodes: WorkflowEditorNode[];
  selectedNodeId: string | null;
  setNodes: React.Dispatch<React.SetStateAction<WorkflowEditorNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<WorkflowEditorEdge[]>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  throttledRecord: () => void;
  showPaywall: (show: boolean) => void;
}

export const useWorkflowActions = ({
  isReadOnly,
  nodes,
  selectedNodeId,
  setNodes,
  setEdges,
  setSelectedNodeId,
  throttledRecord,
  showPaywall,
}: UseWorkflowActionsOptions) => {
  const { screenToFlowPosition } = useReactFlow();

  const handleBlockedAction = () => showPaywall(true);

  const handleAddNode = (nodeType: WorkflowNodeKind, position?: XYPosition) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    if (
      nodeType === "start" &&
      nodes.some((node) => node.data.nodeType === "start")
    ) {
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
    const mutableChangeTypes = new Set([
      "add",
      "remove",
      "position",
      "replace",
    ]);

    if (isReadOnly) {
      if (changes.some((change) => mutableChangeTypes.has(change.type))) {
        handleBlockedAction();
      }
      setNodes((currentNodes) =>
        applyNodeChanges<WorkflowEditorNode>(
          changes.filter(
            (change) =>
              change.type === "select" || change.type === "dimensions",
          ),
          currentNodes,
        ),
      );
      return;
    }

    const filteredChanges = changes.filter((change) => {
      if (change.type !== "remove") return true;
      const targetNode = nodes.find((node) => node.id === change.id);
      return targetNode
        ? WORKFLOW_NODE_REGISTRY[targetNode.data.nodeType].deletable
        : true;
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
          (edge) =>
            !removedNodeIds.includes(edge.source) &&
            !removedNodeIds.includes(edge.target),
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
    setNodes((currentNodes) =>
      currentNodes.filter((entry) => entry.id !== nodeId),
    );
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );
    setSelectedNodeId((currentId) => (currentId === nodeId ? null : currentId));
  };

  return {
    handleBlockedAction,
    handleAddNode,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    handleLabelChange,
    handleConfigChange,
    handleDeleteNode,
  };
};

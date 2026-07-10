"use client";

import { MarkerType, type Connection } from "@xyflow/react";
import type {
  WorkflowEditorEdge,
  WorkflowEditorNode,
  WorkflowEdgeKind,
  WorkflowNodeConfig,
  WorkflowNodeFactoryArgs,
  WorkflowNodeKind,
  WorkflowSerializedGraph,
} from "./workflow-editor-types";
import { WORKFLOW_NODE_REGISTRY } from "./workflow-nodes";

export { WORKFLOW_NODE_ORDER, WORKFLOW_NODE_REGISTRY } from "./workflow-nodes";

export const getEdgePresentation = (
  kind: WorkflowEdgeKind,
  label?: string,
  active?: boolean,
) => {
  const colorMap: Record<WorkflowEdgeKind, string> = {
    default: active ? "var(--color-primary)" : "var(--color-border)",
    true: active ? "var(--color-primary)" : "var(--color-border)",
    false: active ? "var(--color-destructive)" : "var(--color-border)",
  };

  return {
    label:
      label ??
      (kind === "true" ? "True" : kind === "false" ? "False" : undefined),
    labelShowBg: true,
    labelBgPadding: [10, 4] as [number, number],
    labelBgBorderRadius: 5,
    labelBgStyle: {
      fill: "var(--workflow-edge-label-background)",
      stroke: active ? "var(--color-primary)" : "var(--color-border)",
      strokeWidth: 1,
    },
    style: {
      stroke: colorMap[kind],
      strokeWidth: 1,
      opacity: 1,
      filter: active ? "drop-shadow(0 0 4px var(--color-primary))" : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: colorMap[kind],
    },
    labelStyle: {
      fill: "var(--workflow-edge-label-color)",
      fontWeight: 600,
      fontSize: 11,
    },
    animated: active,
  };
};

export const createWorkflowNodeKey = (nodeType: WorkflowNodeKind) =>
  `${nodeType}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

export const createWorkflowEdgeKey = (
  sourceNodeKey: string,
  targetNodeKey: string,
  sourceHandle?: string | null,
) =>
  `edge-${sourceNodeKey}-${sourceHandle ?? "out"}-${targetNodeKey}-${Date.now()
    .toString(36)
    .slice(-6)}`;

export const createWorkflowNode = ({
  nodeKey,
  nodeType,
  position,
}: WorkflowNodeFactoryArgs): WorkflowEditorNode => ({
  id: nodeKey,
  type: "workflow",
  position,
  deletable: WORKFLOW_NODE_REGISTRY[nodeType].deletable,
  data: {
    nodeType,
    label: WORKFLOW_NODE_REGISTRY[nodeType].title,
    config: WORKFLOW_NODE_REGISTRY[nodeType].createDefaultConfig(),
  },
});

export const createWorkflowEdge = (args: {
  edgeKey: string;
  sourceNodeKey: string;
  targetNodeKey: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  kind: WorkflowEdgeKind;
  label?: string;
  active?: boolean;
}): WorkflowEditorEdge => ({
  id: args.edgeKey,
  source: args.sourceNodeKey,
  target: args.targetNodeKey,
  sourceHandle: args.sourceHandle ?? undefined,
  targetHandle: args.targetHandle ?? undefined,
  type: "workflow",
  data: {
    kind: args.kind,
    active: args.active,
  },
  ...getEdgePresentation(args.kind, args.label, args.active),
});

export const createWorkflowEdgeFromConnection = (
  connection: Connection,
): WorkflowEditorEdge | null => {
  if (!connection.source || !connection.target) {
    return null;
  }

  const kind: WorkflowEdgeKind =
    connection.sourceHandle === "true"
      ? "true"
      : connection.sourceHandle === "false"
        ? "false"
        : "default";

  return createWorkflowEdge({
    edgeKey: createWorkflowEdgeKey(
      connection.source,
      connection.target,
      connection.sourceHandle,
    ),
    sourceNodeKey: connection.source,
    targetNodeKey: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    kind,
  });
};

export const toWorkflowEditorNodeWithData = (node: {
  nodeKey: string;
  type: string;
  label?: string;
  positionX: number;
  positionY: number;
  config: WorkflowNodeConfig;
}): WorkflowEditorNode => ({
  id: node.nodeKey,
  type: "workflow",
  position: {
    x: node.positionX,
    y: node.positionY,
  },
  deletable:
    WORKFLOW_NODE_REGISTRY[node.type as WorkflowNodeKind]?.deletable ?? true,
  data: {
    nodeType: node.type as WorkflowNodeKind,
    label:
      node.label ||
      WORKFLOW_NODE_REGISTRY[node.type as WorkflowNodeKind]?.title ||
      node.type,
    config: node.config,
  },
});

export const toWorkflowEditorEdge = (edge: {
  edgeKey: string;
  sourceNodeKey: string;
  sourceHandle?: string;
  targetNodeKey: string;
  targetHandle?: string;
  kind: WorkflowEdgeKind;
  label?: string;
  active?: boolean;
}) =>
  createWorkflowEdge({
    edgeKey: edge.edgeKey,
    sourceNodeKey: edge.sourceNodeKey,
    targetNodeKey: edge.targetNodeKey,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    kind: edge.kind,
    label: edge.label,
    active: edge.active,
  });

export const serializeWorkflowGraph = (
  nodes: WorkflowEditorNode[],
  edges: WorkflowEditorEdge[],
): WorkflowSerializedGraph => ({
  nodes: [...nodes]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((node) => ({
      nodeKey: node.id,
      type: node.data.nodeType,
      label: node.data.label,
      positionX: Number(node.position.x.toFixed(2)),
      positionY: Number(node.position.y.toFixed(2)),
      config: node.data.config,
    })),
  edges: [...edges]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((edge) => ({
      edgeKey: edge.id,
      sourceNodeKey: edge.source,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetNodeKey: edge.target,
      targetHandle: edge.targetHandle ?? undefined,
      kind: edge.data?.kind ?? "default",
      label: typeof edge.label === "string" ? edge.label : undefined,
    })),
});

export const getWorkflowNodeSummary = (
  nodeType: WorkflowNodeKind,
  config: WorkflowNodeConfig,
) => WORKFLOW_NODE_REGISTRY[nodeType].summarize(config);

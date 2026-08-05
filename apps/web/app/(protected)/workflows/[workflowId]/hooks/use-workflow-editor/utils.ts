import type { XYPosition } from "@xyflow/react";
import type { WorkflowEditorNode } from "../../_components/workflow-editor-types";

export const getQuickAddPosition = (
  nodes: WorkflowEditorNode[],
  center: XYPosition,
): XYPosition => {
  const nodeCount = nodes.length;
  return {
    x: center.x + (nodeCount % 5) * 20,
    y: center.y + (nodeCount % 5) * 20,
  };
};

export const sanitizeNodeDefinition = (
  node: WorkflowEditorNode,
): WorkflowEditorNode => {
  if (node.data.status) {
    const { status: _status, ...cleanData } = node.data;
    return { ...node, data: cleanData };
  }
  return node;
};

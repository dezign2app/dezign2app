import type { WorkflowNodeDefinition, WorkflowNodeKind } from "../workflow-editor-types";
import { apiNode } from "./api";
import { conditionNode } from "./condition";
import { endNode } from "./end";
import { llmNode } from "./llm";
import { startNode } from "./start";

export const WORKFLOW_NODE_REGISTRY: Record<WorkflowNodeKind, WorkflowNodeDefinition> = {
  start: startNode,
  condition: conditionNode,
  api: apiNode,
  llm: llmNode,
  end: endNode,
};

export const WORKFLOW_NODE_ORDER: WorkflowNodeKind[] = [
  "start",
  "condition",
  "api",
  "llm",
  "end",
];

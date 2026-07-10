"use client";

import type { LucideIcon } from "lucide-react";
import type { Edge, Node, XYPosition } from "@xyflow/react";
import type { Id } from "@workspace/backend/_generated/dataModel";

export const WORKFLOW_NODE_MIME_TYPE = "application/x-workflow-node";

export type WorkflowNodeKind =
  | "start"
  | "condition"
  | "api"
  | "llm"
  | "end";

export type WorkflowEdgeKind = "default" | "true" | "false";
export type WorkflowCompileStatus = "valid" | "invalid";
export type WorkflowSaveState = "idle" | "saving" | "saved" | "error";
export type WorkflowNodeStatus = "pending" | "running" | "completed" | "failed";
export type WorkflowBottomTab = "validation" | "runs" | "secrets" | "versions";

export type WorkflowTriggerType = "manual" | "cron";
export type WorkflowConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "gt"
  | "lt";
export type WorkflowHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type WorkflowAuthType =
  | "none"
  | "bearer"
  | "api_key_header"
  | "api_key_query"
  | "basic";
export type WorkflowLlmProvider = "openai" | "gemini" | "groq";
export type WorkflowLlmOutputMode = "text" | "json";

export interface StartNodeConfig {
  triggerType: WorkflowTriggerType;
  cronExpression: string;
  timezone: string;
}

export interface ConditionNodeConfig {
  leftOperand: string;
  operator: WorkflowConditionOperator;
  rightOperand: string;
}

export interface ApiNodeConfig {
  method: WorkflowHttpMethod;
  url: string;
  headers: string;
  query: string;
  body: string;
  authType: WorkflowAuthType;
  authSecretId: Id<"workflow_secrets"> | undefined;
  authHeaderName?: string;
  authQueryName?: string;
  authUsername?: string;
  timeoutMs: number;
}

export interface LlmNodeConfig {
  provider: WorkflowLlmProvider;
  model: string;
  systemPrompt: string;
  prompt: string;
  outputMode: WorkflowLlmOutputMode;
  temperature: number;
  apiKeySecretId: Id<"workflow_secrets"> | undefined;
}

export interface EndNodeConfig {
  resultExpression: string;
}

export type WorkflowNodeConfig =
  | StartNodeConfig
  | ConditionNodeConfig
  | ApiNodeConfig
  | LlmNodeConfig
  | EndNodeConfig;

export interface WorkflowEditorNodeData {
  nodeType: WorkflowNodeKind;
  label: string;
  config: WorkflowNodeConfig;
  status?: WorkflowNodeStatus;
}

export interface WorkflowEditorEdgeData {
  kind: WorkflowEdgeKind;
  active?: boolean;
}

export type WorkflowEditorNode = Node<WorkflowEditorNodeData, "workflow">;
export type WorkflowEditorEdge = Edge<WorkflowEditorEdgeData>;

export interface SerializedWorkflowNode {
  nodeKey: string;
  type: WorkflowNodeKind;
  label?: string;
  positionX: number;
  positionY: number;
  config: WorkflowNodeConfig;
}

export interface SerializedWorkflowEdge {
  edgeKey: string;
  sourceNodeKey: string;
  sourceHandle?: string;
  targetNodeKey: string;
  targetHandle?: string;
  kind: WorkflowEdgeKind;
  label?: string;
}

export interface WorkflowSerializedGraph {
  nodes: SerializedWorkflowNode[];
  edges: SerializedWorkflowEdge[];
}

export interface WorkflowSaveResult {
  compileStatus: WorkflowCompileStatus;
  compileErrors: string[];
  updatedAt: number;
}

export type WorkflowHandleDefinition = {
  id: string;
  label?: string;
};

export type WorkflowNodeDefinition = {
  title: string;
  paletteDescription: string;
  badge: string;
  minimapColor: string;
  accentClassName: string;
  icon: LucideIcon;
  deletable: boolean;
  hasTargetHandle: boolean;
  sourceHandles: WorkflowHandleDefinition[];
  createDefaultConfig: () => WorkflowNodeConfig;
  summarize: (config: WorkflowNodeConfig) => string[];
};

export interface WorkflowNodeFactoryArgs {
  nodeKey: string;
  nodeType: WorkflowNodeKind;
  position: XYPosition;
}

export interface WorkflowSecret {
  _id: Id<"workflow_secrets">;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

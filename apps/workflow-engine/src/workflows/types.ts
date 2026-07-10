import type { ConvexHttpClient } from "convex/browser";
import type { Doc, Id } from "@workspace/backend/_generated/dataModel";

export type WorkflowRunContext = {
  workflow: Doc<"workflows">;
  run: Doc<"workflow_runs">;
  version: Doc<"workflow_versions">;
  nodes: Doc<"workflow_nodes">[];
  edges: Doc<"workflow_edges">[];
};

export type WorkflowNodeConfig = Record<string, unknown>;
export type WorkflowNodeDoc = Doc<"workflow_nodes">;
export type WorkflowEdgeDoc = Doc<"workflow_edges">;

export type WorkflowRuntimeState = {
  input: unknown;
  outputs: Record<
    string,
    {
      output: unknown;
      nodeType: string;
      label?: string;
    }
  >;
};

export type WorkflowEventLevel = "debug" | "info" | "warn" | "error";

export type WorkflowRuntimeEvent = {
  type: string;
  level: WorkflowEventLevel;
  nodeKey?: string;
  payload?: unknown;
};

export type WorkflowNodeExecutionResult = {
  output: unknown;
  nextNodeKey?: string;
  completed?: boolean;
};

export type WorkflowNodeExecutor = {
  execute: (
    args: WorkflowNodeExecutionArgs,
  ) => Promise<WorkflowNodeExecutionResult> | WorkflowNodeExecutionResult;
  resolveInputs?: (
    args: WorkflowNodeExecutionArgs,
  ) => Promise<unknown> | unknown;
};

export type WorkflowNodeExecutionArgs = {
  client: ConvexHttpClient;
  workflow: Doc<"workflows">;
  run: Doc<"workflow_runs">;
  node: WorkflowNodeDoc;
  nodesByKey: Map<string, WorkflowNodeDoc>;
  outgoingEdgesByNodeKey: Map<string, WorkflowEdgeDoc[]>;
  runtimeState: WorkflowRuntimeState;
  secretCache: Map<string, string>;
  onFailure?: (expr: string) => void;
};

import { ConvexError, v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

export const DEFAULT_START_NODE_KEY = "start";
export const DEFAULT_END_NODE_KEY = "end";

// Validators
export const workflowNodeInputValidator = v.object({
  nodeKey: v.string(),
  type: v.string(),
  label: v.optional(v.string()),
  positionX: v.float64(),
  positionY: v.float64(),
  config: v.any(),
});

export const workflowEdgeInputValidator = v.object({
  edgeKey: v.string(),
  sourceNodeKey: v.string(),
  sourceHandle: v.optional(v.string()),
  targetNodeKey: v.string(),
  targetHandle: v.optional(v.string()),
  kind: v.union(v.literal("default"), v.literal("true"), v.literal("false")),
  label: v.optional(v.string()),
});

// Types
export type WorkflowContext = QueryCtx | MutationCtx;
export type WorkflowNodeInput = {
  nodeKey: string;
  type: string;
  label?: string;
  positionX: number;
  positionY: number;
  config: any;
};
export type WorkflowEdgeInput = {
  edgeKey: string;
  sourceNodeKey: string;
  sourceHandle?: string;
  targetNodeKey: string;
  targetHandle?: string;
  kind: "default" | "true" | "false";
  label?: string;
};

// Encryption helpers
export const getMasterKey = async () => {
  const keyStr = process.env.WORKFLOW_SECRETS_MASTER_KEY;
  if (!keyStr) {
    throw new ConvexError({
      code: "INTERNAL_SERVER_ERROR",
      message: "WORKFLOW_SECRETS_MASTER_KEY environment variable is not set",
    });
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyStr);
  const hash = await crypto.subtle.digest("SHA-256", keyData);

  return await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptSecret = async (plainText: string): Promise<string> => {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plainText);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
};

export const decryptSecret = async (encryptedBase64: string): Promise<string> => {
  try {
    const key = await getMasterKey();
    const combined = new Uint8Array(
      atob(encryptedBase64).split("").map((c) => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    throw new ConvexError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to decrypt secret. Ensure the master key is correct.",
    });
  }
};

// Auth and Access
export const requireIdentity = async (
  ctx: WorkflowContext,
  systemToken?: string,
) => {
  if (systemToken && systemToken === process.env.SYSTEM_CORE_SECRET) {
    return {
      subject: "system",
      name: "System Agent",
      isSystem: true,
    };
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }
  return identity;
};

export const getIdentityOrganizationId = (identity: any) =>
  identity.org_id?.toString() ?? identity.orgId?.toString();

export const assertWorkflowAccess = async (
  ctx: WorkflowContext,
  workflowId: Id<"workflows">,
  identity: any,
) => {
  const workflow = await ctx.db.get(workflowId);
  if (!workflow || workflow.isArchived) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Workflow not found",
    });
  }

  if (identity.isSystem) {
    return workflow;
  }

  const identityOrganizationId = getIdentityOrganizationId(identity);
  const canAccessFromOrganization =
    workflow.organizationId !== undefined &&
    workflow.organizationId === identityOrganizationId;
  const canAccessPersonalWorkflow =
    workflow.organizationId === undefined &&
    workflow.createdBy === identity.subject;

  if (!canAccessFromOrganization && !canAccessPersonalWorkflow) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Not authorized to access this workflow",
    });
  }

  return workflow;
};

export const assertWorkflowRunAccess = async (
  ctx: WorkflowContext,
  runId: Id<"workflow_runs">,
  identity: any,
) => {
  const run = await ctx.db.get(runId);
  if (!run) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Workflow run not found",
    });
  }
  const workflow = await assertWorkflowAccess(ctx, run.workflowId, identity);
  return { run, workflow };
};

// Graph logic
export const getNextRunEventSequence = async (
  ctx: WorkflowContext,
  runId: Id<"workflow_runs">,
) => {
  const lastEvent = await ctx.db
    .query("workflow_run_events")
    .withIndex("by_run_seq", (q) => q.eq("runId", runId))
    .order("desc")
    .first();

  return lastEvent ? lastEvent.seq + 1 : 0;
};

export const buildAdjacencyMap = (
  nodeKeys: string[],
  edges: WorkflowEdgeInput[],
): Map<string, string[]> => {
  const adjacency = new Map(nodeKeys.map((nodeKey) => [nodeKey, [] as string[]]));

  for (const edge of edges) {
    if (!adjacency.has(edge.sourceNodeKey) || !adjacency.has(edge.targetNodeKey)) continue;
    adjacency.get(edge.sourceNodeKey)?.push(edge.targetNodeKey);
  }

  return adjacency;
};

export const hasCycle = (nodeKeys: string[], edges: WorkflowEdgeInput[]) => {
  const adjacency = buildAdjacencyMap(nodeKeys, edges);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeKey: string): boolean => {
    if (visiting.has(nodeKey)) return true;
    if (visited.has(nodeKey)) return false;

    visiting.add(nodeKey);
    for (const nextNodeKey of adjacency.get(nodeKey) ?? []) {
      if (visit(nextNodeKey)) return true;
    }
    visiting.delete(nodeKey);
    visited.add(nodeKey);

    return false;
  };

  return nodeKeys.some((nodeKey) => visit(nodeKey));
};

export const validateDraftGraph = (
  nodes: WorkflowNodeInput[],
  edges: WorkflowEdgeInput[],
) => {
  const errors: string[] = [];
  const nodeMap = new Map<string, WorkflowNodeInput>();
  const edgeMap = new Set<string>();

  for (const node of nodes) {
    if (nodeMap.has(node.nodeKey)) {
      errors.push(`Duplicate node key "${node.nodeKey}".`);
      continue;
    }
    nodeMap.set(node.nodeKey, node);
  }

  for (const edge of edges) {
    if (edgeMap.has(edge.edgeKey)) {
      errors.push(`Duplicate edge key "${edge.edgeKey}".`);
      continue;
    }
    edgeMap.add(edge.edgeKey);

    if (!nodeMap.has(edge.sourceNodeKey)) {
      errors.push(`Edge "${edge.edgeKey}" references missing source node "${edge.sourceNodeKey}".`);
    }
    if (!nodeMap.has(edge.targetNodeKey)) {
      errors.push(`Edge "${edge.edgeKey}" references missing target node "${edge.targetNodeKey}".`);
    }
    if (edge.sourceNodeKey === edge.targetNodeKey) {
      errors.push(`Edge "${edge.edgeKey}" cannot point to the same node.`);
    }
  }

  const startNodes = nodes.filter((node) => node.type === "start");
  const endNodes = nodes.filter((node) => node.type === "end");

  if (startNodes.length !== 1) errors.push("Workflow must contain exactly one start node.");
  if (endNodes.length < 1) errors.push("Workflow must contain at least one end node.");

  for (const node of nodes) {
    const outgoingEdges = edges.filter((edge) => edge.sourceNodeKey === node.nodeKey);
    const incomingEdges = edges.filter((edge) => edge.targetNodeKey === node.nodeKey);

    if (node.type === "start") {
      if (incomingEdges.length > 0) errors.push(`Start node "${node.nodeKey}" cannot have incoming edges.`);
      if ((node.config?.triggerType ?? "manual") === "cron") {
        if (!node.config?.cronExpression?.trim()) errors.push("Cron start nodes require a cron expression.");
        if (!node.config?.timezone?.trim()) errors.push("Cron start nodes require an explicit timezone.");
      }
    }

    if (node.type === "condition") {
      const trueBranchCount = outgoingEdges.filter((edge) => edge.sourceHandle === "true").length;
      const falseBranchCount = outgoingEdges.filter((edge) => edge.sourceHandle === "false").length;
      if (trueBranchCount !== 1) errors.push(`Condition node "${node.nodeKey}" must have exactly one true branch.`);
      if (falseBranchCount !== 1) errors.push(`Condition node "${node.nodeKey}" must have exactly one false branch.`);
    }

    if (node.type !== "condition" && node.type !== "end" && outgoingEdges.length > 1) {
      errors.push(`Node "${node.nodeKey}" can only have one outgoing edge.`);
    }

    if (node.type === "end" && outgoingEdges.length > 0) errors.push(`End node "${node.nodeKey}" cannot have outgoing edges.`);
    if (node.type === "api" && !node.config?.url?.trim()) errors.push(`API node "${node.nodeKey}" requires a URL.`);
    if (node.type === "llm" && !node.config?.model?.trim()) errors.push(`LLM node "${node.nodeKey}" requires a model.`);
    if (node.type === "end" && !node.config?.resultExpression?.trim()) errors.push(`End node "${node.nodeKey}" requires a result expression.`);
  }

  if (hasCycle([...nodeMap.keys()], edges)) errors.push("Workflow graph cannot contain cycles.");

  return [...new Set(errors)];
};

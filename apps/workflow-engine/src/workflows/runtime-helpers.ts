import { ConvexHttpClient } from "convex/browser";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";

import { WorkflowRunContext, WorkflowNodeDoc, WorkflowEdgeDoc } from "./types";

export const resolveSecretValueByName = async (
  client: ConvexHttpClient,
  workflowId: Id<"workflows">,
  secretName: string,
  secretCache: Map<string, string>,
) => {
  const cacheKey = `name:${secretName}`;
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey)!;
  }

  const secret = await client.query(api.workflows.secrets.getWorkflowSecretByNameForExecution, {
    workflowId,
    secretName,
  });

  secretCache.set(cacheKey, secret.value);
  return secret.value;
};

export const resolveSecretValueById = async (
  client: ConvexHttpClient,
  workflowId: Id<"workflows">,
  secretId: Id<"workflow_secrets">,
  secretCache: Map<string, string>,
) => {
  const cacheKey = `id:${secretId}`;
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey)!;
  }

  const secret = await client.query(api.workflows.secrets.getWorkflowSecretByIdForExecution, {
    workflowId,
    secretId,
  });

  secretCache.set(cacheKey, secret.value);
  return secret.value;
};

export const getWorkflowMaps = (context: WorkflowRunContext) => ({
  nodesByKey: new Map<string, WorkflowNodeDoc>(
    context.nodes.map((node) => [node.nodeKey, node])
  ),
  outgoingEdgesByNodeKey: context.edges.reduce(
    (map, edge) => {
      const existingEdges = map.get(edge.sourceNodeKey) ?? [];
      existingEdges.push(edge);
      map.set(edge.sourceNodeKey, existingEdges);
      return map;
    },
    new Map<string, WorkflowEdgeDoc[]>(),
  ),
});


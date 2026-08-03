"use client";

import { useEffect } from "react";
import { Doc } from "@workspace/backend/_generated/dataModel";
import {
  useBackendCanvasStore,
  parseResourceHandle,
} from "@/lib/stores/backendCanvasStore";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import {
  endpointSchema,
  publishedEventSchema,
  consumedEventSchema,
  identityProviderSchema,
} from "@workspace/canvas/schemas";
import { z } from "zod";
import { BackendNode, BackendEdge } from "@/types/canvas";

type CanvasElements = {
  nodes?: any[];
  edges?: any[];
  endpoints?: any[];
  events?: any[];
  identityProviders?: any[];
  testCases?: any[];
} | undefined;

/**
 * Hydrates the Zustand canvas store from Convex data when the compiler page
 * is opened directly (i.e. without having visited the canvas first).
 * No-ops if the store is already populated for this project.
 */
export function useStoreHydration(
  projectId: string,
  canvasElements: CanvasElements,
) {
  const storeProjectId = useBackendCanvasStore((s) => s.projectId);

  useEffect(() => {
    if (canvasElements === undefined) return; // still loading
    if (storeProjectId === projectId) return; // already hydrated

    const rawNodes: BackendNode[] = (canvasElements.nodes ?? []).map(
      (row: Doc<"canvas_backend_nodes">) => {
        const pos = row.data?.position ?? row.position;
        return {
          id: row.nodeId,
          type: row.type as BackendNode["type"],
          position: pos,
          data: { ...row.data, position: pos },
          fractionalIndex: row.fractionalIndex,
          parentId: row.data?.parentId,
        } as BackendNode;
      }
    );

    const rawEdges: BackendEdge[] = (canvasElements.edges ?? []).map(
      (row: Doc<"canvas_backend_edges">) => {
        const src = parseResourceHandle(row.sourceHandle);
        const tgt = parseResourceHandle(row.targetHandle);
        return {
          id: row.edgeId,
          source: row.source,
          target: row.target,
          type: row.type as BackendEdge["type"],
          sourceHandle: row.sourceHandle ?? undefined,
          targetHandle: row.targetHandle ?? undefined,
          sourceResourceId: src?.resourceId,
          targetResourceId: tgt?.resourceId,
          resourceType: tgt?.resourceType ?? src?.resourceType,
          data: row.data,
          fractionalIndex: row.fractionalIndex,
        };
      }
    );

    const fullEndpointSchema = endpointSchema.extend({ nodeId: z.string() });
    const fullEventSchema = z.union([
      publishedEventSchema.extend({ nodeId: z.string(), variant: z.literal("publish") }),
      consumedEventSchema.extend({ nodeId: z.string(), variant: z.literal("consume") }),
    ]);
    const fullIdpSchema = identityProviderSchema.extend({ nodeId: z.string() });

    const parsedEndpoints = z.array(fullEndpointSchema).parse(canvasElements.endpoints || []);
    const parsedEvents = z.array(fullEventSchema).parse(canvasElements.events || []);
    const parsedProviders = z.array(fullIdpSchema).parse(canvasElements.identityProviders || []);

    useBackendCanvasStore.getState().setNodesAndEdges(
      rawNodes,
      rawEdges,
      parsedEndpoints,
      parsedEvents,
      parsedProviders,
      projectId,
    );

    useSimulationStore
      .getState()
      .setTestCases((canvasElements.testCases || []) as any);
  }, [canvasElements, storeProjectId, projectId]);
}

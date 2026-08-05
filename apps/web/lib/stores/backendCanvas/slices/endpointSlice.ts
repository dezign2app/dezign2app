import { BackendEdge } from "@/types/canvas";
import { Endpoint } from "@workspace/canvas/types";
import { generateKeyBetween } from "fractional-indexing";
import {
  BackendCanvasState,
  EndpointWithNode,
  PendingEndpointRemoval,
} from "../types";
import { syncConfiguredEventEdge } from "../edgeSync";
import { getLastIndex } from "../utils";

export interface EndpointSlice {
  endpoints: EndpointWithNode[];
  pendingEndpointUpserts: EndpointWithNode[];
  pendingEndpointRemovals: PendingEndpointRemoval[];
  addEndpoint: (nodeId: string, endpoint: Endpoint) => void;
  updateEndpoint: (id: string, changes: Partial<Endpoint>) => void;
  deleteEndpoint: (id: string) => void;
}

export const createEndpointSlice = (
  set: (
    partial:
      | Partial<BackendCanvasState>
      | ((state: BackendCanvasState) => Partial<BackendCanvasState>),
  ) => void,
  get: () => BackendCanvasState,
): EndpointSlice => ({
  endpoints: [],
  pendingEndpointUpserts: [],
  pendingEndpointRemovals: [],

  addEndpoint: (nodeId, endpoint) => {
    const newEndpoint = { ...endpoint, nodeId };
    set({
      endpoints: [...get().endpoints, newEndpoint],
      pendingEndpointUpserts: [...get().pendingEndpointUpserts, newEndpoint],
    });
  },

  updateEndpoint: (id, changes) => {
    const next = get().endpoints.map((e) =>
      e.id === id ? { ...e, ...changes } : e,
    );
    const updated = next.find((e) => e.id === id);
    if (updated) {
      let nextEdges = [...get().edges];
      const addedEdges: BackendEdge[] = [];
      const removedEdgeIds: string[] = [];

      let nextEvents = [...get().events];
      const pendingEventRemovals = [...get().pendingEventRemovals];

      if ("publishedEvents" in changes && changes.publishedEvents) {
        const oldEp = get().endpoints.find((e) => e.id === id);
        const oldPubIds = new Set(
          oldEp?.publishedEvents?.map((e) => e.id) || [],
        );
        const newPubIds = new Set(changes.publishedEvents.map((e) => e.id));

        const removedPubIds = Array.from(oldPubIds).filter(
          (eId) => !newPubIds.has(eId),
        );
        if (removedPubIds.length > 0) {
          nextEvents = nextEvents.filter((ev) => !removedPubIds.includes(ev.id));
          removedPubIds.forEach((eId) => {
            pendingEventRemovals.push({ nodeId: updated.nodeId, eventId: eId });
            const handle = `publishedEvents-out-${eId}`;
            nextEdges
              .filter((edge) => edge && edge.sourceHandle === handle)
              .forEach((edge) => {
                removedEdgeIds.push(edge.id);
              });
            nextEdges = nextEdges.filter(
              (edge) => edge && edge.sourceHandle !== handle,
            );
          });
        }
      }

      if (updated.publishedEvents) {
        for (const event of updated.publishedEvents) {
          const synced = syncConfiguredEventEdge(
            event,
            updated.nodeId,
            "publish",
            get().nodes,
            nextEdges,
          );
          nextEdges = synced.edges;
          addedEdges.push(...synced.added);
          removedEdgeIds.push(...synced.removed);
        }
      }

      // Sync database table reference edges for this endpoint ONLY IF databaseNodeIds or databaseNodeId is in changes
      const hasDbChanges =
        "databaseNodeIds" in changes || "databaseNodeId" in changes;
      if (hasDbChanges) {
        const targetDbNodeIds = new Set<string>();
        if (updated.databaseNodeIds) {
          updated.databaseNodeIds.forEach(
            (dbId) => dbId && targetDbNodeIds.add(dbId),
          );
        } else if (updated.databaseNodeId && updated.databaseNodeId !== "none") {
          targetDbNodeIds.add(updated.databaseNodeId);
        }

        const epSourceHandle = `endpoint-out-${updated.id}`;
        const existingDbEdges = nextEdges.filter(
          (e) =>
            e && e.source === updated.nodeId && e.sourceHandle === epSourceHandle,
        );

        // 1. Remove edges ONLY to DB nodes no longer in targetDbNodeIds
        existingDbEdges.forEach((edge) => {
          if (edge) {
            const targetNode = get().nodes.find((n) => n?.id === edge.target);
            const isDbNode =
              targetNode &&
              (targetNode.type === "db_ref" || targetNode.type === "database");
            if (isDbNode && !targetDbNodeIds.has(edge.target)) {
              nextEdges = nextEdges.filter((e) => e && e.id !== edge.id);
              removedEdgeIds.push(edge.id);
            }
          }
        });

        // 2. Add missing edges for DB nodes in targetDbNodeIds
        targetDbNodeIds.forEach((targetDbId) => {
          const hasEdge = nextEdges.some(
            (e) =>
              e &&
              e.source === updated.nodeId &&
              e.sourceHandle === epSourceHandle &&
              e.target === targetDbId,
          );
          const targetNode = get().nodes.find((n) => n?.id === targetDbId);
          if (
            !hasEdge &&
            targetNode &&
            (targetNode.type === "db_ref" || targetNode.type === "database")
          ) {
            const lastEdgeIndex = getLastIndex(nextEdges);
            const fractionalIndex = generateKeyBetween(lastEdgeIndex, null);
            const newEdge: BackendEdge = {
              id: `edge-${Date.now()}-${updated.id}-${targetDbId}`,
              source: updated.nodeId,
              target: targetDbId,
              type: "connection",
              sourceHandle: epSourceHandle,
              targetHandle: "database-target",
              fractionalIndex,
            };
            nextEdges.push(newEdge);
            addedEdges.push(newEdge);
          }
        });
      }

      set({
        endpoints: next,
        events: nextEvents,
        pendingEventRemovals,
        edges: nextEdges,
        pendingEndpointUpserts: [...get().pendingEndpointUpserts, updated],
        pendingEdgeUpserts: [...get().pendingEdgeUpserts, ...addedEdges],
        pendingEdgeRemovals: [...get().pendingEdgeRemovals, ...removedEdgeIds],
      });
    }
  },

  deleteEndpoint: (id) => {
    const endpoint = get().endpoints.find((e) => e.id === id);
    if (endpoint) {
      const active = get().activeConfigItem;
      set({
        endpoints: get().endpoints.filter((e) => e.id !== id),
        activeConfigItem: active?.id === id ? null : active,
        pendingEndpointRemovals: [
          ...get().pendingEndpointRemovals,
          { nodeId: endpoint.nodeId, endpointId: id },
        ],
      });
    }
  },
});

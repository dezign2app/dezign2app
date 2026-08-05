import { BackendEdge } from "@/types/canvas";
import { isValidConnection } from "@workspace/canvas";
import {
  applyEdgeChanges,
  addEdge as addReactFlowEdge,
  EdgeChange,
  Connection,
} from "@xyflow/react";
import { generateKeyBetween } from "fractional-indexing";
import { BackendCanvasState } from "../types";
import { cleanupDeletedEdgesState } from "../stateCleanup";
import { getLastIndex, parseResourceHandle } from "../utils";

export interface EdgeSlice {
  edges: BackendEdge[];
  pendingEdgeUpserts: BackendEdge[];
  pendingEdgeRemovals: string[];
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addEdge: (edge: Omit<BackendEdge, "fractionalIndex">) => void;
  updateEdge: (id: string, changes: Partial<BackendEdge>) => void;
  deleteEdge: (id: string) => void;
}

export const createEdgeSlice = (
  set: (
    partial:
      | Partial<BackendCanvasState>
      | ((state: BackendCanvasState) => Partial<BackendCanvasState>),
  ) => void,
  get: () => BackendCanvasState,
): EdgeSlice => ({
  edges: [],
  pendingEdgeUpserts: [],
  pendingEdgeRemovals: [],

  onEdgesChange: (changes) => {
    const rawEdgesNext = applyEdgeChanges<BackendEdge>(changes, get().edges);
    const next = rawEdgesNext.filter((e): e is BackendEdge => Boolean(e?.id));
    const removedIds: string[] = changes
      .filter((c) => c.type === "remove")
      .map((c) => c.id);

    const persistentChangedEdgeIds = new Set(
      changes
        .filter((c) => c.type === "add" || c.type === "replace")
        .map((c) => c.id),
    );

    const upserts = next.filter((e) => persistentChangedEdgeIds.has(e.id));

    let updates: Partial<BackendCanvasState> = {
      edges: next,
      pendingEdgeUpserts: [...get().pendingEdgeUpserts, ...upserts],
    };

    if (removedIds.length > 0) {
      const edgeCleanupUpdates = cleanupDeletedEdgesState(get(), removedIds);
      updates = { ...updates, ...edgeCleanupUpdates };
    }

    set(updates);
  },

  onConnect: (connection) => {
    const sourceNode = get().nodes.find((n) => n.id === connection.source);
    const targetNode = get().nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return;

    const result = isValidConnection(
      sourceNode.type,
      connection.sourceHandle,
      targetNode.type,
      connection.targetHandle,
      {
        sourceNodeId: connection.source!,
        targetNodeId: connection.target!,
        existingEdges: get().edges,
      },
    );

    if (!result.valid) {
      console.warn("Invalid connection attempted:", result.message);
      return;
    }

    const edgeType = result.edgeType;
    const isColumnToColumn = edgeType === "foreign-key";
    const isPublishedConnect = connection.sourceHandle?.startsWith(
      "publishedEvents-out-",
    );
    const isConsumedConnect =
      connection.targetHandle?.startsWith("consumedEvents-in-");

    const parsedTarget = parseResourceHandle(connection.targetHandle);
    const parsedSource = parseResourceHandle(connection.sourceHandle);

    const targetResourceId = parsedTarget?.resourceId;
    const sourceResourceId = parsedSource?.resourceId;
    const resourceType =
      parsedTarget?.resourceType || parsedSource?.resourceType;

    const lastEdgeIndex = getLastIndex(get().edges);
    const fractionalIndex = generateKeyBetween(lastEdgeIndex, null);

    const newEdge: BackendEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      type: edgeType as BackendEdge["type"],
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      fractionalIndex,
      targetResourceId,
      sourceResourceId,
      resourceType,
    };

    const next = addReactFlowEdge(newEdge, get().edges);
    set({
      edges: next,
      pendingEdgeUpserts: [...get().pendingEdgeUpserts, newEdge],
    });

    // Update targetNodeId on service events if connected via messaging handles
    if (isPublishedConnect && connection.sourceHandle) {
      const eventId = connection.sourceHandle.replace(
        "publishedEvents-out-",
        "",
      );
      get().updateEvent(eventId, {
        brokerNodeId: connection.target ?? undefined,
      });
    }

    if (isConsumedConnect && connection.targetHandle) {
      const eventId = connection.targetHandle.replace("consumedEvents-in-", "");
      get().updateEvent(eventId, {
        brokerNodeId: connection.source ?? undefined,
      });
    }

    const isEndpointConnect = connection.sourceHandle?.startsWith("endpoint-out-");
    if (isEndpointConnect && connection.sourceHandle && connection.target) {
      const endpointId = connection.sourceHandle.replace("endpoint-out-", "");
      const targetNode = get().nodes.find((n) => n.id === connection.target);
      if (
        targetNode &&
        (targetNode.type === "db_ref" || targetNode.type === "database")
      ) {
        const endpoint = get().endpoints.find((e) => e.id === endpointId);
        if (endpoint) {
          const currentDbIds =
            endpoint.databaseNodeIds ||
            (endpoint.databaseNodeId && endpoint.databaseNodeId !== "none"
              ? [endpoint.databaseNodeId]
              : []);
          if (!currentDbIds.includes(connection.target)) {
            const newDbIds = [...currentDbIds, connection.target];
            get().updateEndpoint(endpointId, {
              databaseNodeIds: newDbIds,
              databaseNodeId: newDbIds[0] || "none",
            });
          }
        }
      }
    }

    // Update source node's column to isForeignKey: true if it's a foreign key edge
    if (isColumnToColumn && connection.sourceHandle?.startsWith("source-")) {
      const colIndex = parseInt(
        connection.sourceHandle.replace("source-", ""),
        10,
      );
      if (!isNaN(colIndex) && sourceNode.data.columns) {
        const column = sourceNode.data.columns[colIndex];
        if (column) {
          const newCols = [...sourceNode.data.columns];
          newCols[colIndex] = { ...column, isForeignKey: true };
          get().updateNode(sourceNode.id, {
            data: { ...sourceNode.data, columns: newCols },
          });
        }
      }
    }
  },

  addEdge: (edgeWithoutIndex) => {
    const lastEdgeIndex = getLastIndex(get().edges);
    const fractionalIndex = generateKeyBetween(lastEdgeIndex, null);
    const edge = { ...edgeWithoutIndex, fractionalIndex };
    const next = [...get().edges, edge];
    set({
      edges: next,
      pendingEdgeUpserts: [...get().pendingEdgeUpserts, edge],
    });
  },

  updateEdge: (id, changes) => {
    const next = get().edges.map((e) =>
      e.id === id ? { ...e, ...changes } : e,
    );
    const updated = next.find((e) => e.id === id)!;
    set({
      edges: next,
      pendingEdgeUpserts: [...get().pendingEdgeUpserts, updated],
    });
  },

  deleteEdge: (id) => {
    const updates = cleanupDeletedEdgesState(get(), [id]);
    set(updates);
  },
});

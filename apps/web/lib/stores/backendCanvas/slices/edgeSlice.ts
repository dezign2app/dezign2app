import { BackendEdge } from "@/types/canvas";
import {
  isValidConnection,
  MESSAGING_RESOURCE_TYPES,
  DEFAULT_PUBLISH_TRIGGER_CONDITION,
  DEFAULT_PUBLISHED_EVENT_DEFAULTS,
} from "@workspace/canvas";
import type { MessagingResourceType } from "@workspace/canvas";
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

/** Narrows a plain string to MessagingResourceType without any cast. */
function isMessagingResourceType(value: string): value is MessagingResourceType {
  return MESSAGING_RESOURCE_TYPES.some((t) => t === value);
}


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

      // ── Endpoint → Messaging node: auto-create a publisher and rewire edge ──
      const MESSAGING_NODE_TYPES = [
        "kafka",
        "queue",
        "eventstream",
        "pubsub",
        "redis-streams",
        "sqs",
        "redis-pubsub",
      ] as const;
      const isMessagingTarget =
        targetNode &&
        MESSAGING_NODE_TYPES.some((t) => t === targetNode.type);

      if (isMessagingTarget && targetNode) {
        const endpoint = get().endpoints.find((e) => e.id === endpointId);
        if (!endpoint) return;

        // Parse topic/resource ID from targetHandle, e.g. "topics:in:<topicId>"
        const targetHandle = connection.targetHandle ?? "";
        const resourceMatch = targetHandle.match(/^([^:]+):in:(.+)$/);
        // Use optional chaining + nullish coalescing so both are always `string`
        const messagingResourceId = resourceMatch?.[2] ?? "";
        const rawResourceType = resourceMatch?.[1] ?? "";
        const resolvedResourceType = isMessagingResourceType(rawResourceType)
          ? rawResourceType
          : undefined;

        // Derive a human-readable publisher name
        const endpointLabel =
          endpoint.name || `${endpoint.type ?? "endpoint"} publisher`;
        const topicNode = targetNode.data as {
          topics?: { id: string; name: string }[];
        };
        const topicName =
          messagingResourceId
            ? (topicNode.topics?.find((t) => t.id === messagingResourceId)?.name ?? "")
            : "";
        const publisherName = topicName
          ? `Publish ${topicName}`
          : `${endpointLabel} publisher`;

        // Build the new publisher — all fields are required strings here
        const newEventId = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newPublisher = {
          id: newEventId,
          name: publisherName,
          publishedWhen: DEFAULT_PUBLISH_TRIGGER_CONDITION,
          brokerNodeId: targetNode.id,
          messagingResourceId,
          ...DEFAULT_PUBLISHED_EVENT_DEFAULTS,
          ...(resolvedResourceType ? { resourceType: resolvedResourceType } : {}),
        };

        // Record the direct endpoint→topic edge id so we can remove it
        const directEdgeId = newEdge.id;

        // updateEndpoint handles: endpoint upsert, event upsert, and
        // syncConfiguredEventEdge (creates publishedEvents-out-* → topic edge).
        get().updateEndpoint(endpointId, {
          publishedEvents: [...(endpoint.publishedEvents ?? []), newPublisher],
        });

        // Remove the direct endpoint→topic edge that ReactFlow added before our
        // interception. The correct publisher edge was already added by updateEndpoint.
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== directEdgeId),
          pendingEdgeUpserts: state.pendingEdgeUpserts.filter(
            (e) => e.id !== directEdgeId,
          ),
          pendingEdgeRemovals: [...state.pendingEdgeRemovals, directEdgeId],
        }));
        return; // skip the column-FK check below
      }
    }

    // Update source node's column to isForeignKey: true and populate references if it's a foreign key edge
    if (isColumnToColumn) {
      let fkNode = sourceNode;
      let fkColIndex: number | undefined;
      let refNode = targetNode;
      let refColIndex: number | undefined;

      if (connection.sourceHandle?.startsWith("source-")) {
        fkNode = sourceNode;
        fkColIndex = parseInt(
          connection.sourceHandle.replace("source-", ""),
          10,
        );
        refNode = targetNode;
        if (connection.targetHandle?.startsWith("target-")) {
          refColIndex = parseInt(
            connection.targetHandle.replace("target-", ""),
            10,
          );
        }
      } else if (connection.targetHandle?.startsWith("source-")) {
        fkNode = targetNode;
        fkColIndex = parseInt(
          connection.targetHandle.replace("source-", ""),
          10,
        );
        refNode = sourceNode;
        if (connection.sourceHandle?.startsWith("target-")) {
          refColIndex = parseInt(
            connection.sourceHandle.replace("target-", ""),
            10,
          );
        }
      }

      if (
        fkNode &&
        fkColIndex !== undefined &&
        !isNaN(fkColIndex) &&
        fkNode.data.columns
      ) {
        const column = fkNode.data.columns[fkColIndex];
        if (column) {
          const refTargetCol =
            refColIndex !== undefined && !isNaN(refColIndex)
              ? refNode.data.columns?.[refColIndex]
              : undefined;

          let targetColName = "_id";
          if (refTargetCol) {
            targetColName = refTargetCol.name;
          } else if (refNode.data.columns) {
            const pk = refNode.data.columns.find((c) => c.isPrimaryKey);
            if (pk) targetColName = pk.name;
          }

          const refTable = refNode.data.label || "";
          const newCols = [...fkNode.data.columns];
          newCols[fkColIndex] = {
            ...column,
            isForeignKey: true,
            references: {
              table: refTable,
              column: targetColName,
            },
          };
          get().updateNode(fkNode.id, {
            data: { ...fkNode.data, columns: newCols },
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

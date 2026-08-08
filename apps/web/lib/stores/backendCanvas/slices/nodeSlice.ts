import { BackendNode, BackendEdge } from "@/types/canvas";
import {
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_TEMPERATURE,
} from "@workspace/canvas/constants";
import { applyNodeChanges, NodeChange } from "@xyflow/react";
import { generateKeyBetween } from "fractional-indexing";
import { BackendCanvasState } from "../types";
import { cleanupDeletedNodesState } from "../stateCleanup";
import { getLastIndex } from "../utils";

export interface NodeSlice {
  nodes: BackendNode[];
  pendingNodeUpserts: BackendNode[];
  pendingNodeRemovals: string[];
  nodesPendingDeletion: BackendNode[];
  setNodesPendingDeletion: (nodes: BackendNode[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  addNode: (node: Omit<BackendNode, "fractionalIndex">) => void;
  addTableNode: (
    parentId?: string,
    position?: { x: number; y: number },
  ) => void;
  addLangGraphStepNode: (
    parentId: string,
    position?: { x: number; y: number },
    name?: string,
    stepType?: string,
  ) => void;
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
  deleteNode: (id: string) => void;
}

export const createNodeSlice = (
  set: (
    partial:
      | Partial<BackendCanvasState>
      | ((state: BackendCanvasState) => Partial<BackendCanvasState>),
  ) => void,
  get: () => BackendCanvasState,
): NodeSlice => ({
  nodes: [],
  pendingNodeUpserts: [],
  pendingNodeRemovals: [],
  nodesPendingDeletion: [],

  setNodesPendingDeletion: (nodes) => set({ nodesPendingDeletion: nodes }),

  onNodesChange: (changes) => {
    const removedIds: string[] = changes
      .filter((c) => c.type === "remove")
      .map((c) => c.id);

    const nonRemoveChanges = changes.filter((c) => c.type !== "remove");

    let currentState = get();
    let updates: Partial<BackendCanvasState> = {};

    if (removedIds.length > 0) {
      updates = cleanupDeletedNodesState(currentState, removedIds);
      currentState = { ...currentState, ...updates };
    }

    if (nonRemoveChanges.length > 0) {
      const rawNext = applyNodeChanges<BackendNode>(
        nonRemoveChanges,
        currentState.nodes,
      );
      const next = rawNext.filter((n): n is BackendNode => Boolean(n?.id));

      const persistentChangedNodeIds = new Set(
        nonRemoveChanges
          .filter((c) => {
            if (
              c.type === "position" ||
              c.type === "add" ||
              c.type === "replace"
            ) {
              return true;
            }
            if (
              c.type === "dimensions" &&
              "resizing" in c &&
              Boolean((c as { resizing?: boolean }).resizing)
            ) {
              return true;
            }
            return false;
          })
          .map((c) => c.id),
      );

      const upserts = next.filter((n) => persistentChangedNodeIds.has(n.id));

      updates.nodes = next;
      updates.pendingNodeUpserts = [
        ...currentState.pendingNodeUpserts,
        ...upserts,
      ];
    }

    if (Object.keys(updates).length > 0) {
      set(updates);
    }
  },

  addNode: (nodeWithoutIndex) => {
    let finalNode = nodeWithoutIndex;
    if (nodeWithoutIndex.type === "service" && !nodeWithoutIndex.data?.port) {
      const existingPorts = new Set(
        get()
          .nodes.filter((n) => n.type === "service")
          .map((n) => parseInt(n.data?.port || "8080", 10))
          .filter((p) => !isNaN(p)),
      );
      let nextPort = 8080;
      while (existingPorts.has(nextPort)) {
        nextPort++;
      }
      finalNode = {
        ...nodeWithoutIndex,
        data: {
          ...nodeWithoutIndex.data,
          port: String(nextPort),
        },
      };
    }
    const lastNodeIndex = getLastIndex(get().nodes);
    const fractionalIndex = generateKeyBetween(lastNodeIndex, null);
    const node = { ...finalNode, fractionalIndex, selected: true };
    const next = [...get().nodes.map((n) => ({ ...n, selected: false })), node];
    set({
      nodes: next,
      pendingNodeUpserts: [...get().pendingNodeUpserts, node],
    });
  },

  addTableNode: (parentId, position) => {
    const lastNodeIndex = getLastIndex(get().nodes);
    const fractionalIndex = generateKeyBetween(lastNodeIndex, null);
    const node: BackendNode = {
      id: crypto.randomUUID(),
      type: "entity",
      position: position || { x: 100, y: 100 },
      parentId,
      fractionalIndex,
      data: {
        label: "",
        columns: [{ name: "_id", type: "UUID", isPrimaryKey: true }],
      },
      selected: true,
    };
    const next = [...get().nodes.map((n) => ({ ...n, selected: false })), node];
    set({
      nodes: next,
      pendingNodeUpserts: [...get().pendingNodeUpserts, node],
    });
  },

  addLangGraphStepNode: (parentId, position, name, stepType) => {
    const existingCount = get().nodes.filter(
      (n) => n.parentId === parentId,
    ).length;
    const defaultPos = position || { x: 40 + existingCount * 220, y: 120 };
    const lastNodeIndex = getLastIndex(get().nodes);
    const fractionalIndex = generateKeyBetween(lastNodeIndex, null);
    const stepId = `step_${Date.now().toString(36).slice(-4)}`;
    const stepName = name || `Step ${existingCount + 1}`;
    const node: BackendNode = {
      id: crypto.randomUUID(),
      type: "langgraph_step",
      position: defaultPos,
      parentId,
      fractionalIndex,
      data: {
        label: stepName,
        stepId,
        stepType:
          (stepType as NonNullable<BackendNode["data"]["stepType"]>) ||
          "llm_call",
        modelConfig: {
          provider: DEFAULT_LLM_PROVIDER,
          model: DEFAULT_LLM_MODEL,
          temperature: DEFAULT_LLM_TEMPERATURE,
        },
      },
      selected: true,
    };
    const next = [...get().nodes.map((n) => ({ ...n, selected: false })), node];
    set({
      nodes: next,
      pendingNodeUpserts: [...get().pendingNodeUpserts, node],
    });
  },

  updateNode: (id, changes) => {
    console.log("backendCanvasStore: updateNode called for id", id, changes);
    const updatedNode = get().nodes.find((n) => n.id === id);
    if (!updatedNode) return;

    let currentNodes = get().nodes;

    // If entity label changed, sync references.table across other entity nodes
    if (
      updatedNode.type === "entity" &&
      changes.data?.label !== undefined &&
      changes.data.label !== updatedNode.data.label
    ) {
      const oldLabel = updatedNode.data.label;
      const newLabel = changes.data.label;

      if (
        oldLabel &&
        oldLabel.trim() !== "" &&
        newLabel &&
        newLabel.trim() !== ""
      ) {
        currentNodes = currentNodes.map((node) => {
          if (node.id === id || node.type !== "entity" || !node.data.columns) {
            return node;
          }
          let colsChanged = false;
          const newCols = node.data.columns.map((col) => {
            if (col.references?.table === oldLabel) {
              colsChanged = true;
              return {
                ...col,
                references: {
                  ...col.references,
                  table: newLabel,
                },
              };
            }
            return col;
          });
          return colsChanged
            ? { ...node, data: { ...node.data, columns: newCols } }
            : node;
        });
      }
    }

    const next = currentNodes.map((n) =>
      n.id === id ? { ...n, ...changes } : n,
    );
    const updated = next.find((n) => n.id === id)!;
    console.log("backendCanvasStore: adding to pendingNodeUpserts", updated);

    // Bidirectional sync: sync dropdown updates to edges
    let nextEdges = [...get().edges];
    let edgesChanged = false;

    if (changes.data?.publishedEvents) {
      const existingPublishEdges = nextEdges.filter(
        (e) =>
          e.source === id && e.sourceHandle?.startsWith("publishedEvents-out-"),
      );

      const currentEvents = changes.data.publishedEvents;

      // 1. Remove edges that are no longer referenced or changed targetNodeId
      existingPublishEdges.forEach((edge) => {
        const eventId = edge.sourceHandle?.replace("publishedEvents-out-", "");
        const ev = currentEvents.find((e) => e.id === eventId);
        if (
          !ev ||
          ev.targetNodeId !== edge.target ||
          ev.targetNodeId === "none"
        ) {
          nextEdges = nextEdges.filter((e) => e.id !== edge.id);
          edgesChanged = true;
          set({ pendingEdgeRemovals: [...get().pendingEdgeRemovals, edge.id] });
        }
      });

      // 2. Add edges for newly selected targetNodeId
      currentEvents.forEach((ev: { id?: string; targetNodeId?: string }) => {
        if (ev.targetNodeId && ev.targetNodeId !== "none") {
          const hasEdge = existingPublishEdges.some(
            (e) =>
              e.sourceHandle === `publishedEvents-out-${ev.id}` &&
              e.target === ev.targetNodeId,
          );
          if (!hasEdge) {
            const lastEdgeIndex = getLastIndex(nextEdges);
            const fractionalIndex = generateKeyBetween(lastEdgeIndex, null);
            const newEdge: BackendEdge = {
              id: `edge-${Date.now()}-${ev.id}`,
              source: id,
              target: ev.targetNodeId,
              type: "message",
              sourceHandle: `publishedEvents-out-${ev.id}`,
              targetHandle: null,
              fractionalIndex,
            };
            nextEdges.push(newEdge);
            edgesChanged = true;
            set({ pendingEdgeUpserts: [...get().pendingEdgeUpserts, newEdge] });
          }
        }
      });
    }

    if (changes.data?.consumedEvents) {
      const existingConsumeEdges = nextEdges.filter(
        (e) =>
          e.target === id && e.targetHandle?.startsWith("consumedEvents-in-"),
      );

      const currentEvents = changes.data.consumedEvents;

      // 1. Remove edges that are no longer referenced or changed
      existingConsumeEdges.forEach((edge) => {
        const eventId = edge.targetHandle?.replace("consumedEvents-in-", "");
        const ev = currentEvents.find((e) => e.id === eventId);
        if (
          !ev ||
          ev.targetNodeId !== edge.source ||
          ev.targetNodeId === "none"
        ) {
          nextEdges = nextEdges.filter((e) => e.id !== edge.id);
          edgesChanged = true;
          set({ pendingEdgeRemovals: [...get().pendingEdgeRemovals, edge.id] });
        }
      });

      // 2. Add edges for newly selected targetNodeId
      currentEvents.forEach((ev: { id?: string; targetNodeId?: string }) => {
        if (ev.targetNodeId && ev.targetNodeId !== "none") {
          const hasEdge = existingConsumeEdges.some(
            (e) =>
              e.targetHandle === `consumedEvents-in-${ev.id}` &&
              e.source === ev.targetNodeId,
          );
          if (!hasEdge) {
            const lastEdgeIndex = getLastIndex(nextEdges);
            const fractionalIndex = generateKeyBetween(lastEdgeIndex, null);
            const newEdge: BackendEdge = {
              id: `edge-${Date.now()}-${ev.id}`,
              source: ev.targetNodeId,
              target: id,
              type: "message",
              sourceHandle: null,
              targetHandle: `consumedEvents-in-${ev.id}`,
              fractionalIndex,
            };
            nextEdges.push(newEdge);
            edgesChanged = true;
            set({ pendingEdgeUpserts: [...get().pendingEdgeUpserts, newEdge] });
          }
        }
      });
    }

    if (updatedNode.type === "entity" && changes.data?.columns) {
      const currentCols = changes.data.columns;
      const allEntityNodes = next.filter((n) => n.type === "entity");

      // 1. Sync foreign-key edges where node `id` is the TARGET (referencing table)
      currentCols.forEach((col, colIdx) => {
        const existingEdgeIndices: number[] = [];
        nextEdges.forEach((e, idx) => {
          if (
            e.type === "foreign-key" &&
            e.target === id &&
            (e.targetHandle === `target-${colIdx}` ||
              e.targetHandle === `source-${colIdx}`)
          ) {
            existingEdgeIndices.push(idx);
          }
        });

        if (
          col.isForeignKey &&
          col.references?.table &&
          col.references?.column
        ) {
          const refNode = allEntityNodes.find(
            (n) => n.data.label === col.references?.table,
          );
          if (refNode && refNode.data.columns) {
            const refColIdx = refNode.data.columns.findIndex(
              (c) => c.name === col.references?.column,
            );
            if (refColIdx !== -1) {
              const expectedSourceHandle = `source-${refColIdx}`;
              const expectedTargetHandle = `target-${colIdx}`;
              const expectedSourceId = refNode.id;

              if (existingEdgeIndices.length > 0) {
                const primaryEdgeIdx = existingEdgeIndices[0]!;
                const existingEdge = nextEdges[primaryEdgeIdx]!;

                if (
                  existingEdge.source !== expectedSourceId ||
                  existingEdge.target !== id ||
                  existingEdge.sourceHandle !== expectedSourceHandle ||
                  existingEdge.targetHandle !== expectedTargetHandle
                ) {
                  const updatedEdge: BackendEdge = {
                    ...existingEdge,
                    source: expectedSourceId,
                    target: id,
                    sourceHandle: expectedSourceHandle,
                    targetHandle: expectedTargetHandle,
                  };
                  nextEdges[primaryEdgeIdx] = updatedEdge;
                  edgesChanged = true;
                  set({
                    pendingEdgeUpserts: [
                      ...get().pendingEdgeUpserts,
                      updatedEdge,
                    ],
                  });
                }

                for (let i = 1; i < existingEdgeIndices.length; i++) {
                  const staleIdx = existingEdgeIndices[i]!;
                  const staleEdge = nextEdges[staleIdx];
                  if (staleEdge) {
                    nextEdges = nextEdges.filter((e) => e.id !== staleEdge.id);
                    set({
                      pendingEdgeRemovals: [
                        ...get().pendingEdgeRemovals,
                        staleEdge.id,
                      ],
                    });
                    edgesChanged = true;
                  }
                }
              } else {
                const lastEdgeIndex = getLastIndex(nextEdges);
                const fractionalIndex = generateKeyBetween(lastEdgeIndex, null);
                const newEdge: BackendEdge = {
                  id: `edge-${Date.now()}-${colIdx}`,
                  source: expectedSourceId,
                  target: id,
                  type: "foreign-key",
                  sourceHandle: expectedSourceHandle,
                  targetHandle: expectedTargetHandle,
                  fractionalIndex,
                };
                nextEdges.push(newEdge);
                edgesChanged = true;
                set({
                  pendingEdgeUpserts: [...get().pendingEdgeUpserts, newEdge],
                });
              }
            }
          }
        } else {
          if (existingEdgeIndices.length > 0) {
            existingEdgeIndices.forEach((edgeIdx) => {
              const edgeToRemove = nextEdges[edgeIdx];
              if (edgeToRemove) {
                nextEdges = nextEdges.filter((e) => e.id !== edgeToRemove.id);
                set({
                  pendingEdgeRemovals: [
                    ...get().pendingEdgeRemovals,
                    edgeToRemove.id,
                  ],
                });
              }
            });
            edgesChanged = true;
          }
        }
      });

      // 2. Clean up foreign-key edges where handles point to indices that no longer exist on node `id`
      const maxColIdx = currentCols.length - 1;
      nextEdges.forEach((e) => {
        if (e.type === "foreign-key") {
          if (e.target === id && e.targetHandle) {
            const match = e.targetHandle.match(/^(?:source|target)-(\d+)$/);
            if (match) {
              const idx = parseInt(match[1]!, 10);
              if (idx > maxColIdx) {
                nextEdges = nextEdges.filter((edge) => edge.id !== e.id);
                set({
                  pendingEdgeRemovals: [...get().pendingEdgeRemovals, e.id],
                });
                edgesChanged = true;
              }
            }
          }
          if (e.source === id && e.sourceHandle) {
            const match = e.sourceHandle.match(/^(?:source|target)-(\d+)$/);
            if (match) {
              const idx = parseInt(match[1]!, 10);
              if (idx > maxColIdx) {
                nextEdges = nextEdges.filter((edge) => edge.id !== e.id);
                set({
                  pendingEdgeRemovals: [...get().pendingEdgeRemovals, e.id],
                });
                edgesChanged = true;
              }
            }
          }
        }
      });
    }

    const update: Partial<BackendCanvasState> = {
      nodes: next,
      pendingNodeUpserts: [...get().pendingNodeUpserts, updated],
    };
    if (edgesChanged) {
      update.edges = nextEdges;
    }
    set(update);
  },

  deleteNode: (id) => {
    const updates = cleanupDeletedNodesState(get(), [id]);
    set(updates);
  },
});

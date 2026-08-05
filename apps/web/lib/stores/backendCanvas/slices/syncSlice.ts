import { BackendNode, BackendEdge, BackendCanvasView } from "@/types/canvas";
import {
  BackendCanvasState,
  ActiveConfigItem,
  EndpointWithNode,
  EventWithNode,
  IdentityProviderWithNode,
  PendingEndpointRemoval,
  PendingEventRemoval,
  PendingIdentityProviderRemoval,
} from "../types";

export interface SyncSlice {
  projectId: string | null;
  canvasView: BackendCanvasView;
  activeConfigItem: ActiveConfigItem | null;
  setActiveConfigItem: (item: ActiveConfigItem | null) => void;
  setNodesAndEdges: (
    nodes: BackendNode[],
    edges: BackendEdge[],
    endpoints?: EndpointWithNode[],
    events?: EventWithNode[],
    identityProviders?: IdentityProviderWithNode[],
    projectId?: string,
  ) => void;
  setView: (view: BackendCanvasView) => void;
  clearPending: (
    syncedNodes: BackendNode[],
    syncedNodeRemovals: string[],
    syncedEdges: BackendEdge[],
    syncedEdgeRemovals: string[],
    syncedEndpointUpserts?: EndpointWithNode[],
    syncedEndpointRemovals?: PendingEndpointRemoval[],
    syncedEventUpserts?: EventWithNode[],
    syncedEventRemovals?: PendingEventRemoval[],
    syncedIdentityProviderUpserts?: IdentityProviderWithNode[],
    syncedIdentityProviderRemovals?: PendingIdentityProviderRemoval[],
  ) => void;
  reset: (projectId?: string | null) => void;
}

export const createSyncSlice = (
  set: (
    partial:
      | Partial<BackendCanvasState>
      | ((state: BackendCanvasState) => Partial<BackendCanvasState>),
  ) => void,
): SyncSlice => ({
  projectId: null,
  canvasView: "graph",
  activeConfigItem: null,

  setActiveConfigItem: (item) => set({ activeConfigItem: item }),

  setNodesAndEdges: (
    nodes,
    edges,
    endpoints = [],
    events = [],
    identityProviders = [],
    projectId,
  ) =>
    set({
      ...(projectId !== undefined && { projectId }),
      nodes,
      edges,
      endpoints,
      events,
      identityProviders,
      pendingNodeUpserts: [],
      pendingNodeRemovals: [],
      pendingEdgeUpserts: [],
      pendingEdgeRemovals: [],
      pendingEndpointUpserts: [],
      pendingEndpointRemovals: [],
      pendingEventUpserts: [],
      pendingEventRemovals: [],
      pendingIdentityProviderUpserts: [],
      pendingIdentityProviderRemovals: [],
    }),

  setView: (view) => set({ canvasView: view }),

  clearPending: (
    syncedNodes,
    syncedNodeRemovals,
    syncedEdges,
    syncedEdgeRemovals,
    syncedEndpointUpserts = [],
    syncedEndpointRemovals = [],
    syncedEventUpserts = [],
    syncedEventRemovals = [],
    syncedIdentityProviderUpserts = [],
    syncedIdentityProviderRemovals = [],
  ) =>
    set((state) => ({
      pendingNodeUpserts: state.pendingNodeUpserts.filter(
        (n) => !syncedNodes.includes(n),
      ),
      pendingNodeRemovals: state.pendingNodeRemovals.filter(
        (id) => !syncedNodeRemovals.includes(id),
      ),
      pendingEdgeUpserts: state.pendingEdgeUpserts.filter(
        (e) => !syncedEdges.includes(e),
      ),
      pendingEdgeRemovals: state.pendingEdgeRemovals.filter(
        (id) => !syncedEdgeRemovals.includes(id),
      ),
      pendingEndpointUpserts: state.pendingEndpointUpserts.filter(
        (e) => !syncedEndpointUpserts.includes(e),
      ),
      pendingEndpointRemovals: state.pendingEndpointRemovals.filter(
        (r) =>
          !syncedEndpointRemovals.some((sr) => sr.endpointId === r.endpointId),
      ),
      pendingEventUpserts: state.pendingEventUpserts.filter(
        (e) => !syncedEventUpserts.includes(e),
      ),
      pendingEventRemovals: state.pendingEventRemovals.filter(
        (r) => !syncedEventRemovals.some((sr) => sr.eventId === r.eventId),
      ),
      pendingIdentityProviderUpserts:
        state.pendingIdentityProviderUpserts.filter(
          (p) => !syncedIdentityProviderUpserts.includes(p),
        ),
      pendingIdentityProviderRemovals:
        state.pendingIdentityProviderRemovals.filter(
          (r) =>
            !syncedIdentityProviderRemovals.some(
              (sr) => sr.providerId === r.providerId,
            ),
        ),
    })),

  reset: (projectId = null) =>
    set({
      projectId,
      nodes: [],
      edges: [],
      endpoints: [],
      events: [],
      identityProviders: [],
      pendingNodeUpserts: [],
      pendingNodeRemovals: [],
      pendingEdgeUpserts: [],
      pendingEdgeRemovals: [],
      pendingEndpointUpserts: [],
      pendingEndpointRemovals: [],
      pendingEventUpserts: [],
      pendingEventRemovals: [],
      pendingIdentityProviderUpserts: [],
      pendingIdentityProviderRemovals: [],
      activeConfigItem: null,
    }),
});

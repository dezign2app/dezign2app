import { BackendNode, BackendEdge, BackendCanvasView } from "@/types/canvas";
import {
  Endpoint,
  AnyMessagingResource,
  IdentityProvider,
  MessagingResourceType,
} from "@workspace/canvas/types";
import { NodeChange, EdgeChange, Connection } from "@xyflow/react";

export type ConfigItemType =
  | "endpoint"
  | "event"
  | "task"
  | "searchIndex"
  | "authRule"
  | "identityProvider"
  | "auth"
  | "webApp"
  | "webClient"
  | "clientEvent"
  | "eventTesting"
  | "langgraphRoute";

export interface ActiveConfigItem {
  type: ConfigItemType;
  id: string;
  nodeId: string;
  edgeId?: string;
  sourceId?: string;
  targetNodeId?: string;
  endpointId?: string;
  initialTab?: "trigger" | "test-cases";
}

export type EndpointWithNode = Endpoint & { nodeId: string };
export type EventWithNode = AnyMessagingResource & {
  nodeId: string;
  variant: "publish" | "consume";
};
export type IdentityProviderWithNode = IdentityProvider & { nodeId: string };

export type PendingEndpointRemoval = { nodeId: string; endpointId: string };
export type PendingEventRemoval = { nodeId: string; eventId: string };
export type PendingIdentityProviderRemoval = { nodeId: string; providerId: string };

export interface BackendCanvasState {
  projectId: string | null;
  nodes: BackendNode[];
  edges: BackendEdge[];
  canvasView: BackendCanvasView;

  endpoints: EndpointWithNode[];
  events: EventWithNode[];
  identityProviders: IdentityProviderWithNode[];
  activeConfigItem: ActiveConfigItem | null;
  setActiveConfigItem: (item: ActiveConfigItem | null) => void;

  // Pending Convex sync ops
  pendingNodeUpserts: BackendNode[];
  pendingNodeRemovals: string[];
  pendingEdgeUpserts: BackendEdge[];
  pendingEdgeRemovals: string[];
  pendingEndpointUpserts: EndpointWithNode[];
  pendingEndpointRemovals: PendingEndpointRemoval[];
  pendingEventUpserts: EventWithNode[];
  pendingEventRemovals: PendingEventRemoval[];
  pendingIdentityProviderUpserts: IdentityProviderWithNode[];
  pendingIdentityProviderRemovals: PendingIdentityProviderRemoval[];

  // Deletion confirmation
  nodesPendingDeletion: BackendNode[];
  setNodesPendingDeletion: (nodes: BackendNode[]) => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Manual actions
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
  addEdge: (edge: Omit<BackendEdge, "fractionalIndex">) => void;
  updateEdge: (id: string, changes: Partial<BackendEdge>) => void;
  deleteEdge: (id: string) => void;

  addEndpoint: (nodeId: string, endpoint: Endpoint) => void;
  updateEndpoint: (id: string, changes: Partial<Endpoint>) => void;
  deleteEndpoint: (id: string) => void;

  addEvent: (
    nodeId: string,
    variant: "publish" | "consume",
    event: AnyMessagingResource,
  ) => void;
  updateEvent: (id: string, changes: Partial<AnyMessagingResource>) => void;
  deleteEvent: (id: string) => void;

  addIdentityProvider: (nodeId: string, provider: IdentityProvider) => void;
  updateIdentityProvider: (
    id: string,
    changes: Partial<IdentityProvider>,
  ) => void;
  deleteIdentityProvider: (id: string) => void;

  // Bulk load from Convex (no pending ops)
  setNodesAndEdges: (
    nodes: BackendNode[],
    edges: BackendEdge[],
    endpoints?: EndpointWithNode[],
    events?: EventWithNode[],
    identityProviders?: IdentityProviderWithNode[],
    projectId?: string,
  ) => void;
  setView: (view: BackendCanvasView) => void;

  // Called after Convex sync succeeds
  clearPending: (
    syncedNodeUpserts: BackendNode[],
    syncedNodeRemovals: string[],
    syncedEdgeUpserts: BackendEdge[],
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

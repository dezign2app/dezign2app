import { create } from "zustand";
import { BackendCanvasState } from "./backendCanvas/types";
import { parseResourceHandle } from "./backendCanvas/utils";
import { createNodeSlice } from "./backendCanvas/slices/nodeSlice";
import { createEdgeSlice } from "./backendCanvas/slices/edgeSlice";
import { createEndpointSlice } from "./backendCanvas/slices/endpointSlice";
import { createEventSlice } from "./backendCanvas/slices/eventSlice";
import { createIdentityProviderSlice } from "./backendCanvas/slices/identityProviderSlice";
import { createSyncSlice } from "./backendCanvas/slices/syncSlice";

export { parseResourceHandle };
export type { BackendCanvasState };

export const useBackendCanvasStore = create<BackendCanvasState>((set, get) => ({
  ...createSyncSlice(set),
  ...createNodeSlice(set, get),
  ...createEdgeSlice(set, get),
  ...createEndpointSlice(set, get),
  ...createEventSlice(set, get),
  ...createIdentityProviderSlice(set, get),
}));

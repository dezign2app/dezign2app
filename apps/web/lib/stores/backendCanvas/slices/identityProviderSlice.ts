import { IdentityProvider } from "@workspace/canvas/types";
import {
  BackendCanvasState,
  IdentityProviderWithNode,
  PendingIdentityProviderRemoval,
} from "../types";

export interface IdentityProviderSlice {
  identityProviders: IdentityProviderWithNode[];
  pendingIdentityProviderUpserts: IdentityProviderWithNode[];
  pendingIdentityProviderRemovals: PendingIdentityProviderRemoval[];
  addIdentityProvider: (nodeId: string, provider: IdentityProvider) => void;
  updateIdentityProvider: (
    id: string,
    changes: Partial<IdentityProvider>,
  ) => void;
  deleteIdentityProvider: (id: string) => void;
}

export const createIdentityProviderSlice = (
  set: (
    partial:
      | Partial<BackendCanvasState>
      | ((state: BackendCanvasState) => Partial<BackendCanvasState>),
  ) => void,
  get: () => BackendCanvasState,
): IdentityProviderSlice => ({
  identityProviders: [],
  pendingIdentityProviderUpserts: [],
  pendingIdentityProviderRemovals: [],

  addIdentityProvider: (nodeId, provider) => {
    const newProvider = { ...provider, nodeId };
    set({
      identityProviders: [...get().identityProviders, newProvider],
      pendingIdentityProviderUpserts: [
        ...get().pendingIdentityProviderUpserts,
        newProvider,
      ],
    });
  },

  updateIdentityProvider: (id, changes) => {
    const next = get().identityProviders.map((p) =>
      p.id === id ? { ...p, ...changes } : p,
    );
    const updated = next.find((p) => p.id === id);
    if (updated) {
      set({
        identityProviders: next,
        pendingIdentityProviderUpserts: [
          ...get().pendingIdentityProviderUpserts,
          updated,
        ],
      });
    }
  },

  deleteIdentityProvider: (id) => {
    const provider = get().identityProviders.find((p) => p.id === id);
    if (provider) {
      set({
        identityProviders: get().identityProviders.filter((p) => p.id !== id),
        pendingIdentityProviderRemovals: [
          ...get().pendingIdentityProviderRemovals,
          { nodeId: provider.nodeId, providerId: id },
        ],
      });
    }
  },
});

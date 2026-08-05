import { Endpoint } from "@workspace/canvas/types";
import { BackendCanvasState } from "./types";

export function cleanupDeletedNodesState(
  currentState: BackendCanvasState,
  initialIdsToDelete: string[],
): Partial<BackendCanvasState> {
  const getChildrenIds = (parentId: string): string[] => {
    const children = currentState.nodes
      .filter((n) => n && n.parentId === parentId)
      .map((n) => n.id);
    let allIds = [...children];
    for (const childId of children) {
      allIds = [...allIds, ...getChildrenIds(childId)];
    }
    return allIds;
  };

  const allIdsSet = new Set<string>();
  initialIdsToDelete.forEach((id) => {
    if (id) {
      allIdsSet.add(id);
      getChildrenIds(id).forEach((childId) => allIdsSet.add(childId));
    }
  });

  const idsToDeleteArray = Array.from(allIdsSet);
  if (idsToDeleteArray.length === 0) return {};

  // 1. Next Nodes
  const nextNodes = currentState.nodes.filter((n) => !allIdsSet.has(n.id));

  // 2. Events to remove (publishers & consumers)
  const eventsToDelete = currentState.events.filter((ev) =>
    allIdsSet.has(ev.nodeId),
  );
  const deletedEventIds = new Set(eventsToDelete.map((ev) => ev.id));
  const nextEvents = currentState.events
    .filter((ev) => !allIdsSet.has(ev.nodeId))
    .map((ev) => {
      if (ev.brokerNodeId && allIdsSet.has(ev.brokerNodeId)) {
        return { ...ev, brokerNodeId: "" };
      }
      return ev;
    });

  // 3. Endpoints to remove
  const endpointsToDelete = currentState.endpoints.filter((e) =>
    allIdsSet.has(e.nodeId),
  );
  const deletedEndpointIds = new Set(endpointsToDelete.map((e) => e.id));
  const nextEndpoints = currentState.endpoints
    .filter((e) => !allIdsSet.has(e.nodeId))
    .map((ep) => {
      let changed = false;
      let newDbIds = ep.databaseNodeIds;
      let newDbId = ep.databaseNodeId;
      let newCrudOps = ep.crudOperations;
      let newCrudExp = ep.crudExplanations;
      let newPubEvents = ep.publishedEvents;

      if (newDbIds && newDbIds.some((id) => allIdsSet.has(id))) {
        newDbIds = newDbIds.filter((id) => !allIdsSet.has(id));
        newDbId = newDbIds[0] || "none";
        changed = true;
      }
      if (newDbId && allIdsSet.has(newDbId)) {
        newDbId = "none";
        changed = true;
      }
      if (newCrudOps) {
        const cleanedOps: NonNullable<Endpoint["crudOperations"]> = {};
        for (const [key, val] of Object.entries(newCrudOps)) {
          if (!allIdsSet.has(key)) cleanedOps[key] = val;
          else changed = true;
        }
        if (changed) newCrudOps = cleanedOps;
      }
      if (newCrudExp) {
        const cleanedExp: NonNullable<Endpoint["crudExplanations"]> = {};
        for (const [key, val] of Object.entries(newCrudExp)) {
          if (!allIdsSet.has(key)) cleanedExp[key] = val;
          else changed = true;
        }
        if (changed) newCrudExp = cleanedExp;
      }
      if (newPubEvents) {
        const cleanedEvents = newPubEvents.filter(
          (pev) =>
            !deletedEventIds.has(pev.id) &&
            !allIdsSet.has(pev.id) &&
            !(pev.brokerNodeId && allIdsSet.has(pev.brokerNodeId)),
        );
        if (cleanedEvents.length !== newPubEvents.length) {
          changed = true;
          newPubEvents = cleanedEvents;
        }
      }

      return changed
        ? {
            ...ep,
            databaseNodeIds: newDbIds,
            databaseNodeId: newDbId,
            crudOperations: newCrudOps,
            crudExplanations: newCrudExp,
            publishedEvents: newPubEvents,
          }
        : ep;
    });

  // 4. Identity Providers to remove
  const providersToDelete = currentState.identityProviders.filter((p) =>
    allIdsSet.has(p.nodeId),
  );
  const nextProviders = currentState.identityProviders.filter(
    (p) => !allIdsSet.has(p.nodeId),
  );

  // 5. Edges to remove
  const removedEdges = currentState.edges.filter((e) => {
    if (!e) return false;
    if (allIdsSet.has(e.source) || allIdsSet.has(e.target)) return true;
    if (e.sourceHandle) {
      for (const epId of deletedEndpointIds) {
        if (e.sourceHandle.includes(epId)) return true;
      }
      for (const evId of deletedEventIds) {
        if (e.sourceHandle.includes(evId)) return true;
      }
    }
    if (e.targetHandle) {
      for (const epId of deletedEndpointIds) {
        if (e.sourceHandle?.includes(epId)) return true; // Note: edge target handle check
        if (e.targetHandle.includes(epId)) return true;
      }
      for (const evId of deletedEventIds) {
        if (e.targetHandle.includes(evId)) return true;
      }
    }
    return false;
  });
  const removedEdgeIds = removedEdges.map((e) => e.id);
  const removedEdgeSet = new Set(removedEdgeIds);
  const nextEdges = currentState.edges.filter((e) => !removedEdgeSet.has(e.id));

  // 6. Config sidebar reset
  let nextActiveConfigItem = currentState.activeConfigItem;
  if (nextActiveConfigItem) {
    if (
      allIdsSet.has(nextActiveConfigItem.nodeId) ||
      deletedEndpointIds.has(nextActiveConfigItem.id) ||
      deletedEventIds.has(nextActiveConfigItem.id)
    ) {
      nextActiveConfigItem = null;
    }
  }

  const changedEndpoints = nextEndpoints.filter((ep) => {
    const old = currentState.endpoints.find((o) => o.id === ep.id);
    return old && old !== ep;
  });

  const changedEvents = nextEvents.filter((ev) => {
    const old = currentState.events.find((o) => o.id === ev.id);
    return old && old !== ev;
  });

  return {
    nodes: nextNodes,
    edges: nextEdges,
    endpoints: nextEndpoints,
    events: nextEvents,
    identityProviders: nextProviders,
    activeConfigItem: nextActiveConfigItem,
    pendingNodeRemovals: [
      ...currentState.pendingNodeRemovals,
      ...idsToDeleteArray,
    ],
    pendingEdgeRemovals: [
      ...currentState.pendingEdgeRemovals,
      ...removedEdgeIds,
    ],
    pendingEndpointUpserts: [
      ...currentState.pendingEndpointUpserts,
      ...changedEndpoints,
    ],
    pendingEndpointRemovals: [
      ...currentState.pendingEndpointRemovals,
      ...endpointsToDelete.map((ep) => ({
        nodeId: ep.nodeId,
        endpointId: ep.id,
      })),
    ],
    pendingEventUpserts: [
      ...currentState.pendingEventUpserts,
      ...changedEvents,
    ],
    pendingEventRemovals: [
      ...currentState.pendingEventRemovals,
      ...eventsToDelete.map((ev) => ({ nodeId: ev.nodeId, eventId: ev.id })),
    ],
    pendingIdentityProviderRemovals: [
      ...currentState.pendingIdentityProviderRemovals,
      ...providersToDelete.map((p) => ({
        nodeId: p.nodeId,
        providerId: p.id,
      })),
    ],
  };
}

export function cleanupDeletedEdgesState(
  currentState: BackendCanvasState,
  removedEdgeIds: string[],
): Partial<BackendCanvasState> {
  if (!removedEdgeIds || removedEdgeIds.length === 0) return {};

  const removedSet = new Set(removedEdgeIds);
  const removedEdges = currentState.edges.filter(
    (e) => e && removedSet.has(e.id),
  );
  const nextEdges = currentState.edges.filter(
    (e) => e && !removedSet.has(e.id),
  );

  let nextEndpoints = [...currentState.endpoints];
  let endpointsChanged = false;

  let nextEvents = [...currentState.events];
  let eventsChanged = false;
  const deletedEventEntries: Array<{ nodeId: string; eventId: string }> = [];

  const dbNodeIdsSet = new Set(
    currentState.nodes
      .filter((n) => n && (n.type === "db_ref" || n.type === "database"))
      .map((n) => n.id),
  );

  const pendingEndpointUpserts = [...currentState.pendingEndpointUpserts];
  const pendingEventUpserts = [...currentState.pendingEventUpserts];

  removedEdges.forEach((edge) => {
    if (!edge) return;

    // 1. Endpoint -> DB Node connection cleanup
    const targetEndpointIds = new Set<string>();
    let targetDbId: string | null = null;

    if (edge.sourceHandle?.startsWith("endpoint-out-")) {
      const epId = edge.sourceHandle.replace("endpoint-out-", "");
      targetEndpointIds.add(epId);
      if (dbNodeIdsSet.has(edge.target)) {
        targetDbId = edge.target;
      }
    } else {
      if (dbNodeIdsSet.has(edge.target)) {
        targetDbId = edge.target;
        currentState.endpoints
          .filter((ep) => ep.nodeId === edge.source)
          .forEach((ep) => targetEndpointIds.add(ep.id));
      } else if (dbNodeIdsSet.has(edge.source)) {
        targetDbId = edge.source;
        currentState.endpoints
          .filter((ep) => ep.nodeId === edge.target)
          .forEach((ep) => targetEndpointIds.add(ep.id));
      }
    }

    if (targetDbId) {
      nextEndpoints = nextEndpoints.map((ep) => {
        if (
          targetEndpointIds.size > 0 &&
          !targetEndpointIds.has(ep.id)
        )
          return ep;

        const currentDbIds =
          ep.databaseNodeIds ||
          (ep.databaseNodeId && ep.databaseNodeId !== "none"
            ? [ep.databaseNodeId]
            : []);

        if (currentDbIds.includes(targetDbId!)) {
          endpointsChanged = true;
          const newDbIds = currentDbIds.filter((id) => id !== targetDbId);
          const newDbId = newDbIds[0] || "none";

          const newCrudOps = { ...(ep.crudOperations || {}) };
          delete newCrudOps[targetDbId!];

          const newCrudExp = { ...(ep.crudExplanations || {}) };
          delete newCrudExp[targetDbId!];

          const updatedEp = {
            ...ep,
            databaseNodeIds: newDbIds,
            databaseNodeId: newDbId,
            crudOperations: newCrudOps,
            crudExplanations: newCrudExp,
          };
          pendingEndpointUpserts.push(updatedEp);
          return updatedEp;
        }
        return ep;
      });
    }

    // 2. Messaging Event -> Broker Node cleanup: fully delete the publish event when its edge is removed
    if (edge.sourceHandle?.startsWith("publishedEvents-out-")) {
      const eventId = edge.sourceHandle.replace("publishedEvents-out-", "");

      // Find the event and record it for DB removal
      const deletedEvent = nextEvents.find((ev) => ev.id === eventId);
      if (deletedEvent) {
        eventsChanged = true;
        nextEvents = nextEvents.filter((ev) => ev.id !== eventId);
        deletedEventEntries.push({
          nodeId: deletedEvent.nodeId,
          eventId: deletedEvent.id,
        });
      }

      // Remove from endpoint.publishedEvents too, and re-sync the endpoint to DB
      nextEndpoints = nextEndpoints.map((ep) => {
        if (ep.publishedEvents?.some((pev) => pev.id === eventId)) {
          endpointsChanged = true;
          const updatedEp = {
            ...ep,
            publishedEvents: ep.publishedEvents.filter(
              (pev) => pev.id !== eventId,
            ),
          };
          pendingEndpointUpserts.push(updatedEp);
          return updatedEp;
        }
        return ep;
      });
    }

    if (edge.targetHandle?.startsWith("consumedEvents-in-")) {
      const eventId = edge.targetHandle.replace("consumedEvents-in-", "");
      nextEvents = nextEvents.map((ev) => {
        if (ev.id === eventId && ev.brokerNodeId) {
          eventsChanged = true;
          const updatedEv = { ...ev, brokerNodeId: "" };
          pendingEventUpserts.push(updatedEv);
          return updatedEv;
        }
        return ev;
      });
    }
  });

  const updates: Partial<BackendCanvasState> = {
    edges: nextEdges,
    pendingEdgeRemovals: [
      ...currentState.pendingEdgeRemovals,
      ...removedEdgeIds,
    ],
  };

  if (endpointsChanged) {
    updates.endpoints = nextEndpoints;
    updates.pendingEndpointUpserts = pendingEndpointUpserts;
  }

  if (eventsChanged) {
    updates.events = nextEvents;
    updates.pendingEventUpserts = pendingEventUpserts;
    if (deletedEventEntries.length > 0) {
      updates.pendingEventRemovals = [
        ...currentState.pendingEventRemovals,
        ...deletedEventEntries,
      ];
    }
  }

  return updates;
}

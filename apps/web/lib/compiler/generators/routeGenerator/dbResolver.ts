import { Endpoint, TargetDbOperation, ReusableFunction } from "@workspace/canvas/types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { getEntityDbOperations } from "@/lib/utils/entityOperationsHelper";

export interface EndpointWithNodeId extends Endpoint {
  nodeId?: string;
}

/**
 * Resolves all database functions requested for an endpoint based on attached db_ref nodes,
 * canvas edges, and the user's explicit crudOperations selection.
 */
export function pickDbFunctionsForEndpoint(
  ep: EndpointWithNodeId,
  dbFunctions: ReusableFunction[],
  allNodes: BackendNode[],
  path: string,
  allEdges: BackendEdge[] = [],
): TargetDbOperation[] {
  if (dbFunctions.length === 0) return [];

  const method = (ep.type || "GET").toLowerCase();
  const isIdRoute = path.includes(":id") || path.includes("{id}");

  const nodeDbNodeIds =
    ep.databaseNodeIds ||
    (ep.databaseNodeId && ep.databaseNodeId !== "none" ? [ep.databaseNodeId] : []);

  const crudDbNodeIds =
    ep.crudOperations && Object.keys(ep.crudOperations).length > 0
      ? Object.keys(ep.crudOperations)
      : [];

  const edgeDbNodeIds: string[] = [];
  const epNodeId = ep.nodeId;

  if (epNodeId && allEdges.length > 0 && allNodes.length > 0) {
    allEdges.forEach((e) => {
      let candidateId: string | null = null;
      if (e.source === epNodeId) candidateId = e.target;
      else if (e.target === epNodeId) candidateId = e.source;

      if (candidateId) {
        const candidateNode = allNodes.find((n) => n.id === candidateId);
        if (
          candidateNode &&
          (candidateNode.type === "entity" ||
            candidateNode.type === "db_ref" ||
            candidateNode.type === "database")
        ) {
          edgeDbNodeIds.push(candidateId);
        }
      }
    });
  }

  let targetNodeIds = Array.from(
    new Set([...nodeDbNodeIds, ...crudDbNodeIds, ...edgeDbNodeIds]),
  );

  if (targetNodeIds.length === 0) {
    const dbNodesInCanvas = allNodes.filter(
      (n) =>
        n.type === "entity" ||
        n.type === "db_ref" ||
        n.type === "database",
    );
    if (dbNodesInCanvas.length > 0) {
      targetNodeIds = dbNodesInCanvas.map((n) => n.id);
    }
  }

  if (targetNodeIds.length === 0) {
    return [];
  }

  const results: TargetDbOperation[] = [];

  for (const tableNodeId of targetNodeIds) {
    const tableNode = allNodes.find((n) => n.id === tableNodeId);
    let rawTableName =
      tableNode?.data?.label ||
      tableNode?.data?.tableRef ||
      "";

    if (tableNode?.type === "db_ref" && tableNode.data?.tableRef) {
      const refEntity = allNodes.find((n) => n.id === tableNode.data.tableRef);
      if (refEntity) {
        rawTableName =
          refEntity.data?.label ||
          rawTableName;
      }
    }

    const cleanTableName = rawTableName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const entityCustomFns: ReusableFunction[] = [];
    const targetEntityNode = tableNode?.type === "db_ref" && tableNode.data?.tableRef
      ? allNodes.find((n) => n.id === tableNode.data?.tableRef)
      : tableNode;

    if (targetEntityNode) {
      const ops = getEntityDbOperations(targetEntityNode, allNodes);
      const varName = rawTableName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const importPath = `@workspace/db/helpers/${varName}`;
      ops.forEach((op) => {
        if (op.enabled !== false) {
          entityCustomFns.push({
            name: op.name,
            importPath,
            signature: op.signature || `${op.name}(): any`,
            targetName: rawTableName,
            kind: op.kind === "fetchByIndex" ? "custom" : (op.kind as any),
          });
        }
      });
    }

    const tableFns = [
      ...entityCustomFns,
      ...dbFunctions.filter((f) => {
        const targetClean = (f.targetName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const fnNameClean = f.name.toLowerCase();
        return (
          (cleanTableName && targetClean && targetClean === cleanTableName) ||
          (cleanTableName && fnNameClean.includes(cleanTableName)) ||
          (targetClean && cleanTableName && cleanTableName.includes(targetClean))
        );
      }),
    ];

    const fnsToUse = tableFns.length > 0 ? tableFns : dbFunctions;

    const rawOps = ep.crudOperations?.[tableNodeId];
    const selectedOps: string[] =
      Array.isArray(rawOps) && rawOps.length > 0
        ? rawOps
        : [
            method === "post"
              ? "create"
              : method === "put" || method === "patch"
                ? "update"
                : method === "delete"
                  ? "delete"
                  : "read",
          ];

    for (const op of selectedOps) {
      let fn: ReusableFunction | undefined = fnsToUse.find(
        (f) => f.name === op || f.name.toLowerCase() === op.toLowerCase(),
      );
      let callExpr = "";

      if (!fn) {
        if (op === "read") {
          if (isIdRoute) {
            fn = fnsToUse.find((f) => f.kind === "findById") || fnsToUse.find((f) => f.kind === "findAll");
          } else {
            fn = fnsToUse.find((f) => f.kind === "findAll") || fnsToUse.find((f) => f.kind === "findById");
          }
        } else if (op === "create") {
          fn = fnsToUse.find((f) => f.kind === "create");
        } else if (op === "update") {
          fn = fnsToUse.find((f) => f.kind === "update");
        } else if (op === "delete") {
          fn = fnsToUse.find((f) => f.kind === "delete");
        }
      }

      if (fn) {
        if (fn.kind === "findById" || fn.name.toLowerCase().includes("byid")) {
          callExpr = `await ${fn.name}(req.params.id)`;
        } else if (fn.kind === "create") {
          callExpr = `await ${fn.name}(PAYLOAD_VAR)`;
        } else if (fn.kind === "update") {
          callExpr = `await ${fn.name}(req.params.id, PAYLOAD_VAR)`;
        } else if (fn.kind === "delete") {
          callExpr = `await ${fn.name}(req.params.id)`;
        } else {
          callExpr = `await ${fn.name}()`;
        }

        const targetFnName = fn.name;
        if (!results.some((r) => r.fn.name === targetFnName)) {
          results.push({ fn, callExpr, operationKind: (fn.kind || "read") as any, tableNodeId });
        }
      }
    }
  }

  return results;
}

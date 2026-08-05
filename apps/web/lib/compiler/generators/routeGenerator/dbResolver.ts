import { Endpoint, TargetDbOperation, ReusableFunction } from "@workspace/canvas/types";
import { BackendNode } from "@/types/canvas";

/**
 * Resolves all database functions requested for an endpoint based on attached db_ref nodes
 * and the user's explicit crudOperations selection.
 */
export function pickDbFunctionsForEndpoint(
  ep: Endpoint,
  dbFunctions: ReusableFunction[],
  allNodes: BackendNode[],
  path: string,
): TargetDbOperation[] {
  if (dbFunctions.length === 0) return [];

  const method = (ep.type || "GET").toLowerCase();
  const isIdRoute = path.includes(":id") || path.includes("{id}");

  const dbNodeIds =
    ep.databaseNodeIds ||
    (ep.databaseNodeId && ep.databaseNodeId !== "none" ? [ep.databaseNodeId] : []);

  const results: TargetDbOperation[] = [];

  const targetNodeIds =
    dbNodeIds.length > 0
      ? dbNodeIds
      : ep.crudOperations && Object.keys(ep.crudOperations).length > 0
        ? Object.keys(ep.crudOperations)
        : [];

  if (targetNodeIds.length === 0) {
    return [];
  }

  for (const tableNodeId of targetNodeIds) {
    const tableNode = allNodes.find((n) => n.id === tableNodeId);
    const rawTableName = tableNode?.data?.label || tableNode?.data?.tableRef || "";
    const cleanTableName = rawTableName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const tableFns = dbFunctions.filter((f) => {
      const targetClean = (f.targetName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const fnNameClean = f.name.toLowerCase();
      return (
        targetClean === cleanTableName ||
        (cleanTableName && fnNameClean.includes(cleanTableName)) ||
        (targetClean && cleanTableName.includes(targetClean))
      );
    });

    const fnsToUse = tableFns.length > 0 ? tableFns : dbFunctions;

    const rawOps = ep.crudOperations?.[tableNodeId];
    const ops: ("read" | "create" | "update" | "delete")[] =
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

    for (const op of ops) {
      let fn: ReusableFunction | undefined;
      let callExpr = "";

      if (op === "read") {
        if (isIdRoute) {
          fn = fnsToUse.find((f) => f.kind === "findById") || fnsToUse.find((f) => f.kind === "findAll");
          callExpr = fn ? `${fn.name}(req.params.id)` : "";
        } else {
          fn = fnsToUse.find((f) => f.kind === "findAll") || fnsToUse.find((f) => f.kind === "findById");
          callExpr = fn ? `${fn.name}()` : "";
        }
      } else if (op === "create") {
        fn = fnsToUse.find((f) => f.kind === "create");
        callExpr = fn ? `${fn.name}(PAYLOAD_VAR)` : "";
      } else if (op === "update") {
        fn = fnsToUse.find((f) => f.kind === "update");
        callExpr = fn ? `${fn.name}(req.params.id, PAYLOAD_VAR)` : "";
      } else if (op === "delete") {
        fn = fnsToUse.find((f) => f.kind === "delete");
        callExpr = fn ? `${fn.name}(req.params.id)` : "";
      }

      if (fn && callExpr) {
        const targetFnName = fn.name;
        if (!results.some((r) => r.fn.name === targetFnName)) {
          results.push({ fn, callExpr, operationKind: op, tableNodeId });
        }
      }
    }
  }

  return results;
}

import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledDatabaseResult } from "./types";
import { compileSqliteDrizzleDatabase } from "./databases/sqlite/drizzle";

/**
 * Compiles database nodes based on dbEngine and ORM selected
 */
export function compileDatabaseNodes(
  allNodes: BackendNode[],
  allEdges: BackendEdge[],
): CompiledDatabaseResult {
  const firstDbNode = allNodes.find(
    (n) => n.type === "entity" || n.type === "db_ref",
  );
  const dbEngine = firstDbNode?.data.dbEngine || "sqlite";
  const orm = firstDbNode?.data.orm || "drizzle";

  switch (orm) {
    case "drizzle":
    default:
      return compileSqliteDrizzleDatabase(allNodes, allEdges);
  }
}

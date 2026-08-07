import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledDatabaseResult } from "@workspace/canvas/types";
import { compileRawSqliteDatabase } from "./databases/sqlite/raw";

/**
 * Compiles database nodes into packages/db using raw SQL prepared statements.
 * ORM-free by design — see databases/sqlite/raw/index.ts.
 */
export function compileDatabaseNodes(
  allNodes: BackendNode[],
  allEdges: BackendEdge[],
): CompiledDatabaseResult {
  // Single driver: raw better-sqlite3.
  return compileRawSqliteDatabase(allNodes, allEdges);
}

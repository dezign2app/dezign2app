import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledFile, CompiledDatabaseResult } from "./types";
import { toTableName, toVarName, mapToDrizzleSqliteType } from "./utils";

function enrichEntitiesWithForeignKeys(
  tables: BackendNode[],
  allNodes: BackendNode[],
  allEdges: BackendEdge[]
): BackendNode[] {
  const enrichedTables = tables.map((t) => JSON.parse(JSON.stringify(t)) as BackendNode);
  const tableByLabel = new Map<string, BackendNode>();
  const tableById = new Map<string, BackendNode>();

  enrichedTables.forEach((t) => {
    const label = toTableName(t.data.label || "table");
    tableByLabel.set(label, t);
    tableById.set(t.id, t);
  });

  // 1. Process Foreign Key edges from Canvas
  const fkEdges = allEdges.filter(
    (e) =>
      e.type === "foreign-key" ||
      e.data?.label === "foreign-key" ||
      (e.sourceHandle && (e.sourceHandle.includes("entity") || e.sourceHandle.includes("target") || e.sourceHandle.includes("source")))
  );

  fkEdges.forEach((edge) => {
    const srcNode = tableById.get(edge.source) || allNodes.find((n) => n.id === edge.source && (n.type === "entity" || n.type === "db_ref"));
    const tgtNode = tableById.get(edge.target) || allNodes.find((n) => n.id === edge.target && (n.type === "entity" || n.type === "db_ref"));

    if (!srcNode || !tgtNode) return;

    const srcTable = tableById.get(srcNode.id);
    const tgtTableLabel = toTableName(tgtNode.data.label || "table");

    if (!srcTable || !srcTable.data.columns) return;

    let tgtColName = "id";
    if (edge.targetHandle && edge.targetHandle.startsWith("target-")) {
      const idxStr = edge.targetHandle.replace("target-", "");
      const idx = parseInt(idxStr, 10);
      if (!isNaN(idx) && tgtNode.data.columns?.[idx]) {
        tgtColName = tgtNode.data.columns[idx].name;
      }
    }

    let srcColIdx = -1;
    if (edge.sourceHandle && edge.sourceHandle.startsWith("source-")) {
      const idxStr = edge.sourceHandle.replace("source-", "");
      const idx = parseInt(idxStr, 10);
      if (!isNaN(idx)) srcColIdx = idx;
    }

    if (srcColIdx >= 0 && srcTable.data.columns[srcColIdx]) {
      const col = srcTable.data.columns[srcColIdx];
      if (!col) return;
      col.isForeignKey = true;
      col.references = {
        table: tgtTableLabel,
        column: tgtColName,
      };
    } else {
      const matchingCol = srcTable.data.columns.find(
        (c) =>
          c.isForeignKey ||
          c.name.toLowerCase() === `${tgtTableLabel}_id` ||
          c.name.toLowerCase() === `${tgtTableLabel.slice(0, -1)}_id`
      );
      if (matchingCol) {
        matchingCol.isForeignKey = true;
        matchingCol.references = {
          table: tgtTableLabel,
          column: tgtColName,
        };
      }
    }
  });

  // 2. Infer missing references for columns explicitly marked isForeignKey or ending with _id
  enrichedTables.forEach((table) => {
    (table.data.columns || []).forEach((col) => {
      if (col.references?.table) return;

      const cName = col.name.toLowerCase();
      if (col.isForeignKey || cName.endsWith("_id")) {
        const potentialTargetLabel = cName.endsWith("_id") ? cName.slice(0, -3) : "";
        if (potentialTargetLabel) {
          const matchedTarget =
            tableByLabel.get(potentialTargetLabel) ||
            tableByLabel.get(`${potentialTargetLabel}s`) ||
            tableByLabel.get(`${potentialTargetLabel}es`);

          if (matchedTarget) {
            const targetLabel = toTableName(matchedTarget.data.label || "table");
            col.isForeignKey = true;
            col.references = {
              table: targetLabel,
              column: "id",
            };
          }
        }
      }
    });
  });

  return enrichedTables;
}

/**
 * Generates Drizzle ORM Schema TS file for a specific database entity/table
 */
function generateDrizzleTableSchema(tableNode: BackendNode, allTables: BackendNode[]): string {
  const tableName = toTableName(tableNode.data.label || "table");
  const tableVarName = toVarName(tableName);
  const columns = tableNode.data.columns || [];

  const requiredImports = new Set<string>();
  const drizzleTypes = new Set<string>(["sqliteTable"]);

  const colDefinitions: string[] = [];

  if (columns.length === 0) {
    drizzleTypes.add("text");
    colDefinitions.push(`  id: text("id").primaryKey(),`);
    colDefinitions.push(`  createdAt: text("created_at")`);
  } else {
    columns.forEach((col) => {
      const dbColName = col.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const varName = toVarName(dbColName);
      const { drizzleType, mode } = mapToDrizzleSqliteType(col.type);

      drizzleTypes.add(drizzleType);

      let colDef = `  ${varName}: ${drizzleType}("${dbColName}"${mode ? `, ${mode}` : ""})`;

      if (col.isPrimaryKey) {
        colDef += `.primaryKey()`;
      }
      if (col.isNotNull && !col.isPrimaryKey) {
        colDef += `.notNull()`;
      }
      if (col.isUnique && !col.isPrimaryKey) {
        colDef += `.unique()`;
      }
      if (col.references?.table) {
        const refTableName = toTableName(col.references.table);
        const refTableVar = toVarName(refTableName);
        const refColVar = toVarName(col.references.column || "id");

        if (refTableName !== tableName) {
          requiredImports.add(refTableVar);
        }
        colDef += `.references(() => ${refTableVar}.${refColVar}, { onDelete: "cascade" })`;
      }

      colDefinitions.push(`${colDef},`);
    });
  }

  let code = `import { ${Array.from(drizzleTypes).join(", ")} } from "drizzle-orm/sqlite-core";\n`;

  if (requiredImports.size > 0) {
    Array.from(requiredImports).forEach((imp) => {
      code += `import { ${imp} } from "./${imp}";\n`;
    });
  }
  code += `\n`;

  code += `export const ${tableVarName} = sqliteTable("${tableName}", {\n`;
  code += colDefinitions.join("\n");
  code += `\n});\n`;

  return code;
}

/**
 * Compiles the top-level database folder (db/) containing Drizzle ORM schema per table
 */
export function compileDatabaseNodes(
  allNodes: BackendNode[],
  allEdges: BackendEdge[]
): CompiledDatabaseResult {
  const entityNodes = allNodes.filter((n) => n.type === "entity" || n.type === "db_ref");
  const enrichedTables = enrichEntitiesWithForeignKeys(entityNodes, allNodes, allEdges);

  const files: CompiledFile[] = [];
  const schemaExports: string[] = [];

  if (enrichedTables.length === 0) {
    // Generate default sample schema if no entity nodes exist
    const defaultTable: BackendNode = {
      id: "default_entity",
      type: "entity",
      fractionalIndex: "a0",
      position: { x: 0, y: 0 },
      data: {
        label: "users",
        columns: [
          { name: "id", type: "string", isPrimaryKey: true },
          { name: "name", type: "string", isNotNull: true },
          { name: "created_at", type: "string" },
        ],
      },
    };
    const schemaCode = generateDrizzleTableSchema(defaultTable, [defaultTable]);
    files.push({
      filename: "schema/users.ts",
      language: "typescript",
      content: schemaCode,
    });
    schemaExports.push(`export * from "./schema/users";`);
  } else {
    enrichedTables.forEach((table) => {
      const tableName = toTableName(table.data.label || "table");
      const tableVarName = toVarName(tableName);
      const schemaCode = generateDrizzleTableSchema(table, enrichedTables);

      files.push({
        filename: `schema/${tableVarName}.ts`,
        language: "typescript",
        content: schemaCode,
      });
      schemaExports.push(`export * from "./schema/${tableVarName}";`);
    });
  }

  // Generate db/schema/index.ts
  files.push({
    filename: "schema/index.ts",
    language: "typescript",
    content: `${schemaExports.join("\n")}\n`,
  });

  // Generate db/index.ts
  const dbIndexCode = `import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "sqlite.db");
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
export { schema };
`;
  files.push({
    filename: "index.ts",
    language: "typescript",
    content: dbIndexCode,
  });

  // Generate db/package.json
  const dbPackageJson = JSON.stringify(
    {
      name: "@workspace/db",
      version: "0.0.0",
      private: true,
      description: "Generated Drizzle ORM database schemas package",
      main: "index.ts",
      scripts: {
        build: "tsc",
        generate: "drizzle-kit generate:sqlite",
        push: "drizzle-kit push:sqlite",
      },
      dependencies: {
        "drizzle-orm": "^0.30.0",
        "better-sqlite3": "^11.3.0",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        "drizzle-kit": "^0.20.0",
        "@types/better-sqlite3": "^7.6.11",
        typescript: "^5.3.3",
      },
    },
    null,
    2
  );
  files.push({
    filename: "package.json",
    language: "json",
    content: dbPackageJson,
  });

  const dbTsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: {
        outDir: "dist",
      },
      include: ["src/**/*", "index.ts", "schema/**/*"],
    },
    null,
    2
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: dbTsconfig,
  });

  // Generate db/drizzle.config.ts
  const drizzleConfig = `import type { Config } from "drizzle-kit";

export default {
  schema: "./schema/*",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./sqlite.db",
  },
} satisfies Config;
`;
  files.push({
    filename: "drizzle.config.ts",
    language: "typescript",
    content: drizzleConfig,
  });

  return { files };
}


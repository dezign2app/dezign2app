import { BackendNode, BackendEdge } from "@/types/canvas";
import {
  CompiledFile,
  CompiledDatabaseResult,
  ReusableFunction,
  DbOperationFunction,
} from "@workspace/canvas/types";
import { toTableName, toVarName, toSqlIdentifier } from "../../../utils";
import { generateDefaultDbOperations, getEntityDbOperations } from "@/lib/utils/entityOperationsHelper";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toPascal(str: string): string {
  const clean = toSqlIdentifier(str, "table");
  return clean
    .split(/[_\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function getColumns(
  tableNode: BackendNode,
): { name: string; type: string; isPrimaryKey?: boolean; isUnique?: boolean; isForeignKey?: boolean }[] {
  const cols = tableNode.data.columns;
  if (cols && Array.isArray(cols) && cols.length > 0) {
    return cols.map((c) => ({
      ...c,
      name: toSqlIdentifier(c.name || "col", "col"),
    }));
  }
  return [
    { name: "id", type: "string", isPrimaryKey: true },
    { name: "created_at", type: "string" },
  ];
}

function toTsType(colType: string): string {
  const t = (colType || "string").toLowerCase();
  if (["int", "integer", "bigint", "number"].includes(t)) return "number";
  if (["boolean", "bool"].includes(t)) return "boolean";
  return "string";
}

// ---------------------------------------------------------------------------
// Per-table CRUD code generator
// ---------------------------------------------------------------------------
// Per-table CRUD code generator
// ---------------------------------------------------------------------------

function generateTableHelpers(
  tableNode: BackendNode,
  allNodes: BackendNode[] = [],
): { code: string; fns: ReusableFunction[] } {
  const tableName = toTableName(tableNode.data.label || "table");
  const varName = toVarName(tableName);
  const Pascal = toPascal(tableName);
  const cols = getColumns(tableNode);
  const pkCol = cols.find((c) => c.isPrimaryKey) || cols[0];
  const pkColName = pkCol?.name || "id";
  const pkVarName = toVarName(pkColName);
  const pkTs = toTsType(pkCol?.type || "string");

  const writableCols = cols.filter((c) => !c.isPrimaryKey);
  const writableColNames = writableCols.map((c) => c.name);
  const insertCols = writableColNames.join(", ");
  const insertPlaceholders = writableColNames.map(() => "?").join(", ");

  const recordFields = writableCols
    .map((c) => `  ${toVarName(c.name)}: ${toTsType(c.type)};`)
    .join("\n");
  const dataType =
    writableCols.length > 0 ? `{\n${recordFields}\n}` : `Record<string, never>`;

  const importPath = `@workspace/db/helpers/${varName}`;

  // ── code template ──────────────────────────────────────────────────────────
  let code = `/**\n`;
  code += ` * Auto-generated raw SQL helpers for table: ${tableName}\n`;
  code += ` *\n`;
  code += ` * ALL queries use prepared statements — safe from SQL injection.\n`;
  code += ` * Never concatenate user-supplied values into query strings.\n`;
  code += ` */\n`;
  code += `import { db } from "../index";\n\n`;

  // Types
  code += `// ── Types ────────────────────────────────────────────────────────────────────\n\n`;
  code += `export type ${Pascal}Row = {\n`;
  cols.forEach((c) => {
    code += `  ${toVarName(c.name)}: ${toTsType(c.type)};\n`;
  });
  code += `};\n\n`;
  code += `export type Create${Pascal}Data = ${dataType};\n\n`;
  code += `export type Update${Pascal}Data = Partial<Create${Pascal}Data>;\n\n`;

  const insertBindTypes = writableCols
    .map((c) => `${toVarName(c.name)}: ${toTsType(c.type)}`)
    .join(", ");

  // ── Prepared Statements (created once at module load) ────────────────────────
  code += `// ── Prepared Statements (created once at module load) ────────────────────────\n\n`;
  code += `const stmtFindAll = db.prepare<[limit?: number, offset?: number], ${Pascal}Row>(\n`;
  code += `  "SELECT * FROM ${tableName} LIMIT ? OFFSET ?"\n`;
  code += `);\n\n`;
  code += `const stmtFindById = db.prepare<[${pkVarName}: ${pkTs}], ${Pascal}Row>(\n`;
  code += `  "SELECT * FROM ${tableName} WHERE ${pkColName} = ?"\n`;
  code += `);\n\n`;

  if (writableCols.length > 0) {
    code += `const stmtInsert = db.prepare<[${insertBindTypes}]>(\n`;
    code += `  "INSERT INTO ${tableName} (${insertCols}) VALUES (${insertPlaceholders})"\n`;
    code += `);\n\n`;
    code += `const stmtUpdate = db.prepare<[${insertBindTypes}, ${pkVarName}: ${pkTs}]>(\n`;
    code += `  "UPDATE ${tableName} SET ${writableCols.map((c) => `${c.name} = ?`).join(", ")} WHERE ${pkColName} = ?"\n`;
    code += `);\n\n`;
  }

  code += `const stmtDelete = db.prepare<[${pkVarName}: ${pkTs}]>(\n`;
  code += `  "DELETE FROM ${tableName} WHERE ${pkColName} = ?"\n`;
  code += `);\n\n`;

  // DB operations defined on entity node (or fallback defaults)
  const defaultDbOps = generateDefaultDbOperations(
    tableNode.data.label || "table",
    cols,
    tableNode.data.indexes || [],
    allNodes,
  );

  const dbOps: DbOperationFunction[] = getEntityDbOperations(tableNode, allNodes);

  const fns: ReusableFunction[] = [];

  code += `// ── DB Operations Functions ───────────────────────────────────────────────────\n\n`;

  dbOps.forEach((op) => {
    if (op.enabled === false) return;

    const matchingDefault = defaultDbOps.find((d) => d.id === op.id || d.name === op.name);
    const effectiveName = op.isAutoGenerated && matchingDefault ? matchingDefault.name : op.name;
    const effectiveSignature =
      (op.isAutoGenerated && matchingDefault
        ? matchingDefault.signature
        : op.signature) || `${effectiveName}(): void`;

    fns.push({
      name: effectiveName,
      importPath,
      signature: effectiveSignature,
      targetName: tableName,
      kind: op.kind === "fetchByIndex" || op.kind === "join" ? "custom" : op.kind,
    });

    // Detect code that should be regenerated:
    // - Old dynamic SQL patterns (Object.keys / Object.entries) — SQL injection risk
    // - Malformed WHERE without equality
    // - fetchByIndex ops that used .get() instead of .all() (wrong cardinality for N-side FK columns)
    const isLegacyVulnerableCode =
      op.code &&
      (op.code.includes("Object.keys(") ||
        op.code.includes("Object.entries(") ||
        (op.code.includes("WHERE ") && !op.code.includes("=")) ||
        // Cardinality: a fetchByIndex on a FK column must use .all(), never .get()
        (op.kind === "fetchByIndex" &&
          op.code.includes(".get(") &&
          matchingDefault?.code?.includes(".all(")));

    const effectiveCode =
      (op.isAutoGenerated || isLegacyVulnerableCode || op.kind !== "custom" || !op.code || !op.code.trim()) && matchingDefault
        ? matchingDefault.code
        : op.code;

    if (effectiveCode && effectiveCode.trim()) {
      code += `/** ${op.description || effectiveName} */\n`;
      code += `${effectiveCode.trim()}\n\n`;
    } else if (op.kind === "findAll") {
      code += `/** ${op.description || `Retrieve all rows from ${tableName}`} */\n`;
      code += `export function ${effectiveName}(limit: number = 20, offset: number = 0): ${Pascal}Row[] {\n`;
      code += `  return stmtFindAll.all(limit, offset) as ${Pascal}Row[];\n`;
      code += `}\n\n`;
    } else if (op.kind === "findById") {
      code += `/** ${op.description || `Find a ${tableName} row by primary key`} */\n`;
      code += `export function ${effectiveName}(${pkVarName}: ${pkTs}): ${Pascal}Row | undefined {\n`;
      code += `  return stmtFindById.get(${pkVarName}) as ${Pascal}Row | undefined;\n`;
      code += `}\n\n`;
    } else if (op.kind === "create" && writableCols.length > 0) {
      code += `/** ${op.description || `Create a new record in ${tableName}`} */\n`;
      code += `export function ${effectiveName}(data: Create${Pascal}Data): ${Pascal}Row {\n`;
      code += `  const info = stmtInsert.run(${writableCols.map((c) => `data.${toVarName(c.name)}`).join(", ")});\n`;
      code += `  const _rowId = typeof info.lastInsertRowid === "bigint" ? info.lastInsertRowid.toString() : String(info.lastInsertRowid);\n`;
      code += `  return { ${pkColName}: _rowId, ...data } as ${Pascal}Row;\n`;
      code += `}\n\n`;
    } else if (op.kind === "update" && writableCols.length > 0) {
      code += `/** ${op.description || `Update a ${tableName} row by primary key`} */\n`;
      code += `export function ${effectiveName}(${pkVarName}: ${pkTs}, data: Update${Pascal}Data): ${Pascal}Row | undefined {\n`;
      code += `  const current = find${toPascal(tableName)}ById(${pkVarName});\n`;
      code += `  if (!current) return undefined;\n`;
      code += `  const updated = { ...current, ...data };\n`;
      code += `  stmtUpdate.run(${writableCols.map((c) => `updated.${toVarName(c.name)}`).join(", ")}, ${pkVarName});\n`;
      code += `  return find${toPascal(tableName)}ById(${pkVarName});\n`;
      code += `}\n\n`;
    } else if (op.kind === "delete") {
      code += `/** ${op.description || `Delete a ${tableName} row by primary key`} */\n`;
      code += `export function ${effectiveName}(${pkVarName}: ${pkTs}): void {\n`;
      code += `  stmtDelete.run(${pkVarName});\n`;
      code += `}\n\n`;
    }
  });

  return { code, fns };
}

// ---------------------------------------------------------------------------
// Main compiler export
// ---------------------------------------------------------------------------

/**
 * Compiles database entity nodes into packages/db with:
 *  - index.ts           — raw better-sqlite3 singleton connection + WAL/FK pragmas
 *  - helpers/<table>.ts — per-table CRUD via prepared statements (injection-safe)
 *  - helpers/index.ts   — barrel export
 *  - package.json, tsconfig.json
 *
 * ORM-free by design. No Drizzle, no query builders.
 */
export function compileRawSqliteDatabase(
  allNodes: BackendNode[],
  _allEdges: BackendEdge[],
): CompiledDatabaseResult {
  const entityNodes = allNodes.filter(
    (n) => n.type === "entity" || n.type === "db_ref",
  );

  const files: CompiledFile[] = [];
  const allReusableFunctions: ReusableFunction[] = [];

  // ── index.ts ──────────────────────────────────────────────────────────────
  files.push({
    filename: "index.ts",
    language: "typescript",
    content: [
      `/**`,
      ` * packages/db — Raw SQLite connection via better-sqlite3`,
      ` *`,
      ` * Use the helpers in ./helpers/ instead of calling db directly.`,
      ` */`,
      `import Database from "better-sqlite3";`,
      `import path from "path";`,
      ``,
      `const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "sqlite.db");`,
      ``,
      `/** Singleton synchronous SQLite connection. */`,
      `export const db: Database.Database = new Database(dbPath);`,
      ``,
      `// Recommended pragmas for correctness and performance`,
      `db.pragma("journal_mode = WAL");`,
      `db.pragma("foreign_keys = ON");`,
      ``,
    ].join("\n"),
  });

  // ── helpers/<table>.ts ────────────────────────────────────────────────────
  const tables: BackendNode[] =
    entityNodes.length > 0
      ? entityNodes
      : [
          {
            id: "default",
            type: "entity",
            fractionalIndex: "a0",
            position: { x: 0, y: 0 },
            data: {
              label: "users",
              columns: [
                { name: "id", type: "string", isPrimaryKey: true },
                { name: "name", type: "string", isNotNull: true },
                { name: "email", type: "string", isUnique: true },
                { name: "created_at", type: "string" },
              ],
            },
          } as BackendNode,
        ];

  const helperBarrel: string[] = [];

  tables.forEach((tableNode) => {
    const tableName = toTableName(tableNode.data.label || "table");
    const varName = toVarName(tableName);
    const { code, fns } = generateTableHelpers(tableNode, tables);

    files.push({ filename: `helpers/${varName}.ts`, language: "typescript", content: code });
    helperBarrel.push(`export * from "./${varName}";`);
    allReusableFunctions.push(...fns);
  });

  // ── helpers/index.ts ─────────────────────────────────────────────────────
  files.push({
    filename: "helpers/index.ts",
    language: "typescript",
    content:
      `/**\n * Barrel export for all table-level CRUD helpers.\n */\n` +
      helperBarrel.join("\n") +
      "\n",
  });

  // ── package.json ──────────────────────────────────────────────────────────
  files.push({
    filename: "package.json",
    language: "json",
    content: JSON.stringify(
      {
        name: "@workspace/db",
        version: "0.0.0",
        private: true,
        description: "Raw SQLite helpers — injection-safe prepared statements, no ORM",
        main: "index.ts",
        types: "index.ts",
        exports: {
          ".": "./index.ts",
          "./helpers": "./helpers/index.ts",
          "./helpers/*": "./helpers/*.ts",
        },
        scripts: { build: "tsc", "check-types": "tsc --noEmit" },
        dependencies: { "better-sqlite3": "^11.3.0" },
        devDependencies: {
          "@workspace/typescript-config": "workspace:*",
          "@types/better-sqlite3": "^7.6.11",
          "@types/node": "^20.11.0",
          typescript: "^5.3.3",
        },
      },
      null,
      2,
    ),
  });

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: JSON.stringify(
      {
        extends: "@workspace/typescript-config/base.json",
        compilerOptions: { outDir: "dist" },
        include: ["index.ts", "helpers/**/*"],
      },
      null,
      2,
    ),
  });

  return { files, reusableFunctions: allReusableFunctions };
}

import { BackendNode, BackendEdge } from "@/types/canvas";
import {
  CompiledFile,
  CompiledDatabaseResult,
  ReusableFunction,
} from "../../../types";
import { toTableName, toVarName } from "../../../utils";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toPascal(str: string): string {
  return str
    .split(/[_\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function getColumns(
  tableNode: BackendNode,
): { name: string; type: string; isPrimaryKey?: boolean }[] {
  const cols = tableNode.data.columns;
  if (cols && Array.isArray(cols) && cols.length > 0) return cols;
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

function generateTableHelpers(
  tableNode: BackendNode,
): { code: string; fns: ReusableFunction[] } {
  const tableName = toTableName(tableNode.data.label || "table");
  const varName = toVarName(tableName);
  const Pascal = toPascal(tableName);
  const cols = getColumns(tableNode);
  const pkCol = cols.find((c) => c.isPrimaryKey) || cols[0];
  const pkName = pkCol?.name || "id";
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

  // Prepared statements
  code += `// ── Prepared Statements (created once at module load) ────────────────────────\n\n`;
  code += `const stmtFindAll = db.prepare<[], ${Pascal}Row>(\n`;
  code += `  "SELECT * FROM ${tableName}"\n`;
  code += `);\n\n`;
  code += `const stmtFindById = db.prepare<[${pkTs}], ${Pascal}Row>(\n`;
  code += `  "SELECT * FROM ${tableName} WHERE ${pkName} = ?"\n`;
  code += `);\n\n`;

  if (writableCols.length > 0) {
    // SqliteValue covers every type better-sqlite3 accepts as a positional bind param
    code += `type SqliteValue = string | number | bigint | Buffer | null;\n`;
    code += `const stmtInsert = db.prepare<SqliteValue[], void>(\n`;
    code += `  "INSERT INTO ${tableName} (${insertCols}) VALUES (${insertPlaceholders})"\n`;
    code += `);\n\n`;
  }

  code += `const stmtDelete = db.prepare<[${pkTs}], void>(\n`;
  code += `  "DELETE FROM ${tableName} WHERE ${pkName} = ?"\n`;
  code += `);\n\n`;

  // CRUD functions
  code += `// ── CRUD Functions ───────────────────────────────────────────────────────────\n\n`;

  code += `/** Retrieve all rows from ${tableName}. */\n`;
  code += `export function findAll${Pascal}(): ${Pascal}Row[] {\n`;
  code += `  return stmtFindAll.all();\n`;
  code += `}\n\n`;

  code += `/** Find a ${tableName} row by primary key. Returns undefined if not found. */\n`;
  code += `export function find${Pascal}ById(${pkName}: ${pkTs}): ${Pascal}Row | undefined {\n`;
  code += `  return stmtFindById.get(${pkName}) ?? undefined;\n`;
  code += `}\n\n`;

  if (writableCols.length > 0) {
    code += `/**\n`;
    code += ` * Insert a new row into ${tableName}.\n`;
    code += ` * Values are passed as positional ? parameters — injection-safe.\n`;
    code += ` */\n`;
    code += `export function create${Pascal}(data: Create${Pascal}Data): void {\n`;
    code += `  stmtInsert.run(${writableColNames.map((c) => `data.${toVarName(c)}`).join(", ")});\n`;
    code += `}\n\n`;

    code += `/**\n`;
    code += ` * Update a ${tableName} row by primary key.\n`;
    code += ` * Column names come from the typed Update${Pascal}Data keys — NOT from user input.\n`;
    code += ` * Values flow through ? placeholders — injection-safe.\n`;
    code += ` * @throws {Error} if no fields provided\n`;
    code += ` */\n`;
    code += `export function update${Pascal}(${pkName}: ${pkTs}, data: Update${Pascal}Data): void {\n`;
    code += `  const entries = Object.entries(data).filter(([, v]) => v !== undefined);\n`;
    code += `  if (entries.length === 0) throw new Error("update${Pascal}: no fields provided");\n`;
    code += `  // setClause is built from typed property names, never user input\n`;
    code += `  const setClause = entries.map(([col]) => \`\${col} = ?\`).join(", ");\n`;
    code += `  const values = entries.map(([, v]) => v);\n`;
    code += `  db.prepare(\`UPDATE ${tableName} SET \${setClause} WHERE ${pkName} = ?\`).run(...values, ${pkName});\n`;
    code += `}\n\n`;
  }

  code += `/** Delete a ${tableName} row by primary key. */\n`;
  code += `export function delete${Pascal}ById(${pkName}: ${pkTs}): void {\n`;
  code += `  stmtDelete.run(${pkName});\n`;
  code += `}\n`;

  const fns: ReusableFunction[] = [
    {
      name: `findAll${Pascal}`,
      importPath,
      signature: `findAll${Pascal}(): ${Pascal}Row[]`,
      targetName: tableName,
      kind: "findAll",
    },
    {
      name: `find${Pascal}ById`,
      importPath,
      signature: `find${Pascal}ById(${pkName}: ${pkTs}): ${Pascal}Row | undefined`,
      targetName: tableName,
      kind: "findById",
    },
    ...(writableCols.length > 0
      ? [
          {
            name: `create${Pascal}`,
            importPath,
            signature: `create${Pascal}(data: Create${Pascal}Data): void`,
            targetName: tableName,
            kind: "create" as const,
          },
          {
            name: `update${Pascal}`,
            importPath,
            signature: `update${Pascal}(${pkName}: ${pkTs}, data: Update${Pascal}Data): void`,
            targetName: tableName,
            kind: "update" as const,
          },
        ]
      : []),
    {
      name: `delete${Pascal}ById`,
      importPath,
      signature: `delete${Pascal}ById(${pkName}: ${pkTs}): void`,
      targetName: tableName,
      kind: "delete",
    },
  ];

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
    const { code, fns } = generateTableHelpers(tableNode);

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

import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource, JSONValue } from "@workspace/canvas/types";

export interface CompiledFile {
  filename: string;
  language: string;
  content: string;
}

export interface CompiledServiceResult {
  serviceId: string;
  serviceName: string;
  files: CompiledFile[];
}

export interface CompiledDatabaseResult {
  files: CompiledFile[];
}

function parseSchemaJson(rawJson?: string): JSONValue {
  if (!rawJson || !rawJson.trim()) return null;
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

function toVarName(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, "_");
  const camel = clean.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return "item";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

function toPascalCase(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, "_");
  const camel = clean.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return "Item";
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toTableName(str: string): string {
  return (str || "table").toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function mapToDrizzleSqliteType(type?: string): { drizzleType: string; mode?: string } {
  if (!type) return { drizzleType: "text" };
  const t = type.toLowerCase();
  if (t === "number" || t === "int" || t === "integer") return { drizzleType: "integer" };
  if (t === "float" || t === "double" || t === "decimal" || t === "real") return { drizzleType: "real" };
  if (t === "boolean" || t === "bool") return { drizzleType: "integer", mode: '{ mode: "boolean" }' };
  return { drizzleType: "text" };
}

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
      name: "blueprint-db",
      version: "1.0.0",
      description: "Generated Drizzle ORM database schemas",
      main: "index.ts",
      scripts: {
        generate: "drizzle-kit generate:sqlite",
        push: "drizzle-kit push:sqlite",
      },
      dependencies: {
        "drizzle-orm": "^0.30.0",
        "better-sqlite3": "^11.3.0",
      },
      devDependencies: {
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

/**
 * Compiles a single Service Node into its modular microservice directory structure
 */
export function compileServiceNode(
  node: BackendNode,
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  testCases: SimulationTestCase[] = []
): CompiledServiceResult {
  const serviceName = node.data.label || "Service";
  const sanitizedName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const port = node.data.port || "8080";
  const cors = node.data.cors || false;
  const corsOrigins = node.data.corsOrigins || "*";

  let nodeEndpoints = endpoints.filter((e) => e.nodeId === node.id);
  if (nodeEndpoints.length === 0 && node.data?.endpoints) {
    nodeEndpoints = node.data.endpoints as (Endpoint & { nodeId: string })[];
  }
  if (node.data?.routeGroups) {
    for (const group of node.data.routeGroups as any[]) {
      if (group.endpoints) {
        nodeEndpoints = [...nodeEndpoints, ...group.endpoints];
      }
    }
  }

  let nodeConsumedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "consume");
  if (nodeConsumedEvents.length === 0 && node.data?.consumedEvents) {
    nodeConsumedEvents = (node.data.consumedEvents as any[]).map((e) => ({ ...e, nodeId: node.id, variant: "consume" }));
  }

  let nodePublishedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "publish");
  if (nodePublishedEvents.length === 0 && node.data?.publishedEvents) {
    nodePublishedEvents = (node.data.publishedEvents as any[]).map((e) => ({ ...e, nodeId: node.id, variant: "publish" }));
  }

  const files: CompiledFile[] = [];

  // =========================================================================
  // 1. GENERATE src/routes/ (individual file per endpoint)
  // =========================================================================
  const routeImports: string[] = [];
  const routeRegistrations: string[] = [];

  if (nodeEndpoints.length === 0) {
    // Default endpoint handler if none configured
    const defaultRouteCode = `import { Request, Response } from "express";

export async function defaultHandler(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "Default service route operational for ${serviceName}.",
    timestamp: new Date().toISOString()
  });
}
`;
    files.push({
      filename: "src/routes/defaultRoute.ts",
      language: "typescript",
      content: defaultRouteCode,
    });
    routeImports.push(`import { defaultHandler } from "./defaultRoute";`);
    routeRegistrations.push(`router.get("/example", defaultHandler);`);
  } else {
    nodeEndpoints.forEach((ep) => {
      const rawName = ep.name || ep.id;
      const routeFileName = toVarName(rawName) || "endpoint";
      const handlerName = `${routeFileName}Handler`;
      const method = (ep.type || "GET").toLowerCase();
      const path = ep.name?.startsWith("/") ? ep.name : `/${ep.name || ""}`;
      const summary = ep.summary || `Handler for ${ep.type || "GET"} ${path}`;

      const parsedResSchema = parseSchemaJson(ep.responseBody?.rawJson);
      let responseData: string;
      if (parsedResSchema) {
        responseData = JSON.stringify(parsedResSchema, null, 6).replace(/\n/g, "\n    ");
      } else {
        responseData = `{\n      success: true,\n      message: "Successfully executed ${ep.type || "GET"} ${path}",\n      timestamp: new Date().toISOString()\n    }`;
      }

      let routeHandlerCode = `import { Request, Response } from "express";
import { db } from "../lib/db.config";

/**
 * ${ep.type || "GET"} ${path}
 * ${summary}
 */
export async function ${handlerName}(req: Request, res: Response) {
  try {
    // =========================================================================
    // 🤖 AI CODING AGENT DIRECTIVE:
    // Implement endpoint domain logic for: ${ep.type || "GET"} ${path}
    // Description: ${summary}
    // =========================================================================
`;

      if (ep.businessLogic && ep.businessLogic.trim()) {
        ep.businessLogic.split("\n").forEach((line, idx) => {
          if (line.trim()) routeHandlerCode += `    // STEP ${idx + 1}: ${line.trim()}\n`;
        });
      } else {
        routeHandlerCode += `    // STEP 1: Validate request payload and params\n`;
        routeHandlerCode += `    // STEP 2: Execute database query/mutation\n`;
        routeHandlerCode += `    // STEP 3: Return structured JSON response\n`;
      }

      const statusCode = ep.type === "POST" ? 201 : 200;
      routeHandlerCode += `\n    return res.status(${statusCode}).json(${responseData});\n`;
      routeHandlerCode += `  } catch (error) {\n    console.error("Error in ${method.toUpperCase()} ${path}:", error);\n    return res.status(500).json({ error: "Internal Server Error", details: (error as Error).message });\n  }\n}\n`;

      files.push({
        filename: `src/routes/${routeFileName}.ts`,
        language: "typescript",
        content: routeHandlerCode,
      });

      routeImports.push(`import { ${handlerName} } from "./${routeFileName}";`);
      routeRegistrations.push(`router.${method}("${path}", ${handlerName});`);
    });
  }

  // src/routes/index.ts
  const routesIndexCode = `import { Router } from "express";
${routeImports.join("\n")}

export const router = Router();

${routeRegistrations.join("\n")}
`;
  files.push({
    filename: "src/routes/index.ts",
    language: "typescript",
    content: routesIndexCode,
  });

  // =========================================================================
  // 2. GENERATE src/consumer/ (individual file per event consumer)
  // =========================================================================
  const consumerImports: string[] = [];
  const consumerInits: string[] = [];

  if (nodeConsumedEvents.length === 0) {
    files.push({
      filename: "src/consumer/index.ts",
      language: "typescript",
      content: `/**\n * Event Consumers for ${serviceName}\n */\nexport function initConsumers(): void {\n  // No consumed events configured for this service\n}\n`,
    });
  } else {
    nodeConsumedEvents.forEach((ev) => {
      const consumerFileName = toVarName(ev.name || "event") || "consumer";
      const handlerName = `handle${toPascalCase(ev.name || "event")}`;

      const consumerCode = `/**
 * Event Consumer for: "${ev.name}"
 * Description: ${ev.description || "Processes incoming event payload"}
 */
export async function ${handlerName}(payload: Record<string, unknown>): Promise<void> {
  console.log(\`[EVENT CONSUME] [${ev.name}]\`, payload);
  // Handler Logic: ${ev.handlerLogic || "Process event payload"}
}
`;
      files.push({
        filename: `src/consumer/${consumerFileName}.ts`,
        language: "typescript",
        content: consumerCode,
      });

      consumerImports.push(`import { ${handlerName} } from "./${consumerFileName}";`);
      consumerInits.push(`  console.log("Registered listener for topic: ${ev.name}");`);
    });

    const consumersIndexCode = `/**
 * Event Consumers Initialization for ${serviceName}
 */
${consumerImports.join("\n")}

export function initConsumers(): void {
  console.log("Initializing event consumers...");
${consumerInits.join("\n")}
}
`;
    files.push({
      filename: "src/consumer/index.ts",
      language: "typescript",
      content: consumersIndexCode,
    });
  }

  // =========================================================================
  // 3. GENERATE src/producer/ (individual file per event producer)
  // =========================================================================
  const producerExports: string[] = [];

  if (nodePublishedEvents.length === 0) {
    files.push({
      filename: "src/producer/index.ts",
      language: "typescript",
      content: `/**\n * Event Producers for ${serviceName}\n */\n// No published events configured for this service\n`,
    });
  } else {
    nodePublishedEvents.forEach((ev) => {
      const producerFileName = toVarName(ev.name || "event") || "producer";
      const funcName = `publish${toPascalCase(ev.name || "event")}`;

      const producerCode = `/**
 * Event Producer for: "${ev.name}"
 */
export async function ${funcName}(eventData: Record<string, unknown>): Promise<void> {
  console.log(\`[EVENT PUBLISH] [${ev.name}]\`, JSON.stringify(eventData, null, 2));
  // TODO: Connect message broker (Kafka / NATS / RabbitMQ / Redis)
}
`;
      files.push({
        filename: `src/producer/${producerFileName}.ts`,
        language: "typescript",
        content: producerCode,
      });

      producerExports.push(`export * from "./${producerFileName}";`);
    });

    const producersIndexCode = `/**
 * Event Producers for ${serviceName}
 */
${producerExports.join("\n")}
`;
    files.push({
      filename: "src/producer/index.ts",
      language: "typescript",
      content: producersIndexCode,
    });
  }

  // =========================================================================
  // 4. GENERATE src/lib/ (db.config.ts and index.ts)
  // =========================================================================
  const dbConfigCode = `import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../../../db/sqlite.db");
export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);
`;
  files.push({
    filename: "src/lib/db.config.ts",
    language: "typescript",
    content: dbConfigCode,
  });

  const libIndexCode = `export * from "./db.config";

export function formatResponse<T>(data: T, message = "Success") {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}
`;
  files.push({
    filename: "src/lib/index.ts",
    language: "typescript",
    content: libIndexCode,
  });

  // =========================================================================
  // 5. GENERATE src/index.ts (main server config)
  // =========================================================================
  const serverCode = `import express, { Request, Response } from "express";
${cors ? 'import cors from "cors";\n' : ""}import dotenv from "dotenv";
import { router as apiRouter } from "./routes";
import { initConsumers } from "./consumer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || ${port};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
${cors ? `app.use(cors({ origin: "${corsOrigins}" }));\n` : "app.use(cors());\n"}
// --- Request Logger ---
app.use((req: Request, _res: Response, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  next();
});

// --- Health Check ---
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "UP",
    service: "${serviceName}",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// --- Mount Routes ---
app.use("/api", apiRouter);

// --- Initialize Event Consumers ---
initConsumers();

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(\`🚀 Service "${serviceName}" operational at http://localhost:\${PORT}\`);
  console.log(\`📋 Health check available at http://localhost:\${PORT}/health\`);
});
`;
  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: serverCode,
  });

  // =========================================================================
  // 6. GENERATE package.json, tsconfig.json, .env, .gitignore
  // =========================================================================
  const packageJson = JSON.stringify(
    {
      name: `${sanitizedName}-service`,
      version: "1.0.0",
      description: node.data.description || `Generated microservice for ${serviceName}`,
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "ts-node-dev --respawn src/index.ts",
      },
      dependencies: {
        express: "^4.19.2",
        dotenv: "^16.4.5",
        "drizzle-orm": "^0.30.0",
        "better-sqlite3": "^11.3.0",
        ...(cors ? { cors: "^2.8.5" } : {}),
      },
      devDependencies: {
        "@types/express": "^4.17.21",
        "@types/better-sqlite3": "^7.6.11",
        ...(cors ? { "@types/cors": "^2.8.17" } : {}),
        "@types/node": "^20.11.0",
        "ts-node-dev": "^2.0.0",
        typescript: "^5.3.3",
      },
    },
    null,
    2
  );
  files.push({
    filename: "package.json",
    language: "json",
    content: packageJson,
  });

  const tsconfig = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "CommonJS",
        moduleResolution: "node",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ["src/**/*"],
    },
    null,
    2
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: tsconfig,
  });

  const envFile = `PORT=${port}
NODE_ENV=development
DATABASE_PATH=../../db/sqlite.db
`;
  files.push({
    filename: ".env",
    language: "dotenv",
    content: envFile,
  });

  const gitignoreFile = `node_modules
dist
.env
*.log
`;
  files.push({
    filename: ".gitignore",
    language: "gitignore",
    content: gitignoreFile,
  });

  return {
    serviceId: node.id,
    serviceName,
    files,
  };
}

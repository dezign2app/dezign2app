import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource, JSONValue, UIEventItem } from "@workspace/canvas/types";

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

function parseSchemaJson(rawJson?: string): JSONValue {
  if (!rawJson || !rawJson.trim()) return null;
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

function mapToSqliteType(type?: string): string {
  if (!type) return "TEXT";
  const t = type.toLowerCase();
  if (t === "number" || t === "int" || t === "integer") return "INTEGER";
  if (t === "float" || t === "double" || t === "decimal" || t === "real") return "REAL";
  if (t === "boolean" || t === "bool") return "INTEGER";
  return "TEXT";
}

function generateSqliteTableDdl(node: BackendNode): string {
  const tableName = (node.data.label || "table").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const columns = node.data.columns || [];

  if (columns.length === 0) {
    return `CREATE TABLE IF NOT EXISTS ${tableName} (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`;
  }

  const columnLines: string[] = [];
  columns.forEach((col) => {
    const colName = col.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const sqliteType = mapToSqliteType(col.type);
    let line = `  ${colName} ${sqliteType}`;

    if (col.isPrimaryKey) {
      line += " PRIMARY KEY";
    }
    if (col.isNotNull || col.isPrimaryKey) {
      line += " NOT NULL";
    }
    if (col.isUnique && !col.isPrimaryKey) {
      line += " UNIQUE";
    }
    if (col.references?.table) {
      const refTable = col.references.table.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const refCol = (col.references.column || "id").toLowerCase().replace(/[^a-z0-9_]/g, "_");
      line += ` REFERENCES ${refTable}(${refCol})`;
    }
    columnLines.push(line);
  });

  let ddl = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnLines.join(",\n")}\n);`;

  // Generate indexes
  const indexes = node.data.indexes || [];
  if (indexes.length > 0) {
    const indexDdls = indexes.map((idx) => {
      const idxName = (idx.name || `idx_${tableName}_${idx.columns}`).toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const uniqueKw = idx.isUnique ? "UNIQUE " : "";
      return `CREATE ${uniqueKw}INDEX IF NOT EXISTS ${idxName} ON ${tableName} (${idx.columns});`;
    });
    ddl += "\n\n" + indexDdls.join("\n");
  }

  return ddl;
}

function generateEndpointHandler(ep: Endpoint, serviceName: string, connectedTables: BackendNode[]): string {
  const method = (ep.type || "GET").toLowerCase();
  const path = ep.name || "/";
  const summary = ep.summary || `Handler for ${ep.type || "GET"} ${path}`;

  const headers = ep.headers || [];
  const pathParams = ep.pathParams || [];
  const queryParams = ep.queryParams || [];
  const requiredRoles = ep.requiredRoles || [];
  const requiredScopes = ep.requiredScopes || [];
  const publishedEvents = ep.publishedEvents || [];

  const parsedReqSchema = parseSchemaJson(ep.requestBody?.rawJson);
  const parsedResSchema = parseSchemaJson(ep.responseBody?.rawJson);

  let code = `/**
 * ${ep.type || "GET"} ${path}
 * ${summary}
`;
  if (requiredRoles.length > 0) {
    code += ` * @roles ${requiredRoles.join(", ")}\n`;
  }
  if (requiredScopes.length > 0) {
    code += ` * @scopes ${requiredScopes.join(", ")}\n`;
  }
  code += ` */\n`;

  code += `router.${method}("${path}", async (req: Request, res: Response) => {
  try {`;

  // --- 1. BUSINESS LOGIC & AI AGENT DIRECTIVES (FIRST & PROMINENT) ---
  code += `\n    // =========================================================================`;
  code += `\n    // 🤖 AI CODING AGENT DIRECTIVE:`;
  code += `\n    // Implement the endpoint domain logic for: ${ep.type || "GET"} ${path}`;
  code += `\n    // Description: ${summary}`;
  code += `\n    // =========================================================================`;
  if (ep.businessLogic && ep.businessLogic.trim()) {
    const lines = ep.businessLogic.split("\n");
    lines.forEach((line, idx) => {
      if (line.trim()) {
        code += `\n    // STEP ${idx + 1}: ${line.trim()}`;
      }
    });
  } else {
    code += `\n    // STEP 1: Validate incoming parameters and payload`;
    code += `\n    // STEP 2: Perform domain query/mutation`;
    code += `\n    // STEP 3: Return formatted JSON response`;
  }
  code += `\n    // TODO: Write custom implementation below this line\n`;

  // 2. Authorization Guard
  if (requiredRoles.length > 0 || requiredScopes.length > 0) {
    code += `\n    // --- Authorization Guard ---`;
    code += `\n    const authReq = req as Request & { user?: { roles?: string[]; scopes?: string[] } };`;
    if (requiredRoles.length > 0) {
      code += `\n    const userRoles = authReq.user?.roles || [];\n`;
      code += `    const hasRequiredRole = ${JSON.stringify(requiredRoles)}.some(role => userRoles.includes(role));\n`;
      code += `    if (!hasRequiredRole) {\n      return res.status(403).json({ error: "Forbidden: Required roles [${requiredRoles.join(", ")}] missing" });\n    }\n`;
    }
    if (requiredScopes.length > 0) {
      code += `\n    const userScopes = authReq.user?.scopes || [];\n`;
      code += `    const hasRequiredScope = ${JSON.stringify(requiredScopes)}.some(scope => userScopes.includes(scope));\n`;
      code += `    if (!hasRequiredScope) {\n      return res.status(403).json({ error: "Forbidden: Required scopes [${requiredScopes.join(", ")}] missing" });\n    }\n`;
    }
  }

  // 3. Header Validation
  const requiredHeaders = headers.filter((h) => h.required && h.name);
  if (requiredHeaders.length > 0) {
    code += `\n    // --- Header Validation ---`;
    requiredHeaders.forEach((h) => {
      const headerKey = h.name.toLowerCase();
      code += `\n    if (!req.headers["${headerKey}"]) {\n      return res.status(400).json({ error: "Missing required header: ${h.name}" });\n    }`;
    });
    code += `\n`;
  }

  // 4. Path Parameters Extraction
  if (pathParams.length > 0) {
    code += `\n    // --- Path Parameters ---`;
    const paramNames = pathParams.map((p) => p.name).filter(Boolean);
    if (paramNames.length > 0) {
      code += `\n    const { ${paramNames.join(", ")} } = req.params;`;
      pathParams.forEach((p) => {
        if (p.required) {
          code += `\n    if (!${p.name}) return res.status(400).json({ error: "Path parameter '${p.name}' is required" });`;
        }
      });
      code += `\n`;
    }
  }

  // 5. Query Parameters Extraction
  if (queryParams.length > 0) {
    code += `\n    // --- Query Parameters ---`;
    const queryNames = queryParams.map((q) => q.name).filter(Boolean);
    if (queryNames.length > 0) {
      code += `\n    const { ${queryNames.join(", ")} } = req.query;`;
      queryParams.forEach((q) => {
        if (q.required) {
          code += `\n    if (!${q.name}) return res.status(400).json({ error: "Query parameter '${q.name}' is required" });`;
        }
      });
      code += `\n`;
    }
  }

  // 6. Request Body & Schema Validation
  if (ep.type !== "GET" && ep.type !== "DELETE") {
    code += `\n    // --- Request Body & Payload ---`;
    if (parsedReqSchema && typeof parsedReqSchema === "object" && !Array.isArray(parsedReqSchema)) {
      const reqKeys = Object.keys(parsedReqSchema);
      if (reqKeys.length > 0) {
        code += `\n    const { ${reqKeys.join(", ")} } = req.body || {};`;
      } else {
        code += `\n    const payload = req.body;`;
      }
    } else {
      code += `\n    const payload = req.body;`;
    }
    code += `\n`;
  }

  // 7. Event Publishing Triggers
  if (publishedEvents.length > 0) {
    code += `\n    // --- Event Triggers ---`;
    publishedEvents.forEach((ev) => {
      const funcName = `publish${(ev.name || "Event").replace(/[^a-zA-Z0-9]/g, "")}`;
      code += `\n    await ${funcName}({\n      triggeredBy: "${method.toUpperCase()} ${path}",\n      timestamp: new Date().toISOString(),\n      payload: ${ep.type !== "GET" ? "req.body" : "req.query"}\n    });`;
    });
    code += `\n`;
  }

  // 8. Response
  code += `\n    // --- Response ---`;
  let responseData: string;
  if (parsedResSchema) {
    responseData = JSON.stringify(parsedResSchema, null, 6).replace(/\n/g, "\n    ");
  } else {
    responseData = `{\n      success: true,\n      message: "Successfully executed ${ep.type || "GET"} ${path}",\n      timestamp: new Date().toISOString()\n    }`;
  }

  const statusCode = ep.type === "POST" ? 201 : 200;
  code += `\n    return res.status(${statusCode}).json(${responseData});`;

  code += `\n  } catch (error) {\n    console.error("Error in ${method.toUpperCase()} ${path}:", error);\n    return res.status(500).json({ error: "Internal Server Error", details: (error as Error).message });\n  }\n});`;

  return code;
}

function generateE2eTestSuite(
  serviceNode: BackendNode,
  serviceName: string,
  port: string,
  endpoints: Endpoint[],
  testCases: SimulationTestCase[]
): string {
  let code = `import { describe, it } from "node:test";
import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:${port}";

describe("E2E Test Suite for ${serviceName}", () => {
  it("Health check endpoint responds with UP status", async () => {
    const res = await fetch(\`\${BASE_URL}/health\`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as { status: string; service: string };
    assert.strictEqual(data.status, "UP");
  });
`;

  // Filter test cases that explicitly belong to this ServiceNode or its endpoints
  const validTestCases = testCases.filter((tc) => {
    if (tc.enabled === false) return false;
    if (tc.targetNodeId === serviceNode.id) return true;
    return endpoints.some((ep) => ep.id === tc.targetEventId || ep.id === tc.targetNodeId);
  });

  if (validTestCases.length > 0) {
    validTestCases.forEach((tc, idx) => {
      const matchedEndpoint = endpoints.find((ep) => ep.id === tc.targetEventId || ep.id === tc.targetNodeId) || endpoints[0];
      const method = (matchedEndpoint?.type || tc.request?.headers?.["x-method"] || "GET").toUpperCase();
      const rawPath = matchedEndpoint?.name || "/";
      const routePath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
      const tcName = tc.name && !tc.name.startsWith("Test Case ") ? tc.name : `${method} ${routePath} - ${tc.name || `Scenario #${idx + 1}`}`;
      const expectedStatus = tc.expectedStatus || (method === "POST" ? 201 : 200);

      code += `
  it("${tcName.replace(/"/g, '\\"')}", async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...${JSON.stringify(tc.request?.headers || {})}
    };
    const body = ${tc.request?.body ? JSON.stringify(tc.request.body) : "undefined"};

    const res = await fetch(\`\${BASE_URL}/api${routePath}\`, {
      method: "${method}",
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    assert.strictEqual(res.status, ${expectedStatus}, "Expected HTTP status ${expectedStatus}");
    const data = await res.json();
    assert.ok(data, "Response body should be defined");
  });
`;
    });
  } else {
    // Generate clean E2E tests matching each endpoint on this service
    endpoints.forEach((ep) => {
      const method = (ep.type || "GET").toUpperCase();
      const rawPath = ep.name || "/";
      const routePath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
      const expectedStatus = method === "POST" ? 201 : 200;

      code += `
  it("E2E Test: ${method} /api${routePath}", async () => {
    const res = await fetch(\`\${BASE_URL}/api${routePath}\`, {
      method: "${method}",
      headers: { "Content-Type": "application/json" }
    });
    assert.strictEqual(res.status, ${expectedStatus});
  });
`;
    });
  }

  code += `});\n`;
  return code;
}

function resolveLinkedEndpoint(
  eventId: string,
  fromNodeId: string,
  allNodes: BackendNode[],
  allEdges: BackendEdge[],
  allEndpoints: (Endpoint & { nodeId?: string })[]
): { targetNode: BackendNode; endpoint: Endpoint } | null {
  const edge = allEdges.find((e) => e.source === fromNodeId && e.sourceHandle === `events-${eventId}`);
  if (!edge || !edge.targetHandle) return null;

  const targetNode = allNodes.find((n) => n.id === edge.target);
  if (!targetNode) return null;

  const parts = edge.targetHandle.split("-in-");
  const endpointId = parts[parts.length - 1];
  if (!endpointId) return null;

  let endpoint = allEndpoints.find((ep) => ep.nodeId === targetNode.id && ep.id === endpointId);
  if (!endpoint && targetNode.data?.endpoints) {
    endpoint = (targetNode.data.endpoints as Endpoint[]).find((ep) => ep.id === endpointId);
  }
  if (!endpoint && targetNode.data?.routeGroups) {
    for (const group of targetNode.data.routeGroups as any[]) {
      endpoint = group.endpoints?.find((ep: Endpoint) => ep.id === endpointId);
      if (endpoint) break;
    }
  }

  return endpoint ? { targetNode, endpoint } : null;
}

function generateWebClientSdk(
  webClientNodes: BackendNode[],
  allNodes: BackendNode[],
  allEdges: BackendEdge[],
  allEndpoints: (Endpoint & { nodeId?: string })[],
  port: string
): string {
  let code = `/**
 * Web Client API SDK
 * Typed client fetchers generated for Web Client pages
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:${port}";

`;

  if (webClientNodes.length === 0) {
    code += `export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(\`\${BASE_URL}\${endpoint}\`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  return res.json();
}
`;
    return code;
  }

  webClientNodes.forEach((clientNode) => {
    const pageTitle = clientNode.data.label || "WebPage";
    const clientEvents = (clientNode.data.events || []) as UIEventItem[];

    code += `// --- ${pageTitle} Client API ---\n`;
    clientEvents.forEach((evt) => {
      const eventType = "event" in evt && typeof (evt as { event?: string }).event === "string" ? (evt as { event?: string }).event : "event";
      const funcName = `trigger${(evt.name || "Action").replace(/[^a-zA-Z0-9]/g, "")}`;

      // Resolve linked edge & target route endpoint
      const linked = resolveLinkedEndpoint(evt.id, clientNode.id, allNodes, allEdges, allEndpoints);
      const targetService = linked?.targetNode.data?.label || "Service";
      const method = (linked?.endpoint.type || "POST").toUpperCase();
      const rawPath = linked?.endpoint.name || "/";
      const routePath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
      const fullUrlPath = `/api${routePath}`;

      code += `/**
 * Web Client Action: "${evt.name}" (${eventType})
 * Target Service: ${targetService}
 * Connected Route: ${method} ${fullUrlPath}
 */
export async function ${funcName}(payload?: Record<string, unknown>, headers?: Record<string, string>) {
  const res = await fetch(\`\${BASE_URL}${fullUrlPath}\`, {
    method: "${method}",
    headers: { "Content-Type": "application/json", ...headers },
    ${method !== "GET" && method !== "HEAD" ? "body: payload ? JSON.stringify(payload) : undefined" : ""}
  });
  return res.json();
}

`;
    });
  });

  return code;
}

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

  const nodeEndpoints = endpoints.filter((e) => e.nodeId === node.id);
  const nodeConsumedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "consume");
  const nodePublishedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "publish");
  const webClientNodes = allNodes.filter((n) => n.type === "webClient");

  // Discover connected SQLite database table references
  const connectedEdges = allEdges.filter((e) => e.source === node.id || e.target === node.id);
  const connectedNodeIds = connectedEdges.map((e) => (e.source === node.id ? e.target : e.source));

  const connectedDbNodes = allNodes.filter(
    (n) => connectedNodeIds.includes(n.id) && (n.type === "db_ref" || n.type === "entity" || n.type === "database")
  );

  // Resolve entity nodes (table schemas)
  const connectedTables: BackendNode[] = [];
  connectedDbNodes.forEach((dbNode) => {
    if (dbNode.type === "entity") {
      connectedTables.push(dbNode);
    } else if (dbNode.type === "db_ref" && dbNode.data.tableRef) {
      const entity = allNodes.find((n) => n.id === dbNode.data.tableRef && n.type === "entity");
      if (entity && !connectedTables.some((t) => t.id === entity.id)) {
        connectedTables.push(entity);
      }
    }
  });

  // If no direct edges, check all entity nodes in canvas as general project tables
  if (connectedTables.length === 0) {
    allNodes.filter((n) => n.type === "entity" && n.data.dbType !== "vector").forEach((e) => connectedTables.push(e));
  }

  // Collect all published event names
  const allPublishedEventNames = new Set<string>();
  nodePublishedEvents.forEach((e) => e.name && allPublishedEventNames.add(e.name));
  nodeEndpoints.forEach((ep) => {
    (ep.publishedEvents || []).forEach((ev) => ev.name && allPublishedEventNames.add(ev.name));
  });

  // 1. Generate db/schema.sql and db/sqlite.ts if tables exist
  let sqliteDdl = `-- SQLite Schema generated for ${serviceName}\n-- Automatically initialized on startup\n\n`;
  if (connectedTables.length > 0) {
    sqliteDdl += connectedTables.map((t) => generateSqliteTableDdl(t)).join("\n\n");
  } else {
    sqliteDdl += `CREATE TABLE IF NOT EXISTS app_data (\n  id TEXT PRIMARY KEY,\n  key TEXT UNIQUE,\n  value TEXT,\n  created_at TEXT DEFAULT CURRENT_TIMESTAMP\n);`;
  }

  const sqliteDbHelperCode = `import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../../data.db");
export const db = new Database(dbPath);

// Enable foreign keys constraint
db.pragma("foreign_keys = ON");

/**
 * Automatically initializes SQLite schema on service startup.
 */
export function initDatabase(): void {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf-8");
      db.exec(schemaSql);
      console.log("sqlite SQLite Database initialized with schema.sql");
    }
  } catch (error) {
    console.error("Failed to initialize SQLite database:", error);
  }
}
`;

  // 2. Generate routes/api.ts
  let apiRoutesCode = `import { Router, Request, Response } from "express";
${connectedTables.length > 0 ? `import { db } from "../db/sqlite";\n` : ""}
${
  allPublishedEventNames.size > 0
    ? `import { ${Array.from(allPublishedEventNames)
        .map((name) => `publish${name.replace(/[^a-zA-Z0-9]/g, "")}`)
        .join(", ")} } from "../events/publishers";\n`
    : ""
}
export const router = Router();

`;

  if (nodeEndpoints.length === 0) {
    apiRoutesCode += `// No endpoints configured on canvas for ${serviceName}.
router.get("/example", async (_req: Request, res: Response) => {
  res.json({ message: "Default service route operational." });
});\n`;
  } else {
    apiRoutesCode += nodeEndpoints
      .map((ep) => generateEndpointHandler(ep, serviceName, connectedTables))
      .join("\n\n");
  }

  // 3. Generate events/publishers.ts & consumers.ts
  let publishersCode = `/**
 * Event Publishers for ${serviceName}
 */
`;
  if (allPublishedEventNames.size === 0) {
    publishersCode += `// No published events configured.\n`;
  } else {
    Array.from(allPublishedEventNames).forEach((eventName) => {
      const funcName = `publish${eventName.replace(/[^a-zA-Z0-9]/g, "")}`;
      publishersCode += `
/**
 * Publish event: "${eventName}"
 */
export async function ${funcName}(eventData: Record<string, unknown>): Promise<void> {
  console.log(\`[EVENT PUBLISH] [${eventName}]\`, JSON.stringify(eventData, null, 2));
  // TODO: Connect message broker (Kafka / NATS / RabbitMQ / Redis)
}
`;
    });
  }

  let consumersCode = `/**
 * Event Consumers / Listeners for ${serviceName}
 */
`;
  if (nodeConsumedEvents.length === 0) {
    consumersCode += `// No consumed events configured.\n`;
  } else {
    nodeConsumedEvents.forEach((ev) => {
      const handlerName = `handle${ev.name.replace(/[^a-zA-Z0-9]/g, "")}`;
      consumersCode += `
/**
 * Listener for topic/event: "${ev.name}"
 * ${ev.description || "Processes incoming event payload"}
 */
export async function ${handlerName}(payload: Record<string, unknown>): Promise<void> {
  console.log(\`[EVENT CONSUME] [${ev.name}]\`, payload);
  // Handler Logic: ${ev.handlerLogic || "Process event"}
}
`;
    });
  }

  // 4. Generate E2E Test Suite & Web Client SDK (Traces edges from WebClientNode events to target endpoints)
  const e2eTestCode = generateE2eTestSuite(node, serviceName, port, nodeEndpoints, testCases);
  const clientSdkCode = generateWebClientSdk(webClientNodes, allNodes, allEdges, endpoints, port);

  // 5. Generate main server.ts
  const serverCode = `import express, { Request, Response } from "express";
${cors ? 'import cors from "cors";\n' : ''}import { router as apiRouter } from "./routes/api";
import { initDatabase } from "./db/sqlite";

const app = express();
const PORT = process.env.PORT || ${port};

// Initialize SQLite database tables
initDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
${cors ? `app.use(cors({ origin: "${corsOrigins}" }));\n` : ""}\n// --- Request Logger ---
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

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(\`🚀 Service "${serviceName}" operational at http://localhost:\${PORT}\`);
  console.log(\`📋 Health check available at http://localhost:\${PORT}/health\`);
});
`;

  // 6. Generate package.json
  const packageJson = JSON.stringify(
    {
      name: `${sanitizedName}-service`,
      version: "1.0.0",
      description: node.data.description || `Generated microservice template for ${serviceName}`,
      main: "dist/server.js",
      scripts: {
        build: "tsc",
        start: "node dist/server.js",
        dev: "ts-node-dev --respawn server.ts",
        test: "tsc && node --test dist/tests/e2e.test.js"
      },
      dependencies: {
        express: "^4.19.2",
        "better-sqlite3": "^11.3.0",
        ...(cors ? { cors: "^2.8.5" } : {})
      },
      devDependencies: {
        "@types/express": "^4.17.21",
        "@types/better-sqlite3": "^7.6.11",
        ...(cors ? { "@types/cors": "^2.8.17" } : {}),
        "@types/node": "^20.11.0",
        "ts-node-dev": "^2.0.0",
        typescript: "^5.3.3"
      }
    },
    null,
    2
  );

  // 7. Generate tsconfig.json
  const tsconfig = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "CommonJS",
        moduleResolution: "node",
        outDir: "./dist",
        rootDir: "./",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ["**/*.ts"]
    },
    null,
    2
  );

  // 8. Generate Dockerfile
  const dockerfile = `# Dockerfile for ${serviceName}
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE ${port}
CMD ["node", "dist/server.js"]
`;

  return {
    serviceId: node.id,
    serviceName,
    files: [
      { filename: "server.ts", language: "typescript", content: serverCode },
      { filename: "routes/api.ts", language: "typescript", content: apiRoutesCode },
      { filename: "db/sqlite.ts", language: "typescript", content: sqliteDbHelperCode },
      { filename: "db/schema.sql", language: "sql", content: sqliteDdl },
      { filename: "tests/e2e.test.ts", language: "typescript", content: e2eTestCode },
      { filename: "client/apiClient.ts", language: "typescript", content: clientSdkCode },
      { filename: "events/publishers.ts", language: "typescript", content: publishersCode },
      { filename: "events/consumers.ts", language: "typescript", content: consumersCode },
      { filename: "package.json", language: "json", content: packageJson },
      { filename: "tsconfig.json", language: "json", content: tsconfig },
      { filename: "Dockerfile", language: "dockerfile", content: dockerfile }
    ]
  };
}

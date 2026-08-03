import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledFile, ReusableFunction } from "../types";
import { parseSchemaJson, toVarName, toPascalCase } from "../utils";
import {
  parametersToTsInterface,
  schemaToTsInterface,
} from "./schemaToTypeScript";
import { resolveEndpointTrace } from "../traceResolver";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Given the HTTP method and available DB functions, pick the most relevant
 * CRUD function for this route and return it with the import line.
 * Returns null if no DB functions are available.
 */
function pickDbFunction(
  method: string,
  dbFunctions: ReusableFunction[],
  path: string,
): { fn: ReusableFunction; callExpr: string } | null {
  if (dbFunctions.length === 0) return null;

  const isIdRoute = path.includes(":id") || path.includes("{id}");

  // Group by kind for quick lookup
  const byKind = (kind: ReusableFunction["kind"]) =>
    dbFunctions.filter((f) => f.kind === kind);

  let fn: ReusableFunction | undefined;
  let callExpr = "";

  switch (method) {
    case "get":
      if (isIdRoute) {
        fn = byKind("findById")[0];
        callExpr = fn ? `${fn.name}(req.params.id)` : "";
      } else {
        fn = byKind("findAll")[0];
        callExpr = fn ? `${fn.name}()` : "";
      }
      break;
    case "post":
      fn = byKind("create")[0];
      callExpr = fn ? `${fn.name}(req.body)` : "";
      break;
    case "put":
    case "patch":
      fn = byKind("update")[0];
      callExpr = fn ? `${fn.name}(req.params.id, req.body)` : "";
      break;
    case "delete":
      fn = byKind("delete")[0];
      callExpr = fn ? `${fn.name}(req.params.id)` : "";
      break;
    default:
      fn = byKind("findAll")[0];
      callExpr = fn ? `${fn.name}()` : "";
  }

  if (!fn) return null;
  return { fn, callExpr };
}

/**
 * Pick a Kafka publish function when the endpoint has published events or
 * the route name suggests an event-producing action.
 */
function pickKafkaPublishFunction(
  kafkaFunctions: ReusableFunction[],
): ReusableFunction | null {
  return kafkaFunctions.find((f) => f.kind === "publish" && f.name === "publishKafkaEvent") ?? null;
}

/**
 * Convert an event/topic name like "product-created" to a KAFKA_TOPICS key
 * like "PRODUCT_CREATED" that matches the generated constant.
 */
function toKafkaTopicKey(eventName: string): string {
  return eventName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateRoutes(
  serviceName: string,
  nodeEndpoints: (Endpoint & { nodeId: string })[],
  serviceNode?: BackendNode,
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  allEndpoints: (Endpoint & { nodeId: string })[] = [],
  dbFunctions: ReusableFunction[] = [],
  kafkaFunctions: ReusableFunction[] = [],
  nodePublishedEvents: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[] = [],
): CompiledFile[] {
  const files: CompiledFile[] = [];
  const routeImports: string[] = [];
  const routeRegistrations: string[] = [];
  const usedFileNames = new Set<string>();

  const pascalServiceName = toPascalCase(serviceName);
  const serviceFolderName = toVarName(serviceName);

  if (nodeEndpoints.length === 0) {
    // Build default route with db helper if available
    const defaultDbFn = dbFunctions.find((f) => f.kind === "findAll");
    const defaultDbImport = defaultDbFn
      ? `import { ${defaultDbFn.name} } from "${defaultDbFn.importPath}";\n`
      : "";
    const defaultDbCall = defaultDbFn
      ? `  const data = ${defaultDbFn.name}();\n  return res.status(200).json({ success: true, data, timestamp: new Date().toISOString() });\n`
      : `  return res.status(200).json({\n    success: true,\n    message: "Default service route operational for ${serviceName}.",\n    timestamp: new Date().toISOString()\n  });\n`;

    const defaultRouteCode = `import { Request, Response } from "express";
import { createLogger } from "@workspace/logger";
${defaultDbImport}
const logger = createLogger("${serviceName}:DefaultRoute");

export async function defaultHandler(_req: Request, res: Response) {
  logger.info("Executing default handler");
${defaultDbCall}}
`;
    files.push({
      filename: "src/routes/defaultRoute.ts",
      language: "typescript",
      content: defaultRouteCode,
    });
    routeImports.push(`import { defaultHandler } from "./defaultRoute";`);
    routeRegistrations.push(`router.get("/example", defaultHandler);`);
  } else {
    nodeEndpoints.forEach((ep, index) => {
      const method = (ep.type || "GET").toLowerCase();
      const rawName = ep.name || ep.id || "route";
      let routeFileName =
        toVarName(`${method}_${rawName}`) || `route_${index + 1}`;

      if (usedFileNames.has(routeFileName)) {
        routeFileName = `${routeFileName}_${index + 1}`;
      }
      usedFileNames.add(routeFileName);

      const handlerName = `${routeFileName}Handler`;
      const pascalName = `${pascalServiceName}${toPascalCase(routeFileName)}`;
      const schemaVarPrefix = `${serviceFolderName}${toPascalCase(routeFileName)}`;
      const path = ep.name?.startsWith("/") ? ep.name : `/${ep.name || ""}`;
      const summary = ep.summary || `Handler for ${ep.type || "GET"} ${path}`;

      const parsedResSchema = parseSchemaJson(ep.responseBody?.rawJson);
      let responseData: string;
      if (parsedResSchema) {
        responseData = JSON.stringify(parsedResSchema, null, 6).replace(
          /\n/g,
          "\n    ",
        );
      } else {
        responseData = `{\n      success: true,\n      message: "Successfully executed ${ep.type || "GET"} ${path}",\n      timestamp: new Date().toISOString()\n    }`;
      }

      const queryTypeRes = parametersToTsInterface(
        `${pascalName}Query`,
        ep.queryParams,
        false,
      );
      const bodyTypeRes = schemaToTsInterface(
        `${pascalName}Body`,
        ep.requestBody,
      );
      const isBodyMethod = ["post", "put", "patch"].includes(method);

      // Resolve targeted connection trace for this endpoint
      const trace = serviceNode
        ? resolveEndpointTrace(
            serviceNode,
            ep,
            allNodes,
            allEdges,
            allEndpoints,
          )
        : { incoming: [], outgoing: [] };

      // --- Resolve reusable function imports ---
      const pickedDb = pickDbFunction(method, dbFunctions, path);
      const pickedKafka =
        method === "post" && kafkaFunctions.length > 0
          ? pickKafkaPublishFunction(kafkaFunctions)
          : null;

      // Build the extra import lines (de-duped by importPath)
      const extraImports: Map<string, Set<string>> = new Map();
      if (pickedDb) {
        if (!extraImports.has(pickedDb.fn.importPath)) {
          extraImports.set(pickedDb.fn.importPath, new Set());
        }
        extraImports.get(pickedDb.fn.importPath)!.add(pickedDb.fn.name);
      }
      if (pickedKafka) {
        if (!extraImports.has(pickedKafka.importPath)) {
          extraImports.set(pickedKafka.importPath, new Set());
        }
        extraImports.get(pickedKafka.importPath)!.add(pickedKafka.name);
        // Also pull in KAFKA_TOPICS constant if available
        const topicsConst = kafkaFunctions.find((f) => f.name === "KAFKA_TOPICS");
        if (topicsConst) {
          extraImports.get(pickedKafka.importPath)!.add("KAFKA_TOPICS");
        }
      }

      const extraImportLines = Array.from(extraImports.entries())
        .map(([pkg, names]) => `import { ${Array.from(names).join(", ")} } from "${pkg}";`)
        .join("\n");

      // Build imports from @workspace/types
      const typeImportsList = [
        `${pascalName}Params`,
        `${pascalName}Query`,
        `${pascalName}Body`,
        `${pascalName}Response`,
      ];
      if (queryTypeRes.hasContent) {
        typeImportsList.push(`${schemaVarPrefix}QuerySchema`);
      }
      if (isBodyMethod && bodyTypeRes.hasContent) {
        typeImportsList.push(`${schemaVarPrefix}BodySchema`);
      }

      let routeHandlerCode = `import { Request, Response } from "express";
import { createLogger } from "@workspace/logger";
import {
  ${typeImportsList.join(",\n  ")}
} from "@workspace/types";
${extraImportLines ? `${extraImportLines}\n` : ""}
const logger = createLogger("${serviceName}:${routeFileName}");

/**
 * ${ep.type || "GET"} ${path}
 * ${summary}
 */
export async function ${handlerName}(
  req: Request<${pascalName}Params, ${pascalName}Response | { error: string; details?: string }, ${pascalName}Body, ${pascalName}Query>,
  res: Response<${pascalName}Response | { error: string; details?: string }>
) {
  try {
    logger.info("Handling ${ep.type || "GET"} ${path}");
    logger.debug("Request details", { params: req.params, query: req.query, body: req.body });

`;

      // 1. Validation Checks
      const hasValidatedBody = isBodyMethod && bodyTypeRes.hasContent;
      if (hasValidatedBody) {
        routeHandlerCode += `    // Validate Body Payload\n`;
        routeHandlerCode += `    const bodyParsed = ${schemaVarPrefix}BodySchema.safeParse(req.body);\n`;
        routeHandlerCode += `    if (!bodyParsed.success) {\n`;
        routeHandlerCode += `      logger.warn("Request body validation failed", bodyParsed.error.flatten());\n`;
        routeHandlerCode += `      return res.status(400).json({ error: "Invalid request body", details: bodyParsed.error.flatten() });\n`;
        routeHandlerCode += `    }\n`;
        routeHandlerCode += `    const body = bodyParsed.data;\n\n`;
      }

      if (queryTypeRes.hasContent) {
        routeHandlerCode += `    // Validate Query Parameters\n`;
        routeHandlerCode += `    const queryParsed = ${schemaVarPrefix}QuerySchema.safeParse(req.query);\n`;
        routeHandlerCode += `    if (!queryParsed.success) {\n`;
        routeHandlerCode += `      logger.warn("Query parameters validation failed", queryParsed.error.flatten());\n`;
        routeHandlerCode += `      return res.status(400).json({ error: "Invalid query parameters", details: queryParsed.error.flatten() });\n`;
        routeHandlerCode += `    }\n`;
        routeHandlerCode += `    const query = queryParsed.data;\n\n`;
      }

      // 2. AI Coding Agent Directive & Context (placed before operations)
      const promptText = (ep.businessLogic || ep.prompt || "").trim();
      const codeBlock = (ep.body || ep.code || "").trim();

      if (promptText || trace.incoming.length > 0 || trace.outgoing.length > 0) {
        routeHandlerCode += `    // =========================================================================\n`;
        routeHandlerCode += `    // AI CODING AGENT DIRECTIVE:\n`;
        if (ep.summary && !ep.summary.startsWith("Handler for ")) {
          routeHandlerCode += `    // Goal: ${ep.summary.trim()}\n`;
        }

        if (trace.incoming.length > 0) {
          routeHandlerCode += `    //\n    // INBOUND TRIGGER / CALLER:\n`;
          trace.incoming.forEach((inc) => {
            routeHandlerCode += `    // - ${inc.nodeType}: "${inc.nodeName}" (${inc.detail})\n`;
            if (inc.dataContext)
              routeHandlerCode += `    //   Data Context: ${inc.dataContext}\n`;
          });
        }

        if (trace.outgoing.length > 0) {
          routeHandlerCode += `    //\n    // RESOURCE DEPENDENCIES:\n`;
          trace.outgoing.forEach((out) => {
            routeHandlerCode += `    // - ${out.nodeType}: "${out.nodeName}"\n`;
            if (out.dataContext)
              routeHandlerCode += `    //   ${out.dataContext}\n`;
          });
        }

        if (ep.crudOperations && Object.keys(ep.crudOperations).length > 0) {
          const activeOps = Object.entries(ep.crudOperations).filter(
            ([_, ops]) => ops && ops.length > 0,
          );
          if (activeOps.length > 0) {
            routeHandlerCode += `    //\n    // DATABASE OPERATIONS REQUIRED:\n`;
            for (const [tableId, ops] of activeOps) {
              const tableNode = allNodes.find((n) => n.id === tableId);
              const tableName =
                tableNode?.data?.label ||
                tableNode?.data?.tableRef ||
                "Unknown Table";
              routeHandlerCode += `    // - Table [${tableName}]: ${ops.map((o) => o.toUpperCase()).join(", ")}\n`;
              if (ep.crudExplanations && ep.crudExplanations[tableId]) {
                for (const op of ops) {
                  const explanation = ep.crudExplanations[tableId][op];
                  if (explanation) {
                    routeHandlerCode += `    //   * ${op.toUpperCase()} Context: ${explanation.replace(/\n/g, "\n    //     ")}\n`;
                  }
                }
              }
            }
          }
        }

        routeHandlerCode += `    // =========================================================================\n`;

        if (promptText) {
          promptText.split("\n").forEach((line: string, idx: number) => {
            if (line.trim())
              routeHandlerCode += `    // STEP ${idx + 1}: ${line.trim()}\n`;
          });
          routeHandlerCode += `\n`;
        }
      }

      // Payload reference for DB and Messaging operations
      const payloadVar = hasValidatedBody ? "body" : "req.body";

      // 3. DB Call
      if (pickedDb) {
        routeHandlerCode += `    // --- Database Operation (via @workspace/db prepared statement) ---\n`;
        if (method === "get") {
          routeHandlerCode += `    const result = ${pickedDb.callExpr};\n`;
          routeHandlerCode += `    if (result === undefined || result === null) {\n`;
          routeHandlerCode += `      return res.status(404).json({ error: "Not found" });\n`;
          routeHandlerCode += `    }\n\n`;
        } else if (method === "post") {
          const postCallExpr = pickedDb.callExpr.replace("req.body", payloadVar);
          routeHandlerCode += `    ${postCallExpr};\n\n`;
        } else if (method === "put" || method === "patch") {
          const updateCallExpr = pickedDb.callExpr.replace("req.body", payloadVar);
          routeHandlerCode += `    ${updateCallExpr};\n\n`;
        } else if (method === "delete") {
          routeHandlerCode += `    ${pickedDb.callExpr};\n\n`;
        }
      }

      // 4. Kafka Publish Call
      if (pickedKafka) {
        const matchedEvent =
          nodePublishedEvents.find((e) =>
            rawName.toLowerCase().includes((e.name || "").toLowerCase()) ||
            (e.name || "").toLowerCase().includes(rawName.toLowerCase()),
          ) ?? nodePublishedEvents[0];

        const topicKey = matchedEvent
          ? toKafkaTopicKey(matchedEvent.name || rawName)
          : toKafkaTopicKey(rawName);

        const topicRef = `KAFKA_TOPICS.${topicKey}`;

        routeHandlerCode += `    // --- Kafka Event Publish ---\n`;
        routeHandlerCode += `    await publishKafkaEvent(\n`;
        routeHandlerCode += `      ${topicRef},\n`;
        routeHandlerCode += `      { action: "${method}", path: "${path}", payload: ${payloadVar} },\n`;
        routeHandlerCode += `    );\n\n`;
      }

      // 5. Business Logic (Editable User/AI Code Block)
      routeHandlerCode += `    // --- Business Logic ---\n`;
      if (codeBlock) {
        codeBlock.split("\n").forEach((line: string) => {
          routeHandlerCode += `    ${line}\n`;
        });
      }
      routeHandlerCode += `\n`;

      // Final response â€” use 'result' if we have a DB findAll/findById result
      const statusCode = ep.type === "POST" ? 201 : 200;
      const responsePayload =
        pickedDb && method === "get"
          ? `{ success: true, data: result, timestamp: new Date().toISOString() }`
          : responseData;

      routeHandlerCode += `\n    logger.debug("Successfully generated response for ${path}");\n`;
      routeHandlerCode += `    return res.status(${statusCode}).json(${responsePayload});\n`;
      routeHandlerCode += `  } catch (err) {\n`;
      routeHandlerCode += `    const message = err instanceof Error ? err.message : String(err);\n`;
      routeHandlerCode += `    logger.error("Error in ${method.toUpperCase()} ${path}:", message);\n`;
      routeHandlerCode += `    return res.status(500).json({ error: "Internal Server Error", details: message });\n`;
      routeHandlerCode += `  }\n}\n`;

      files.push({
        filename: `src/routes/${routeFileName}.ts`,
        language: "typescript",
        content: routeHandlerCode,
      });

      routeImports.push(`import { ${handlerName} } from "./${routeFileName}";`);
      routeRegistrations.push(`router.${method}("${path}", ${handlerName});`);
    });
  }

  const routesIndexCode = `import { Router } from "express";
${routeImports.join("\n")}

export const router: Router = Router();

${routeRegistrations.join("\n")}
`;
  files.push({
    filename: "src/routes/index.ts",
    language: "typescript",
    content: routesIndexCode,
  });

  return files;
}
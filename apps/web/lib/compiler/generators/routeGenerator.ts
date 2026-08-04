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



interface TargetDbOperation {
  fn: ReusableFunction;
  callExpr: string;
  operationKind: "read" | "create" | "update" | "delete";
  tableNodeId?: string;
}

/**
 * Resolves all database functions requested for an endpoint based on attached db_ref nodes
 * and the user's explicit crudOperations selection.
 */
function pickDbFunctionsForEndpoint(
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
        if (!results.some((r) => r.fn.name === fn!.name)) {
          results.push({ fn, callExpr, operationKind: op, tableNodeId });
        }
      }
    }
  }

  return results;
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

function buildResponsePayloadCode(
  ep: Endpoint,
  statusCode: number,
  path: string,
  pickedDbOps: TargetDbOperation[],
  targetVarMap: Map<string, string>,
  responseData: string,
): string {
  const mode = ep.responseMode || "schema_builder";

  if (mode === "custom_expression" && ep.responseExpression?.trim()) {
    return ep.responseExpression.trim();
  }

  if (mode === "inferred") {
    if (pickedDbOps.length > 0) {
      const lastOp = pickedDbOps[pickedDbOps.length - 1];
      const primaryVar = lastOp ? `${lastOp.fn.name}Result` : "result";
      return `{ success: true, data: ${primaryVar}, timestamp: new Date().toISOString() }`;
    }
    return responseData;
  }

  // mode === "schema_builder"
  if (ep.responseFields && ep.responseFields.length > 0) {
    const fieldEntries: string[] = [];

    for (const f of ep.responseFields) {
      const fieldName = f.name || "field";
      if (!fieldName) continue;

      if (fieldName === "status" || fieldName === "statusCode") {
        fieldEntries.push(`      ${fieldName}: ${statusCode}`);
        continue;
      }
      if (fieldName === "message") {
        fieldEntries.push(`      ${fieldName}: "Successfully executed ${ep.type || "GET"} ${path}"`);
        continue;
      }
      if (fieldName === "timestamp") {
        fieldEntries.push(`      ${fieldName}: new Date().toISOString()`);
        continue;
      }

      // Resolve variable name for DB field or entity payload
      let targetVar: string | null = null;
      if (f.type && f.type.startsWith("db:")) {
        const parts = f.type.split(":");
        const tableNodeId = parts[1];
        if (tableNodeId && targetVarMap.has(tableNodeId)) {
          targetVar = targetVarMap.get(tableNodeId)!;
        }
      }

      if (!targetVar && pickedDbOps.length > 0) {
        const cleanName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchedOp = pickedDbOps.find((op) => {
          const targetClean = (op.fn.targetName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const fnClean = op.fn.name.toLowerCase();
          return (
            (cleanName && targetClean && (cleanName.includes(targetClean) || targetClean.includes(cleanName))) ||
            (cleanName && fnClean.includes(cleanName))
          );
        });

        if (matchedOp) {
          targetVar = `${matchedOp.fn.name}Result`;
        } else if (cleanName === "data" || cleanName === "payload" || cleanName === "result") {
          const lastOp = pickedDbOps[pickedDbOps.length - 1];
          const firstOp = pickedDbOps[0];
          const primaryOp =
            pickedDbOps.find((op) => op.operationKind === "create" || op.operationKind === "update") || lastOp;
          targetVar = primaryOp ? `${primaryOp.fn.name}Result` : firstOp ? `${firstOp.fn.name}Result` : "result";
        }
      }

      if (f.type && f.type.startsWith("db:")) {
        const isPartial = f.type.includes(":partial");
        const cols: string[] = f.selectedColumns || [];

        if (targetVar) {
          if (isPartial && cols.length > 0) {
            const pickProps = cols.map((c) => `${c}: item.${c}`).join(", ");
            fieldEntries.push(
              `      ${fieldName}: Array.isArray(${targetVar}) ? ${targetVar}.map((item) => ({ ${pickProps} })) : ${targetVar} ? ({ ${cols.map((c) => `${c}: ${targetVar}.${c}`).join(", ")} }) : null`,
            );
          } else {
            fieldEntries.push(`      ${fieldName}: ${targetVar}`);
          }
        } else {
          fieldEntries.push(`      ${fieldName}: null`);
        }
        continue;
      }

      if (targetVar && (fieldName === "data" || fieldName === "payload" || fieldName === "result")) {
        fieldEntries.push(`      ${fieldName}: ${targetVar}`);
        continue;
      }

      switch (f.type) {
        case "string":
          fieldEntries.push(`      ${fieldName}: "success"`);
          break;
        case "number":
          fieldEntries.push(`      ${fieldName}: 0`);
          break;
        case "boolean":
          fieldEntries.push(`      ${fieldName}: true`);
          break;
        case "array":
          fieldEntries.push(`      ${fieldName}: []`);
          break;
        case "object":
          fieldEntries.push(`      ${fieldName}: {}`);
          break;
        default:
          fieldEntries.push(`      ${fieldName}: null`);
      }
    }

    if (fieldEntries.length > 0) {
      return `{\n${fieldEntries.join(",\n")}\n    }`;
    }
  }

  if (pickedDbOps.length > 0) {
    const lastOp = pickedDbOps[pickedDbOps.length - 1];
    const primaryVar = lastOp ? `${lastOp.fn.name}Result` : "result";
    return `{ status: ${statusCode}, message: "Successfully executed ${ep.type || "GET"} ${path}", data: ${primaryVar} }`;
  }
  return responseData;
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
      const pickedDbOps = pickDbFunctionsForEndpoint(ep, dbFunctions, allNodes, path);
      const pickedKafka =
        method === "post" && kafkaFunctions.length > 0
          ? pickKafkaPublishFunction(kafkaFunctions)
          : null;

      // Build the extra import lines (de-duped by importPath)
      const extraImports: Map<string, Set<string>> = new Map();
      pickedDbOps.forEach((op) => {
        if (!extraImports.has(op.fn.importPath)) {
          extraImports.set(op.fn.importPath, new Set());
        }
        extraImports.get(op.fn.importPath)!.add(op.fn.name);
      });
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

      // Business Logic
      routeHandlerCode += `    // --- Business Logic ---\n`;

      // Payload reference for DB and Messaging operations
      const payloadVar = hasValidatedBody ? "body" : "req.body";

      // 3. DB Call
      const targetVarMap = new Map<string, string>();
      if (pickedDbOps.length > 0) {
        routeHandlerCode += `    // --- Database Operation(s) (via @workspace/db prepared statement) ---\n`;
        pickedDbOps.forEach((op) => {
          const callExpr = op.callExpr.replace("PAYLOAD_VAR", payloadVar);
          const varName = `${op.fn.name}Result`;

          if (op.tableNodeId) {
            targetVarMap.set(op.tableNodeId, varName);
          }

          if (op.operationKind === "read" && (path.includes(":id") || path.includes("{id}"))) {
            routeHandlerCode += `    const ${varName} = ${callExpr};\n`;
            routeHandlerCode += `    if (${varName} === undefined || ${varName} === null) {\n`;
            routeHandlerCode += `      return res.status(404).json({ error: "Not found" });\n`;
            routeHandlerCode += `    }\n\n`;
          } else {
            routeHandlerCode += `    const ${varName} = ${callExpr};\n\n`;
          }
        });
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

      if (codeBlock) {
        codeBlock.split("\n").forEach((line: string) => {
          routeHandlerCode += `    ${line}\n`;
        });
      }

      // Check if custom code already handles sending a response
      const hasCustomResponse =
        Boolean(codeBlock) &&
        (codeBlock.includes("res.json(") ||
          codeBlock.includes("res.send(") ||
          codeBlock.includes("return res.") ||
          codeBlock.includes("res.end("));

      if (!hasCustomResponse) {
        const statusCode = ep.type === "POST" ? 201 : 200;
        const responsePayload = buildResponsePayloadCode(
          ep,
          statusCode,
          path,
          pickedDbOps,
          targetVarMap,
          responseData,
        );

        routeHandlerCode += `\n\n    logger.debug("Successfully generated response for ${path}");\n`;
        routeHandlerCode += `    return res.status(${statusCode}).json(${responsePayload});\n`;
      }
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
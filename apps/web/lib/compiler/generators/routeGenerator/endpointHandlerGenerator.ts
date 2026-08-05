import { Endpoint, AnyMessagingResource, CompiledFile, ReusableFunction } from "@workspace/canvas/types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { parseSchemaJson, toVarName, toPascalCase } from "../../utils";
import {
  parametersToTsInterface,
  schemaToTsInterface,
} from "../schemaToTypeScript";
import { resolveEndpointTrace } from "../../traceResolver";
import { pickDbFunctionsForEndpoint } from "./dbResolver";
import { pickKafkaPublishFunction, toKafkaTopicKey } from "./kafkaResolver";
import { buildResponsePayloadCode } from "./responseBuilder";

export interface GenerateEndpointHandlerParams {
  ep: Endpoint & { nodeId: string };
  index: number;
  serviceName: string;
  pascalServiceName: string;
  serviceFolderName: string;
  serviceNode?: BackendNode;
  allNodes: BackendNode[];
  allEdges: BackendEdge[];
  allEndpoints: (Endpoint & { nodeId: string })[];
  dbFunctions: ReusableFunction[];
  kafkaFunctions: ReusableFunction[];
  nodePublishedEvents: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[];
  usedFileNames: Set<string>;
}

export interface GenerateEndpointHandlerResult {
  file: CompiledFile;
  routeImport: string;
  routeRegistration: string;
}

export function generateEndpointRouteHandler(
  params: GenerateEndpointHandlerParams,
): GenerateEndpointHandlerResult {
  const {
    ep,
    index,
    serviceName,
    pascalServiceName,
    serviceFolderName,
    serviceNode,
    allNodes,
    allEdges,
    allEndpoints,
    dbFunctions,
    kafkaFunctions,
    nodePublishedEvents,
    usedFileNames,
  } = params;

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
  const hasPublishedEvents =
    nodePublishedEvents.length > 0 || (ep.publishedEvents && ep.publishedEvents.length > 0);
  const pickedKafka =
    (hasPublishedEvents || method === "post") && kafkaFunctions.length > 0
      ? pickKafkaPublishFunction(kafkaFunctions)
      : null;

  // Build the extra import lines (de-duped by importPath)
  const extraImports: Map<string, Set<string>> = new Map();
  pickedDbOps.forEach((op) => {
    let importSet = extraImports.get(op.fn.importPath);
    if (!importSet) {
      importSet = new Set();
      extraImports.set(op.fn.importPath, importSet);
    }
    importSet.add(op.fn.name);
  });

  // Scan user's manual codeBlock for DB function references
  const codeBlockText = (ep.body || ep.code || "").trim();
  dbFunctions.forEach((f) => {
    if (codeBlockText.includes(f.name)) {
      let importSet = extraImports.get(f.importPath);
      if (!importSet) {
        importSet = new Set();
        extraImports.set(f.importPath, importSet);
      }
      importSet.add(f.name);
    }
  });

  // Scan for Kafka publisher references or configured published events
  if (
    pickedKafka ||
    codeBlockText.includes("publishKafkaEvent") ||
    codeBlockText.includes("KAFKA_TOPICS")
  ) {
    const publishFn =
      pickedKafka ||
      kafkaFunctions.find((f) => f.name === "publishKafkaEvent");
    if (publishFn) {
      if (!extraImports.has(publishFn.importPath)) {
        extraImports.set(publishFn.importPath, new Set());
      }
      extraImports.get(publishFn.importPath)!.add("publishKafkaEvent");
    }
    const topicsConst = kafkaFunctions.find((f) => f.name === "KAFKA_TOPICS");
    if (topicsConst) {
      const importPath = publishFn?.importPath || topicsConst.importPath;
      if (!extraImports.has(importPath)) {
        extraImports.set(importPath, new Set());
      }
      extraImports.get(importPath)!.add("KAFKA_TOPICS");
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
  const hasDbInCodeBlock = Boolean(
    codeBlock &&
      (codeBlock.includes("findAll") ||
        codeBlock.includes("find") ||
        codeBlock.includes("create") ||
        codeBlock.includes("update") ||
        codeBlock.includes("delete") ||
        codeBlock.includes("db.")),
  );

  if (pickedDbOps.length > 0 && !hasDbInCodeBlock) {
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
  const hasKafkaInCodeBlock = Boolean(
    codeBlock && codeBlock.includes("publishKafkaEvent"),
  );

  if (pickedKafka && !hasKafkaInCodeBlock) {
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

  return {
    file: {
      filename: `src/routes/${routeFileName}.ts`,
      language: "typescript",
      content: routeHandlerCode,
    },
    routeImport: `import { ${handlerName} } from "./${routeFileName}";`,
    routeRegistration: `router.${method}("${path}", ${handlerName});`,
  };
}

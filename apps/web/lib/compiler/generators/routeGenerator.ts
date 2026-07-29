import { Endpoint } from "@workspace/canvas/types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledFile } from "../types";
import { parseSchemaJson, toVarName, toPascalCase } from "../utils";
import {
  parametersToTsInterface,
  schemaToTsInterface,
} from "./schemaToTypeScript";
import { resolveEndpointTrace } from "../traceResolver";

export function generateRoutes(
  serviceName: string,
  nodeEndpoints: (Endpoint & { nodeId: string })[],
  serviceNode?: BackendNode,
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  allEndpoints: (Endpoint & { nodeId: string })[] = []
): CompiledFile[] {
  const files: CompiledFile[] = [];
  const routeImports: string[] = [];
  const routeRegistrations: string[] = [];
  const usedFileNames = new Set<string>();

  const pascalServiceName = toPascalCase(serviceName);
  const serviceFolderName = toVarName(serviceName);

  if (nodeEndpoints.length === 0) {
    const defaultRouteCode = `import { Request, Response } from "express";
import { createLogger } from "@workspace/logger";

const logger = createLogger("${serviceName}:DefaultRoute");

export async function defaultHandler(_req: Request, res: Response) {
  logger.info("Executing default handler");
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
    nodeEndpoints.forEach((ep, index) => {
      const method = (ep.type || "GET").toLowerCase();
      const rawName = ep.name || ep.id || "route";
      let routeFileName = toVarName(`${method}_${rawName}`) || `route_${index + 1}`;

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
        responseData = JSON.stringify(parsedResSchema, null, 6).replace(/\n/g, "\n    ");
      } else {
        responseData = `{\n      success: true,\n      message: "Successfully executed ${ep.type || "GET"} ${path}",\n      timestamp: new Date().toISOString()\n    }`;
      }

      const queryTypeRes = parametersToTsInterface(`${pascalName}Query`, ep.queryParams, false);
      const bodyTypeRes = schemaToTsInterface(`${pascalName}Body`, ep.requestBody);
      const isBodyMethod = ["post", "put", "patch"].includes(method);

      // Resolve targeted connection trace for this endpoint
      const trace = serviceNode
        ? resolveEndpointTrace(serviceNode, ep, allNodes, allEdges, allEndpoints)
        : { incoming: [], outgoing: [] };

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

const logger = createLogger("${serviceName}:${routeFileName}");

/**
 * ${ep.type || "GET"} ${path}
 * ${summary}
 */
export async function ${handlerName}(
  req: Request<${pascalName}Params, ${pascalName}Response | { error: string; details?: unknown }, ${pascalName}Body, ${pascalName}Query>,
  res: Response<${pascalName}Response | { error: string; details?: unknown }>
) {
  try {
    logger.info("Handling ${ep.type || "GET"} ${path}");
    logger.debug("Request details", { params: req.params, query: req.query, body: req.body });

`;

      // Insert validation checks if schemas are present
      if (isBodyMethod && bodyTypeRes.hasContent) {
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

      routeHandlerCode += `    // =========================================================================\n`;
      routeHandlerCode += `    // 🤖 AI CODING AGENT DIRECTIVE:\n`;
      routeHandlerCode += `    // Implement endpoint domain logic for: ${ep.type || "GET"} ${path}\n`;
      routeHandlerCode += `    // Description: ${summary}\n`;
      routeHandlerCode += `    //\n`;
      routeHandlerCode += `    // 📥 CONNECTED INCOMING NODE(S):\n`;
      if (trace.incoming.length > 0) {
        trace.incoming.forEach((inc) => {
          routeHandlerCode += `    // - Node: ${inc.nodeName} [${inc.nodeType}] (${inc.detail})\n`;
          if (inc.dataContext) routeHandlerCode += `    //   Data Context: ${inc.dataContext}\n`;
        });
      } else {
        routeHandlerCode += `    // - Direct API request (Method: ${ep.type || "GET"}, Path: ${path})\n`;
      }
      routeHandlerCode += `    //\n`;
      routeHandlerCode += `    // 📤 CONNECTED OUTGOING NODE(S):\n`;
      if (trace.outgoing.length > 0) {
        trace.outgoing.forEach((out) => {
          routeHandlerCode += `    // - Node: ${out.nodeName} [${out.nodeType}] (${out.detail})\n`;
          if (out.dataContext) routeHandlerCode += `    //   Data Context: ${out.dataContext}\n`;
        });
      } else {
        routeHandlerCode += `    // - Returns HTTP ${ep.type === "POST" ? 201 : 200} JSON response\n`;
      }

      if (ep.crudOperations && Object.keys(ep.crudOperations).length > 0) {
        routeHandlerCode += `    //\n    // 🗄️ DATABASE OPERATIONS REQUIRED:\n`;
        for (const [tableId, ops] of Object.entries(ep.crudOperations)) {
          if (ops && ops.length > 0) {
            const tableNode = allNodes.find(n => n.id === tableId);
            const tableName = tableNode?.data?.label || tableNode?.data?.tableRef || "Unknown Table";
            routeHandlerCode += `    // - Table [${tableName}]: ${ops.map(o => o.toUpperCase()).join(", ")}\n`;
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
      routeHandlerCode += `\n    logger.debug("Successfully generated response for ${path}");\n`;
      routeHandlerCode += `    return res.status(${statusCode}).json(${responseData} as ${pascalName}Response);\n`;
      routeHandlerCode += `  } catch (error) {\n    logger.error("Error in ${method.toUpperCase()} ${path}:", error);\n    return res.status(500).json({ error: "Internal Server Error", details: (error as Error).message });\n  }\n}\n`;

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

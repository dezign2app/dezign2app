import { Endpoint } from "@workspace/canvas/types";
import { CompiledFile } from "../types";
import { parseSchemaJson, toVarName } from "../utils";

export function generateRoutes(
  serviceName: string,
  nodeEndpoints: (Endpoint & { nodeId: string })[]
): CompiledFile[] {
  const files: CompiledFile[] = [];
  const routeImports: string[] = [];
  const routeRegistrations: string[] = [];

  if (nodeEndpoints.length === 0) {
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
import { db } from "@workspace/db";

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

  return files;
}

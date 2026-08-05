import { CompiledFile, ReusableFunction } from "@workspace/canvas/types";

export function generateDefaultRoute(
  serviceName: string,
  dbFunctions: ReusableFunction[],
): { files: CompiledFile[]; routeImports: string[]; routeRegistrations: string[] } {
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

  return {
    files: [
      {
        filename: "src/routes/defaultRoute.ts",
        language: "typescript",
        content: defaultRouteCode,
      },
    ],
    routeImports: [`import { defaultHandler } from "./defaultRoute";`],
    routeRegistrations: [`router.get("/example", defaultHandler);`],
  };
}

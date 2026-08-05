import { Endpoint, AnyMessagingResource, CompiledFile, ReusableFunction } from "@workspace/canvas/types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { toVarName, toPascalCase } from "../../utils";
import { generateDefaultRoute } from "./defaultRouteGenerator";
import { generateEndpointRouteHandler } from "./endpointHandlerGenerator";

export * from "./dbResolver";
export * from "./kafkaResolver";
export * from "./responseBuilder";
export * from "./defaultRouteGenerator";
export * from "./endpointHandlerGenerator";

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
    const defaultRouteResult = generateDefaultRoute(serviceName, dbFunctions);
    files.push(...defaultRouteResult.files);
    routeImports.push(...defaultRouteResult.routeImports);
    routeRegistrations.push(...defaultRouteResult.routeRegistrations);
  } else {
    nodeEndpoints.forEach((ep, index) => {
      const result = generateEndpointRouteHandler({
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
      });

      files.push(result.file);
      routeImports.push(result.routeImport);
      routeRegistrations.push(result.routeRegistration);
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

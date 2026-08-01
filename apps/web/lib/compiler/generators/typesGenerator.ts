import { BackendNode } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile } from "../types";
import { toVarName, toPascalCase } from "../utils";
import {
  parametersToTsInterface,
  parametersToZodSchema,
  schemaToTsInterface,
  schemaToZodSchema,
} from "./schemaToTypeScript";

export function generateTypesPackage(
  nodes: BackendNode[],
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[] = [],
): CompiledFile[] {
  const files: CompiledFile[] = [];
  const barrelExports: string[] = [];

  // 1. package.json
  const packageJson = JSON.stringify(
    {
      name: "@workspace/types",
      version: "0.0.0",
      private: true,
      description:
        "Shared TypeScript interfaces and Zod schemas across microservices and frontend clients",
      main: "src/index.ts",
      types: "src/index.ts",
      scripts: {
        build: "tsc",
        "check-types": "tsc --noEmit",
      },
      dependencies: {
        zod: "^3.24.2",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        typescript: "^5.3.3",
      },
    },
    null,
    2,
  );
  files.push({
    filename: "package.json",
    language: "json",
    content: packageJson,
  });

  // 2. tsconfig.json
  const tsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: {
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
    },
    null,
    2,
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: tsconfig,
  });

  // 3. Service Folders: src/<serviceFolderName>/<routeFileName>.ts
  const endpointNodes = nodes.filter(
    (n) =>
      n.type === "service" ||
      n.type === "api_gateway" ||
      n.type === "serverless" ||
      Boolean(n.data && (n.data.endpoints || n.data.routeGroups)),
  );

  const processedServiceFolders = new Set<string>();

  endpointNodes.forEach((serviceNode) => {
    const rawServiceName =
      serviceNode.data.label || serviceNode.id || "Service";
    let serviceFolderName = toVarName(rawServiceName) || "service";
    let pascalServiceName = toPascalCase(rawServiceName);

    if (processedServiceFolders.has(serviceFolderName)) {
      serviceFolderName = `${serviceFolderName}_${serviceNode.id.replace(/[^a-zA-Z0-9]/g, "")}`;
      pascalServiceName = `${pascalServiceName}_${toPascalCase(serviceNode.id)}`;
    }
    processedServiceFolders.add(serviceFolderName);

    // Gather all endpoints for this node
    let nodeEndpoints = endpoints.filter((e) => e.nodeId === serviceNode.id);
    if (nodeEndpoints.length === 0 && serviceNode.data?.endpoints) {
      nodeEndpoints = serviceNode.data.endpoints as (Endpoint & {
        nodeId: string;
      })[];
    }
    if (serviceNode.data?.routeGroups) {
      for (const group of serviceNode.data.routeGroups as any[]) {
        if (group.endpoints) {
          nodeEndpoints = [...nodeEndpoints, ...group.endpoints];
        }
      }
    }

    if (nodeEndpoints.length > 0) {
      const routeFileExports: string[] = [];
      const usedFileNames = new Set<string>();

      nodeEndpoints.forEach((ep, index) => {
        const method = (ep.type || "GET").toLowerCase();
        const rawName = ep.name || ep.id || "route";
        let routeFileName =
          toVarName(`${method}_${rawName}`) || `route_${index + 1}`;

        if (usedFileNames.has(routeFileName)) {
          routeFileName = `${routeFileName}_${index + 1}`;
        }
        usedFileNames.add(routeFileName);

        // Disambiguate type names with PascalCase Service Name to prevent TS2308 collisions across modules
        const pascalName = `${pascalServiceName}${toPascalCase(routeFileName)}`;
        const schemaVarPrefix = `${serviceFolderName}${toPascalCase(routeFileName)}`;
        const isBodyMethod = ["post", "put", "patch"].includes(method);

        const paramsTypeRes = parametersToTsInterface(
          `${pascalName}Params`,
          ep.pathParams,
          true,
        );
        const queryTypeRes = parametersToTsInterface(
          `${pascalName}Query`,
          ep.queryParams,
          false,
        );
        const bodyTypeRes = schemaToTsInterface(
          `${pascalName}Body`,
          ep.requestBody,
        );
        const responseTypeRes = schemaToTsInterface(
          `${pascalName}Response`,
          ep.responseBody,
        );

        const queryZodRes = parametersToZodSchema(
          `${schemaVarPrefix}QuerySchema`,
          ep.queryParams,
          false,
        );
        const bodyZodRes = schemaToZodSchema(
          `${schemaVarPrefix}BodySchema`,
          ep.requestBody,
        );

        let singleRouteCode = `import { z } from "zod";\n\n`;
        singleRouteCode += `/**\n * ${ep.type || "GET"} ${ep.name || "/"}\n * Service: ${rawServiceName}\n * ${ep.summary || "Route Schema"}\n */\n`;
        singleRouteCode += `// --- Input Schemas ---\n`;
        singleRouteCode += paramsTypeRes.code + "\n";
        singleRouteCode += queryTypeRes.code + "\n";
        if (isBodyMethod) {
          singleRouteCode += bodyTypeRes.code + "\n";
        } else {
          singleRouteCode += `export type ${pascalName}Body = never;\n\n`;
        }

        singleRouteCode += `// --- Output Schema ---\n`;
        singleRouteCode += responseTypeRes.code + "\n";

        singleRouteCode += `// --- Zod Validation Schemas ---\n`;
        if (queryTypeRes.hasContent) {
          singleRouteCode += queryZodRes.code + "\n";
        }
        if (isBodyMethod && bodyTypeRes.hasContent) {
          singleRouteCode += bodyZodRes.code + "\n";
        }

        // File per route: src/<serviceFolderName>/<routeFileName>.ts
        files.push({
          filename: `src/${serviceFolderName}/${routeFileName}.ts`,
          language: "typescript",
          content: singleRouteCode,
        });

        routeFileExports.push(`export * from "./${routeFileName}";`);
      });

      // Service barrel file: src/<serviceFolderName>/index.ts
      files.push({
        filename: `src/${serviceFolderName}/index.ts`,
        language: "typescript",
        content: `/**\n * Schemas for ${rawServiceName}\n */\n${routeFileExports.join("\n")}\n`,
      });

      barrelExports.push(`export * from "./${serviceFolderName}";`);
      barrelExports.push(
        `export * as ${pascalServiceName} from "./${serviceFolderName}";`,
      );
    }
  });

  // 4. Events Types: src/events/index.ts
  let eventsCode = `import { z } from "zod";\n\n`;
  if (events.length === 0) {
    eventsCode += `// No messaging events configured\nexport type GenericEventPayload = Record<string, unknown>;\n`;
  } else {
    const processedEventNames = new Set<string>();

    events.forEach((ev) => {
      const eventName = ev.name || "event";
      const eventPascalName = toPascalCase(eventName);
      if (processedEventNames.has(eventPascalName)) return;
      processedEventNames.add(eventPascalName);

      const payloadInterfaceName = `${eventPascalName}EventPayload`;
      const schemaName = `${toVarName(eventName)}PayloadSchema`;

      const schemaObj = {
        rawJson: ev.payloadSchema?.rawJson,
      };

      const interfaceRes = schemaToTsInterface(payloadInterfaceName, schemaObj);
      const zodRes = schemaToZodSchema(schemaName, schemaObj);

      eventsCode += `// --- Event Contract: "${eventName}" ---\n`;
      eventsCode += interfaceRes.code + "\n";
      if (zodRes.hasContent) {
        eventsCode += zodRes.code + "\n";
      }
    });
  }

  files.push({
    filename: "src/events/index.ts",
    language: "typescript",
    content: eventsCode,
  });

  barrelExports.push(`export * from "./events";`);

  // 5. Root Index barrel: src/index.ts
  const indexContent = `/**
 * Shared Type Definitions & Zod Validation Schemas
 * Reused across all microservices (@workspace/*) and frontend web clients
 */
${barrelExports.join("\n")}
`;

  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: indexContent,
  });

  return files;
}

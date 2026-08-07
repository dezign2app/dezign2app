import { BackendNode } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile } from "@workspace/canvas/types";
import { toVarName, toPascalCase } from "../utils";
import {
  parametersToTsInterface,
  parametersToZodSchema,
  schemaToTsInterface,
  schemaToZodSchema,
} from "./schemaToTypeScript";

function generateResponseInterface(
  interfaceName: string,
  responseFields: any[] = [],
  legacyResponseBody: any,
  nodes: BackendNode[],
): { code: string; dbImports: Set<string> } {
  const dbImports = new Set<string>();

  if (!responseFields || responseFields.length === 0) {
    const legacy = schemaToTsInterface(interfaceName, legacyResponseBody);
    if (legacy.hasContent) return { code: legacy.code, dbImports };
    return {
      code: `export interface ${interfaceName} {\n  status: number;\n  message: string;\n  data?: unknown;\n}\n`,
      dbImports,
    };
  }

  const props: string[] = [];

  for (const field of responseFields) {
    const isRequired = field.required !== false;
    const propName = field.name || "field";
    let tsType = "unknown";

    if (field.type && field.type.startsWith("db:")) {
      const parts = field.type.split(":");
      const tableNodeId = parts[1];
      const category = parts[2] || "single";
      const tableNode = nodes.find((n) => n.id === tableNodeId);
      const rawTableName =
        tableNode?.data?.label || tableNode?.data?.tableRef || "Entity";
      const pascalEntity = toPascalCase(rawTableName);

      dbImports.add(pascalEntity);

      const cols: string[] = field.selectedColumns || [];
      const hasPick = category.startsWith("partial") && cols.length > 0;
      const pickUnion = hasPick ? cols.map((c) => `"${c}"`).join(" | ") : "";

      if (category === "single") {
        tsType = pascalEntity;
      } else if (category === "array") {
        tsType = `${pascalEntity}[]`;
      } else if (category === "partial_single") {
        tsType = hasPick ? `Pick<${pascalEntity}, ${pickUnion}>` : pascalEntity;
      } else if (category === "partial_array") {
        tsType = hasPick ? `Pick<${pascalEntity}, ${pickUnion}>[]` : `${pascalEntity}[]`;
      }
    } else {
      switch (field.type) {
        case "string":
        case "UUID":
        case "timestamp":
          tsType = "string";
          break;
        case "number":
          tsType = "number";
          break;
        case "boolean":
          tsType = "boolean";
          break;
        case "object":
          tsType = "Record<string, unknown>";
          break;
        case "array":
          tsType = "unknown[]";
          break;
        default:
          tsType = "string";
      }
    }

    props.push(`  ${propName}${isRequired ? "" : "?"}: ${tsType};`);
  }

  const code = `export interface ${interfaceName} {\n${props.join("\n")}\n}\n`;
  return { code, dbImports };
}

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
      nodeEndpoints = serviceNode.data.endpoints.map((ep) => ({
        ...ep,
        nodeId: serviceNode.id,
      }));
    }
    if (serviceNode.data?.routeGroups) {
      for (const group of serviceNode.data.routeGroups) {
        if (group.endpoints) {
          const groupEndpoints = group.endpoints.map((ep) => ({
            ...ep,
            nodeId: serviceNode.id,
          }));
          nodeEndpoints = [...nodeEndpoints, ...groupEndpoints];
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
        const responseResInfo = generateResponseInterface(
          `${pascalName}Response`,
          ep.responseFields,
          ep.responseBody,
          nodes,
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

        const dbImportStatement =
          responseResInfo.dbImports.size > 0
            ? `import type { ${Array.from(responseResInfo.dbImports).join(", ")} } from "@workspace/db";\n`
            : "";

        let singleRouteCode = `import { z } from "zod";\n${dbImportStatement}\n`;
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
        singleRouteCode += responseResInfo.code + "\n";

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

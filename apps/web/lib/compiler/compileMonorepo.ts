import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile, CompiledMonorepoResult } from "./types";
import { compileServiceNode } from "./compileServiceNode";
import { compileLangGraphNode } from "./compileLangGraphNode";
import { compileDatabaseNodes } from "./compileDatabaseNodes";
import { compileKafkaNodes } from "./compileKafkaNodes";
import { compileWebClientNodes } from "./compileWebClientNode";
import { compileUiPackage } from "./compileUiPackage";
import { generateLoggerPackage } from "./generators/loggerGenerator";
import { generateTypesPackage } from "./generators/typesGenerator";
import {
  generateRootFiles,
  generateTypescriptConfigPackage,
} from "./generators/rootFilesGenerator";
import { generateRootReadme } from "./generators/readmeGenerator";

/**
 * Compiles the entire system architecture canvas into a production-ready
 * Turborepo + pnpm monorepo matching standard monorepo structure.
 */
export function compileMonorepo(
  nodes: BackendNode[],
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[] = [],
  edges: BackendEdge[] = [],
  testCases: SimulationTestCase[] = [],
  projectName: string = "Blueprint Monorepo",
): CompiledMonorepoResult {
  const files: CompiledFile[] = [];

  const serviceNodes = nodes.filter((n) => n.type === "service");
  const langGraphNodes = nodes.filter((n) => n.type === "langgraph");
  const entityNodes = nodes.filter(
    (n) => n.type === "entity" || n.type === "db_ref",
  );
  const webClientNodes = nodes.filter(
    (n) => n.type === "webClient" || n.data?.isWebClient,
  );

  const servicesInfo: { id: string; name: string; folderName: string }[] = [];
  const webClientsInfo: { id: string; name: string; folderName: string }[] = [];

  // 1. Generate Root Manifest Files (package.json, pnpm-workspace.yaml, turbo.json, .gitignore)
  files.push(...generateRootFiles(projectName));

  // 2. Generate Shared Package: packages/typescript-config (@workspace/typescript-config)
  files.push(...generateTypescriptConfigPackage());

  // 3. Generate Shared Package: packages/ui (@workspace/ui - Shadcn UI)
  const compiledUi = compileUiPackage();
  compiledUi.files.forEach((f) => {
    files.push({
      filename: `packages/ui/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // 4. Generate Shared Package: packages/db (@workspace/db)
  const compiledDb = compileDatabaseNodes(nodes, edges);
  compiledDb.files.forEach((f) => {
    files.push({
      filename: `packages/db/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // 4.5 Generate Shared Package: packages/logger (@workspace/logger)
  const compiledLogger = generateLoggerPackage();
  compiledLogger.forEach((f) => {
    files.push({
      filename: `packages/logger/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // 4.6 Generate Shared Package: packages/types (@workspace/types)
  const compiledTypes = generateTypesPackage(nodes, endpoints, events);
  compiledTypes.forEach((f) => {
    files.push({
      filename: `packages/types/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // 4.7 Generate Shared Package: packages/kafka (@workspace/kafka)
  const compiledKafka = compileKafkaNodes(nodes, edges);
  compiledKafka.files.forEach((f) => {
    files.push({
      filename: `packages/kafka/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // 5. Generate Apps: apps/<sanitizedName> for Service Nodes
  serviceNodes.forEach((srvNode) => {
    const rawName = srvNode.data.label || "Service";
    const folderName = rawName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    servicesInfo.push({
      id: srvNode.id,
      name: rawName,
      folderName,
    });

    const srvResult = compileServiceNode(
      srvNode,
      endpoints,
      events,
      nodes,
      edges,
      testCases,
    );
    srvResult.files.forEach((f) => {
      files.push({
        filename: `apps/${folderName}/${f.filename}`,
        language: f.language,
        content: f.content,
      });
    });
  });

  // 5.5. Generate Apps: apps/<sanitizedName> for LangGraph Service Nodes
  langGraphNodes.forEach((lgNode) => {
    const rawName = lgNode.data?.label || "LangGraph Service";
    let folderName =
      rawName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "langgraph-service";
    if (servicesInfo.some((s) => s.folderName === folderName)) {
      folderName = `${folderName}-agent`;
    }
    servicesInfo.push({
      id: lgNode.id,
      name: rawName,
      folderName,
    });

    const lgResult = compileLangGraphNode(lgNode, {
      edges,
      nodes,
      endpoints,
      events,
      testCases,
    });
    lgResult.files.forEach((f) => {
      files.push({
        filename: `apps/${folderName}/${f.filename}`,
        language: f.language,
        content: f.content,
      });
    });
  });

  // 6. Generate Web Client App: apps/web-client (if WebClient nodes exist)
  if (webClientNodes.length > 0) {
    const webClientFolder = "web-client";
    webClientsInfo.push({
      id: "web-client-app",
      name: "Web Client",
      folderName: webClientFolder,
    });

    const webClientResult = compileWebClientNodes(
      webClientNodes,
      endpoints,
      events,
      nodes,
      edges,
      projectName,
      testCases,
    );

    webClientResult.files.forEach((f) => {
      files.push({
        filename: `apps/${webClientFolder}/${f.filename}`,
        language: f.language,
        content: f.content,
      });
    });
  }

  // 7. Generate Root tsconfig.json (referencing packages and apps)
  const rootReferences = [
    { path: "packages/typescript-config" },
    { path: "packages/ui" },
    { path: "packages/db" },
    { path: "packages/logger" },
    { path: "packages/types" },
    ...(compiledKafka.files.length > 0 ? [{ path: "packages/kafka" }] : []),
    ...servicesInfo.map((s) => ({ path: `apps/${s.folderName}` })),
    ...webClientsInfo.map((w) => ({ path: `apps/${w.folderName}` })),
  ];
  const rootTsconfig = JSON.stringify(
    {
      files: [],
      references: rootReferences,
    },
    null,
    2,
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: rootTsconfig,
  });

  // 8. Generate Root README.md
  files.push(
    generateRootReadme(
      projectName,
      serviceNodes.length,
      webClientNodes.length,
      entityNodes.length,
      servicesInfo,
      webClientsInfo,
      compiledKafka.files.length > 0,
    ),
  );

  return {
    projectName,
    files,
    services: servicesInfo,
    webClients: webClientsInfo,
  };
}

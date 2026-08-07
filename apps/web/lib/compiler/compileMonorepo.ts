import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource, CompiledFile, CompiledMonorepoResult, ReusableFunction } from "@workspace/canvas/types";
import { compileServiceNode } from "./compileServiceNode";
import { compileLangGraphNode } from "./compileLangGraphNode";
import { compileDatabaseNodes } from "./compileDatabaseNodes";
import { compileKafkaNodes } from "./compileKafkaNodes";
import { compileRedisNodes } from "./compileRedisNodes";
import { compileWebClientNodes } from "./compileWebClientNode";
import { compileUiPackage } from "./compileUiPackage";
import { generateLoggerPackage } from "./generators/loggerGenerator";
import { generateTypesPackage } from "./generators/typesGenerator";
import {
  generateRootFiles,
  generateTypescriptConfigPackage,
} from "./generators/rootFilesGenerator";
import { generateRootReadme } from "./generators/readmeGenerator";
import { compileGrpcPackages } from "./grpc";

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

  // 4.7 Generate Shared Package: packages/<kafkaNodeLabel> (@workspace/<kafkaNodeLabel>)
  const compiledKafka = compileKafkaNodes(nodes, edges);
  compiledKafka.files.forEach((f) => {
    files.push({
      filename: `packages/${compiledKafka.packageFolder}/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // Collect reusable functions from db + kafka packages for service route generation
  const dbFunctions: ReusableFunction[] = compiledDb.reusableFunctions ?? [];
  const kafkaFunctions: ReusableFunction[] = compiledKafka.reusableFunctions ?? [];

  // 4.8 Generate Shared Package: packages/redis (@workspace/redis)
  const compiledRedis = compileRedisNodes(nodes, edges);
  compiledRedis.files.forEach((f) => {
    files.push({
      filename: `packages/redis/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // 4.9 Generate Shared Packages: packages/grpc/<service-name>/ for gRPC inter-service calls
  const compiledGrpc = compileGrpcPackages(nodes, edges, endpoints);
  const grpcPackageFolders: string[] = [];
  compiledGrpc.packagesByServiceId.forEach(({ packageFolder, files: grpcFiles }) => {
    grpcFiles.forEach((f) => {
      files.push({
        filename: `packages/${f.filename}`,
        language: f.language,
        content: f.content,
      });
    });
    grpcPackageFolders.push(`packages/${packageFolder}`);
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
      dbFunctions,
      kafkaFunctions,
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

  // 6. Generate Web Apps: apps/<appSlug> for WebApp nodes & connected WebClient pages
  const webAppNodes = nodes.filter((n) => n.type === "webApp");

  if (webAppNodes.length > 0 || webClientNodes.length > 0) {
    const appMap = new Map<string, { appName: string; appSlug: string; webAppNode?: BackendNode; pageNodes: BackendNode[] }>();

    // Process explicit WebApp nodes
    webAppNodes.forEach((appNode) => {
      const appName = appNode.data.label || "Web Application";
      const appSlug =
        appNode.data.appSlug ||
        appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      appMap.set(appSlug, {
        appName,
        appSlug,
        webAppNode: appNode,
        pageNodes: [],
      });
    });

    // Process page nodes (WebClient) and trace their section connections to WebApp nodes
    webClientNodes.forEach((pageNode) => {
      // Find edge connecting this pageNode (page-out) to a WebAppNode section
      const edgeToApp = edges.find(
        (e) =>
          e.source === pageNode.id &&
          webAppNodes.some((appNode) => appNode.id === e.target),
      );

      let targetAppSlug = "web-client";
      let accessTypeOverride: "public" | "private" | "role-gated" | "payment-gated" | "org-gated" | undefined = undefined;

      if (edgeToApp) {
        const targetAppNode = webAppNodes.find((n) => n.id === edgeToApp.target);
        if (targetAppNode) {
          targetAppSlug =
            targetAppNode.data.appSlug ||
            (targetAppNode.data.label || "web-app")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-");

          const handle = edgeToApp.targetHandle || "";
          if (handle.startsWith("public-in")) accessTypeOverride = "public";
          else if (handle.startsWith("private-in")) accessTypeOverride = "private";
          else if (handle.startsWith("role-in")) accessTypeOverride = "role-gated";
          else if (handle.startsWith("payment-in")) accessTypeOverride = "payment-gated";
          else if (handle.startsWith("org-in")) accessTypeOverride = "org-gated";
        }
      } else if (pageNode.data.appSlug) {
        targetAppSlug = pageNode.data.appSlug;
      }

      if (!appMap.has(targetAppSlug)) {
        appMap.set(targetAppSlug, {
          appName: pageNode.data.appName || targetAppSlug,
          appSlug: targetAppSlug,
          pageNodes: [],
        });
      }

      const targetAppObj = appMap.get(targetAppSlug)!;
      const appNodeData = targetAppObj.webAppNode?.data;

      // Clone page node data with section access override & app parameters
      const enrichedPageNode: BackendNode = {
        ...pageNode,
        data: {
          ...pageNode.data,
          appSlug: targetAppSlug,
          appName: targetAppObj.appName,
          accessType: accessTypeOverride || pageNode.data.accessType || "public",
          allowedRoles: pageNode.data.allowedRoles || appNodeData?.allowedRoles,
          requiredPlans: pageNode.data.requiredPlans || appNodeData?.requiredPlans,
          allowedOrgRoles: pageNode.data.allowedOrgRoles || appNodeData?.allowedOrgRoles,
          authNodeId: pageNode.data.authNodeId || appNodeData?.authNodeId,
        },
      };

      targetAppObj.pageNodes.push(enrichedPageNode);
    });

    appMap.forEach(({ appName, appSlug, pageNodes }, slug) => {
      webClientsInfo.push({
        id: `web-app-${slug}`,
        name: appName,
        folderName: slug,
      });

      const webClientResult = compileWebClientNodes(
        pageNodes,
        endpoints,
        events,
        nodes,
        edges,
        `${projectName} - ${appName}`,
        testCases,
      );

      webClientResult.files.forEach((f) => {
        files.push({
          filename: `apps/${slug}/${f.filename}`,
          language: f.language,
          content: f.content,
        });
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
    ...(compiledKafka.files.length > 0 ? [{ path: `packages/${compiledKafka.packageFolder}` }] : []),
    ...(compiledRedis.files.length > 0 ? [{ path: "packages/redis" }] : []),
    ...grpcPackageFolders.map((folder) => ({ path: folder })),
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
      compiledRedis.files.length > 0,
    ),
  );

  return {
    projectName,
    files,
    services: servicesInfo,
    webClients: webClientsInfo,
  };
}

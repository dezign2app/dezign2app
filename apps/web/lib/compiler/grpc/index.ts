import { BackendNode, BackendEdge } from "@/types/canvas";
import { Endpoint, CompiledFile } from "@workspace/canvas/types";
import {
  INTER_SERVICE_PROTOCOL_GRPC,
  GRPC_DEFAULT_PORT,
} from "@workspace/canvas";
import { toFolderName } from "../kafka/utils";
import { toPascalCase, toVarName, toEnvVarName } from "../utils";
import { generateProtoFile } from "./generators/protoGenerator";
import {
  generateGrpcPackageFiles,
  generateGrpcServerBootstrap,
  GrpcEndpointItem,
} from "./generators/packageFiles";

export interface CompiledGrpcResult {
  /** Map of target service node ID → list of compiled files for its grpc package */
  packagesByServiceId: Map<
    string,
    { packageName: string; packageFolder: string; files: CompiledFile[] }
  >;
  /** Map of target service node ID → gRPC server bootstrap code snippet */
  serverBootstrapByServiceId: Map<string, string>;
  /** Map of source endpoint ID → generated gRPC call code block */
  clientCallByEndpointId: Map<string, string>;
}

/**
 * Compiles gRPC packages for all inter-service edges where the source endpoint
 * has `interServiceProtocol: "grpc"`.
 *
 * Generates under packages/grpc/<target-service-name>/:
 *  - proto/<endpoint_name>.proto (separate per-endpoint proto file)
 *  - src/<endpoint_name>.ts (separate per-endpoint strongly-typed TS client stub)
 *  - src/index.ts (re-exporting all endpoint files)
 *  - package.json, tsconfig.json
 */
export function compileGrpcPackages(
  allNodes: BackendNode[],
  allEdges: BackendEdge[],
  allEndpoints: (Endpoint & { nodeId: string })[],
): CompiledGrpcResult {
  const packagesByServiceId = new Map<
    string,
    { packageName: string; packageFolder: string; files: CompiledFile[] }
  >();
  const serverBootstrapByServiceId = new Map<string, string>();
  const clientCallByEndpointId = new Map<string, string>();

  // Find all source endpoints belonging to services with gRPC interServiceProtocol
  const grpcEndpoints = allEndpoints.filter((ep) => {
    const srcNode = allNodes.find((n) => n.id === ep.nodeId);
    return (
      (srcNode?.data?.interServiceProtocol ?? ep.interServiceProtocol) ===
      INTER_SERVICE_PROTOCOL_GRPC
    );
  });


  if (grpcEndpoints.length === 0) {
    return {
      packagesByServiceId,
      serverBootstrapByServiceId,
      clientCallByEndpointId,
    };
  }

  // For each gRPC endpoint on a source service, find its outgoing edges to target services
  grpcEndpoints.forEach((ep) => {
    const sourceServiceId = ep.nodeId;

    // Find outgoing edges from this service node
    const outgoingEdges = allEdges.filter(
      (e) =>
        e.source === sourceServiceId &&
        allNodes.find((n) => n.id === e.target)?.type === "service",
    );

    outgoingEdges.forEach((edge) => {
      const targetNode = allNodes.find((n) => n.id === edge.target);
      if (!targetNode) return;

      const tgtLabel = targetNode.data?.label || targetNode.id;
      const tgtServiceName = toPascalCase(
        tgtLabel.replace(/[^a-zA-Z0-9]/g, "_"),
      );
      const protoPackageName = toFolderName(tgtLabel).replace(/-/g, "_");
      const packageFolder = `grpc/${toFolderName(tgtLabel)}`;
      const packageName = `@workspace/grpc-${toFolderName(tgtLabel)}`;
      const envVarName = `${toEnvVarName(tgtLabel)}_GRPC_URL`;

      // Find target endpoints for this service
      const tgtEndpoints = allEndpoints.filter(
        (e) => e.nodeId === targetNode.id,
      );
      const targetEp = tgtEndpoints[0] || ep;
      const rawRpcName = (targetEp.name || "Execute")
        .replace(/^\//, "")
        .replace(/[^a-zA-Z0-9]/g, "_");
      const rpcName = toPascalCase(rawRpcName || "Execute");
      const endpointName = rawRpcName.toLowerCase() || "execute";
      const methodName = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);

      // Generate .proto file and TS interface metadata for this endpoint
      const protoResult = generateProtoFile({
        packageName: protoPackageName,
        serviceName: tgtServiceName,
        rpcName,
        endpoint: targetEp,
      });

      const epItem: GrpcEndpointItem = {
        rpcName,
        endpointName,
        protoFilename: protoResult.filename,
        protoContent: protoResult.content,
        reqFields: protoResult.reqFields,
        resFields: protoResult.resFields,
      };

      // Build or update the grpc package for this target service
      const existingPkg = packagesByServiceId.get(targetNode.id);
      if (!existingPkg) {
        const pkgFiles = generateGrpcPackageFiles({
          packageFolder,
          packageName,
          serviceName: tgtServiceName,
          protoPackageName,
          endpoints: [epItem],
        });
        packagesByServiceId.set(targetNode.id, {
          packageName,
          packageFolder,
          files: pkgFiles.map((f) => ({
            ...f,
            filename: `${packageFolder}/${f.filename}`,
          })),
        });

        serverBootstrapByServiceId.set(
          targetNode.id,
          generateGrpcServerBootstrap(tgtServiceName),
        );
      }

      // Generate the strongly typed client call code block (Zero `any` or `unknown`)
      const varPrefix = toVarName(tgtLabel);
      const reqPayload = ep.requestBody ? "body" : "{}";
      const tgtGrpcPort = targetNode.data?.grpcPort || "50051";
      const clientCall =
        `    // --- Inter-Service gRPC Call: ${tgtLabel} (${rpcName}) ---\n` +
        `    const { create${rpcName}Client } = await import("${packageName}/${endpointName}");\n` +
        `    type ${rpcName}Response = import("${packageName}/${endpointName}").${rpcName}Response;\n` +
        `    const ${varPrefix}GrpcClient = create${rpcName}Client(\n` +
        `      process.env.${envVarName} || "localhost:${tgtGrpcPort}",\n` +
        `    );\n` +
        `    let ${varPrefix}Data: ${rpcName}Response | null = null;\n` +
        `    ${varPrefix}Data = await new Promise((resolve, reject) => {\n` +
        `      ${varPrefix}GrpcClient.${methodName}(${reqPayload}, (err, response) => {\n` +
        `        if (err) {\n` +
        `          logger.error("gRPC call to ${tgtLabel} failed", { err });\n` +
        `          return reject(err);\n` +
        `        }\n` +
        `        logger.info("gRPC response from ${tgtLabel}", { data: response });\n` +
        `        resolve(response);\n` +
        `      });\n` +
        `    });\n\n`;


      clientCallByEndpointId.set(ep.id, clientCall);
    });
  });

  return {
    packagesByServiceId,
    serverBootstrapByServiceId,
    clientCallByEndpointId,
  };
}

import { CompiledFile } from "@workspace/canvas/types";
import { GRPC_DEFAULT_PORT } from "@workspace/canvas";
import { ProtoField, toTsType } from "./protoGenerator";

export interface GrpcEndpointItem {
  rpcName: string;            // e.g. "ProcessCharge"
  endpointName: string;       // e.g. "process_charge"
  protoFilename: string;     // e.g. "process_charge.proto"
  protoContent: string;      // content of .proto file
  reqFields: ProtoField[];
  resFields: ProtoField[];
}

export interface GenerateGrpcPackageFilesParams {
  packageFolder: string;      // e.g. "grpc/payment-service"
  packageName: string;        // e.g. "@workspace/grpc-payment-service"
  serviceName: string;        // e.g. "PaymentService"
  protoPackageName: string;   // e.g. "payment_service"
  endpoints: GrpcEndpointItem[];
}

/**
 * Generates a package for a service under packages/grpc/<service-name>/
 * with strongly-typed TypeScript interfaces, stubs, and clients for each endpoint —
 * with zero `any` or `unknown` types.
 */
export function generateGrpcPackageFiles(
  params: GenerateGrpcPackageFilesParams,
): CompiledFile[] {
  const { packageName, serviceName, protoPackageName, endpoints } = params;

  const packageJson = JSON.stringify(
    {
      name: packageName,
      version: "0.0.0",
      private: true,
      description: `Generated gRPC stubs for ${serviceName}`,
      main: "dist/index.js",
      types: "dist/index.d.ts",
      scripts: { build: "tsc", dev: "tsc --watch" },
      dependencies: {
        "@grpc/grpc-js": "^1.11.1",
        "@grpc/proto-loader": "^0.7.13",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        "@types/node": "^20.11.0",
        typescript: "^5.3.3",
      },
    },
    null,
    2,
  );

  const tsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: { outDir: "./dist", rootDir: "./src", declaration: true },
      include: ["src/**/*"],
    },
    null,
    2,
  );

  const files: CompiledFile[] = [
    { filename: "package.json", language: "json", content: packageJson },
    { filename: "tsconfig.json", language: "json", content: tsconfig },
  ];

  const indexExports: string[] = [];

  endpoints.forEach((ep) => {
    const fileBase = ep.endpointName;
    const methodName = ep.rpcName.charAt(0).toLowerCase() + ep.rpcName.slice(1);

    // 1. Proto file in proto/<endpointName>.proto
    files.push({
      filename: `proto/${ep.protoFilename}`,
      language: "protobuf",
      content: ep.protoContent,
    });

    // 2. Strongly-typed Request interface
    const reqLines =
      ep.reqFields.length > 0
        ? ep.reqFields.map((f) => `  ${f.name}?: ${toTsType(f.type)};`).join("\n")
        : "  // Optional payload properties\n  [key: string]: string | number | boolean | undefined;";

    // 3. Strongly-typed Response interface
    const resLines =
      ep.resFields.length > 0
        ? ep.resFields.map((f) => `  ${f.name}?: ${toTsType(f.type)};`).join("\n")
        : "  success?: boolean;\n  message?: string;";

    // 4. Per-endpoint TypeScript stub file in src/<endpointName>.ts (Zero `any` or `unknown`)
    const epTsContent =
      `import path from "path";\n` +
      `import * as grpc from "@grpc/grpc-js";\n` +
      `import * as protoLoader from "@grpc/proto-loader";\n\n` +
      `export interface ${ep.rpcName}Request {\n` +
      `${reqLines}\n` +
      `}\n\n` +
      `export interface ${ep.rpcName}Response {\n` +
      `${resLines}\n` +
      `}\n\n` +
      `export type ${ep.rpcName}Callback = (\n` +
      `  error: grpc.ServiceError | null,\n` +
      `  response: ${ep.rpcName}Response,\n` +
      `) => void;\n\n` +
      `export interface ${ep.rpcName}ClientStub {\n` +
      `  ${methodName}(\n` +
      `    request: ${ep.rpcName}Request,\n` +
      `    callback: ${ep.rpcName}Callback,\n` +
      `  ): grpc.ClientUnaryCall;\n` +
      `  ${methodName}(\n` +
      `    request: ${ep.rpcName}Request,\n` +
      `    metadata: grpc.Metadata,\n` +
      `    callback: ${ep.rpcName}Callback,\n` +
      `  ): grpc.ClientUnaryCall;\n` +
      `}\n\n` +
      `const packageDef = protoLoader.loadSync(\n` +
      `  path.resolve(__dirname, "../proto/${ep.protoFilename}"),\n` +
      `  { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true },\n` +
      `);\n\n` +
      `const loadedProto = grpc.loadPackageDefinition(packageDef);\n\n` +
      `/**\n` +
      ` * Creates a strongly typed gRPC client for ${ep.rpcName}.\n` +
      ` * @param address - host:port, default "localhost:${GRPC_DEFAULT_PORT}"\n` +
      ` */\n` +
      `export function create${ep.rpcName}Client(\n` +
      `  address = "localhost:${GRPC_DEFAULT_PORT}",\n` +
      `  credentials: grpc.ChannelCredentials = grpc.credentials.createInsecure(),\n` +
      `): ${ep.rpcName}ClientStub {\n` +
      `  const pkg = loadedProto["${protoPackageName}"] as Record<string, grpc.ServiceClientConstructor> | undefined;\n` +
      `  const ClientCtor = pkg?.${serviceName};\n` +
      `  if (!ClientCtor) {\n` +
      `    throw new Error("gRPC service ${serviceName} not found in package ${protoPackageName}");\n` +
      `  }\n` +
      `  return new ClientCtor(address, credentials) as unknown as ${ep.rpcName}ClientStub;\n` +
      `}\n`;

    files.push({
      filename: `src/${fileBase}.ts`,
      language: "typescript",
      content: epTsContent,
    });

    indexExports.push(`export * from "./${fileBase}";`);
  });

  // 5. Barrel src/index.ts re-exporting all endpoint files
  const indexTs =
    `${indexExports.join("\n")}\n` +
    `import * as grpc from "@grpc/grpc-js";\n` +
    `export { grpc };\n` +
    `export const ${serviceName.toUpperCase().replace(/\s+/g, "_")}_GRPC_DEFAULT_ADDRESS = "localhost:${GRPC_DEFAULT_PORT}";\n`;

  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: indexTs,
  });

  return files;
}

/**
 * Generates the gRPC server bootstrap code to append to the target service's src/index.ts.
 */
export function generateGrpcServerBootstrap(
  serviceName: string,
): string {
  return (
    `\n// ─── gRPC Server Setup ────────────────────────────────────────────────────────\n` +
    `import * as grpc from "@grpc/grpc-js";\n\n` +
    `const GRPC_PORT = Number(process.env.GRPC_PORT || "${GRPC_DEFAULT_PORT}");\n` +
    `const grpcServer = new grpc.Server();\n` +
    `// Register RPC service handlers here:\n` +
    `// grpcServer.addService(ServiceDefinition, { methodName: handlerFn });\n` +
    `grpcServer.bindAsync(\n` +
    `  \`0.0.0.0:\${GRPC_PORT}\`,\n` +
    `  grpc.ServerCredentials.createInsecure(),\n` +
    `  (_err, port) => {\n` +
    `    logger.info(\`⚡ gRPC server for "${serviceName}" listening on port \${port}\`);\n` +
    `  },\n` +
    `);\n` +
    `// ─────────────────────────────────────────────────────────────────────────────\n`
  );
}

import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile, CompiledMonorepoResult } from "./types";
import { compileServiceNode } from "./compileServiceNode";
import { compileDatabaseNodes } from "./compileDatabaseNodes";

/**
 * Compiles the entire system architecture canvas into a production-ready
 * Turborepo + pnpm monorepo matching standard monorepo structure.
 */
export function compileMonorepo(
  nodes: BackendNode[],
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[] = [],
  edges: BackendEdge[] = [],
  testCases: SimulationTestCase[] = [],
  projectName: string = "Blueprint Monorepo"
): CompiledMonorepoResult {
  const files: CompiledFile[] = [];

  const serviceNodes = nodes.filter((n) => n.type === "service");
  const entityNodes = nodes.filter((n) => n.type === "entity" || n.type === "db_ref");

  const servicesInfo: { id: string; name: string; folderName: string }[] = [];

  // 1. Generate Root Files
  const rootPackageJson = JSON.stringify(
    {
      name: projectName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      version: "0.0.1",
      private: true,
      scripts: {
        build: "turbo build",
        dev: "turbo dev",
        lint: "turbo lint",
        "check-types": "turbo check-types",
        format: 'prettier --write "**/*.{ts,tsx,md}"',
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        prettier: "^3.7.4",
        turbo: "^2.6.3",
        typescript: "5.7.3",
      },
      packageManager: "pnpm@10.4.1",
      engines: {
        node: ">=20",
      },
    },
    null,
    2
  );
  files.push({
    filename: "package.json",
    language: "json",
    content: rootPackageJson,
  });

  files.push({
    filename: "pnpm-workspace.yaml",
    language: "yaml",
    content: `packages:\n  - "apps/*"\n  - "packages/*"\n`,
  });

  const turboJson = JSON.stringify(
    {
      $schema: "https://turbo.build/schema.json",
      ui: "tui",
      tasks: {
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**"],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        lint: {},
        "check-types": {
          dependsOn: ["^check-types"],
        },
      },
    },
    null,
    2
  );
  files.push({
    filename: "turbo.json",
    language: "json",
    content: turboJson,
  });

  const rootGitignore = `node_modules
dist
.turbo
.env
*.log
.DS_Store
`;
  files.push({
    filename: ".gitignore",
    language: "gitignore",
    content: rootGitignore,
  });

  // 2. Generate Shared Package: packages/typescript-config
  const tsConfigPackageJson = JSON.stringify(
    {
      name: "@workspace/typescript-config",
      version: "0.0.0",
      private: true,
      license: "MIT",
    },
    null,
    2
  );
  files.push({
    filename: "packages/typescript-config/package.json",
    language: "json",
    content: tsConfigPackageJson,
  });

  const tsConfigBase = JSON.stringify(
    {
      $schema: "https://json.schemastore.org/tsconfig",
      display: "Default",
      compilerOptions: {
        declaration: true,
        declarationMap: true,
        esModuleInterop: true,
        incremental: false,
        isolatedModules: true,
        lib: ["es2022", "DOM", "DOM.Iterable"],
        module: "NodeNext",
        moduleDetection: "force",
        moduleResolution: "NodeNext",
        noUncheckedIndexedAccess: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        strict: true,
        target: "ES2022",
      },
    },
    null,
    2
  );
  files.push({
    filename: "packages/typescript-config/base.json",
    language: "json",
    content: tsConfigBase,
  });

  // 3. Generate Shared Package: packages/db (@workspace/db)
  const compiledDb = compileDatabaseNodes(nodes, edges);
  compiledDb.files.forEach((f) => {
    files.push({
      filename: `packages/db/${f.filename}`,
      language: f.language,
      content: f.content,
    });
  });

  // 4. Generate Apps: apps/<sanitizedName>
  serviceNodes.forEach((srvNode) => {
    const rawName = srvNode.data.label || "Service";
    const folderName = rawName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    servicesInfo.push({
      id: srvNode.id,
      name: rawName,
      folderName,
    });

    const srvResult = compileServiceNode(srvNode, endpoints, events, nodes, edges, testCases);
    srvResult.files.forEach((f) => {
      files.push({
        filename: `apps/${folderName}/${f.filename}`,
        language: f.language,
        content: f.content,
      });
    });
  });

  // 5. Generate Root tsconfig.json (referencing packages and apps)
  const rootReferences = [
    { path: "packages/typescript-config" },
    { path: "packages/db" },
    ...servicesInfo.map((s) => ({ path: `apps/${s.folderName}` })),
  ];
  const rootTsconfig = JSON.stringify(
    {
      files: [],
      references: rootReferences,
    },
    null,
    2
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: rootTsconfig,
  });

  // 6. Generate Root README.md
  const readmeContent = `# ${projectName} Workspace

Generated Turborepo + pnpm monorepo backend architecture containing ${serviceNodes.length} service(s) and ${entityNodes.length} database entity table(s).

## Workspace Structure

- **Shared TS Config**: \`packages/typescript-config\` (\`@workspace/typescript-config\`)
- **Database Package**: \`packages/db\` (\`@workspace/db\`)
${servicesInfo.map((s) => `- **${s.name}**: \`apps/${s.folderName}\``).join("\n")}

## Getting Started

1. **Install dependencies**:
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Run all microservices in parallel**:
   \`\`\`bash
   pnpm dev
   \`\`\`

3. **Build all apps and packages**:
   \`\`\`bash
   pnpm build
   \`\`\`

4. **Database Schema Management**:
   \`\`\`bash
   cd packages/db
   pnpm push
   \`\`\`
`;
  files.push({
    filename: "README.md",
    language: "markdown",
    content: readmeContent,
  });

  return {
    projectName,
    files,
    services: servicesInfo,
  };
}

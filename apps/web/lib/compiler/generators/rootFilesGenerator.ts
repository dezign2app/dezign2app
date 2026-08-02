import { CompiledFile } from "../types";

/**
 * Generates root workspace files: package.json, pnpm-workspace.yaml, turbo.json, .gitignore
 */
export function generateRootFiles(projectName: string): CompiledFile[] {
  const files: CompiledFile[] = [];

  const rootPackageJson = JSON.stringify(
    {
      name: projectName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      version: "0.0.1",
      private: true,
      scripts: {
        build: "turbo build",
        dev: "turbo dev",
        test: "turbo test",
        lint: "turbo lint",
        "check-types": "turbo check-types",
        format: 'prettier --write "**/*.{ts,tsx,md}"',
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        prettier: "^3.7.4",
        turbo: "^2.6.3",
        typescript: "5.7.3",
        vitest: "^1.6.0",
      },
      packageManager: "pnpm@10.4.1",
      engines: {
        node: ">=20",
      },
    },
    null,
    2,
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
          outputs: [".next/**", "dist/**"],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        test: {},
        lint: {},
        "check-types": {
          dependsOn: ["^check-types"],
        },
      },
    },
    null,
    2,
  );
  files.push({
    filename: "turbo.json",
    language: "json",
    content: turboJson,
  });

  const rootGitignore = `node_modules
dist
.turbo
.next
.env
*.log
.DS_Store
`;
  files.push({
    filename: ".gitignore",
    language: "gitignore",
    content: rootGitignore,
  });

  return files;
}

/**
 * Generates shared packages/typescript-config package (@workspace/typescript-config)
 */
export function generateTypescriptConfigPackage(): CompiledFile[] {
  const files: CompiledFile[] = [];

  const tsConfigPackageJson = JSON.stringify(
    {
      name: "@workspace/typescript-config",
      version: "0.0.0",
      private: true,
      license: "MIT",
    },
    null,
    2,
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
    2,
  );
  files.push({
    filename: "packages/typescript-config/base.json",
    language: "json",
    content: tsConfigBase,
  });

  return files;
}

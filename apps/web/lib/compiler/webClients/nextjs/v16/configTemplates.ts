import { CompiledFile } from "../../../types";

export function generateProjectConfigFiles(): CompiledFile[] {
  const packageJson = JSON.stringify(
    {
      name: "@workspace/web-client",
      version: "0.0.1",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
        test: "vitest run",
      },
      dependencies: {
        "@workspace/ui": "workspace:*",
        "@workspace/logger": "workspace:*",
        next: "^16.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "lucide-react": "^0.475.0",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4.0.0",
        "@types/node": "^20.19.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@workspace/typescript-config": "workspace:*",
        tailwindcss: "^4.0.0",
        typescript: "^5.9.0",
        vitest: "^1.6.0",
      },
    },
    null,
    2,
  );

  const tsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [
          {
            name: "next",
          },
        ],
        paths: {
          "@/*": ["./*"],
        },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  );

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@workspace/ui", "@workspace/logger"],
};

export default nextConfig;
`;

  return [
    {
      filename: "package.json",
      language: "json",
      content: packageJson,
    },
    {
      filename: ".env",
      language: "dotenv",
      content: `NEXT_PUBLIC_LOG_LEVEL=info\n`,
    },
    {
      filename: "postcss.config.mjs",
      language: "javascript",
      content: `export { default } from "@workspace/ui/postcss.config";\n`,
    },
    {
      filename: "tsconfig.json",
      language: "json",
      content: tsconfig,
    },
    {
      filename: "next.config.mjs",
      language: "javascript",
      content: nextConfig,
    },
    {
      filename: "app/globals.css",
      language: "css",
      content: `@import "@workspace/ui/globals.css";\n`,
    },
  ];
}

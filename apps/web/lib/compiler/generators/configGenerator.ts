import { CompiledFile } from "../types";
import { BackendNode } from "@/types/canvas";

export function generateLibFiles(): CompiledFile[] {
  const libIndexCode = `export { db, sqlite, schema } from "@workspace/db";

export function formatResponse<T>(data: T, message = "Success") {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}
`;

  return [
    {
      filename: "src/lib/index.ts",
      language: "typescript",
      content: libIndexCode,
    },
  ];
}

export function generateServerFile(
  serviceName: string,
  port: string,
  cors: boolean,
  corsOrigins: string
): CompiledFile {
  const serverCode = `import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { createLogger } from "@workspace/logger";
import { router as apiRouter } from "./routes";
import { initConsumers } from "./consumer";

const logger = createLogger("${serviceName}");
const app = express();
const PORT = process.env.PORT || ${port};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
${cors ? `app.use(cors({ origin: "${corsOrigins}" }));\n` : "app.use(cors());\n"}
// --- Request Logger ---
app.use((req: Request, _res: Response, next) => {
  logger.info(\`\${req.method} \${req.url}\`);
  next();
});

// --- Health Check ---
app.get("/health", (_req: Request, res: Response) => {
  logger.debug("Health check invoked");
  res.status(200).json({
    status: "UP",
    service: "${serviceName}",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// --- Mount Routes ---
app.use("/api", apiRouter);

// --- Initialize Event Consumers ---
initConsumers();

// --- Server Startup ---
app.listen(PORT, () => {
  logger.info(\`🚀 Service "${serviceName}" operational at http://localhost:\${PORT}\`);
  logger.info(\`📋 Health check available at http://localhost:\${PORT}/health\`);
});
`;

  return {
    filename: "src/index.ts",
    language: "typescript",
    content: serverCode,
  };
}

export function generateConfigFiles(
  node: BackendNode,
  sanitizedName: string,
  serviceName: string,
  port: string,
  cors: boolean
): CompiledFile[] {
  const packageJson = JSON.stringify(
    {
      name: `@workspace/${sanitizedName}`,
      version: "0.0.0",
      private: true,
      description: node.data.description || `Generated microservice for ${serviceName}`,
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "ts-node-dev --respawn --watch .env src/index.ts",
      },
      dependencies: {
        "@workspace/db": "workspace:*",
        "@workspace/logger": "workspace:*",
        express: "^4.19.2",
        cors: "^2.8.5",
        dotenv: "^16.4.5",
        "drizzle-orm": "^0.30.0",
        "better-sqlite3": "^11.3.0",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        "@types/express": "^4.17.21",
        "@types/cors": "^2.8.17",
        "@types/better-sqlite3": "^7.6.11",
        "@types/node": "^20.11.0",
        "ts-node-dev": "^2.0.0",
        typescript: "^5.3.3",
      },
    },
    null,
    2
  );

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
    2
  );

  const envFile = `PORT=${port}
NODE_ENV=development
LOG_LEVEL=info
DATABASE_PATH=../../packages/db/sqlite.db
`;

  const gitignoreFile = `node_modules
dist
.env
*.log
`;

  return [
    {
      filename: "package.json",
      language: "json",
      content: packageJson,
    },
    {
      filename: "tsconfig.json",
      language: "json",
      content: tsconfig,
    },
    {
      filename: ".env",
      language: "dotenv",
      content: envFile,
    },
    {
      filename: ".gitignore",
      language: "gitignore",
      content: gitignoreFile,
    },
  ];
}

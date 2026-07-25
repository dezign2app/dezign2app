import { CompiledFile } from "../types";
import { BackendNode } from "@/types/canvas";

export function generateLibFiles(): CompiledFile[] {
  const dbConfigCode = `import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../../../db/sqlite.db");
export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);
`;

  const libIndexCode = `export * from "./db.config";

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
      filename: "src/lib/db.config.ts",
      language: "typescript",
      content: dbConfigCode,
    },
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
  const serverCode = `import express, { Request, Response } from "express";
${cors ? 'import cors from "cors";\n' : ""}import dotenv from "dotenv";
import { router as apiRouter } from "./routes";
import { initConsumers } from "./consumer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || ${port};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
${cors ? `app.use(cors({ origin: "${corsOrigins}" }));\n` : "app.use(cors());\n"}
// --- Request Logger ---
app.use((req: Request, _res: Response, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  next();
});

// --- Health Check ---
app.get("/health", (_req: Request, res: Response) => {
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
  console.log(\`🚀 Service "${serviceName}" operational at http://localhost:\${PORT}\`);
  console.log(\`📋 Health check available at http://localhost:\${PORT}/health\`);
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
      name: `${sanitizedName}-service`,
      version: "1.0.0",
      description: node.data.description || `Generated microservice for ${serviceName}`,
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "ts-node-dev --respawn src/index.ts",
      },
      dependencies: {
        express: "^4.19.2",
        dotenv: "^16.4.5",
        "drizzle-orm": "^0.30.0",
        "better-sqlite3": "^11.3.0",
        ...(cors ? { cors: "^2.8.5" } : {}),
      },
      devDependencies: {
        "@types/express": "^4.17.21",
        "@types/better-sqlite3": "^7.6.11",
        ...(cors ? { "@types/cors": "^2.8.17" } : {}),
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
      compilerOptions: {
        target: "ES2022",
        module: "CommonJS",
        moduleResolution: "node",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ["src/**/*"],
    },
    null,
    2
  );

  const envFile = `PORT=${port}
NODE_ENV=development
DATABASE_PATH=../../db/sqlite.db
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

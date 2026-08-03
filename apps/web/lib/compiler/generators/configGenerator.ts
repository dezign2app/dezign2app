import { CompiledFile } from "../types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import {
  resolveEndpointTrace,
  resolveConsumerTrace,
  resolveProducerTrace,
} from "../traceResolver";

export function generateLibFiles(): CompiledFile[] {
  const libIndexCode = `/**
 * Shared lib helpers for this service.
 * DB access goes through @workspace/db/helpers — injection-safe prepared statements.
 */
export * from "@workspace/db/helpers";

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
  corsOrigins: string,
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
app.use("/", apiRouter);

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
  cors: boolean,
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
): CompiledFile[] {
  const packageJson = JSON.stringify(
    {
      name: `@workspace/${sanitizedName}`,
      version: "0.0.0",
      private: true,
      description:
        node.data?.description || `Generated microservice for ${serviceName}`,
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        dev: "ts-node-dev --respawn --watch .env src/index.ts",
        test: "vitest run",
      },
      dependencies: {
        "@workspace/db": "workspace:*",
        "@workspace/logger": "workspace:*",
        "@workspace/types": "workspace:*",
        express: "^4.19.2",
        cors: "^2.8.5",
        dotenv: "^16.4.5",
        zod: "^3.24.2",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        "@types/express": "^4.17.21",
        "@types/cors": "^2.8.17",
        "@types/node": "^20.11.0",
        "ts-node-dev": "^2.0.0",
        typescript: "^5.3.3",
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
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
    },
    null,
    2,
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

  // Build service-level README.md
  let readmeLines = [
    `# ${serviceName} Microservice`,
    ``,
    `Port: \`${port}\``,
    `Description: ${node.data?.description || "Modular microservice compiled from Blueprint architecture canvas."}`,
    ``,
    `## Connected Routes & Endpoint Data Flow`,
    ``,
  ];

  const srvEndpoints = endpoints.filter((e) => e.nodeId === node.id);
  if (srvEndpoints.length === 0) {
    readmeLines.push(`- Default route: \`GET /example\``);
  } else {
    srvEndpoints.forEach((ep) => {
      const trace = resolveEndpointTrace(
        node,
        ep,
        allNodes,
        allEdges,
        endpoints,
      );
      readmeLines.push(
        `### \`${(ep.type || "GET").toUpperCase()} ${ep.name || "/"}\``,
      );
      readmeLines.push(`- **Summary**: ${ep.summary || "Endpoint handler"}`);

      readmeLines.push(`- **Incoming Callers**:`);
      if (trace.incoming.length > 0) {
        trace.incoming.forEach((inc) => {
          readmeLines.push(
            `  - ${inc.nodeName} (${inc.nodeType}): ${inc.detail}${inc.dataContext ? ` — ${inc.dataContext}` : ""}`,
          );
        });
      } else {
        readmeLines.push(`  - Direct HTTP Clients`);
      }

      readmeLines.push(`- **Outgoing Destinations**:`);
      if (trace.outgoing.length > 0) {
        trace.outgoing.forEach((out) => {
          readmeLines.push(
            `  - ${out.nodeName} (${out.nodeType}): ${out.detail}${out.dataContext ? ` — ${out.dataContext}` : ""}`,
          );
        });
      } else {
        readmeLines.push(`  - HTTP Response`);
      }
      readmeLines.push(``);
    });
  }

  const consumedEvents = events.filter(
    (e) => e.nodeId === node.id && e.variant === "consume",
  );
  if (consumedEvents.length > 0) {
    readmeLines.push(`## Consumed Events`);
    consumedEvents.forEach((ev) => {
      const trace = resolveConsumerTrace(node, ev, allNodes, allEdges);
      readmeLines.push(`### Event: \`${ev.name}\``);
      readmeLines.push(
        `- **Incoming Source**: ${trace.incoming.map((i) => `${i.nodeName} (${i.detail})`).join(", ")}`,
      );
      readmeLines.push(
        `- **Outgoing Target**: ${trace.outgoing.map((o) => `${o.nodeName} (${o.detail})`).join(", ") || "Domain Logic"}`,
      );
      readmeLines.push(``);
    });
  }

  const publishedEvents = events.filter(
    (e) => e.nodeId === node.id && e.variant === "publish",
  );
  if (publishedEvents.length > 0) {
    readmeLines.push(`## Published Events`);
    publishedEvents.forEach((ev) => {
      const trace = resolveProducerTrace(node, ev, allNodes, allEdges);
      readmeLines.push(`### Event: \`${ev.name}\``);
      readmeLines.push(
        `- **Destination Broker/Consumers**: ${trace.outgoing.map((o) => `${o.nodeName} (${o.detail})`).join(", ")}`,
      );
      readmeLines.push(``);
    });
  }

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
    {
      filename: "README.md",
      language: "markdown",
      content: readmeLines.join("\n"),
    },
  ];
}

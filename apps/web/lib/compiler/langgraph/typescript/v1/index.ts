/**
 * LangGraph TypeScript Compiler (v1) — Target @langchain/langgraph v1.x (^1.1.2)
 * Location: /lib/compiler/langgraph/typescript/v1/index.ts
 *
 * Accepts LangGraph canvas state and emits a CompiledFile[] (multi-file npm project).
 *
 * Docs reference:
 *  - https://docs.langchain.com/oss/javascript/langgraph/quickstart
 *  - https://docs.langchain.com/oss/javascript/langgraph/persistence
 *  - https://docs.langchain.com/oss/javascript/langgraph/checkpointers
 */

import type { CompiledFile } from "../../../types";
import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
} from "@/types/canvas";
import type {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  LangGraphLLMNodeData,
  ToolNodeData,
  CanvasNodeData,
  StepNodeData,
  MemoryNodeData,
  MiddlewareNodeData,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/types";
import {
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_STEP,
  HANDLE_LLM_IN,
  HANDLE_TOOL_IN,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MEMORY_IN,
  NODE_ID_START,
  NODE_ID_END,
  MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_END,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/constants";

// ─── Public API ───────────────────────────────────────────────────────────────

/** Describes one HTTP/event entry point that invokes this LangGraph agent. */
export interface RouteEndpoint {
  kind: "endpoint" | "event" | "task";
  /** HTTP path, e.g. "/chat" or "/analyze-ticket" */
  path: string;
  /** HTTP method to expose this route on */
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Name of the event (for kind=="event") */
  eventName?: string;
  /** Source service/node label for documentation purposes */
  sourceNodeLabel?: string;
  /**
   * Optional per-route payload mapping:
   * key = LangGraph state channel key, value = dot-path into the HTTP body/headers
   * e.g. { "messages": "body.message", "userId": "headers.x-user-id" }
   */
  payloadMapping?: Record<string, string>;
  preInvokeLogicMode?: "natural_language" | "code";
  preInvokePrompt?: string;
  preInvokeCode?: string;
  responseExecutionMode?: "sync" | "stream" | "async_ack";
  responseOutputMode?: "full" | "selected";
  responseFields?: string[];
  postInvokeLogicMode?: "natural_language" | "code";
  postInvokePrompt?: string;
  postInvokeCode?: string;
}

export interface CompileLangGraphInput {
  graphLabel: string;
  stateChannels: LangGraphStateChannel[];
  inputChannels: LangGraphInputChannel[];
  nodes: LangGraphCanvasNode[];
  edges: LangGraphCanvasEdge[];
  memoryConfig?: LangGraphMemoryConfig;
  /** Connected HTTP/event entry points that invoke this agent (from main canvas edges). */
  routeEndpoints?: RouteEndpoint[];
}

/**
 * Compile the visual canvas state into a multi-file npm project (CompiledFile[]).
 * Compatible with the CompilerModal UI file-tree explorer.
 */
export function compileLangGraph(input: CompileLangGraphInput): CompiledFile[] {
  const ctx = buildContext(input);
  const files: CompiledFile[] = [];
  const pkgId = toIdentifier(input.graphLabel || "langgraph-agent").toLowerCase().replace(/_/g, "-");
  const deps = buildDependencies(ctx);

  const llmMetaMap = buildLLMMetaMap(ctx);
  const nodeMetaMap = buildNodeMetaMap(ctx);

  // package.json
  files.push({
    filename: "package.json",
    language: "json",
    content: buildPackageJson(pkgId, deps),
  });

  // tsconfig.json
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: buildTsConfig(),
  });

  // .env.example
  const envContent = buildEnvExample(ctx);
  if (envContent) {
    files.push({ filename: ".env.example", language: "dotenv", content: envContent });
  }

  // README.md
  files.push({
    filename: "README.md",
    language: "markdown",
    content: buildReadme(ctx, pkgId, deps),
  });

  // src/state.ts
  files.push({
    filename: "src/state.ts",
    language: "typescript",
    content: buildStateFile(ctx),
  });

  // src/tools.ts (if tools exist)
  if (ctx.toolNodes.length > 0) {
    files.push({
      filename: "src/tools.ts",
      language: "typescript",
      content: buildToolsFile(ctx),
    });
  }

  // src/llm/ folder (if LLM nodes exist)
  if (ctx.llmNodes.length > 0) {
    for (const llmNode of ctx.llmNodes) {
      const meta = llmMetaMap.get(llmNode.id);
      if (meta) {
        files.push({
          filename: `src/llm/${meta.fileName}.ts`,
          language: "typescript",
          content: buildIndividualLLMFile(llmNode, ctx, llmMetaMap),
        });
      }
    }
    files.push({
      filename: "src/llm/index.ts",
      language: "typescript",
      content: buildLLMIndexFile(ctx, llmMetaMap),
    });
  }

  // src/nodes/ folder (if agent or step nodes exist)
  if (ctx.agentNodes.length > 0 || ctx.stepNodes.length > 0) {
    for (const agentNode of ctx.agentNodes) {
      const meta = nodeMetaMap.get(agentNode.id);
      if (meta) {
        files.push({
          filename: `src/nodes/${meta.fileName}.ts`,
          language: "typescript",
          content: buildAgentNodeFile(agentNode, ctx, nodeMetaMap, llmMetaMap),
        });
      }
    }
    for (const stepNode of ctx.stepNodes) {
      const meta = nodeMetaMap.get(stepNode.id);
      if (meta) {
        files.push({
          filename: `src/nodes/${meta.fileName}.ts`,
          language: "typescript",
          content: buildStepNodeFile(stepNode, ctx, nodeMetaMap, llmMetaMap),
        });
      }
    }
    files.push({
      filename: "src/nodes/index.ts",
      language: "typescript",
      content: buildNodesIndexFile(ctx, nodeMetaMap),
    });
  }

  // src/graph.ts
  files.push({
    filename: "src/graph.ts",
    language: "typescript",
    content: buildGraphFile(ctx, nodeMetaMap),
  });

  // src/index.ts
  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: buildIndexFile(ctx),
  });

  // src/server.ts — only generated when routes are connected on the main canvas
  if (input.routeEndpoints && input.routeEndpoints.length > 0) {
    files.push({
      filename: "src/server.ts",
      language: "typescript",
      content: buildServerFile(ctx, input.routeEndpoints),
    });
  }

  return files;
}

// ─── Internal Context & Metadata ─────────────────────────────────────────────

interface LLMMeta {
  fileName: string;
  varName: string;
}

interface NodeMeta {
  fileName: string;
  exportName: string;
}

function buildLLMMetaMap(ctx: CompileContext): Map<string, LLMMeta> {
  const map = new Map<string, LLMMeta>();
  const used = new Set<string>();

  for (const llmNode of ctx.llmNodes) {
    const d = llmNode.data;
    const raw = d.label || d.model || d.provider || `llm_${llmNode.id}`;
    let base = toIdentifier(raw);
    if (!base) base = `llm_${llmNode.id}`;

    let name = base;
    let counter = 2;
    while (used.has(name)) {
      name = `${base}${counter}`;
      counter++;
    }
    used.add(name);
    map.set(llmNode.id, { fileName: name, varName: name });
  }

  return map;
}

function buildNodeMetaMap(ctx: CompileContext): Map<string, NodeMeta> {
  const map = new Map<string, NodeMeta>();
  const used = new Set<string>();

  for (const agentNode of ctx.agentNodes) {
    const d = agentNode.data;
    const raw = d.name || d.label || `node_${agentNode.id}`;
    let base = toIdentifier(raw);
    if (!base) base = `node_${agentNode.id}`;

    let fileName = base;
    let counter = 2;
    while (used.has(fileName)) {
      fileName = `${base}${counter}`;
      counter++;
    }
    used.add(fileName);
    map.set(agentNode.id, { fileName, exportName: fileName });
  }

  for (const stepNode of ctx.stepNodes) {
    const d = stepNode.data;
    let raw = d.label || `step_${stepNode.id}`;
    if (d.stepType === "router") {
      raw = d.label || `router_${stepNode.id}`;
    }
    let base = toIdentifier(raw);
    if (!base) base = `step_${stepNode.id}`;

    let fileName = base;
    let counter = 2;
    while (used.has(fileName)) {
      fileName = `${base}${counter}`;
      counter++;
    }
    used.add(fileName);

    const exportName = d.stepType === "router"
      ? (base.endsWith("Router") ? base : `${base}Router`)
      : base;

    map.set(stepNode.id, { fileName, exportName });
  }

  return map;
}

interface CompileContext {
  input: CompileLangGraphInput;
  llmNodes: Array<{ id: string; data: LangGraphLLMNodeData }>;
  toolNodes: Array<{ id: string; data: ToolNodeData }>;
  agentNodes: Array<{ id: string; data: CanvasNodeData }>;
  stepNodes: Array<{ id: string; data: StepNodeData }>;
  memoryNodes: Array<{ id: string; data: MemoryNodeData }>;
  middlewareNodes: Array<{ id: string; data: MiddlewareNodeData }>;
  hasMemory: boolean;
  hasTools: boolean;
  hasHumanInLoop: boolean;
  usesMessages: boolean;
  agentLLMMap: Map<string, string>;
  agentToolsMap: Map<string, string[]>;
  agentMiddlewareMap: Map<string, string[]>;
  agentMemoryMap: Map<string, string[]>;
  routerStepIds: Set<string>;
  graphId: string;
}

function buildContext(input: CompileLangGraphInput): CompileContext {
  const { nodes, edges } = input;

  const llmNodes = nodes.filter((n) => n.type === LANGGRAPH_CANVAS_NODE_LLM) as Array<{ id: string; data: LangGraphLLMNodeData }>;
  const toolNodes = nodes.filter((n) => n.type === LANGGRAPH_CANVAS_NODE_TOOL) as Array<{ id: string; data: ToolNodeData }>;
  const agentNodes = nodes.filter((n) => n.type === LANGGRAPH_CANVAS_NODE_NODE || n.type === LANGGRAPH_CANVAS_NODE_AGENT) as Array<{ id: string; data: CanvasNodeData }>;
  const stepNodes = nodes.filter((n) => n.type === LANGGRAPH_CANVAS_NODE_STEP) as Array<{ id: string; data: StepNodeData }>;
  const memoryNodes = nodes.filter((n) => n.type === LANGGRAPH_CANVAS_NODE_MEMORY) as Array<{ id: string; data: MemoryNodeData }>;
  const middlewareNodes = nodes.filter((n) => n.type === LANGGRAPH_CANVAS_NODE_MIDDLEWARE) as Array<{ id: string; data: MiddlewareNodeData }>;

  const agentLLMMap = new Map<string, string>();
  const agentToolsMap = new Map<string, string[]>();
  const agentMiddlewareMap = new Map<string, string[]>();
  const agentMemoryMap = new Map<string, string[]>();

  for (const edge of edges) {
    if (edge.targetHandle === HANDLE_LLM_IN) {
      agentLLMMap.set(edge.target, edge.source);
    } else if (edge.targetHandle === HANDLE_TOOL_IN) {
      const existing = agentToolsMap.get(edge.target) || [];
      agentToolsMap.set(edge.target, [...existing, edge.source]);
    } else if (edge.targetHandle === HANDLE_MIDDLEWARE_IN) {
      const existing = agentMiddlewareMap.get(edge.target) || [];
      agentMiddlewareMap.set(edge.target, [...existing, edge.source]);
    } else if (edge.targetHandle === HANDLE_MEMORY_IN) {
      const existing = agentMemoryMap.get(edge.target) || [];
      agentMemoryMap.set(edge.target, [...existing, edge.source]);
    }
  }

  const routerStepIds = new Set(
    stepNodes.filter((n) => n.data.stepType === "router").map((n) => n.id)
  );

  const hasHumanInLoop = middlewareNodes.some(
    (m) => m.data.type === MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP
  ) || stepNodes.some((s) => s.data.stepType === "human_gate" || s.data.stepType === "interrupt");

  const usesMessages = input.stateChannels.some((c) => c.key === "messages" || c.reducer === "add_messages");

  return {
    input,
    llmNodes,
    toolNodes,
    agentNodes,
    stepNodes,
    memoryNodes,
    middlewareNodes,
    hasMemory: memoryNodes.length > 0 || !!input.memoryConfig?.checkpointer,
    hasTools: toolNodes.length > 0,
    hasHumanInLoop,
    usesMessages,
    agentLLMMap,
    agentToolsMap,
    agentMiddlewareMap,
    agentMemoryMap,
    routerStepIds,
    graphId: input.graphLabel || "agent",
  };
}

function ctxMemoryNeedsStore(ctx: CompileContext): boolean {
  return ctx.memoryNodes.some((m) => m.data.checkpointer === "redis" || m.data.checkpointer === "postgres");
}

function buildDependencies(ctx: CompileContext): Record<string, string> {
  const deps: Record<string, string> = {
    "@langchain/langgraph": "^1.1.2",
    "@langchain/core": "^1.1.17",
    "zod": "^3.24.1",
    "dotenv": "^17.3.1",
  };

  for (const llmNode of ctx.llmNodes) {
    const pkg = getProviderPackage(llmNode.data.provider);
    if (pkg) deps[pkg] = "latest";
  }

  // Add express when routes are connected
  if (ctx.input.routeEndpoints && ctx.input.routeEndpoints.length > 0) {
    deps["express"] = "^4.21.2";
  }

  return deps;
}

// ─── File Generators ─────────────────────────────────────────────────────────

function buildPackageJson(pkgId: string, deps: Record<string, string>): string {
  return JSON.stringify(
    {
      name: pkgId,
      version: "1.0.0",
      description: "Compiled LangGraph v1.x agent workflow generated by Blueprint Studio",
      main: "dist/index.js",
      type: "module",
      scripts: {
        build: "tsc",
        start: "tsx src/index.ts",
        dev: "tsx watch src/index.ts",
      },
      dependencies: deps,
      devDependencies: {
        "@types/node": "^22.0.0",
        "tsx": "^4.19.0",
        "typescript": "^5.7.0",
      },
    },
    null,
    2
  );
}

function buildTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        lib: ["ES2022"],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
    },
    null,
    2
  );
}

function buildEnvExample(ctx: CompileContext): string {
  const envVars = ctx.llmNodes
    .map((l) => getEnvKey(l.data))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  if (envVars.length === 0) return "";
  return envVars.map((v) => `${v}=your_api_key_here`).join("\n");
}

function buildReadme(ctx: CompileContext, pkgId: string, deps: Record<string, string>): string {
  const envVars = ctx.llmNodes
    .map((l) => getEnvKey(l.data))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  return `# ${ctx.input.graphLabel || "LangGraph Agent Workflow"}

Compiled \`@langchain/langgraph\` (v1.1.2) agent generated by **Blueprint Studio**.

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

${envVars.length > 0 ? `2. **Set Environment Variables:**
   Create a \`.env\` file based on \`.env.example\`:
   \`\`\`env
${envVars.map((v) => `${v}=your_key_here`).join("\n")}
   \`\`\`
` : ""}
3. **Run the graph:**
   \`\`\`bash
   npm start
   \`\`\`

## Graph Overview
- **Nodes (${ctx.agentNodes.length + ctx.stepNodes.length}):** ${[...ctx.agentNodes.map(a => a.data.name || a.data.label), ...ctx.stepNodes.map(s => s.data.label)].filter(Boolean).join(", ") || "Default pipeline"}
- **Tools (${ctx.toolNodes.length}):** ${ctx.toolNodes.map(t => t.data.name).filter(Boolean).join(", ") || "None"}
- **LLM Providers:** ${[...new Set(ctx.llmNodes.map(l => l.data.provider))].join(", ") || "Default"}
`;
}

function buildStateFile(ctx: CompileContext): string {
  const schemaName = `${toPascalCase(ctx.graphId)}State`;
  const imports: string[] = ["StateSchema"];
  
  if (ctx.usesMessages) imports.push("MessagesValue");
  const needsReducedValue = ctx.input.stateChannels.some(
    (c) => c.reducer && (c.reducer as string) !== "replace" && (c.reducer as string) !== "add_messages"
  );
  if (needsReducedValue) imports.push("ReducedValue");

  const channelLines = ctx.input.stateChannels.map((ch) => {
    const field = toCamelCase(ch.key);
    if (ch.key === "messages" || ch.type === "messages" || (ch.reducer as string) === "add_messages") {
      return `  ${field}: MessagesValue,`;
    }
    const zodType = getZodType(ch.type, ch.defaultValue);
    if (ch.reducer && ch.reducer !== "replace") {
      const reducerFn = getReducerFn(ch.reducer, ch.type);
      return `  ${field}: new ReducedValue(\n    ${zodType},\n    { reducer: ${reducerFn} }\n  ),`;
    }
    return `  ${field}: ${zodType},`;
  });

  return `import { ${imports.sort().join(", ")} } from "@langchain/langgraph";
import { z } from "zod";

/**
 * Graph State Schema Definition
 */
export const ${schemaName} = new StateSchema({
${channelLines.join("\n")}
});

export type ${schemaName}Type = typeof ${schemaName}.State;
`;
}

function buildToolsFile(ctx: CompileContext): string {
  if (ctx.toolNodes.length === 0) return "// No tools defined";

  const parts: string[] = [
    `import { tool } from "@langchain/core/tools";`,
    `import { z } from "zod";`,
    ``,
  ];

  for (const toolNode of ctx.toolNodes) {
    const d = toolNode.data;
    const fnName = toIdentifier(d.name || `tool_${toolNode.id}`);
    let inputSchemaCode = "z.object({})";

    if (d.inputSchema) {
      try {
        const schema = JSON.parse(d.inputSchema);
        inputSchemaCode = jsonSchemaToZod(schema);
      } catch {
        inputSchemaCode = `z.object({})`;
      }
    }

    if (d.source === "api_endpoint") {
      parts.push(`export const ${fnName} = tool(
  async (input) => {
    const response = await fetch("${d.endpointUrl || "https://api.example.com"}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(\`API error: \${response.status}\`);
    return response.json();
  },
  {
    name: "${d.name}",
    description: "${escapeStr(d.description)}",
    schema: ${inputSchemaCode},
  }
);`);
      continue;
    }

    const promptText = (d.prompt || "").trim();
    const codeBlock = (d.functionBody || "").trim();

    let bodyLines: string[] = [];
    if (promptText) {
      bodyLines.push(`    // --- Natural Language Instructions ---`);
      promptText.split("\n").forEach((line: string, idx: number) => {
        if (line.trim()) bodyLines.push(`    // STEP ${idx + 1}: ${line.trim()}`);
      });
    }
    if (codeBlock) {
      bodyLines.push(indent(codeBlock, 4));
    } else if (!promptText) {
      bodyLines.push(`    return "Tool execution success";`);
    }

    const body = bodyLines.join("\n");

    parts.push(`export const ${fnName} = tool(
  async (input) => {
${body}
  },
  {
    name: "${d.name}",
    description: "${escapeStr(d.description)}",
    schema: ${inputSchemaCode},
  }
);`);
  }

  return parts.join("\n\n");
}

function buildIndividualLLMFile(
  llmNode: { id: string; data: LangGraphLLMNodeData },
  ctx: CompileContext,
  llmMetaMap: Map<string, LLMMeta>
): string {
  const d = llmNode.data;
  const meta = llmMetaMap.get(llmNode.id);
  const varName = meta ? meta.varName : toIdentifier(d.label || `llm_${llmNode.id}`);

  const pkg = getProviderPackage(d.provider);
  const cls = getProviderClass(d.provider);

  const imports: string[] = [];
  if (pkg && cls) {
    imports.push(`import { ${cls} } from "${pkg}";`);
  }

  const connectedAgentIds = [...ctx.agentLLMMap.entries()]
    .filter(([, llmId]) => llmId === llmNode.id)
    .map(([agentId]) => agentId);

  const connectedToolIds = new Set<string>();
  for (const agentId of connectedAgentIds) {
    const toolIds = ctx.agentToolsMap.get(agentId) || [];
    toolIds.forEach((tid) => connectedToolIds.add(tid));
  }

  const toolVarNames = [...connectedToolIds]
    .map((tid) => {
      const toolNode = ctx.toolNodes.find((t) => t.id === tid);
      return toolNode ? toIdentifier(toolNode.data.name || `tool_${tid}`) : null;
    })
    .filter(Boolean) as string[];

  if (toolVarNames.length > 0) {
    imports.push(`import { ${toolVarNames.join(", ")} } from "../tools";`);
  }

  const configLines: string[] = [];
  if (d.model) configLines.push(`  model: "${d.model}",`);
  if (d.temperature !== undefined) configLines.push(`  temperature: ${d.temperature},`);
  if (d.maxTokens !== undefined) configLines.push(`  maxTokens: ${d.maxTokens},`);

  if ((d.provider === "ollama" || d.provider === "custom") && (d.baseUrl || d.url)) {
    configLines.push(`  baseURL: "${d.baseUrl || d.url}",`);
  }

  const parts: string[] = [imports.join("\n"), ""];

  if (toolVarNames.length > 0) {
    parts.push(`const ${varName}Base = new ${cls}({\n${configLines.join("\n")}\n});`);
    parts.push(`export const ${varName} = ${varName}Base.bindTools([${toolVarNames.join(", ")}]);`);
  } else {
    parts.push(`export const ${varName} = new ${cls}({\n${configLines.join("\n")}\n});`);
  }

  return parts.join("\n\n");
}

function buildLLMIndexFile(ctx: CompileContext, llmMetaMap: Map<string, LLMMeta>): string {
  const exports = ctx.llmNodes.map((l) => {
    const meta = llmMetaMap.get(l.id);
    return `export * from "./${meta?.fileName}";`;
  });
  return exports.join("\n") + "\n";
}

function buildAgentNodeFile(
  agentNode: { id: string; data: CanvasNodeData },
  ctx: CompileContext,
  nodeMetaMap: Map<string, NodeMeta>,
  llmMetaMap: Map<string, LLMMeta>
): string {
  const d = agentNode.data;
  const nodeMeta = nodeMetaMap.get(agentNode.id);
  const fnName = nodeMeta ? nodeMeta.exportName : toIdentifier(d.name || d.label || `node_${agentNode.id}`);
  const schemaName = `${toPascalCase(ctx.graphId)}State`;

  const llmId = ctx.agentLLMMap.get(agentNode.id);
  const llmNode = llmId ? ctx.llmNodes.find((l) => l.id === llmId) : null;
  const llmMeta = llmId ? llmMetaMap.get(llmId) : null;
  const llmVar = llmMeta ? llmMeta.varName : null;

  const imports: string[] = [
    `import { ${schemaName}Type } from "../state";`,
  ];

  const systemPrompt = d.systemPrompt?.trim();
  if (systemPrompt && llmVar) {
    imports.push(`import { SystemMessage } from "@langchain/core/messages";`);
  }

  if (llmVar && llmMeta) {
    imports.push(`import { ${llmVar} } from "../llm/${llmMeta.fileName}";`);
  }

  const bodyLines: string[] = [];

  if (systemPrompt && llmVar) {
    bodyLines.push(`  const messages = [`);
    bodyLines.push(`    new SystemMessage(\`${escapeTemplateLiteral(systemPrompt)}\`),`);
    bodyLines.push(`    ...state.messages,`);
    bodyLines.push(`  ];`);
    bodyLines.push(`  const response = await ${llmVar}.invoke(messages);`);
  } else if (llmVar) {
    bodyLines.push(`  const response = await ${llmVar}.invoke(state.messages);`);
  } else {
    bodyLines.push(`  // Node without LLM execution logic`);
    bodyLines.push(`  const response = null;`);
  }

  const stateUpdates = d.stateUpdates || [];
  const returnEntries: string[] = [];
  if (llmVar) returnEntries.push(`    messages: [response],`);

  for (const su of stateUpdates) {
    if (su.channelKey === "messages") continue;
    const key = toCamelCase(su.channelKey);
    const val = su.value ? `${su.value}` : `state.${key}`;
    returnEntries.push(`    ${key}: ${val},`);
  }

  bodyLines.push(`  return {`);
  bodyLines.push(...returnEntries);
  bodyLines.push(`  };`);

  return `${imports.join("\n")}

export async function ${fnName}(state: ${schemaName}Type) {
${bodyLines.join("\n")}
}
`;
}

function buildStepNodeFile(
  stepNode: { id: string; data: StepNodeData },
  ctx: CompileContext,
  nodeMetaMap: Map<string, NodeMeta>,
  llmMetaMap: Map<string, LLMMeta>
): string {
  const d = stepNode.data;
  const nodeMeta = nodeMetaMap.get(stepNode.id);
  const fnName = nodeMeta ? nodeMeta.exportName : toIdentifier(d.label || `step_${stepNode.id}`);
  const schemaName = `${toPascalCase(ctx.graphId)}State`;

  if (d.stepType === "router") {
    const routerConfig = d.routerConfig as {
      branches?: Array<{
        id: string;
        label: string;
        field?: string;
        operator?: string;
        value?: string;
        isDefault?: boolean;
        conditions?: Array<{ field?: string; operator?: string; value?: string }>;
        targetId?: string;
      }>;
      defaultBranchId?: string;
    } | undefined;

    const branches = routerConfig?.branches || [];
    const branchLines: string[] = [];
    const possibleTargets = new Set<string>();

    for (const branch of branches) {
      // Find connected target node if targetId is not explicitly set
      let targetId = branch.targetId;
      if (!targetId) {
        const edge = ctx.input.edges.find((e) => e.source === stepNode.id && e.sourceHandle === branch.id);
        if (edge) {
          targetId = edge.target;
        }
      }

      let targetExpr = "";
      if (targetId) {
        const meta = nodeMetaMap.get(targetId);
        if (meta) {
          targetExpr = `"${meta.exportName}"`;
          possibleTargets.add(`"${meta.exportName}"`);
        } else if (targetId === "END" || targetId === "__end__" || targetId === NODE_ID_END) {
          targetExpr = "END";
          possibleTargets.add("typeof END");
        } else {
          const ident = toIdentifier(targetId);
          targetExpr = `"${ident}"`;
          possibleTargets.add(`"${ident}"`);
        }
      } else {
        const label = branch.label || "END";
        if (label === "END" || label === "__end__") {
          targetExpr = "END";
          possibleTargets.add("typeof END");
        } else {
          targetExpr = `"${label}"`;
          possibleTargets.add(`"${label}"`);
        }
      }

      let condExpr = "";
      if (branch.conditions && branch.conditions.length > 0) {
        const condParts = branch.conditions.map((c) => {
          const rawField = c.field || "messages";
          const field = rawField.startsWith("state.") ? rawField : `state.${toCamelCase(rawField)}`;
          return buildCondition(field, c.operator || "eq", c.value || "");
        });
        condExpr = condParts.join(" && ");
      } else if (branch.field) {
        const rawField = branch.field;
        const field = rawField.startsWith("state.") ? rawField : `state.${toCamelCase(rawField)}`;
        condExpr = buildCondition(field, branch.operator || "eq", branch.value || "");
      }

      if (condExpr) {
        branchLines.push(`  if (${condExpr}) return ${targetExpr};`);
      } else if (branch.isDefault) {
        // default branch handled below if no condition match
      }
    }

    let defaultTargetExpr = "END";
    const defaultBranch = branches.find((b) => b.isDefault);
    if (defaultBranch) {
      let defTargetId = defaultBranch.targetId;
      if (!defTargetId) {
        const edge = ctx.input.edges.find((e) => e.source === stepNode.id && e.sourceHandle === defaultBranch.id);
        if (edge) defTargetId = edge.target;
      }
      if (defTargetId) {
        const meta = nodeMetaMap.get(defTargetId);
        if (meta) {
          defaultTargetExpr = `"${meta.exportName}"`;
          possibleTargets.add(`"${meta.exportName}"`);
        } else if (defTargetId === "END" || defTargetId === "__end__" || defTargetId === NODE_ID_END) {
          defaultTargetExpr = "END";
          possibleTargets.add("typeof END");
        }
      }
    } else if (routerConfig?.defaultBranchId) {
      const meta = nodeMetaMap.get(routerConfig.defaultBranchId);
      if (meta) {
        defaultTargetExpr = `"${meta.exportName}"`;
        possibleTargets.add(`"${meta.exportName}"`);
      } else if (routerConfig.defaultBranchId === "END" || routerConfig.defaultBranchId === "__end__") {
        defaultTargetExpr = "END";
        possibleTargets.add("typeof END");
      } else {
        const ident = toIdentifier(routerConfig.defaultBranchId);
        defaultTargetExpr = `"${ident}"`;
        possibleTargets.add(`"${ident}"`);
      }
    } else {
      possibleTargets.add("typeof END");
    }

    const returnTypeStr = possibleTargets.size > 0 ? [...possibleTargets].join(" | ") : "string";
    const hasEnd = possibleTargets.has("typeof END");
    const importHeader = hasEnd
      ? `import { END } from "@langchain/langgraph";\nimport { ${schemaName}Type } from "../state";`
      : `import { ${schemaName}Type } from "../state";`;

    return `${importHeader}

export function ${fnName}(state: ${schemaName}Type): ${returnTypeStr} {
${branchLines.join("\n")}
  return ${defaultTargetExpr};
}
`;
  }

  if (d.stepType === "tool_node") {
    const toolVarNames = ctx.toolNodes.map((t) => toIdentifier(t.data.name || `tool_${t.id}`));
    return `import { ToolNode } from "@langchain/langgraph";
import { ${toolVarNames.join(", ")} } from "../tools";

export const ${fnName} = new ToolNode([${toolVarNames.join(", ")}]);
`;
  }

  if (d.stepType === "human_gate" || d.stepType === "interrupt") {
    return `import { interrupt } from "@langchain/langgraph";
import { ${schemaName}Type } from "../state";

export async function ${fnName}(state: ${schemaName}Type) {
  const humanInput = interrupt({
    question: "Review step input:",
    state,
  });
  return { messages: [{ role: "human", content: humanInput }] };
}
`;
  }

  if (d.stepType === "custom_code" || d.customCode?.body?.trim()) {
    const promptText = (d.modelConfig?.systemPrompt || "").trim();
    const codeBlock = (d.customCode?.body || "").trim();

    let bodyLines: string[] = [];
    if (promptText) {
      bodyLines.push(`  // --- Natural Language Instructions ---`);
      promptText.split("\n").forEach((line: string, idx: number) => {
        if (line.trim()) bodyLines.push(`  // STEP ${idx + 1}: ${line.trim()}`);
      });
    }
    if (codeBlock) {
      bodyLines.push(indent(codeBlock, 2));
    } else if (!promptText) {
      bodyLines.push(`  return {};`);
    }

    const body = bodyLines.join("\n");
    return `import { ${schemaName}Type } from "../state";

export async function ${fnName}(state: ${schemaName}Type) {
${body}
}
`;
  }

  return `import { ${schemaName}Type } from "../state";

export async function ${fnName}(state: ${schemaName}Type) {
  return {};
}
`;
}

function buildNodesIndexFile(ctx: CompileContext, nodeMetaMap: Map<string, NodeMeta>): string {
  const files = new Set<string>();
  for (const agentNode of ctx.agentNodes) {
    const meta = nodeMetaMap.get(agentNode.id);
    if (meta) files.add(meta.fileName);
  }
  for (const stepNode of ctx.stepNodes) {
    const meta = nodeMetaMap.get(stepNode.id);
    if (meta) files.add(meta.fileName);
  }
  return [...files].map((f) => `export * from "./${f}";`).join("\n") + "\n";
}

function buildGraphFile(ctx: CompileContext, nodeMetaMap: Map<string, NodeMeta>): string {
  const schemaName = `${toPascalCase(ctx.graphId)}State`;
  const graphVarName = `${toCamelCase(ctx.graphId)}Graph`;
  const builderVarName = `${toCamelCase(ctx.graphId)}Builder`;

  const nodeExports: string[] = [];
  for (const agentNode of ctx.agentNodes) {
    const meta = nodeMetaMap.get(agentNode.id);
    if (meta) nodeExports.push(meta.exportName);
  }
  for (const stepNode of ctx.stepNodes) {
    const meta = nodeMetaMap.get(stepNode.id);
    if (meta) nodeExports.push(meta.exportName);
  }

  const imports = [
    `import { StateGraph, START, END${ctx.hasMemory ? ", MemorySaver" + (ctxMemoryNeedsStore(ctx) ? ", MemoryStore" : "") : ""} } from "@langchain/langgraph";`,
    `import { ${schemaName} } from "./state";`,
    nodeExports.length > 0
      ? `import { ${nodeExports.join(", ")} } from "./nodes";`
      : "",
  ].filter(Boolean);

  const lines: string[] = [
    imports.join("\n"),
    "",
    `const ${builderVarName} = new StateGraph(${schemaName})`,
  ];

  for (const agentNode of ctx.agentNodes) {
    const meta = nodeMetaMap.get(agentNode.id);
    const fnName = meta ? meta.exportName : toIdentifier(agentNode.data.name || agentNode.data.label || `node_${agentNode.id}`);
    lines.push(`  .addNode("${fnName}", ${fnName})`);
  }

  for (const stepNode of ctx.stepNodes) {
    if (stepNode.data.stepType === "router") continue;
    const meta = nodeMetaMap.get(stepNode.id);
    const fnName = meta ? meta.exportName : toIdentifier(stepNode.data.label || `step_${stepNode.id}`);
    lines.push(`  .addNode("${fnName}", ${fnName})`);
  }

  const flowEdges = buildFlowEdges(ctx, nodeMetaMap);
  lines.push(...flowEdges);

  const lastLine = lines[lines.length - 1];
  lines[lines.length - 1] = lastLine + ";";

  if (ctx.hasMemory) {
    lines.push(``);
    lines.push(`const checkpointer = new MemorySaver();`);
    if (ctxMemoryNeedsStore(ctx)) {
      lines.push(`const store = new MemoryStore();`);
      lines.push(`export const ${graphVarName} = ${builderVarName}.compile({ checkpointer, store });`);
    } else {
      lines.push(`export const ${graphVarName} = ${builderVarName}.compile({ checkpointer });`);
    }
  } else {
    lines.push(`export const ${graphVarName} = ${builderVarName}.compile();`);
  }

  return lines.join("\n");
}

function buildIndexFile(ctx: CompileContext): string {
  const graphVarName = `${toCamelCase(ctx.graphId)}Graph`;

  return `import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { ${graphVarName} } from "./graph";

async function main() {
  console.log("🚀 Running ${ctx.input.graphLabel || "LangGraph Agent"}...");

  const result = await ${graphVarName}.invoke(
    {
      messages: [new HumanMessage("Hello! Can you help me?")],
    }${ctx.hasMemory ? `,\n    { configurable: { thread_id: "session-1" } }` : ""}
  );

  console.log("✅ Execution Result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
`;
}

function buildServerFile(ctx: CompileContext, routes: RouteEndpoint[]): string {
  const graphVarName = `${toCamelCase(ctx.graphId)}Graph`;
  const hasMemory = ctx.hasMemory;

  // Deduplicate routes by path+method so we don't emit the same route twice
  const seen = new Set<string>();
  const deduped = routes.filter((r) => {
    const key = `${r.method}:${r.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const routeHandlers = deduped.map((route) => {
    const isEvent = route.kind === "event";
    const payloadMap = route.payloadMapping ?? {};
    const stateChannels = ctx.input.stateChannels || [];

    // Collect all defined state channel keys + explicit payload mapping keys
    const allStateKeys = new Set<string>();
    stateChannels.forEach((ch) => allStateKeys.add(ch.key));
    Object.keys(payloadMap).forEach((k) => allStateKeys.add(k));
    if (allStateKeys.size === 0) {
      allStateKeys.add("messages");
    }

    const stateFields: string[] = [];
    for (const key of allStateKeys) {
      const customPath = payloadMap[key];
      if (customPath) {
        const accessor = customPath.startsWith("headers.")
          ? `req.headers["${customPath.slice(8)}"]`
          : customPath.startsWith("body.")
          ? `req.body?.${customPath.slice(5)}`
          : `req.body?.${customPath}`;
        stateFields.push(`      ${JSON.stringify(key)}: ${accessor}`);
      } else if (key === "messages") {
        if (isEvent) {
          stateFields.push(`      messages: req.body?.messages ?? [{ role: "user", content: JSON.stringify(req.body) }]`);
        } else {
          stateFields.push(`      messages: req.body?.messages ?? [{ role: "user", content: req.body?.message ?? (typeof req.body === "string" ? req.body : JSON.stringify(req.body)) }]`);
        }
      } else {
        stateFields.push(`      ${JSON.stringify(key)}: req.body?.${key}`);
      }
    }

    const stateInit = `{\n${stateFields.join(",\n")}\n    }`;

    const preInvokeBlock = (() => {
      if (route.preInvokeCode && route.preInvokeCode.trim()) {
        return `\n      // Pre-Invoke Business Logic\n      ${route.preInvokeCode.trim().replace(/\n/g, "\n      ")}\n`;
      }
      if (route.preInvokePrompt && route.preInvokePrompt.trim()) {
        // Natural language: emit as a comment directive for the AI agent
        const lines = route.preInvokePrompt.trim().split("\n");
        const commentLines = lines.map((l, i) => `      // STEP ${i + 1}: ${l.trim()}`).join("\n");
        return `\n      // Pre-Invoke Business Logic (natural language spec — implement below):\n${commentLines}\n`;
      }
      return "";
    })();

    const postInvokeBlock = (() => {
      if (route.postInvokeCode && route.postInvokeCode.trim()) {
        return `\n      // Post-Invoke Business Logic\n      ${route.postInvokeCode.trim().replace(/\n/g, "\n      ")}\n`;
      }
      if (route.postInvokePrompt && route.postInvokePrompt.trim()) {
        const lines = route.postInvokePrompt.trim().split("\n");
        const commentLines = lines.map((l, i) => `      // POST-STEP ${i + 1}: ${l.trim()}`).join("\n");
        return `\n      // Post-Invoke Business Logic (natural language spec — implement below):\n${commentLines}\n`;
      }
      return "";
    })();

    const threadIdLine = hasMemory
      ? `\n    const threadId = req.body?.thread_id ?? req.headers["x-thread-id"] ?? "default";`
      : "";

    const configLine = hasMemory
      ? `,\n      { configurable: { thread_id: threadId } }`
      : "";

    const comment = isEvent
      ? `// Event: ${route.eventName ?? route.path} (from ${route.sourceNodeLabel ?? "event source"})`
      : `// Route: ${route.method} ${route.path} (from ${route.sourceNodeLabel ?? "service"})`;

    const isStream = route.responseExecutionMode === "stream";
    const isAsyncAck = route.responseExecutionMode === "async_ack";

    if (isStream) {
      return `
  ${comment}
  app.${route.method.toLowerCase()}(${JSON.stringify(route.path)}, async (req, res) => {
    let isAborted = false;
    let activeStream: { return?: () => void } | null = null;

    req.on("close", () => {
      isAborted = true;
      if (activeStream && typeof activeStream.return === "function") {
        activeStream.return();
      }
    });

    try {${threadIdLine}
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const state: Partial<${toPascalCase(ctx.graphId)}StateType> = ${stateInit};${preInvokeBlock}
      const stream = await ${graphVarName}.stream(state${configLine});
      activeStream = stream;

      for await (const chunk of stream) {
        if (isAborted) break;
        const content = typeof chunk === "string" ? chunk : (chunk?.content ?? chunk);
        res.write(\`data: \${JSON.stringify({ content })}\\n\\n\`);
      }
      if (!isAborted) {
        res.write("data: [DONE]\\n\\n");
        res.end();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[${route.method} ${route.path}] stream error:", message);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: message });
      } else {
        res.write(\`data: \${JSON.stringify({ error: message })}\\n\\n\`);
        res.end();
      }
    }
  });`;
    }

    if (isAsyncAck) {
      return `
  ${comment}
  app.${route.method.toLowerCase()}(${JSON.stringify(route.path)}, async (req, res) => {
    try {${threadIdLine}
      const state: Partial<${toPascalCase(ctx.graphId)}StateType> = ${stateInit};${preInvokeBlock}
      
      // Async background execution: acknowledge caller immediately with 202 Accepted
      res.status(202).json({ ok: true, status: "processing"${hasMemory ? `, threadId` : ""} });

      // Run graph asynchronously with promise rejection handling
      ${graphVarName}.invoke(state${configLine}).then((result) => {${postInvokeBlock}
        console.log("[${route.method} ${route.path}] Async background execution completed:", result);
      }).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[${route.method} ${route.path}] Async background error:", message);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[${route.method} ${route.path}] error:", message);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: message });
      }
    }
  });`;
    }

    // Default Sync REST Response Mode
    const resultExpr = route.responseOutputMode === "selected" && route.responseFields && route.responseFields.length > 0
      ? `{\n${route.responseFields.map(f => `        ${JSON.stringify(f)}: result[${JSON.stringify(f)}]`).join(",\n")}\n      }`
      : "result";

    return `
  ${comment}
  app.${route.method.toLowerCase()}(${JSON.stringify(route.path)}, async (req, res) => {
    try {${threadIdLine}
      const state: Partial<${toPascalCase(ctx.graphId)}StateType> = ${stateInit};${preInvokeBlock}
      const result = await ${graphVarName}.invoke(state${configLine});${postInvokeBlock}
      res.json({ ok: true, result: ${resultExpr} });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[${route.method} ${route.path}] error:", message);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: message });
      }
    }
  });`;

  }).join("\n");

  const portEnvLine = `const PORT = Number(process.env.PORT ?? 3001);`;
  const agentLabel = escapeStr(ctx.input.graphLabel || "LangGraph Agent");

  return `import "dotenv/config";
import express from "express";
import { ${graphVarName} } from "./graph";
import type { ${toPascalCase(ctx.graphId)}StateType } from "./state";

/**
 * HTTP Server for ${agentLabel}
 *
 * Auto-generated by Blueprint — exposes the LangGraph agent over HTTP.
 * Each route corresponds to a connected endpoint or event on the main canvas.
 *
 * Start: ts-node src/server.ts  (or compile and run dist/server.js)
 */

const app = express();
app.use(express.json());
${portEnvLine}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, agent: ${JSON.stringify(agentLabel)} }));

// ── Agent routes ──────────────────────────────────────────────────────────────
${routeHandlers}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(\`🤖 ${agentLabel} running on http://localhost:\${PORT}\`);
  console.log("Routes:");
${deduped.map((r) => `  console.log("  ${r.method.padEnd(6)} http://localhost:\${PORT}${r.path}");`).join("\n")}
  console.log("  GET    http://localhost:\${PORT}/health");
});
`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFlowEdges(ctx: CompileContext, nodeMetaMap: Map<string, NodeMeta>): string[] {
  const { edges } = ctx.input;
  const lines: string[] = [];

  // Filter to only flow edges (exclude wiring edges like LLM/tool/memory connections)
  const flowEdges = edges.filter((e) => {
    return (
      e.targetHandle !== HANDLE_LLM_IN &&
      e.targetHandle !== HANDLE_TOOL_IN &&
      e.targetHandle !== HANDLE_MIDDLEWARE_IN &&
      e.targetHandle !== HANDLE_MEMORY_IN &&
      e.source !== NODE_ID_END &&
      !e.source.startsWith("llm_") &&
      !e.source.startsWith("tool_") &&
      !e.source.startsWith("mw_") &&
      !e.source.startsWith("mem_") &&
      !e.source.startsWith("db_")
    );
  });

  // Collect edges that ENTER a router node.
  // Each such edge means: from upstream node → router → downstream targets
  // This becomes: .addConditionalEdges(upstreamNode, routerFn, [targets])
  const processedSources = new Set<string>();

  for (const edge of flowEdges) {
    // If this edge points INTO a router node
    if (ctx.routerStepIds.has(edge.target)) {
      const routerId = edge.target;
      if (processedSources.has(edge.source + "->" + routerId)) continue;
      processedSources.add(edge.source + "->" + routerId);

      const sourceName = resolveNodeName(edge.source, ctx, nodeMetaMap);
      if (!sourceName) continue;

      // Get the router function name
      const routerMeta = nodeMetaMap.get(routerId);
      const routerFnName = routerMeta ? routerMeta.exportName : `${toIdentifier(getNodeLabel(routerId, ctx) || routerId)}Router`;

      // Collect all downstream targets that the router can route to
      const routerOutEdges = flowEdges.filter((e2) => e2.source === routerId);
      const uniqueTargets = [
        ...new Set(
          routerOutEdges
            .map((e2) => resolveNodeName(e2.target, ctx, nodeMetaMap))
            .filter(Boolean) as string[]
        ),
      ];

      const targetsStr = uniqueTargets
        .map((t) => (t === "END" ? "END" : `"${t}"`))
        .join(", ");

      if (sourceName === "START") {
        lines.push(`  .addConditionalEdges(START, ${routerFnName}, [${targetsStr}])`);
      } else {
        lines.push(`  .addConditionalEdges("${sourceName}", ${routerFnName}, [${targetsStr}])`);
      }
      continue;
    }

    // Skip edges that originate FROM a router node — those are covered above
    if (ctx.routerStepIds.has(edge.source)) continue;

    const pairKey = `${edge.source}->${edge.target}`;
    if (processedSources.has(pairKey)) continue;
    processedSources.add(pairKey);

    const sourceName = resolveNodeName(edge.source, ctx, nodeMetaMap);
    const targetName = resolveNodeName(edge.target, ctx, nodeMetaMap);

    if (!sourceName || !targetName) continue;

    if (sourceName === "START") {
      lines.push(`  .addEdge(START, "${targetName}")`);
    } else if (targetName === "END") {
      lines.push(`  .addEdge("${sourceName}", END)`);
    } else {
      lines.push(`  .addEdge("${sourceName}", "${targetName}")`);
    }
  }

  return lines;
}

function getProviderPackage(provider?: string): string {
  switch (provider) {
    case "openai": return "@langchain/openai";
    case "anthropic": return "@langchain/anthropic";
    case "google": return "@langchain/google-genai";
    case "groq": return "@langchain/groq";
    case "ollama": return "@langchain/ollama";
    default: return "@langchain/openai";
  }
}

function getProviderClass(provider?: string): string {
  switch (provider) {
    case "openai": return "ChatOpenAI";
    case "anthropic": return "ChatAnthropic";
    case "google": return "ChatGoogleGenerativeAI";
    case "groq": return "ChatGroq";
    case "ollama": return "ChatOllama";
    default: return "ChatOpenAI";
  }
}

function getEnvKey(data: LangGraphLLMNodeData): string | null {
  if (data.apiKeyHeader) return data.apiKeyHeader;
  switch (data.provider) {
    case "openai": return "OPENAI_API_KEY";
    case "anthropic": return "ANTHROPIC_API_KEY";
    case "google": return "GEMINI_API_KEY";
    case "groq": return "GROQ_API_KEY";
    default: return null;
  }
}

function getZodType(type: string, defaultValue?: unknown): string {
  switch (type) {
    case "string": return `z.string().default(${JSON.stringify(defaultValue ?? "")})`;
    case "number": return `z.number().default(${Number(defaultValue ?? 0)})`;
    case "boolean": return `z.boolean().default(${Boolean(defaultValue ?? false)})`;
    case "array": return `z.array(z.any()).default(${JSON.stringify(defaultValue ?? [])})`;
    case "object": return `z.record(z.any()).default({})`;
    case "messages": return "MessagesValue";
    default: return `z.any().default(${JSON.stringify(defaultValue ?? null)})`;
  }
}

function getReducerFn(reducer: string, type: string): string {
  switch (reducer) {
    case "append": return type === "array" ? "(x, y) => x.concat(y)" : "(x, y) => x + y";
    case "add": return "(x, y) => x + y";
    case "max": return "(x, y) => Math.max(x, y)";
    case "min": return "(x, y) => Math.min(x, y)";
    default: return "(x, y) => y";
  }
}

function jsonSchemaToZod(schema: Record<string, unknown>): string {
  if (schema.type !== "object" || !schema.properties) return "z.object({})";
  const props = schema.properties as Record<string, { type?: string; description?: string; enum?: string[] }>;
  const required = (schema.required as string[]) || [];

  const fields = Object.entries(props).map(([key, prop]) => {
    let zodType: string;
    if (prop.enum) {
      zodType = `z.enum([${prop.enum.map((e) => `"${e}"`).join(", ")}])`;
    } else {
      switch (prop.type) {
        case "string": zodType = "z.string()"; break;
        case "number": zodType = "z.number()"; break;
        case "boolean": zodType = "z.boolean()"; break;
        case "array": zodType = "z.array(z.any())"; break;
        default: zodType = "z.any()";
      }
    }
    if (!required.includes(key)) zodType += ".optional()";
    if (prop.description) zodType += `.describe("${escapeStr(prop.description)}")`;
    return `  ${key}: ${zodType},`;
  });

  return `z.object({\n${fields.join("\n")}\n})`;
}

function resolveNodeName(nodeId: string, ctx: CompileContext, nodeMetaMap?: Map<string, NodeMeta>): string | null {
  if (nodeId === NODE_ID_START) return "START";
  if (nodeId === NODE_ID_END || nodeId === "END") return "END";

  if (nodeMetaMap) {
    const meta = nodeMetaMap.get(nodeId);
    if (meta) return meta.exportName;
  }

  const node = ctx.input.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  if (node.type === LANGGRAPH_CANVAS_NODE_NODE || node.type === LANGGRAPH_CANVAS_NODE_AGENT) {
    return toIdentifier((node.data as CanvasNodeData).name || (node.data as CanvasNodeData).label || nodeId);
  }
  if (node.type === LANGGRAPH_CANVAS_NODE_STEP) {
    return toIdentifier((node.data as StepNodeData).label || nodeId);
  }
  if (node.type === LANGGRAPH_CANVAS_NODE_END) return "END";
  if (node.type === LANGGRAPH_CANVAS_NODE_START) return "START";
  return null;
}

function getNodeLabel(nodeId: string, ctx: CompileContext): string | null {
  const node = ctx.input.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  return (node.data as { label?: string }).label || null;
}

function buildCondition(field: string, operator: string, value: string): string {
  const formattedVal = value === "true" ? "true" : value === "false" ? "false" : JSON.stringify(value);
  switch (operator) {
    case "eq": case "==": case "equals":
      return `${field} === ${formattedVal}`;
    case "neq": case "!=": case "not_equals":
      return `${field} !== ${formattedVal}`;
    case "gt": case ">":
      return `Number(${field}) > ${Number(value) || 0}`;
    case "gte": case ">=":
      return `Number(${field}) >= ${Number(value) || 0}`;
    case "lt": case "<":
      return `Number(${field}) < ${Number(value) || 0}`;
    case "lte": case "<=":
      return `Number(${field}) <= ${Number(value) || 0}`;
    case "contains":
      return `String(${field} ?? "").includes(${JSON.stringify(value)})`;
    case "starts_with":
      return `String(${field} ?? "").startsWith(${JSON.stringify(value)})`;
    case "ends_with":
      return `String(${field} ?? "").endsWith(${JSON.stringify(value)})`;
    case "is_not_null":
      return `${field} != null && ${field} !== ""`;
    case "has_tool_calls":
      return `(Array.isArray((state as any).messages?.at(-1)?.tool_calls) && (state as any).messages.at(-1).tool_calls.length > 0)`;
    case "is_true":
      return `Boolean(${field})`;
    case "is_false":
      return `!${field}`;
    default:
      return `${field} === ${formattedVal}`;
  }
}

function toCamelCase(str: string): string {
  if (!str) return "node";
  const formatted = str
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
  if (!formatted) return "node";
  const words = formatted.split(/\s+/);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("")
    .replace(/^([0-9])/, "node$1");
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toIdentifier(str: string): string {
  return toCamelCase(str);
}

function capitalize(str: string): string {
  return toPascalCase(str);
}

function escapeStr(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function escapeTemplateLiteral(str: string): string {
  return str.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function indent(code: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return code.split("\n").map((line) => (line.trim() ? pad + line : line)).join("\n");
}

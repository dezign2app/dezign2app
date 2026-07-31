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

export interface CompileLangGraphInput {
  graphLabel: string;
  stateChannels: LangGraphStateChannel[];
  inputChannels: LangGraphInputChannel[];
  nodes: LangGraphCanvasNode[];
  edges: LangGraphCanvasEdge[];
  memoryConfig?: LangGraphMemoryConfig;
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

  // src/llm.ts (if LLM nodes exist)
  if (ctx.llmNodes.length > 0) {
    files.push({
      filename: "src/llm.ts",
      language: "typescript",
      content: buildLLMFile(ctx),
    });
  }

  // src/nodes.ts
  files.push({
    filename: "src/nodes.ts",
    language: "typescript",
    content: buildNodesFile(ctx),
  });

  // src/graph.ts
  files.push({
    filename: "src/graph.ts",
    language: "typescript",
    content: buildGraphFile(ctx),
  });

  // src/index.ts
  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: buildIndexFile(ctx),
  });

  return files;
}

// ─── Internal Context ─────────────────────────────────────────────────────────

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

    const body = d.functionBody?.trim()
      ? indent(d.functionBody.trim(), 4)
      : `    return "Tool execution success";`;

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

function buildLLMFile(ctx: CompileContext): string {
  if (ctx.llmNodes.length === 0) return "// No LLMs configured";

  const providerMap = new Map<string, Set<string>>();
  for (const llmNode of ctx.llmNodes) {
    const pkg = getProviderPackage(llmNode.data.provider);
    const cls = getProviderClass(llmNode.data.provider);
    if (pkg && cls) {
      const set = providerMap.get(pkg) || new Set<string>();
      set.add(cls);
      providerMap.set(pkg, set);
    }
  }

  const imports: string[] = [];
  for (const [pkg, classes] of providerMap) {
    imports.push(`import { ${[...classes].join(", ")} } from "${pkg}";`);
  }

  if (ctx.hasTools) {
    const toolNames = ctx.toolNodes.map(t => toIdentifier(t.data.name || `tool_${t.id}`));
    imports.push(`import { ${toolNames.join(", ")} } from "./tools.js";`);
  }

  const parts: string[] = [imports.join("\n"), ""];

  for (const llmNode of ctx.llmNodes) {
    const d = llmNode.data;
    const varName = toIdentifier(d.label || `llm_${llmNode.id}`);
    const cls = getProviderClass(d.provider);

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

    const configLines: string[] = [];
    if (d.model) configLines.push(`  model: "${d.model}",`);
    if (d.temperature !== undefined) configLines.push(`  temperature: ${d.temperature},`);
    if (d.maxTokens !== undefined) configLines.push(`  maxTokens: ${d.maxTokens},`);

    if ((d.provider === "ollama" || d.provider === "custom") && (d.baseUrl || d.url)) {
      configLines.push(`  baseURL: "${d.baseUrl || d.url}",`);
    }

    if (toolVarNames.length > 0) {
      parts.push(`const ${varName}Base = new ${cls}({\n${configLines.join("\n")}\n});`);
      parts.push(`export const ${varName} = ${varName}Base.bindTools([${toolVarNames.join(", ")}]);`);
    } else {
      parts.push(`export const ${varName} = new ${cls}({\n${configLines.join("\n")}\n});`);
    }
  }

  return parts.join("\n\n");
}

function buildNodesFile(ctx: CompileContext): string {
  const schemaName = `${toPascalCase(ctx.graphId)}State`;
  const imports = [
    `import { ${schemaName}Type } from "./state.js";`,
  ];

  if (ctx.agentNodes.length > 0 || ctx.stepNodes.some((s) => s.data.stepType === "llm_call")) {
    imports.push(`import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";`);
  }

  if (ctx.hasHumanInLoop) {
    imports.push(`import { interrupt } from "@langchain/langgraph";`);
  }

  if (ctx.stepNodes.some((s) => s.data.stepType === "tool_node")) {
    imports.push(`import { ToolNode } from "@langchain/langgraph";`);
    const toolVarNames = ctx.toolNodes.map((t) => toIdentifier(t.data.name || `tool_${t.id}`));
    imports.push(`import { ${toolVarNames.join(", ")} } from "./tools.js";`);
  }

  if (ctx.llmNodes.length > 0) {
    const llmVars = ctx.llmNodes.map((l) => toIdentifier(l.data.label || `llm_${l.id}`));
    imports.push(`import { ${llmVars.join(", ")} } from "./llm.js";`);
  }

  const parts: string[] = [imports.join("\n")];

  // Agent Nodes
  for (const agentNode of ctx.agentNodes) {
    const d = agentNode.data;
    const fnName = toIdentifier(d.name || d.label || `node_${agentNode.id}`);
    const llmId = ctx.agentLLMMap.get(agentNode.id);
    const llmNode = llmId ? ctx.llmNodes.find((l) => l.id === llmId) : null;
    const llmVar = llmNode ? toIdentifier(llmNode.data.label || `llm_${llmId}`) : null;

    const bodyLines: string[] = [];
    const systemPrompt = d.systemPrompt?.trim();

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

    parts.push(`export async function ${fnName}(state: ${schemaName}Type) {
${bodyLines.join("\n")}
}`);
  }

  // Step Nodes
  for (const stepNode of ctx.stepNodes) {
    const d = stepNode.data;
    const fnName = toIdentifier(d.label || `step_${stepNode.id}`);

    if (d.stepType === "router") continue;

    if (d.stepType === "tool_node") {
      const toolVarNames = ctx.toolNodes.map((t) => toIdentifier(t.data.name || `tool_${t.id}`));
      parts.push(`export const ${fnName} = new ToolNode([${toolVarNames.join(", ")}]);`);
      continue;
    }

    if (d.stepType === "human_gate" || d.stepType === "interrupt") {
      parts.push(`export async function ${fnName}(state: ${schemaName}Type) {
  const humanInput = interrupt({
    question: "Review step input:",
    state,
  });
  return { messages: [{ role: "human", content: humanInput }] };
}`);
      continue;
    }

    if (d.stepType === "custom_code" && d.customCode?.body?.trim()) {
      const body = indent(d.customCode.body.trim(), 2);
      parts.push(`export async function ${fnName}(state: ${schemaName}Type) {
${body}
}`);
      continue;
    }

    parts.push(`export async function ${fnName}(state: ${schemaName}Type) {
  return {};
}`);
  }

  // Router Functions
  const routerSteps = ctx.stepNodes.filter((s) => s.data.stepType === "router");
  for (const routerStep of routerSteps) {
    const d = routerStep.data;
    const fnName = `${toIdentifier(d.label || `router_${routerStep.id}`)}Router`;
    const routerConfig = d.routerConfig as {
      branches?: Array<{
        id: string;
        label: string;
        conditions?: Array<{ field?: string; operator?: string; value?: string }>;
        targetId?: string;
      }>;
      defaultBranchId?: string;
    } | undefined;

    const branches = routerConfig?.branches || [];
    const branchLines: string[] = [];

    for (const branch of branches) {
      const targetId = branch.targetId ? toIdentifier(branch.targetId) : `"${branch.label}"`;
      const conditions = branch.conditions || [];
      if (conditions.length > 0) {
        const condParts = conditions.map((c) => {
          const field = c.field ? `state.${toCamelCase(c.field)}` : "state.messages.at(-1)";
          return buildCondition(field, c.operator || "==", c.value || "");
        });
        branchLines.push(`  if (${condParts.join(" && ")}) return ${targetId};`);
      }
    }

    const defaultTarget = routerConfig?.defaultBranchId
      ? toIdentifier(routerConfig.defaultBranchId)
      : "END";

    parts.push(`export function ${fnName}(state: ${schemaName}Type): string {
${branchLines.join("\n")}
  return ${defaultTarget};
}`);
  }

  return parts.join("\n\n");
}

function buildGraphFile(ctx: CompileContext): string {
  const schemaName = `${toPascalCase(ctx.graphId)}State`;
  const graphVarName = `${toCamelCase(ctx.graphId)}Graph`;
  const builderVarName = `${toCamelCase(ctx.graphId)}Builder`;

  const nodeExports: string[] = [];
  for (const agentNode of ctx.agentNodes) {
    nodeExports.push(toIdentifier(agentNode.data.name || agentNode.data.label || `node_${agentNode.id}`));
  }
  for (const stepNode of ctx.stepNodes) {
    if (stepNode.data.stepType === "router") {
      nodeExports.push(`${toIdentifier(stepNode.data.label || `router_${stepNode.id}`)}Router`);
    } else {
      nodeExports.push(toIdentifier(stepNode.data.label || `step_${stepNode.id}`));
    }
  }

  const imports = [
    `import { StateGraph, START, END${ctx.hasMemory ? ", MemorySaver" + (ctxMemoryNeedsStore(ctx) ? ", MemoryStore" : "") : ""} } from "@langchain/langgraph";`,
    `import { ${schemaName} } from "./state.js";`,
    `import { ${nodeExports.join(", ")} } from "./nodes.js";`,
  ];

  const lines: string[] = [
    imports.join("\n"),
    "",
    `const ${builderVarName} = new StateGraph(${schemaName})`,
  ];

  for (const agentNode of ctx.agentNodes) {
    const fnName = toIdentifier(agentNode.data.name || agentNode.data.label || `node_${agentNode.id}`);
    lines.push(`  .addNode("${fnName}", ${fnName})`);
  }

  for (const stepNode of ctx.stepNodes) {
    if (stepNode.data.stepType === "router") continue;
    const fnName = toIdentifier(stepNode.data.label || `step_${stepNode.id}`);
    lines.push(`  .addNode("${fnName}", ${fnName})`);
  }

  const flowEdges = buildFlowEdges(ctx);
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
import { ${graphVarName} } from "./graph.js";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFlowEdges(ctx: CompileContext): string[] {
  const { edges } = ctx.input;
  const lines: string[] = [];

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

  const processedPairs = new Set<string>();

  for (const edge of flowEdges) {
    const pairKey = `${edge.source}->${edge.target}`;
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    const sourceName = resolveNodeName(edge.source, ctx);
    const targetName = resolveNodeName(edge.target, ctx);

    if (!sourceName || !targetName) continue;

    if (ctx.routerStepIds.has(edge.source)) {
      const routerFnName = `${toIdentifier(getNodeLabel(edge.source, ctx) || edge.source)}Router`;
      const routerTargets = flowEdges
        .filter((e2) => e2.source === edge.source)
        .map((e2) => resolveNodeName(e2.target, ctx))
        .filter(Boolean) as string[];
      const uniqueTargets = [...new Set(routerTargets)];
      const targetsStr = uniqueTargets.map((t) => (t === "END" ? "END" : `"${t}"`)).join(", ");
      lines.push(`  .addConditionalEdges("${sourceName}", ${routerFnName}, [${targetsStr}])`);
      uniqueTargets.forEach((t) => processedPairs.add(`${edge.source}->${t}`));
      continue;
    }

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

function resolveNodeName(nodeId: string, ctx: CompileContext): string | null {
  if (nodeId === NODE_ID_START) return "START";
  if (nodeId === NODE_ID_END || nodeId === "END") return "END";

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
  switch (operator) {
    case "==": case "equals": return `${field} === ${JSON.stringify(value)}`;
    case "!=": case "not_equals": return `${field} !== ${JSON.stringify(value)}`;
    case ">": return `${field} > ${value}`;
    case "<": return `${field} < ${value}`;
    case ">=": return `${field} >= ${value}`;
    case "<=": return `${field} <= ${value}`;
    case "contains": return `String(${field}).includes(${JSON.stringify(value)})`;
    case "starts_with": return `String(${field}).startsWith(${JSON.stringify(value)})`;
    case "ends_with": return `String(${field}).endsWith(${JSON.stringify(value)})`;
    case "is_true": return `Boolean(${field})`;
    case "is_false": return `!${field}`;
    default: return `${field} === ${JSON.stringify(value)}`;
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

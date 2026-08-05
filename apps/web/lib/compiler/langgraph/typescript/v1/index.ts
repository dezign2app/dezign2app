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
import type { RouteEndpoint, CompileLangGraphInput } from "./types";
import {
  buildContext,
  buildLLMMetaMap,
  buildNodeMetaMap,
  buildDependencies,
} from "./context";
import { toIdentifier } from "./utils";
import {
  buildPackageJson,
  buildTsConfig,
  buildEnvExample,
  buildReadme,
} from "./generators/config";
import { buildStateFile } from "./generators/state";
import { buildToolsFile } from "./generators/tools";
import { buildIndividualLLMFile, buildLLMIndexFile } from "./generators/llm";
import {
  buildAgentNodeFile,
  buildStepNodeFile,
  buildNodesIndexFile,
} from "./generators/nodes";
import { buildGraphFile } from "./generators/graph";
import { buildIndexFile } from "./generators/entry";
import { buildServerFile } from "./generators/server";
import { buildLangGraphScenariosFile } from "./generators/scenarios";

export type { RouteEndpoint, CompileLangGraphInput };

/**
 * Compile the visual canvas state into a multi-file npm project (CompiledFile[]).
 * Compatible with the CompilerModal UI file-tree explorer.
 */
export function compileLangGraph(input: CompileLangGraphInput): CompiledFile[] {
  const ctx = buildContext(input);
  const files: CompiledFile[] = [];
  const pkgId = toIdentifier(input.graphLabel || "langgraph-agent")
    .toLowerCase()
    .replace(/_/g, "-");
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
    files.push({
      filename: ".env.example",
      language: "dotenv",
      content: envContent,
    });
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

  if (input.testCases && input.testCases.length > 0) {
    files.push({
      filename: "src/tests/langgraph-scenarios.ts",
      language: "typescript",
      content: buildLangGraphScenariosFile(input.testCases),
    });
  }

  return files;
}

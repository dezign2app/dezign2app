import {
  HANDLE_LLM_IN,
  HANDLE_TOOL_IN,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MEMORY_IN,
  NODE_ID_END,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/constants";
import type { CompileContext, NodeMeta } from "../types";
import {
  toPascalCase,
  toCamelCase,
  toIdentifier,
  resolveNodeName,
  getNodeLabel,
} from "../utils";
import { ctxMemoryNeedsStore } from "../context";

export function buildGraphFile(
  ctx: CompileContext,
  nodeMetaMap: Map<string, NodeMeta>,
): string {
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
    const fnName = meta
      ? meta.exportName
      : toIdentifier(
          agentNode.data.name || agentNode.data.label || `node_${agentNode.id}`,
        );
    lines.push(`  .addNode("${fnName}", ${fnName})`);
  }

  for (const stepNode of ctx.stepNodes) {
    if (stepNode.data.stepType === "router") continue;
    const meta = nodeMetaMap.get(stepNode.id);
    const fnName = meta
      ? meta.exportName
      : toIdentifier(stepNode.data.label || `step_${stepNode.id}`);
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
      lines.push(
        `export const ${graphVarName} = ${builderVarName}.compile({ checkpointer, store });`,
      );
    } else {
      lines.push(
        `export const ${graphVarName} = ${builderVarName}.compile({ checkpointer });`,
      );
    }
  } else {
    lines.push(`export const ${graphVarName} = ${builderVarName}.compile();`);
  }

  return lines.join("\n");
}

export function buildFlowEdges(
  ctx: CompileContext,
  nodeMetaMap: Map<string, NodeMeta>,
): string[] {
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
      const routerFnName = routerMeta
        ? routerMeta.exportName
        : `${toIdentifier(getNodeLabel(routerId, ctx) || routerId)}Router`;

      // Collect all downstream targets that the router can route to
      const routerOutEdges = flowEdges.filter((e2) => e2.source === routerId);
      const uniqueTargets = [
        ...new Set(
          routerOutEdges
            .map((e2) => resolveNodeName(e2.target, ctx, nodeMetaMap))
            .filter(Boolean) as string[],
        ),
      ];

      const targetsStr = uniqueTargets
        .map((t) => (t === "END" ? "END" : `"${t}"`))
        .join(", ");

      if (sourceName === "START") {
        lines.push(
          `  .addConditionalEdges(START, ${routerFnName}, [${targetsStr}])`,
        );
      } else {
        lines.push(
          `  .addConditionalEdges("${sourceName}", ${routerFnName}, [${targetsStr}])`,
        );
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

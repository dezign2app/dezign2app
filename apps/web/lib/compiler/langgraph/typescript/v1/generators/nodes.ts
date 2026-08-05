import type {
  CanvasNodeData,
  StepNodeData,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/types";
import { NODE_ID_END } from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/constants";
import type { CompileContext, NodeMeta, LLMMeta } from "../types";
import {
  toIdentifier,
  toPascalCase,
  toCamelCase,
  escapeTemplateLiteral,
  buildCondition,
  indent,
} from "../utils";

export function buildAgentNodeFile(
  agentNode: { id: string; data: CanvasNodeData },
  ctx: CompileContext,
  nodeMetaMap: Map<string, NodeMeta>,
  llmMetaMap: Map<string, LLMMeta>,
): string {
  const d = agentNode.data;
  const nodeMeta = nodeMetaMap.get(agentNode.id);
  const fnName = nodeMeta
    ? nodeMeta.exportName
    : toIdentifier(d.name || d.label || `node_${agentNode.id}`);
  const schemaName = `${toPascalCase(ctx.graphId)}State`;

  const llmId = ctx.agentLLMMap.get(agentNode.id);
  const llmNode = llmId ? ctx.llmNodes.find((l) => l.id === llmId) : null;
  const llmMeta = llmId ? llmMetaMap.get(llmId) : null;
  const llmVar = llmMeta ? llmMeta.varName : null;

  const imports: string[] = [`import { ${schemaName}Type } from "../state";`];

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
    bodyLines.push(
      `    new SystemMessage(\`${escapeTemplateLiteral(systemPrompt)}\`),`,
    );
    bodyLines.push(`    ...state.messages,`);
    bodyLines.push(`  ];`);
    bodyLines.push(`  const response = await ${llmVar}.invoke(messages);`);
  } else if (llmVar) {
    bodyLines.push(
      `  const response = await ${llmVar}.invoke(state.messages);`,
    );
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

export function buildStepNodeFile(
  stepNode: { id: string; data: StepNodeData },
  ctx: CompileContext,
  nodeMetaMap: Map<string, NodeMeta>,
  llmMetaMap: Map<string, LLMMeta>,
): string {
  const d = stepNode.data;
  const nodeMeta = nodeMetaMap.get(stepNode.id);
  const fnName = nodeMeta
    ? nodeMeta.exportName
    : toIdentifier(d.label || `step_${stepNode.id}`);
  const schemaName = `${toPascalCase(ctx.graphId)}State`;

  if (d.stepType === "router") {
    const routerConfig = d.routerConfig as
      | {
          branches?: Array<{
            id: string;
            label: string;
            field?: string;
            operator?: string;
            value?: string;
            isDefault?: boolean;
            conditions?: Array<{
              field?: string;
              operator?: string;
              value?: string;
            }>;
            targetId?: string;
          }>;
          defaultBranchId?: string;
        }
      | undefined;

    const branches = routerConfig?.branches || [];
    const branchLines: string[] = [];
    const possibleTargets = new Set<string>();

    for (const branch of branches) {
      // Find connected target node if targetId is not explicitly set
      let targetId = branch.targetId;
      if (!targetId) {
        const edge = ctx.input.edges.find(
          (e) => e.source === stepNode.id && e.sourceHandle === branch.id,
        );
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
        } else if (
          targetId === "END" ||
          targetId === "__end__" ||
          targetId === NODE_ID_END
        ) {
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
          const field = rawField.startsWith("state.")
            ? rawField
            : `state.${toCamelCase(rawField)}`;
          return buildCondition(field, c.operator || "eq", c.value || "");
        });
        condExpr = condParts.join(" && ");
      } else if (branch.field) {
        const rawField = branch.field;
        const field = rawField.startsWith("state.")
          ? rawField
          : `state.${toCamelCase(rawField)}`;
        condExpr = buildCondition(
          field,
          branch.operator || "eq",
          branch.value || "",
        );
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
        const edge = ctx.input.edges.find(
          (e) =>
            e.source === stepNode.id && e.sourceHandle === defaultBranch.id,
        );
        if (edge) defTargetId = edge.target;
      }
      if (defTargetId) {
        const meta = nodeMetaMap.get(defTargetId);
        if (meta) {
          defaultTargetExpr = `"${meta.exportName}"`;
          possibleTargets.add(`"${meta.exportName}"`);
        } else if (
          defTargetId === "END" ||
          defTargetId === "__end__" ||
          defTargetId === NODE_ID_END
        ) {
          defaultTargetExpr = "END";
          possibleTargets.add("typeof END");
        }
      }
    } else if (routerConfig?.defaultBranchId) {
      const meta = nodeMetaMap.get(routerConfig.defaultBranchId);
      if (meta) {
        defaultTargetExpr = `"${meta.exportName}"`;
        possibleTargets.add(`"${meta.exportName}"`);
      } else if (
        routerConfig.defaultBranchId === "END" ||
        routerConfig.defaultBranchId === "__end__"
      ) {
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

    const returnTypeStr =
      possibleTargets.size > 0 ? [...possibleTargets].join(" | ") : "string";
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
    const toolVarNames = ctx.toolNodes.map((t) =>
      toIdentifier(t.data.name || `tool_${t.id}`),
    );
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

export function buildNodesIndexFile(
  ctx: CompileContext,
  nodeMetaMap: Map<string, NodeMeta>,
): string {
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

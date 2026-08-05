import type { CompileContext } from "../types";
import { toIdentifier, jsonSchemaToZod, escapeStr, indent } from "../utils";

export function buildToolsFile(ctx: CompileContext): string {
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
        if (line.trim())
          bodyLines.push(`    // STEP ${idx + 1}: ${line.trim()}`);
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

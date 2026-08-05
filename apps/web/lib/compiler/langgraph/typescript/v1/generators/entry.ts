import type { CompileContext } from "../types";
import { toCamelCase } from "../utils";

export function buildIndexFile(ctx: CompileContext): string {
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

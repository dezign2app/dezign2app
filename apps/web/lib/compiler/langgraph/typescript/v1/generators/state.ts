import type { CompileContext } from "../types";
import { toPascalCase, toCamelCase, getZodType, getReducerFn } from "../utils";

export function buildStateFile(ctx: CompileContext): string {
  const schemaName = `${toPascalCase(ctx.graphId)}State`;
  const imports: string[] = ["StateSchema"];

  if (ctx.usesMessages) imports.push("MessagesValue");
  const needsReducedValue = ctx.input.stateChannels.some(
    (c) =>
      c.reducer &&
      (c.reducer as string) !== "replace" &&
      (c.reducer as string) !== "add_messages",
  );
  if (needsReducedValue) imports.push("ReducedValue");

  const channelLines = ctx.input.stateChannels.map((ch) => {
    const field = toCamelCase(ch.key);
    if (
      ch.key === "messages" ||
      ch.type === "messages" ||
      (ch.reducer as string) === "add_messages"
    ) {
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

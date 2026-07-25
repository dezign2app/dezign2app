import { AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile } from "../types";
import { toVarName, toPascalCase } from "../utils";

export function generateConsumers(
  serviceName: string,
  nodeConsumedEvents: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[]
): CompiledFile[] {
  const files: CompiledFile[] = [];
  const consumerImports: string[] = [];
  const consumerInits: string[] = [];

  if (nodeConsumedEvents.length === 0) {
    files.push({
      filename: "src/consumer/index.ts",
      language: "typescript",
      content: `/**\n * Event Consumers for ${serviceName}\n */\nexport function initConsumers(): void {\n  // No consumed events configured for this service\n}\n`,
    });
  } else {
    nodeConsumedEvents.forEach((ev) => {
      const consumerFileName = toVarName(ev.name || "event") || "consumer";
      const handlerName = `handle${toPascalCase(ev.name || "event")}`;

      const consumerCode = `/**
 * Event Consumer for: "${ev.name}"
 * Description: ${ev.description || "Processes incoming event payload"}
 */
export async function ${handlerName}(payload: Record<string, unknown>): Promise<void> {
  console.log(\`[EVENT CONSUME] [${ev.name}]\`, payload);
  // Handler Logic: ${ev.handlerLogic || "Process event payload"}
}
`;
      files.push({
        filename: `src/consumer/${consumerFileName}.ts`,
        language: "typescript",
        content: consumerCode,
      });

      consumerImports.push(`import { ${handlerName} } from "./${consumerFileName}";`);
      consumerInits.push(`  console.log("Registered listener for topic: ${ev.name}");`);
    });

    const consumersIndexCode = `/**
 * Event Consumers Initialization for ${serviceName}
 */
${consumerImports.join("\n")}

export function initConsumers(): void {
  console.log("Initializing event consumers...");
${consumerInits.join("\n")}
}
`;
    files.push({
      filename: "src/consumer/index.ts",
      language: "typescript",
      content: consumersIndexCode,
    });
  }

  return files;
}

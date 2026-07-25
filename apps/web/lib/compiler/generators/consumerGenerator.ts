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
      content: `import { createLogger } from "@workspace/logger";

const logger = createLogger("${serviceName}:Consumer");

/**
 * Event Consumers for ${serviceName}
 */
export function initConsumers(): void {
  logger.debug("No consumed events configured for this service");
}
`,
    });
  } else {
    nodeConsumedEvents.forEach((ev) => {
      const consumerFileName = toVarName(ev.name || "event") || "consumer";
      const handlerName = `handle${toPascalCase(ev.name || "event")}`;

      const consumerCode = `import { createLogger } from "@workspace/logger";

const logger = createLogger("${serviceName}:Consumer:${ev.name}");

/**
 * Event Consumer for: "${ev.name}"
 * Description: ${ev.description || "Processes incoming event payload"}
 */
export async function ${handlerName}(payload: Record<string, unknown>): Promise<void> {
  try {
    logger.info(\`Consuming event [${ev.name}]\`, payload);
    // Handler Logic: ${ev.handlerLogic || "Process event payload"}
  } catch (error) {
    logger.error(\`Error processing event [${ev.name}]:\`, error);
  }
}
`;
      files.push({
        filename: `src/consumer/${consumerFileName}.ts`,
        language: "typescript",
        content: consumerCode,
      });

      consumerImports.push(`import { ${handlerName} } from "./${consumerFileName}";`);
      consumerInits.push(`  logger.info("Registered listener for topic: ${ev.name}");`);
    });

    const consumersIndexCode = `import { createLogger } from "@workspace/logger";

const logger = createLogger("${serviceName}:Consumer");

/**
 * Event Consumers Initialization for ${serviceName}
 */
${consumerImports.join("\n")}

export function initConsumers(): void {
  logger.info("Initializing event consumers...");
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


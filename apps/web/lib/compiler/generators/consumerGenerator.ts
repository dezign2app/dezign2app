import { AnyMessagingResource } from "@workspace/canvas/types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledFile } from "../types";
import { toVarName, toPascalCase } from "../utils";
import { schemaToZodSchema } from "./schemaToTypeScript";
import { resolveConsumerTrace } from "../traceResolver";

export function generateConsumers(
  serviceName: string,
  nodeConsumedEvents: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[],
  serviceNode?: BackendNode,
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
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
      const eventPascalName = toPascalCase(ev.name || "event");
      const handlerName = `handle${eventPascalName}`;
      const payloadInterfaceName = `${eventPascalName}EventPayload`;
      const schemaName = `${consumerFileName}PayloadSchema`;

      const schemaObj = {
        rawJson: ev.payloadSchema?.rawJson,
      };
      const zodRes = schemaToZodSchema(schemaName, schemaObj);

      const trace = serviceNode
        ? resolveConsumerTrace(serviceNode, ev, allNodes, allEdges)
        : { incoming: [], outgoing: [] };

      const typeImportsList = [payloadInterfaceName];
      if (zodRes.hasContent) {
        typeImportsList.push(schemaName);
      }

      let consumerCode = `import { createLogger } from "@workspace/logger";
import {
  ${typeImportsList.join(",\n  ")}
} from "@workspace/types";

const logger = createLogger("${serviceName}:Consumer:${ev.name}");

/**
 * Event Consumer for: "${ev.name}"
 * Description: ${ev.description || "Processes incoming event payload"}
 */
export async function ${handlerName}(rawPayload: unknown): Promise<void> {
  try {
    logger.info(\`Consuming event [${ev.name}]\`, rawPayload);
`;

      if (zodRes.hasContent) {
        consumerCode += `    const parsed = ${schemaName}.safeParse(rawPayload);\n`;
        consumerCode += `    if (!parsed.success) {\n`;
        consumerCode += `      logger.error(\`Invalid payload format for event [${ev.name}]:\`, parsed.error.flatten());\n`;
        consumerCode += `      return;\n`;
        consumerCode += `    }\n`;
        consumerCode += `    const payload = parsed.data;\n`;
      } else {
        consumerCode += `    const payload = rawPayload as ${payloadInterfaceName};\n`;
      }

      const promptText = (ev.handlerLogic || ev.description || "").trim();
      const codeBlock = (ev.body || ev.code || ev.functionBody || "").trim();

      if (promptText) {
        consumerCode += `    // --- Natural Language Instructions ---\n`;
        promptText.split("\n").forEach((line: string, idx: number) => {
          if (line.trim())
            consumerCode += `    // STEP ${idx + 1}: ${line.trim()}\n`;
        });
        consumerCode += `\n`;
      } else if (!codeBlock) {
        consumerCode += `    // STEP 1: Parse and validate event payload\n`;
        consumerCode += `    // STEP 2: Execute side effects / domain logic\n`;
      }

      if (codeBlock) {
        consumerCode += `    // --- Event Handler Code Execution ---\n`;
        codeBlock.split("\n").forEach((line: string) => {
          consumerCode += `    ${line}\n`;
        });
        consumerCode += `\n`;
      }

      consumerCode += `  } catch (error) {\n`;
      consumerCode += `    logger.error(\`Error processing event [${ev.name}]:\`, error);\n`;
      consumerCode += `  }\n`;
      consumerCode += `}\n`;

      files.push({
        filename: `src/consumer/${consumerFileName}.ts`,
        language: "typescript",
        content: consumerCode,
      });

      consumerImports.push(
        `import { ${handlerName} } from "./${consumerFileName}";`,
      );
      consumerInits.push(
        `  logger.info("Registered listener for topic: ${ev.name}");`,
      );
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

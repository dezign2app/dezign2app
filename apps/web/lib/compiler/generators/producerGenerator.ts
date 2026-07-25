import { AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile } from "../types";
import { toVarName, toPascalCase } from "../utils";

export function generateProducers(
  serviceName: string,
  nodePublishedEvents: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[]
): CompiledFile[] {
  const files: CompiledFile[] = [];
  const producerExports: string[] = [];

  if (nodePublishedEvents.length === 0) {
    files.push({
      filename: "src/producer/index.ts",
      language: "typescript",
      content: `/**
 * Event Producers for ${serviceName}
 */
// No published events configured for this service
`,
    });
  } else {
    nodePublishedEvents.forEach((ev) => {
      const producerFileName = toVarName(ev.name || "event") || "producer";
      const funcName = `publish${toPascalCase(ev.name || "event")}`;

      const producerCode = `import { createLogger } from "@workspace/logger";

const logger = createLogger("${serviceName}:Producer:${ev.name}");

/**
 * Event Producer for: "${ev.name}"
 */
export async function ${funcName}(eventData: Record<string, unknown>): Promise<void> {
  logger.info(\`Publishing event [${ev.name}]\`, eventData);
  // TODO: Connect message broker (Kafka / NATS / RabbitMQ / Redis)
}
`;
      files.push({
        filename: `src/producer/${producerFileName}.ts`,
        language: "typescript",
        content: producerCode,
      });

      producerExports.push(`export * from "./${producerFileName}";`);
    });

    const producersIndexCode = `/**
 * Event Producers for ${serviceName}
 */
${producerExports.join("\n")}
`;
    files.push({
      filename: "src/producer/index.ts",
      language: "typescript",
      content: producersIndexCode,
    });
  }

  return files;
}


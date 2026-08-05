import { AnyMessagingResource } from "@workspace/canvas/types";
import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledFile } from "@workspace/canvas/types";
import { toVarName, toPascalCase } from "../utils";
import { resolveProducerTrace } from "../traceResolver";

export function generateProducers(
  serviceName: string,
  nodePublishedEvents: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[],
  serviceNode?: BackendNode,
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
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
      const eventPascalName = toPascalCase(ev.name || "event");
      const funcName = `publish${eventPascalName}`;
      const payloadInterfaceName = `${eventPascalName}EventPayload`;

      const trace = serviceNode
        ? resolveProducerTrace(serviceNode, ev, allNodes, allEdges)
        : { incoming: [], outgoing: [] };

      let producerCode = `import { createLogger } from "@workspace/logger";
import { ${payloadInterfaceName} } from "@workspace/types";

const logger = createLogger("${serviceName}:Producer:${ev.name}");

/**
 * Event Producer for: "${ev.name}"
 */
export async function ${funcName}(eventData: ${payloadInterfaceName}): Promise<void> {
  // =========================================================================
  // 🤖 AI CODING AGENT DIRECTIVE:
`;
      if (trace.outgoing.length > 0) {
        producerCode += `  //\n  // 📤 TARGET DESTINATIONS:\n`;
        trace.outgoing.forEach((out) => {
          producerCode += `  // - ${out.nodeType}: "${out.nodeName}" (${out.detail})\n`;
          if (out.dataContext)
            producerCode += `  //   Details: ${out.dataContext}\n`;
        });
      }
      producerCode += `  // =========================================================================\n`;
      producerCode += `  logger.info(\`Publishing event [${ev.name}]\`, eventData);\n`;
      producerCode += `  // TODO: Connect message broker (Kafka / NATS / RabbitMQ / Redis)\n`;
      producerCode += `}\n`;

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

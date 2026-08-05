import { CompiledFile } from "@workspace/canvas/types";
import { toVarName, toPascalCase } from "../../utils";
import { toTopicKey } from "../utils";

/** publishers/<topicVar>.ts — typed publish function for a single topic */
export function generatePublisherFile(topicName: string, loggerPrefix: string): string {
  const key = toTopicKey(topicName);
  const Pascal = toPascalCase(topicName);
  const varName = toVarName(topicName) || "topic";
  const fnName = `publish${Pascal}`;

  const lines: string[] = [];
  lines.push(`import { Producer } from "kafkajs";`);
  lines.push(`import { getKafkaProducer } from "../client";`);
  lines.push(`import { createLogger } from "@workspace/logger";`);
  lines.push(`import { ${key}_TOPIC } from "../topics/${varName}";`);
  lines.push(``);
  lines.push(`const logger = createLogger("${loggerPrefix}:Publisher:${Pascal}");`);
  lines.push(``);
  lines.push(`export interface ${Pascal}Payload {`);
  lines.push(`  // TODO: define the fields for "${topicName}" messages`);
  lines.push(`  [key: string]: string | number | boolean | null;`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`/**`);
  lines.push(` * Publish a typed message to the "${topicName}" topic.`);
  lines.push(` * @param message - Payload conforming to ${Pascal}Payload`);
  lines.push(` * @param key     - Optional partition key`);
  lines.push(` */`);
  lines.push(`export async function ${fnName}(`);
  lines.push(`  message: ${Pascal}Payload,`);
  lines.push(`  key?: string,`);
  lines.push(`): Promise<void> {`);
  lines.push(`  const producer: Producer = await getKafkaProducer();`);
  lines.push(`  try {`);
  lines.push(`    await producer.send({`);
  lines.push(`      topic: ${key}_TOPIC,`);
  lines.push(`      messages: [`);
  lines.push(`        {`);
  lines.push(`          key: key ?? undefined,`);
  lines.push(`          value: JSON.stringify(message),`);
  lines.push(`          timestamp: Date.now().toString(),`);
  lines.push(`        },`);
  lines.push(`      ],`);
  lines.push(`    });`);
  lines.push(`    logger.info(\`Published to \${${key}_TOPIC}\`, message);`);
  lines.push(`  } catch (err) {`);
  lines.push(`    const msg = err instanceof Error ? err.message : String(err);`);
  lines.push(`    logger.error(\`Failed to publish to \${${key}_TOPIC}: \${msg}\`);`);
  lines.push(`    throw err;`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(``);
  return lines.join("\n");
}

/** publishers/index.ts — barrel + generic publishKafkaEvent utility */
export function generatePublishersIndexFile(
  publisherBarrelExports: string[],
  nodeLabel: string,
): CompiledFile {
  return {
    filename: "src/publishers/index.ts",
    language: "typescript",
    content: [
      `/** Barrel export for all typed publisher functions */`,
      ...publisherBarrelExports,
      ``,
      `// Generic low-level utility — prefer the typed publish functions above`,
      `export { getKafkaProducer } from "../client";`,
      ``,
      `import { getKafkaProducer } from "../client";`,
      `import { createLogger } from "@workspace/logger";`,
      ``,
      `const logger = createLogger("${nodeLabel}:GenericPublisher");`,
      ``,
      `/**`,
      ` * Generic publish — use the typed publish<Topic>() functions when possible.`,
      ` */`,
      `export async function publishKafkaEvent<T extends Record<string, string | number | boolean | null>>(`,
      `  topic: string,`,
      `  message: T,`,
      `  key?: string,`,
      `): Promise<void> {`,
      `  const producer = await getKafkaProducer();`,
      `  try {`,
      `    await producer.send({`,
      `      topic,`,
      `      messages: [{ key: key ?? undefined, value: JSON.stringify(message), timestamp: Date.now().toString() }],`,
      `    });`,
      `    logger.info(\`Published to \${topic}\`, message);`,
      `  } catch (err) {`,
      `    const msg = err instanceof Error ? err.message : String(err);`,
      `    logger.error(\`Failed to publish to \${topic}: \${msg}\`);`,
      `    throw err;`,
      `  }`,
      `}`,
      ``,
    ].join("\n"),
  };
}

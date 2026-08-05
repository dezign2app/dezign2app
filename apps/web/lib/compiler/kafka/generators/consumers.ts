import { CompiledFile } from "@workspace/canvas/types";
import { toVarName, toPascalCase } from "../../utils";
import { toTopicKey } from "../utils";

/** consumers/<topicVar>.ts — typed consumer for a single topic */
export function generateConsumerFile(topicName: string, loggerPrefix: string): string {
  const key = toTopicKey(topicName);
  const Pascal = toPascalCase(topicName);
  const varName = toVarName(topicName) || "topic";
  const fnName = `consume${Pascal}`;

  const lines: string[] = [];
  lines.push(`import { Consumer, EachMessagePayload } from "kafkajs";`);
  lines.push(`import { createKafkaClient } from "../client";`);
  lines.push(`import { createLogger } from "@workspace/logger";`);
  lines.push(`import { ${key}_TOPIC } from "../topics/${varName}";`);
  lines.push(``);
  lines.push(`const logger = createLogger("${loggerPrefix}:Consumer:${Pascal}");`);
  lines.push(``);
  lines.push(`/**`);
  lines.push(` * Subscribe to the "${topicName}" topic with a typed message handler.`);
  lines.push(` * @param groupId - Kafka consumer group ID`);
  lines.push(` * @param handler - Called for every message received`);
  lines.push(` * @returns The connected Consumer instance`);
  lines.push(` */`);
  lines.push(`export async function ${fnName}(`);
  lines.push(`  groupId: string,`);
  lines.push(`  handler: (payload: EachMessagePayload) => Promise<void>,`);
  lines.push(`): Promise<Consumer> {`);
  lines.push(`  const kafka = createKafkaClient();`);
  lines.push(`  const consumer = kafka.consumer({ groupId });`);
  lines.push(``);
  lines.push(`  await consumer.connect();`);
  lines.push(`  logger.info(\`Consumer group [\${groupId}] connected\`);`);
  lines.push(``);
  lines.push(`  await consumer.subscribe({ topic: ${key}_TOPIC, fromBeginning: false });`);
  lines.push(`  logger.info(\`Subscribed [\${groupId}] to \${${key}_TOPIC}\`);`);
  lines.push(``);
  lines.push(`  await consumer.run({`);
  lines.push(`    eachMessage: async (payload) => {`);
  lines.push(`      logger.info(`);
  lines.push(`        \`[\${${key}_TOPIC}] partition=\${payload.partition} offset=\${payload.message.offset}\`,`);
  lines.push(`      );`);
  lines.push(`      await handler(payload);`);
  lines.push(`    },`);
  lines.push(`  });`);
  lines.push(``);
  lines.push(`  return consumer;`);
  lines.push(`}`);
  lines.push(``);
  return lines.join("\n");
}

/** consumers/index.ts — barrel + generic startKafkaConsumer utility */
export function generateConsumersIndexFile(
  consumerBarrelExports: string[],
  nodeLabel: string,
): CompiledFile {
  return {
    filename: "src/consumers/index.ts",
    language: "typescript",
    content: [
      `/** Barrel export for all typed consumer functions */`,
      ...consumerBarrelExports,
      ``,
      `// Generic low-level utility — prefer the typed consume<Topic>() functions above`,
      `import { Consumer, EachMessagePayload } from "kafkajs";`,
      `import { createKafkaClient } from "../client";`,
      `import { createLogger } from "@workspace/logger";`,
      ``,
      `const logger = createLogger("${nodeLabel}:GenericConsumer");`,
      ``,
      `/**`,
      ` * Generic consumer — use the typed consume<Topic>() functions when possible.`,
      ` */`,
      `export async function startKafkaConsumer(`,
      `  groupId: string,`,
      `  topics: string[],`,
      `  handler: (payload: EachMessagePayload) => Promise<void>,`,
      `): Promise<Consumer> {`,
      `  const kafka = createKafkaClient();`,
      `  const consumer = kafka.consumer({ groupId });`,
      `  await consumer.connect();`,
      `  logger.info(\`Consumer group [\${groupId}] connected\`);`,
      `  for (const topic of topics) {`,
      `    await consumer.subscribe({ topic, fromBeginning: false });`,
      `    logger.info(\`Subscribed [\${groupId}] → \${topic}\`);`,
      `  }`,
      `  await consumer.run({`,
      `    eachMessage: async (payload) => {`,
      `      logger.info(\`[\${payload.topic}] partition=\${payload.partition}\`);`,
      `      await handler(payload);`,
      `    },`,
      `  });`,
      `  return consumer;`,
      `}`,
      ``,
    ].join("\n"),
  };
}

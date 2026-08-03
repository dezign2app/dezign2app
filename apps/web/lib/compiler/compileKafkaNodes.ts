import { BackendNode, BackendEdge } from "@/types/canvas";
import { KafkaTopic } from "@workspace/canvas/types";
import { CompiledFile, CompiledKafkaResult, ReusableFunction } from "./types";
import { toVarName, toPascalCase } from "./utils";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Convert a label like "Order Events Broker" → "order-events-broker" */
function toFolderName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Convert a topic name to a safe const key: "order-created" → "ORDER_CREATED" */
function toTopicKey(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Per-topic file generators
// ---------------------------------------------------------------------------

/** topics/<topicVar>.ts — one file per topic, just the constant */
function generateTopicFile(topicName: string): string {
  const key = toTopicKey(topicName);
  const varName = toVarName(topicName) || "topic";
  return [
    `/** Topic constant for: ${topicName} */`,
    `export const ${key}_TOPIC = "${topicName}" as const;`,
    `export type ${toPascalCase(topicName)}TopicName = typeof ${key}_TOPIC;`,
    "",
  ].join("\n");
}

/** publishers/<topicVar>.ts — typed publish function for a single topic */
function generatePublisherFile(topicName: string, loggerPrefix: string): string {
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

/** consumers/<topicVar>.ts — typed consumer for a single topic */
function generateConsumerFile(topicName: string, loggerPrefix: string): string {
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

// ---------------------------------------------------------------------------
// Main compiler
// ---------------------------------------------------------------------------

/**
 * Compiles Kafka nodes into a structured shared package under packages/<nodeLabel>.
 *
 * Generated file tree:
 *   src/
 *     config.ts
 *     client.ts
 *     admin.ts
 *     topics/
 *       <topicName>.ts   ← one constant per file
 *       index.ts         ← barrel + KAFKA_TOPICS object
 *     publishers/
 *       <topicName>.ts   ← typed publish fn per topic
 *       index.ts         ← barrel + generic publishKafkaEvent
 *     consumers/
 *       <topicName>.ts   ← typed consumer fn per topic
 *       index.ts         ← barrel + generic startKafkaConsumer
 *     index.ts           ← master barrel
 *   package.json
 *   tsconfig.json
 *   docker-compose.yml
 */
export function compileKafkaNodes(
  allNodes: BackendNode[],
  _allEdges: BackendEdge[] = [],
): CompiledKafkaResult {
  const files: CompiledFile[] = [];

  const kafkaNodes = allNodes.filter(
    (n) =>
      n.type === "kafka" ||
      n.type === "eventstream" ||
      (n.type === "queue" &&
        (n.data as { implementation?: string })?.implementation?.toLowerCase() === "kafka"),
  );

  // Derive package name from first node label
  const firstKafkaNode = kafkaNodes[0];
  const nodeLabel = firstKafkaNode?.data?.label || "Kafka Broker";
  const packageFolder = toFolderName(nodeLabel) || "kafka";
  const packageName = `@workspace/${packageFolder}`;

  if (kafkaNodes.length === 0) {
    return { files: [], reusableFunctions: [], packageFolder: "kafka", packageName: "@workspace/kafka" };
  }

  // Gather all topics across all Kafka nodes (de-duped by name)
  const seenTopicNames = new Set<string>();
  const allTopics: (KafkaTopic & { nodeId: string; nodeLabel: string })[] = [];

  kafkaNodes.forEach((node) => {
    const label = node.data?.label || "Kafka Broker";
    const topics = (node.data as { topics?: KafkaTopic[] })?.topics;
    if (topics && Array.isArray(topics)) {
      topics.forEach((t) => {
        if (t.name && !seenTopicNames.has(t.name)) {
          seenTopicNames.add(t.name);
          allTopics.push({ ...t, nodeId: node.id, nodeLabel: label });
        }
      });
    }
  });

  const brokerConfig = (firstKafkaNode?.data as { kafkaBroker?: { partitions?: number; replication?: number } })?.kafkaBroker ?? {};
  const defaultPartitions = brokerConfig.partitions ?? 3;
  const defaultReplication = brokerConfig.replication ?? 1;

  // ── package.json ──────────────────────────────────────────────────────────
  files.push({
    filename: "package.json",
    language: "json",
    content: JSON.stringify(
      {
        name: packageName,
        version: "0.0.0",
        private: true,
        description: `Kafka client, publishers, consumers and admin helpers for ${nodeLabel}`,
        main: "src/index.ts",
        types: "src/index.ts",
        exports: {
          ".": "./src/index.ts",
          "./topics": "./src/topics/index.ts",
          "./publishers": "./src/publishers/index.ts",
          "./consumers": "./src/consumers/index.ts",
        },
        scripts: { build: "tsc", "check-types": "tsc --noEmit" },
        dependencies: {
          kafkajs: "^2.2.4",
          "@workspace/logger": "workspace:*",
        },
        devDependencies: {
          "@workspace/typescript-config": "workspace:*",
          typescript: "^5.3.3",
        },
      },
      null,
      2,
    ),
  });

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: JSON.stringify(
      {
        extends: "@workspace/typescript-config/base.json",
        compilerOptions: { outDir: "./dist", rootDir: "./src" },
        include: ["src/**/*"],
      },
      null,
      2,
    ),
  });

  // ── src/config.ts ─────────────────────────────────────────────────────────
  files.push({
    filename: "src/config.ts",
    language: "typescript",
    content: [
      `/** Kafka broker configuration for ${nodeLabel} */`,
      `export interface KafkaClientConfig {`,
      `  brokers: string[];`,
      `  clientId: string;`,
      `  defaultPartitions: number;`,
      `  defaultReplicationFactor: number;`,
      `}`,
      ``,
      `export function getKafkaConfig(): KafkaClientConfig {`,
      `  const brokersEnv = process.env.KAFKA_BROKERS ?? "localhost:9092";`,
      `  return {`,
      `    brokers: brokersEnv.split(",").map((b) => b.trim()),`,
      `    clientId: process.env.KAFKA_CLIENT_ID ?? "${packageFolder}-client",`,
      `    defaultPartitions: Number(process.env.KAFKA_DEFAULT_PARTITIONS) || ${defaultPartitions},`,
      `    defaultReplicationFactor: Number(process.env.KAFKA_DEFAULT_REPLICATION) || ${defaultReplication},`,
      `  };`,
      `}`,
      ``,
    ].join("\n"),
  });

  // ── src/client.ts ─────────────────────────────────────────────────────────
  files.push({
    filename: "src/client.ts",
    language: "typescript",
    content: [
      `import { Kafka, KafkaConfig, Producer } from "kafkajs";`,
      `import { getKafkaConfig } from "./config";`,
      `import { createLogger } from "@workspace/logger";`,
      ``,
      `const logger = createLogger("${nodeLabel}:Client");`,
      ``,
      `let globalKafkaInstance: Kafka | null = null;`,
      `let sharedProducer: Producer | null = null;`,
      ``,
      `export function createKafkaClient(overrides?: Partial<KafkaConfig>): Kafka {`,
      `  if (globalKafkaInstance && !overrides) return globalKafkaInstance;`,
      `  const config = getKafkaConfig();`,
      `  const kafka = new Kafka({`,
      `    clientId: overrides?.clientId ?? config.clientId,`,
      `    brokers: overrides?.brokers ?? config.brokers,`,
      `    retry: { initialRetryTime: 300, retries: 8, ...overrides?.retry },`,
      `    logLevel: 2,`,
      `    ...overrides,`,
      `  });`,
      `  if (!overrides) globalKafkaInstance = kafka;`,
      `  logger.info(\`Kafka client [\${config.clientId}] → brokers: \${config.brokers.join(", ")}\`);`,
      `  return kafka;`,
      `}`,
      ``,
      `export async function getKafkaProducer(): Promise<Producer> {`,
      `  if (!sharedProducer) {`,
      `    sharedProducer = createKafkaClient().producer();`,
      `    await sharedProducer.connect();`,
      `    logger.info("Shared producer connected");`,
      `  }`,
      `  return sharedProducer;`,
      `}`,
      ``,
    ].join("\n"),
  });

  // ── src/admin.ts ──────────────────────────────────────────────────────────
  files.push({
    filename: "src/admin.ts",
    language: "typescript",
    content: [
      `import { createKafkaClient } from "./client";`,
      `import { getKafkaConfig } from "./config";`,
      `import { createLogger } from "@workspace/logger";`,
      ``,
      `const logger = createLogger("${nodeLabel}:Admin");`,
      ``,
      `export interface TopicCreationSpec {`,
      `  name: string;`,
      `  numPartitions?: number;`,
      `  replicationFactor?: number;`,
      `}`,
      ``,
      `export async function ensureKafkaTopics(topics: TopicCreationSpec[]): Promise<void> {`,
      `  const kafka = createKafkaClient();`,
      `  const admin = kafka.admin();`,
      `  try {`,
      `    await admin.connect();`,
      `    const existing = await admin.listTopics();`,
      `    const config = getKafkaConfig();`,
      `    const toCreate = topics`,
      `      .filter((t) => !existing.includes(t.name))`,
      `      .map((t) => ({`,
      `        topic: t.name,`,
      `        numPartitions: t.numPartitions ?? config.defaultPartitions,`,
      `        replicationFactor: t.replicationFactor ?? config.defaultReplicationFactor,`,
      `      }));`,
      `    if (toCreate.length > 0) {`,
      `      await admin.createTopics({ topics: toCreate, waitForLeaders: true });`,
      `      logger.info(\`Created \${toCreate.length} topic(s): \${toCreate.map((t) => t.topic).join(", ")}\`);`,
      `    } else {`,
      `      logger.info("All configured topics already exist");`,
      `    }`,
      `  } catch (err) {`,
      `    logger.error("Topic initialization error", err);`,
      `  } finally {`,
      `    await admin.disconnect();`,
      `  }`,
      `}`,
      ``,
    ].join("\n"),
  });

  // ── src/topics/<topic>.ts + topics/index.ts ───────────────────────────────
  const topicList = allTopics.length > 0
    ? allTopics
    : [{ name: "system-events", nodeId: "", nodeLabel }];

  const topicBarrelExports: string[] = [];
  const kafkaTopicsEntries: string[] = [];
  const seenTopicKeys = new Set<string>();

  topicList.forEach((t) => {
    const varName = toVarName(t.name) || "topic";
    const key = toTopicKey(t.name);
    if (seenTopicKeys.has(key)) return;
    seenTopicKeys.add(key);

    files.push({
      filename: `src/topics/${varName}.ts`,
      language: "typescript",
      content: generateTopicFile(t.name),
    });

    topicBarrelExports.push(`export * from "./${varName}";`);
    kafkaTopicsEntries.push(`  ${key}: ${key}_TOPIC,`);
  });

  // topics/index.ts — barrel + the KAFKA_TOPICS aggregate object
  files.push({
    filename: "src/topics/index.ts",
    language: "typescript",
    content: [
      `/** Barrel export for all topic constants */`,
      ...topicBarrelExports,
      ``,
      `/** Aggregate map of all configured topics. Import this for use in publishers/consumers. */`,
      `export const KAFKA_TOPICS = {`,
      ...kafkaTopicsEntries,
      `} as const;`,
      ``,
      `export type KafkaTopicName = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];`,
      ``,
    ].join("\n"),
  });

  // ── src/publishers/<topic>.ts + publishers/index.ts ──────────────────────
  const publisherBarrelExports: string[] = [];

  topicList.forEach((t) => {
    const varName = toVarName(t.name) || "topic";
    const key = toTopicKey(t.name);
    if (!seenTopicKeys.has(key)) return; // already guarded above
    const Pascal = toPascalCase(t.name);

    files.push({
      filename: `src/publishers/${varName}.ts`,
      language: "typescript",
      content: generatePublisherFile(t.name, nodeLabel),
    });

    publisherBarrelExports.push(`export * from "./${varName}";`);
  });

  // publishers/index.ts — barrel + generic publishKafkaEvent utility
  files.push({
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
  });

  // ── src/consumers/<topic>.ts + consumers/index.ts ─────────────────────────
  const consumerBarrelExports: string[] = [];

  topicList.forEach((t) => {
    const varName = toVarName(t.name) || "topic";

    files.push({
      filename: `src/consumers/${varName}.ts`,
      language: "typescript",
      content: generateConsumerFile(t.name, nodeLabel),
    });

    consumerBarrelExports.push(`export * from "./${varName}";`);
  });

  // consumers/index.ts — barrel + generic startKafkaConsumer utility
  files.push({
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
  });

  // ── src/index.ts — master barrel ──────────────────────────────────────────
  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: [
      `/**`,
      ` * ${packageName} — Kafka package for ${nodeLabel}`,
      ` *`,
      ` * Prefer the sub-path imports for tree-shaking:`,
      ` *   import { ... } from "${packageName}/topics";`,
      ` *   import { ... } from "${packageName}/publishers";`,
      ` *   import { ... } from "${packageName}/consumers";`,
      ` */`,
      `export * from "./config";`,
      `export * from "./client";`,
      `export * from "./admin";`,
      `export * from "./topics";`,
      `export * from "./publishers";`,
      `export * from "./consumers";`,
      ``,
    ].join("\n"),
  });

  // ── docker-compose.yml ────────────────────────────────────────────────────
  files.push({
    filename: "docker-compose.yml",
    language: "yaml",
    content: [
      `version: "3.8"`,
      ``,
      `services:`,
      `  zookeeper:`,
      `    image: confluentinc/cp-zookeeper:7.5.0`,
      `    container_name: ${packageFolder}-zookeeper`,
      `    ports:`,
      `      - "2181:2181"`,
      `    environment:`,
      `      ZOOKEEPER_CLIENT_PORT: 2181`,
      `      ZOOKEEPER_TICK_TIME: 2000`,
      ``,
      `  kafka:`,
      `    image: confluentinc/cp-kafka:7.5.0`,
      `    container_name: ${packageFolder}-broker`,
      `    depends_on:`,
      `      - zookeeper`,
      `    ports:`,
      `      - "9092:9092"`,
      `      - "29092:29092"`,
      `    environment:`,
      `      KAFKA_BROKER_ID: 1`,
      `      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181`,
      `      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_HOST://kafka:29092`,
      `      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT`,
      `      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT`,
      `      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1`,
      `      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0`,
      ``,
    ].join("\n"),
  });

  // ── reusableFunctions metadata for service route generators ───────────────
  const reusableFunctions: ReusableFunction[] = [
    {
      name: "publishKafkaEvent",
      importPath: `${packageName}/publishers`,
      signature: "publishKafkaEvent<T extends Record<string, string | number | boolean | null>>(topic: string, message: T, key?: string): Promise<void>",
      targetName: packageFolder,
      kind: "publish",
    },
    {
      name: "startKafkaConsumer",
      importPath: `${packageName}/consumers`,
      signature: "startKafkaConsumer(groupId: string, topics: string[], handler: (payload: EachMessagePayload) => Promise<void>): Promise<Consumer>",
      targetName: packageFolder,
      kind: "consume",
    },
    {
      name: "KAFKA_TOPICS",
      importPath: `${packageName}/topics`,
      signature: "KAFKA_TOPICS: Record<string, string>",
      targetName: packageFolder,
      kind: "custom",
    },
    // Per-topic typed publish functions
    ...topicList.map((t) => {
      const fnName = `publish${toPascalCase(t.name || "Event")}`;
      return {
        name: fnName,
        importPath: `${packageName}/publishers`,
        signature: `${fnName}(message: ${toPascalCase(t.name || "Event")}Payload, key?: string): Promise<void>`,
        targetName: t.name,
        kind: "publish" as const,
      };
    }),
    // Per-topic typed consume functions
    ...topicList.map((t) => {
      const fnName = `consume${toPascalCase(t.name || "Event")}`;
      return {
        name: fnName,
        importPath: `${packageName}/consumers`,
        signature: `${fnName}(groupId: string, handler: (payload: EachMessagePayload) => Promise<void>): Promise<Consumer>`,
        targetName: t.name,
        kind: "consume" as const,
      };
    }),
  ];

  return { files, reusableFunctions, packageFolder, packageName };
}

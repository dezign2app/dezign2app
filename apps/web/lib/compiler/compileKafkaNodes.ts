import { BackendNode, BackendEdge } from "@/types/canvas";
import { KafkaTopic } from "@workspace/canvas/types";
import { CompiledFile, CompiledKafkaResult } from "./types";
import { toVarName, toPascalCase } from "./utils";

/**
 * Compiles Kafka nodes into a shared microservices package: packages/kafka (@workspace/kafka)
 */
export function compileKafkaNodes(
  allNodes: BackendNode[],
  allEdges: BackendEdge[] = [],
): CompiledKafkaResult {
  const files: CompiledFile[] = [];

  const kafkaNodes = allNodes.filter(
    (n) =>
      n.type === "kafka" ||
      n.type === "eventstream" ||
      (n.type === "queue" &&
        (n.data as any)?.implementation?.toLowerCase() === "kafka"),
  );

  if (kafkaNodes.length === 0) {
    return { files: [] };
  }

  // Gather all topics across all Kafka nodes
  const allTopics: (KafkaTopic & { nodeId: string; nodeLabel: string })[] = [];
  kafkaNodes.forEach((node) => {
    const nodeLabel = node.data?.label || "Kafka Broker";
    const topics = (node.data as any)?.topics as KafkaTopic[] | undefined;
    if (topics && Array.isArray(topics)) {
      topics.forEach((t) => {
        allTopics.push({
          ...t,
          nodeId: node.id,
          nodeLabel,
        });
      });
    }
  });

  // 1. package.json
  const packageJson = JSON.stringify(
    {
      name: "@workspace/kafka",
      version: "0.0.0",
      private: true,
      description:
        "Shared Kafka client, producer, consumer, topic management and admin helpers",
      main: "src/index.ts",
      types: "src/index.ts",
      scripts: {
        build: "tsc",
        "check-types": "tsc --noEmit",
      },
      dependencies: {
        kafkajs: "^2.2.4",
        "@workspace/logger": "workspace:*",
        "@workspace/types": "workspace:*",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        typescript: "^5.3.3",
      },
    },
    null,
    2,
  );
  files.push({
    filename: "package.json",
    language: "json",
    content: packageJson,
  });

  // 2. tsconfig.json
  const tsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: {
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
    },
    null,
    2,
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: tsconfig,
  });

  // 3. src/config.ts
  const firstKafkaNode = kafkaNodes[0];
  const brokerConfig = (firstKafkaNode?.data as any)?.kafkaBroker || {};
  const defaultPartitions = brokerConfig.partitions || 3;
  const defaultReplication = brokerConfig.replication || 1;

  const configContent = `/**
 * Kafka Broker Configuration Defaults & Environment Resolvers
 */
export interface KafkaClientConfig {
  brokers: string[];
  clientId: string;
  defaultPartitions: number;
  defaultReplicationFactor: number;
}

export function getKafkaConfig(): KafkaClientConfig {
  const brokersEnv = process.env.KAFKA_BROKERS || "localhost:9092";
  return {
    brokers: brokersEnv.split(",").map((b) => b.trim()),
    clientId: process.env.KAFKA_CLIENT_ID || "blueprint-kafka-client",
    defaultPartitions: Number(process.env.KAFKA_DEFAULT_PARTITIONS) || ${defaultPartitions},
    defaultReplicationFactor: Number(process.env.KAFKA_DEFAULT_REPLICATION) || ${defaultReplication},
  };
}
`;
  files.push({
    filename: "src/config.ts",
    language: "typescript",
    content: configContent,
  });

  // 4. src/client.ts
  const clientContent = `import { Kafka, KafkaConfig } from "kafkajs";
import { getKafkaConfig } from "./config";
import { createLogger } from "@workspace/logger";

const logger = createLogger("KafkaClient");

let globalKafkaInstance: Kafka | null = null;

export function createKafkaClient(overrides?: Partial<KafkaConfig>): Kafka {
  if (globalKafkaInstance && !overrides) {
    return globalKafkaInstance;
  }

  const config = getKafkaConfig();
  const kafka = new Kafka({
    clientId: overrides?.clientId || config.clientId,
    brokers: overrides?.brokers || config.brokers,
    retry: {
      initialRetryTime: 300,
      retries: 8,
      ...overrides?.retry,
    },
    logLevel: 2,
    ...overrides,
  });

  if (!overrides) {
    globalKafkaInstance = kafka;
  }

  logger.info(\`Initialized Kafka client [\${config.clientId}] targeting brokers: \${config.brokers.join(", ")}\`);
  return kafka;
}
`;
  files.push({
    filename: "src/client.ts",
    language: "typescript",
    content: clientContent,
  });

  // 5. src/topics.ts
  let topicsContent = `/**
 * Configured Kafka Topics & Schema Registry Constants
 */
export const KAFKA_TOPICS = {
`;
  if (allTopics.length > 0) {
    const seenTopicKeys = new Set<string>();
    allTopics.forEach((t) => {
      const varKey = (toVarName(t.name) || "TOPIC").toUpperCase();
      if (!seenTopicKeys.has(varKey)) {
        seenTopicKeys.add(varKey);
        topicsContent += `  ${varKey}: "${t.name}",\n`;
      }
    });
  } else {
    topicsContent += `  DEFAULT_EVENTS: "system-events",\n`;
  }
  topicsContent += `} as const;\n\nexport type KafkaTopicName = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];\n`;

  files.push({
    filename: "src/topics.ts",
    language: "typescript",
    content: topicsContent,
  });

  // 6. src/producer.ts
  const producerContent = `import { Producer } from "kafkajs";
import { createKafkaClient } from "./client";
import { createLogger } from "@workspace/logger";

const logger = createLogger("KafkaProducer");
let sharedProducer: Producer | null = null;

export async function getKafkaProducer(): Promise<Producer> {
  if (!sharedProducer) {
    const kafka = createKafkaClient();
    sharedProducer = kafka.producer();
    await sharedProducer.connect();
    logger.info("Kafka Producer connected successfully");
  }
  return sharedProducer;
}

export async function publishKafkaEvent<T = Record<string, unknown>>(
  topic: string,
  message: T,
  key?: string,
): Promise<void> {
  try {
    const producer = await getKafkaProducer();
    await producer.send({
      topic,
      messages: [
        {
          key: key || undefined,
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
        },
      ],
    });
    logger.info(\`Published event to topic [\${topic}]\`, message);
  } catch (error) {
    logger.error(\`Failed to publish event to topic [\${topic}]\`, error);
    throw error;
  }
}
`;
  files.push({
    filename: "src/producer.ts",
    language: "typescript",
    content: producerContent,
  });

  // 7. src/consumer.ts
  const consumerContent = `import { Consumer, EachMessagePayload } from "kafkajs";
import { createKafkaClient } from "./client";
import { createLogger } from "@workspace/logger";

const logger = createLogger("KafkaConsumer");

export async function startKafkaConsumer(
  groupId: string,
  topics: string[],
  handler: (payload: EachMessagePayload) => Promise<void>,
): Promise<Consumer> {
  const kafka = createKafkaClient();
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  logger.info(\`Kafka Consumer connected for group [\${groupId}]\`);

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
    logger.info(\`Subscribed consumer [\${groupId}] to topic [\${topic}]\`);
  }

  await consumer.run({
    eachMessage: async (payload) => {
      logger.info(\`Received message from topic [\${payload.topic}] partition [\${payload.partition}]\`);
      await handler(payload);
    },
  });

  return consumer;
}
`;
  files.push({
    filename: "src/consumer.ts",
    language: "typescript",
    content: consumerContent,
  });

  // 8. src/admin.ts
  const adminContent = `import { createKafkaClient } from "./client";
import { getKafkaConfig } from "./config";
import { createLogger } from "@workspace/logger";

const logger = createLogger("KafkaAdmin");

export interface TopicCreationSpec {
  name: string;
  numPartitions?: number;
  replicationFactor?: number;
}

export async function ensureKafkaTopics(topics: TopicCreationSpec[]): Promise<void> {
  const kafka = createKafkaClient();
  const admin = kafka.admin();

  try {
    await admin.connect();
    const existingTopics = await admin.listTopics();
    const config = getKafkaConfig();

    const topicsToCreate = topics
      .filter((t) => !existingTopics.includes(t.name))
      .map((t) => ({
        topic: t.name,
        numPartitions: t.numPartitions || config.defaultPartitions,
        replicationFactor: t.replicationFactor || config.defaultReplicationFactor,
      }));

    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
      logger.info(\`Created \${topicsToCreate.length} Kafka topic(s): \${topicsToCreate.map((t) => t.topic).join(", ")}\`);
    } else {
      logger.info("All configured Kafka topics already exist");
    }
  } catch (error) {
    logger.error("Error during Kafka topic initialization", error);
  } finally {
    await admin.disconnect();
  }
}
`;
  files.push({
    filename: "src/admin.ts",
    language: "typescript",
    content: adminContent,
  });

  // 9. src/index.ts
  const indexContent = `/**
 * Shared Kafka Package (@workspace/kafka)
 */
export * from "./config";
export * from "./client";
export * from "./topics";
export * from "./producer";
export * from "./consumer";
export * from "./admin";
`;
  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: indexContent,
  });

  // 10. docker-compose.yml
  const dockerComposeContent = `version: "3.8"

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: kafka-zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka-broker
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_HOST://kafka:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
`;
  files.push({
    filename: "docker-compose.yml",
    language: "yaml",
    content: dockerComposeContent,
  });

  return { files };
}

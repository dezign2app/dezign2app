import { BackendNode, BackendEdge } from "@/types/canvas";
import { KafkaTopic } from "@workspace/canvas/types";
import { CompiledFile, CompiledKafkaResult } from "../types";
import { toVarName } from "../utils";
import { toFolderName, toTopicKey } from "./utils";
import {
  generatePackageJson,
  generateTsConfig,
  generateConfigFile,
  generateClientFile,
  generateAdminFile,
  generateIndexFile,
  generateDockerComposeFile,
} from "./generators/packageFiles";
import { generateTopicFile, generateTopicsIndexFile } from "./generators/topics";
import { generatePublisherFile, generatePublishersIndexFile } from "./generators/publishers";
import { generateConsumerFile, generateConsumersIndexFile } from "./generators/consumers";
import { generateReusableFunctions } from "./generators/reusableFunctions";

export * from "./utils";
export * from "./generators/packageFiles";
export * from "./generators/topics";
export * from "./generators/publishers";
export * from "./generators/consumers";
export * from "./generators/reusableFunctions";

/**
 * Compiles Kafka nodes into a structured shared package under packages/<nodeLabel>.
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

  // Package configuration files
  files.push(generatePackageJson(packageName, nodeLabel));
  files.push(generateTsConfig());
  files.push(generateConfigFile(nodeLabel, packageFolder, defaultPartitions, defaultReplication));
  files.push(generateClientFile(nodeLabel));
  files.push(generateAdminFile(nodeLabel));

  // Topics
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

  files.push(generateTopicsIndexFile(topicBarrelExports, kafkaTopicsEntries));

  // Publishers
  const publisherBarrelExports: string[] = [];

  topicList.forEach((t) => {
    const varName = toVarName(t.name) || "topic";
    const key = toTopicKey(t.name);
    if (!seenTopicKeys.has(key)) return;

    files.push({
      filename: `src/publishers/${varName}.ts`,
      language: "typescript",
      content: generatePublisherFile(t.name, nodeLabel),
    });

    publisherBarrelExports.push(`export * from "./${varName}";`);
  });

  files.push(generatePublishersIndexFile(publisherBarrelExports, nodeLabel));

  // Consumers
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

  files.push(generateConsumersIndexFile(consumerBarrelExports, nodeLabel));

  // Master barrel index & docker compose
  files.push(generateIndexFile(packageName, nodeLabel));
  files.push(generateDockerComposeFile(packageFolder));

  const reusableFunctions = generateReusableFunctions(packageName, packageFolder, topicList);

  return { files, reusableFunctions, packageFolder, packageName };
}

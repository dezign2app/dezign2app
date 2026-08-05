import { CompiledFile } from "@workspace/canvas/types";
import { toVarName, toPascalCase } from "../../utils";
import { toTopicKey } from "../utils";

/** topics/<topicVar>.ts — one file per topic, just the constant */
export function generateTopicFile(topicName: string): string {
  const key = toTopicKey(topicName);
  return [
    `/** Topic constant for: ${topicName} */`,
    `export const ${key}_TOPIC = "${topicName}" as const;`,
    `export type ${toPascalCase(topicName)}TopicName = typeof ${key}_TOPIC;`,
    "",
  ].join("\n");
}

/** topics/index.ts — barrel + the KAFKA_TOPICS aggregate object */
export function generateTopicsIndexFile(
  topicBarrelExports: string[],
  kafkaTopicsEntries: string[],
): CompiledFile {
  return {
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
  };
}

import { ReusableFunction } from "../../types";
import { toPascalCase } from "../../utils";

export function generateReusableFunctions(
  packageName: string,
  packageFolder: string,
  topicList: { name: string }[],
): ReusableFunction[] {
  return [
    {
      name: "publishKafkaEvent",
      importPath: `${packageName}/publishers`,
      signature:
        "publishKafkaEvent<T extends Record<string, string | number | boolean | null>>(topic: string, message: T, key?: string): Promise<void>",
      targetName: packageFolder,
      kind: "publish",
    },
    {
      name: "startKafkaConsumer",
      importPath: `${packageName}/consumers`,
      signature:
        "startKafkaConsumer(groupId: string, topics: string[], handler: (payload: EachMessagePayload) => Promise<void>): Promise<Consumer>",
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
}

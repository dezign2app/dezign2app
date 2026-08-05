import { ReusableFunction } from "@workspace/canvas/types";

/**
 * Pick a Kafka publish function when the endpoint has published events or
 * the route name suggests an event-producing action.
 */
export function pickKafkaPublishFunction(
  kafkaFunctions: ReusableFunction[],
): ReusableFunction | null {
  return kafkaFunctions.find((f) => f.kind === "publish" && f.name === "publishKafkaEvent") ?? null;
}

/**
 * Convert an event/topic name like "product-created" to a KAFKA_TOPICS key
 * like "PRODUCT_CREATED" that matches the generated constant.
 */
export function toKafkaTopicKey(eventName: string): string {
  return eventName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
}

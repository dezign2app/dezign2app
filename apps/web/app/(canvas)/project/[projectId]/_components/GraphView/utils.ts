import type { GraphNodeType } from "@workspace/canvas";

export function createGraphNodeData(
  type: GraphNodeType,
  label: string,
  existingNodes: Array<{ type: string; data?: { port?: string } }>,
) {
  let initialPort: string | undefined = undefined;
  if (type === "service") {
    const existingPorts = new Set(
      existingNodes
        .filter((n) => n.type === "service")
        .map((n) => parseInt(n.data?.port || "8080", 10))
        .filter((p) => !isNaN(p)),
    );
    let nextPort = 8080;
    while (existingPorts.has(nextPort)) {
      nextPort++;
    }
    initialPort = String(nextPort);
  }

  return {
    label,
    port: initialPort,
    events: type === "webClient" ? [] : undefined,
    inputs: type === "service" ? [] : undefined,
    logic: type === "service" ? [] : undefined,
    outputs: type === "service" ? [] : undefined,
    actions: type === "external" ? [] : undefined,
    topics: type === "kafka" ? [] : undefined,
    streams: type === "redis-streams" ? [] : undefined,
    queues: type === "sqs" ? [] : undefined,
    channels: type === "redis-pubsub" ? [] : undefined,
    buckets: type === "storage" ? [] : undefined,
    kafkaBroker: type === "kafka" ? {} : undefined,
    redisBroker: type === "redis-streams" ? {} : undefined,
    sqsBroker: type === "sqs" ? {} : undefined,
    tasks: type === "worker" ? [] : undefined,
    endpoints:
      type === "serverless" || type === "api_gateway" ? [] : undefined,
    searchSources: type === "search_index" ? [] : undefined,
    authRules: type === "api_gateway" ? [] : undefined,
    targetGroups: type === "load_balancer" ? [] : undefined,
    prompts: type === "llm" || type === "mcp_server" ? [] : undefined,
    tools: type === "llm" || type === "mcp_server" ? [] : undefined,
    resources: type === "mcp_server" ? [] : undefined,
    ...(type === "langgraph"
      ? {
          inputChannels: [],
          stateChannels: [
            {
              key: "messages",
              type: "messages" as const,
              reducer: "add_messages" as const,
              defaultValue: [],
            },
          ],
          graphSteps: [],
          graphEdges: [],
        }
      : {}),
  };
}

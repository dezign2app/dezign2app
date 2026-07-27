import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphOutputPort,
  LangGraphStepConfig,
  LangGraphEdgeConfig,
  LangGraphMemoryConfig,
  LangGraphToolDefinition,
} from "./types";

export const RULES_VERSION = 1;

export const NODE_TYPE_TO_RESOURCE_KIND: Record<string, string | undefined> = {
  kafka: "kafka",
  sqs: "sqs",
  "redis-streams": "redis-stream",
  "redis-pubsub": "redis-pubsub",
  queue: "generic-queue",
  pubsub: "generic-pubsub",
  eventstream: "generic-eventstream",
  storage: "storage",
  // New node types
  worker: "worker",
  serverless: "serverless",
  search_index: "search_index",
  api_gateway: "api_gateway",
  load_balancer: "load_balancer",
  webhook: "webhook",
  llm: "llm",
  mcp_server: "mcp_server",
  langgraph: "langgraph",
  langgraph_step: "langgraph_step",
};

export const LANGGRAPH_STARTER_TEMPLATE: {
  version: number;
  recursionLimit: number;
  stepTimeoutMs: number;
  inputChannels: LangGraphInputChannel[];
  stateChannels: LangGraphStateChannel[];
  outputPorts: LangGraphOutputPort[];
  tools: LangGraphToolDefinition[];
  graphSteps: LangGraphStepConfig[];
  graphEdges: LangGraphEdgeConfig[];
  memoryConfig: LangGraphMemoryConfig;
} = {
  version: 2,
  recursionLimit: 25,
  stepTimeoutMs: 30000,
  inputChannels: [],
  stateChannels: [
    { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
    { key: "summary", type: "string", reducer: "replace", defaultValue: "" },
    { key: "intent", type: "string", reducer: "replace", defaultValue: "" },
  ],
  outputPorts: [
    { id: "tool_call", label: "Tool Output Port" },
    { id: "human_gate", label: "Human Approval Port" },
    { id: "completed", label: "Completed Output Port" },
    { id: "error", label: "Error Output Port" },
  ],
  tools: [],
  graphSteps: [
    {
      id: "classify",
      name: "Classify Intent",
      type: "evaluator",
      modelConfig: { provider: "groq", model: "llama-3.1-8b-instant", temperature: 0 },
    },
    {
      id: "agent_llm",
      name: "Agent LLM Reasoning",
      type: "llm_call",
      modelConfig: { provider: "groq", model: "llama-3.3-70b-versatile", temperature: 0.2 },
    },
    { id: "memory_sync", name: "Memory Summarizer", type: "summarizer" },
  ],
  graphEdges: [
    { id: "e1", source: "START", targets: [{ id: "classify", kind: "step" }] },
    { id: "e2", source: "classify", targets: [{ id: "agent_llm", kind: "step" }] },
    {
      id: "e3",
      source: "agent_llm",
      targets: [{ id: "tool_call", kind: "port" }],
      condition: { field: "messages", operator: "has_tool_calls" },
    },
    {
      id: "e4",
      source: "agent_llm",
      targets: [{ id: "memory_sync", kind: "step" }],
      isDefault: true,
    },
    {
      id: "e5",
      source: "memory_sync",
      targets: [{ id: "completed", kind: "port" }],
    },
  ],
  memoryConfig: {
    checkpointer: "convex",
    threadScope: "session",
    autoSummarize: true,
    maxWindowMessages: 10,
  },
};

export const MESSAGING_RESOURCE_TYPES = [
  "topics",
  "streams",
  "queues",
  "channels",
  "caches",
  "buckets",
  "collections",
  "indexes",
  "routes",
  "targetGroups",
  "events",
  "prompts",
  "tools",
  "tasks",
] as const;

export type MessagingResourceType = typeof MESSAGING_RESOURCE_TYPES[number];

export const MESSAGING_NODE_TYPES = [
  "queue",
  "eventstream",
  "pubsub",
  "kafka",
  "redis-streams",
  "sqs",
  "redis-pubsub",
  "cache",
  "storage",
  "redis-cache", // Added to make sure we cover all cache/storage nodes
] as const;

export type MessagingNodeType = typeof MESSAGING_NODE_TYPES[number];

export interface LangGraphDataInput {
  graphSteps?: LangGraphStepConfig[];
  graphEdges?: LangGraphEdgeConfig[];
  [key: string]: unknown;
}

export function ensureLangGraphDataReachability<T extends LangGraphDataInput>(data: T): T {
  if (!data || !Array.isArray(data.graphSteps) || data.graphSteps.length === 0) {
    return data;
  }

  const steps = data.graphSteps;
  const edges: LangGraphEdgeConfig[] = Array.isArray(data.graphEdges) ? data.graphEdges : [];
  const stepIds = new Set(steps.map((s) => s.id));

  const visited = new Set<string>();
  const queue: string[] = ["START"];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);

    const outgoing = edges.filter((e) => e.source === curr);
    outgoing.forEach((e) => {
      if (e.targets && Array.isArray(e.targets)) {
        e.targets.forEach((t) => {
          if (t.kind === "step" && stepIds.has(t.id)) {
            queue.push(t.id);
          }
        });
      }
    });
  }

  const nextEdges: LangGraphEdgeConfig[] = [...edges];
  let lastReachable = "START";

  steps.forEach((step) => {
    if (!visited.has(step.id)) {
      nextEdges.push({
        id: `auto_edge_${step.id}`,
        source: lastReachable,
        targets: [{ id: step.id, kind: "step" }],
      });
      visited.add(step.id);
      lastReachable = step.id;
    } else {
      lastReachable = step.id;
    }
  });

  return {
    ...data,
    graphSteps: steps,
    graphEdges: nextEdges,
  };
}


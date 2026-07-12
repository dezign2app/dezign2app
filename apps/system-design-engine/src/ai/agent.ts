import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

const addNodeTool = tool(
  async ({ type, label, data }) => {
    // Return empty since the side effect is handled by client receiving the tool call
    return `Added node ${label} of type ${type}`;
  },
  {
    name: "add_node",
    description: `Add a node to the backend canvas. Node types:
- 'service': A backend API / microservice
- 'database': A database reference node
- 'sqs': Amazon SQS broker (stores queues in data.queues)
- 'redis-pubsub': Redis Pub/Sub broker (stores channels in data.channels)
- 'kafka': Apache Kafka broker (stores topics in data.topics)
- 'redis-streams': Redis Streams broker (stores streams in data.streams)
- 'entity': A database table/schema entity
- 'webClient': A frontend client or page
- 'external': An external third-party API
- 'group': A logical grouping node`,
    schema: z.object({
      type: z.enum(["service", "database", "sqs", "redis-pubsub", "kafka", "redis-streams", "entity", "group", "webClient", "external"]),
      label: z.string().describe("Name of the node"),
      data: z.any().optional().describe("Additional data for the node. For 'entity': { columns: [{ name, type, isPrimaryKey, isForeignKey, isNotNull, isUnique }] }."),
    }),
  }
);

const updateNodeTool = tool(
  async ({ id, changes }) => {
    return `Updated node ${id}`;
  },
  {
    name: "update_node",
    description: "Update an existing node on the backend canvas.",
    schema: z.object({
      id: z.string(),
      changes: z.any(),
    }),
  }
);

const deleteNodeTool = tool(
  async ({ id }) => {
    return `Deleted node ${id}`;
  },
  {
    name: "delete_node",
    description: "Delete a node from the backend canvas.",
    schema: z.object({
      id: z.string(),
    }),
  }
);

const addEdgeTool = tool(
  async ({ source, target, type, data }) => {
    return `Added edge from ${source} to ${target}`;
  },
  {
    name: "add_edge",
    description: "Connect two nodes on the backend canvas.",
    schema: z.object({
      source: z.string().describe("Source node ID"),
      target: z.string().describe("Target node ID"),
      type: z.enum(["connection", "foreign-key", "message"]),
      data: z.any().optional(),
    }),
  }
);

const runAutoLayoutTool = tool(
  async () => {
    return `Requested auto layout`;
  },
  {
    name: "run_auto_layout",
    description: "Automatically arrange nodes on the backend canvas.",
    schema: z.object({}),
  }
);

const tools = [addNodeTool, updateNodeTool, deleteNodeTool, addEdgeTool, runAutoLayoutTool];

export function createGraph() {
  const apiKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_LLM_MODEL
  if (!apiKey || !model) {
    throw new Error("Missing environment variables: GROQ_API_KEY or GROQ_LLM_MODEL");
  }
  const llm = new ChatGroq({
    apiKey,
    model,
    temperature: 0,
  });

  const toolNode = new ToolNode(tools);
  const modelWithTools = llm.bindTools(tools);

  const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && "tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
      return "tools";
    }
    return "__end__";
  };

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const response = await modelWithTools.invoke(state.messages);
    return { messages: [response] };
  };

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return workflow.compile();
}

export const systemPromptTemplate = (canvasStateContext: string) =>{

  return `You are an expert AI software architect and UI designer. 
    Your job is to assist the user in designing their system using the provided tools.
    You are currently viewing the system design canvas.

    If working on a Database Schema, use 'entity' nodes and populate 'data.columns' with an array of { name, type, isPrimaryKey, isForeignKey, isNotNull, isUnique }. Use 'group' nodes to group tables, and 'foreign-key' edges to connect tables, specifying 'sourceCardinality' and 'targetCardinality' (1 or N) in 'data'.

    When adding messaging infrastructure, choose the correct node type based on the messaging pattern:
    - Use 'sqs' for Amazon SQS message queues. Store queues in 'data.queues'. Set broker settings under 'data.sqsBroker'. Valid fields: delivery, failureHandling, and sqsBroker: { visibilityTimeout, delay, fifo: boolean }.
    - Use 'redis-pubsub' for Redis Pub/Sub channels. Store channels in 'data.channels'. Valid fields: delivery, and redisPubSubBroker.
    - Use 'kafka' for Apache Kafka messaging brokers. Store topics in 'data.topics'. Set broker configuration under 'data.kafkaBroker' (partitions, replication, compression, ttl, batchSize). Valid fields: delivery, ordering, retention.
    - Use 'redis-streams' for Redis Streams messaging brokers. Store streams in 'data.streams'. Set broker configuration under 'data.redisBroker' (consumerGroup). Valid fields: delivery, ordering, retention.
    NEVER mix implementation fields across node types.

    Current Canvas State:
    ${canvasStateContext}

    Be concise in your textual responses. Prefer using tools to update the canvas to match the user's intent.`;
}

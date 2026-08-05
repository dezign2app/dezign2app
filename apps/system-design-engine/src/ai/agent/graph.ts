import { ChatGroq } from "@langchain/groq";
import { StateGraph } from "@langchain/langgraph";
import { GraphAnnotation } from "../state";
import { createAgentNodes } from "./agentNodes";
import { createRequirementsAndPlanNodes } from "./requirementsAndPlanNodes";
import {
  routeAfterIntent,
  shouldContinue,
  afterTools,
  shouldContinueReflect,
} from "./router";

let apiKeyIndex = 0;

export function createGraph() {
  const apiKeyStr = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_LLM_MODEL;
  if (!apiKeyStr || !model) {
    throw new Error(
      "Missing environment variables: GROQ_API_KEY or GROQ_LLM_MODEL",
    );
  }

  const apiKeys = apiKeyStr
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  if (apiKeys.length === 0) {
    throw new Error("GROQ_API_KEY is empty or invalid");
  }

  const apiKey = apiKeys[apiKeyIndex];
  apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;

  const llm = new ChatGroq({ apiKey, model, temperature: 0, maxTokens: 4000 });

  const agentNodes = createAgentNodes(llm);
  const reqPlanNodes = createRequirementsAndPlanNodes(llm);

  const workflow = new StateGraph(GraphAnnotation)
    .addNode("intentIdentifier", agentNodes.intentIdentifier)
    .addNode("chatAgent", agentNodes.chatAgent)
    .addNode("requirementsAgent", reqPlanNodes.requirementsAgent)
    .addNode("syncRequirements", reqPlanNodes.syncRequirements)
    .addNode("planAgent", reqPlanNodes.planAgent)
    .addNode("approvePlan", reqPlanNodes.approvePlan)
    .addNode("approveSchema", reqPlanNodes.approveSchema)
    .addNode("approveNodes", reqPlanNodes.approveNodes)
    .addNode("canvasAgent", agentNodes.canvasAgent)
    .addNode("tools", agentNodes.customToolNode)
    .addNode("reflectAgent", agentNodes.reflectAgent)

    .addEdge("__start__", "intentIdentifier")
    .addConditionalEdges("intentIdentifier", routeAfterIntent)

    .addEdge("chatAgent", "__end__")
    .addEdge("requirementsAgent", "__end__")
    .addEdge("syncRequirements", "planAgent")
    .addEdge("planAgent", "__end__")
    .addEdge("approvePlan", "canvasAgent")
    .addEdge("approveSchema", "canvasAgent")
    .addEdge("approveNodes", "canvasAgent")

    .addConditionalEdges("canvasAgent", shouldContinue)
    .addConditionalEdges("tools", afterTools)
    .addConditionalEdges("reflectAgent", shouldContinueReflect);

  return workflow.compile();
}

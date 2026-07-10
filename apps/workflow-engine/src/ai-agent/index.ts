import { getAIModel } from "@/lib/ai-model";
import { StateGraph, START, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { classifyIntent } from "./nodes/classify-intent";
import { getConvexClient } from "./convex-client";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";

export interface ChatHistoryItem {
  role: "USER" | "AI" | "SYSTEM";
  content: string;
  [key: string]: any;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface EditOperation {
  type: 'chat_response';
  content: string;
}

// ============= STATE ANNOTATION =============
export const AgentStateAnnotation = Annotation.Root({
  // Input
  userMessage: Annotation<string>,
  conversationId: Annotation<string | undefined>,
  sessionToken: Annotation<string>,
  
  // Processing
  intent: Annotation<'kanban' | 'workflow' | 'general' | null>,
  intentReasoning: Annotation<string | undefined>,
  chatHistory: Annotation<ChatHistoryItem[]>,
  
  // Output
  operations: Annotation<EditOperation[]>,
  error: Annotation<string | undefined>,
});

// ============= AI CLIENT =============
const aiModel = getAIModel();

export async function callAI(messages: ChatMessage[], options: {
  returnJson?: boolean;
  temperature?: number;
  tags?: string[];
  config?: RunnableConfig;
} = {}) {
  const tags = [...(options.tags || []), ...(options.config?.tags || [])];
  const stream = await aiModel.stream(messages as BaseLanguageModelInput, { ...options.config, tags });

  let text = "";
  for await (const chunk of stream) {
    if (typeof chunk.content === 'string') text += chunk.content;
    else if (Array.isArray(chunk.content)) {
      for (const part of chunk.content) {
        if (typeof part === 'string') text += part;
        else if (part?.type === 'text') text += part.text ?? '';
      }
    }
  }

  if (options.returnJson) {
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }
  return text;
}

// ============= NODES =============

async function initialize(state: typeof AgentStateAnnotation.State, config: RunnableConfig) {
  console.log("🚀 Initializing AI Agent...");
  
  let chatHistory: ChatHistoryItem[] = [];
  if (state.conversationId) {
    try {
      const client = getConvexClient(config?.configurable?.token);
      const messages = await client.query(api.ai.messages.getLastNMessages, {
        conversationId: state.conversationId as Id<"conversations">,
        n: 20
      });
      chatHistory = (messages || []).map((m) => ({
        ...m,
        role: m.role,
        content: m.content,
      }));
    } catch (e) {
      console.error("Failed to fetch history:", e);
    }
  }

  return { chatHistory };
}

async function handleGeneral(state: typeof AgentStateAnnotation.State, config: RunnableConfig) {
  console.log("💬 Handling general chat");
  const response = await callAI([
    ...state.chatHistory.map(m => ({ role: m.role.toLowerCase() as "user" | "assistant" | "system", content: m.content })),
    { role: "user", content: state.userMessage }
  ], { tags: ["chat_stream"], config });

  return {
    operations: [
      {
        type: "chat_response",
        content: response
      }
    ]
  };
}

// ============= ROUTING LOGIC =============
function routeByIntent(state: typeof AgentStateAnnotation.State): string {
  if (state.intent === 'kanban' || state.intent === 'workflow') return END; // Handled by handler.ts -> Inngest
  return 'handleGeneral';
}

// ============= BUILD THE GRAPH =============
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('initialize', initialize)
  .addNode('classifyIntent', classifyIntent)
  .addNode('handleGeneral', handleGeneral)

  .addEdge(START, 'initialize')
  .addEdge('initialize', 'classifyIntent')
  .addConditionalEdges('classifyIntent', routeByIntent)
  .addEdge('handleGeneral', END);

export const aiAgent = workflow.compile();

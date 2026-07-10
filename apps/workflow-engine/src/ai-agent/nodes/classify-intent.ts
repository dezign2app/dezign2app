import { AgentStateAnnotation, callAI, ChatHistoryItem, ChatMessage } from "../index";

export async function classifyIntent(state: typeof AgentStateAnnotation.State) {
  console.log("🔍 Classifying intent...");
  
  const chatHistoryContext = state.chatHistory?.length > 0 
    ? state.chatHistory.map((m: ChatHistoryItem) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")
    : "No recent history.";

  const prompt = `You are an AI assistant for a Kanban board.
Analyze the user's request and classify it into ONE of these categories:

1. **kanban**: The user wants to perform an action on the Kanban board (create, move, delete, update) OR the user is responding to a follow-up question about a Kanban task.
   - Examples: "Create a task called 'Fix bug'", "Move task 1 to In Progress", "Delete the 'Write tests' task", "yes", "no".
2. **workflow**: The user wants to create, modify, or execute a workflow (e.g., using LLM, API calls, web scraping).
   - Examples: "Create a workflow to summarize text", "Build a flow that calls an API and then uses LLM", "Execute the scraping workflow".
3. **general**: A generic conversational query, greeting, or question that is NOT related to a current or proposed action.
   - Examples: "Hi", "How are you?", "What can you do?".

User Message: "${state.userMessage}"

Recent Conversation History:
${chatHistoryContext}

Return ONLY valid JSON:
{
  "intent": "kanban" | "workflow" | "general",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}
`;

  try {
    const messages: ChatMessage[] = state.chatHistory?.length > 0 
      ? state.chatHistory.map((m: ChatHistoryItem) => ({
          role: m.role?.toLowerCase() === 'user' ? 'user' : 'assistant',
          content: m.content || ""
      }))
      : [];

    messages.push({ role: "user", content: prompt });

    const result = await callAI(messages, { returnJson: true });
    console.log("Intent classification result:", result);
    return {
      intent: result.intent,
      confidence: result.confidence,
      intentReasoning: result.reasoning
    };
  } catch (error) {
    console.error("Intent classification failed:", error);
    return { 
      intent: "general",
      confidence: 0.5,
      error: "Failed to classify intent"
    };
  }
}

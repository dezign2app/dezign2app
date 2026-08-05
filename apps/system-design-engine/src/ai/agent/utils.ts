import { BaseMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { requirementsSchema } from "../state";

export const sanitizeMessages = (messages: BaseMessage[]) => {
  return messages
    .filter((m) => m.type !== "tool")
    .map((m) => {
      if (
        m.type === "ai" &&
        (m as AIMessage).tool_calls &&
        (m as AIMessage).tool_calls!.length > 0
      ) {
        return new AIMessage(m.content || "(System design updated)");
      }
      return m;
    });
};

export const parseRequirementsWithRetry = async (
  llm: ChatGroq,
  prompt: string,
  config: RunnableConfig,
  maxAttempts = 2,
) => {
  let lastError = "";
  for (let i = 0; i < maxAttempts; i++) {
    const suffix = lastError
      ? `\n\nYour previous output was invalid: ${lastError}. Return valid JSON only, no prose, no markdown fences.`
      : "";
    console.log(
      `[DEBUG] Helper: parseRequirementsWithRetry invoking LLM (attempt ${i})`,
    );
    const response = await llm.invoke(
      [new SystemMessage(prompt + suffix)],
      config,
    );
    try {
      const cleaned = response.content
        .toString()
        .replace(/```json|```/g, "")
        .trim();
      return requirementsSchema.parse(JSON.parse(cleaned));
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  return null;
};

import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Tool } from "@langchain/core/tools";

// ============================================================
// 🔀 SWITCH MODELS HERE — one place, affects the entire app
// ============================================================
const AI_PROVIDER = "groq" as "gemini" | "groq";

const MODEL_CONFIG = {
  gemini: {
    model: "gemini-3-flash-preview",
  },
  groq: {
    model: "openai/gpt-oss-120b",
    maxTokens: 8192,
    maxRetries: 2,
  },
};

/** Returns a plain (no tools) AI model instance. */
export function getAIModel() {
  if (AI_PROVIDER === "groq") {
    return new ChatGroq({
      model: MODEL_CONFIG.groq.model,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return new ChatGoogleGenerativeAI({
    model: MODEL_CONFIG.gemini.model,
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

/** Returns an AI model instance pre-bound with the given tools. */
function getAIModelWithTools(tools: Tool[]) {
  return getAIModel().bindTools(tools);
}

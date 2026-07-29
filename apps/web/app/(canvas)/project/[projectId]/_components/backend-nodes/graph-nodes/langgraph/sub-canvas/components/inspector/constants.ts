import { LLM_PROVIDERS } from "@workspace/canvas/constants";

export interface ProviderPreset {
  label: string;
  defaultModel: string;
  defaultUrl: string;
  defaultApiKeyEnv?: string;
  models: string[];
}

export const LLM_PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  [LLM_PROVIDERS.OPENAI]: {
    label: "OpenAI (ChatGPT)",
    defaultModel: "gpt-4o-mini",
    defaultUrl: "https://api.openai.com/v1/chat/completions",
    defaultApiKeyEnv: "OPENAI_API_KEY",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
  },
  [LLM_PROVIDERS.ANTHROPIC]: {
    label: "Anthropic (Claude)",
    defaultModel: "claude-3-5-sonnet-20241022",
    defaultUrl: "https://api.anthropic.com/v1/messages",
    defaultApiKeyEnv: "ANTHROPIC_API_KEY",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  },
  [LLM_PROVIDERS.GOOGLE]: {
    label: "Google (Gemini)",
    defaultModel: "gemini-1.5-flash",
    defaultUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    defaultApiKeyEnv: "GEMINI_API_KEY",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
  },
  [LLM_PROVIDERS.GROQ]: {
    label: "Groq",
    defaultModel: "openai/gpt-oss-120b",
    defaultUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultApiKeyEnv: "GROQ_API_KEY",
    models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"],
  },
  [LLM_PROVIDERS.CUSTOM]: {
    label: "Custom RAW API",
    defaultModel: "custom-model",
    defaultUrl: "http://localhost:8080/v1",
    defaultApiKeyEnv: "CUSTOM_API_KEY",
    models: [],
  },
};




export interface ProviderPreset {
  label: string;
  defaultModel: string;
  defaultUrl: string;
  defaultApiKeyEnv?: string;
  models: string[];
}

export const LLM_PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  openai: {
    label: "OpenAI (ChatGPT)",
    defaultModel: "gpt-4o-mini",
    defaultUrl: "https://api.openai.com/v1/chat/completions",
    defaultApiKeyEnv: "OPENAI_API_KEY",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
  },
  anthropic: {
    label: "Anthropic (Claude)",
    defaultModel: "claude-3-5-sonnet-20241022",
    defaultUrl: "https://api.anthropic.com/v1/messages",
    defaultApiKeyEnv: "ANTHROPIC_API_KEY",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  },
  google: {
    label: "Google (Gemini)",
    defaultModel: "gemini-1.5-flash",
    defaultUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    defaultApiKeyEnv: "GEMINI_API_KEY",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
  },
  groq: {
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    defaultUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultApiKeyEnv: "GROQ_API_KEY",
    models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b"],
  },
  custom: {
    label: "Custom RAW API",
    defaultModel: "custom-model",
    defaultUrl: "http://localhost:8080/v1",
    defaultApiKeyEnv: "CUSTOM_API_KEY",
    models: [],
  },
};




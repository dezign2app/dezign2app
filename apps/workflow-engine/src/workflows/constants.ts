export const WORKFLOW_STREAM_TTL_SECONDS = 60 * 60;
export const EXPRESSION_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g;
export const SENSITIVE_KEY_PATTERN =
  /authorization|token|api[-_]?key|secret|password|credential|access[-_]?key|appid|sid|key/i;

export const LLM_PROVIDERS = {
  OPENAI: {
    baseUrl: "https://api.openai.com/v1",
  },
  GROQ: {
    baseUrl: "https://api.groq.com/openai/v1",
  },
  GEMINI: {
    baseUrl: (model: string, apiKey: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
  },
};

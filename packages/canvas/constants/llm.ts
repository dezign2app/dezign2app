// ─── LLM Providers ─────────────────────────────────────────────────────────────
export const LLM_PROVIDERS = {
  GROQ: "groq",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
  CUSTOM: "custom",
} as const;

export const ALL_LLM_PROVIDER_VALUES = Object.values(LLM_PROVIDERS) as [
  (typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS],
  ...(typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS][],
];

export const LLM_PROVIDER_MAP = {
  [LLM_PROVIDERS.GROQ]: { value: LLM_PROVIDERS.GROQ, label: "Groq" },
  [LLM_PROVIDERS.OPENAI]: { value: LLM_PROVIDERS.OPENAI, label: "OpenAI" },
  [LLM_PROVIDERS.ANTHROPIC]: {
    value: LLM_PROVIDERS.ANTHROPIC,
    label: "Anthropic",
  },
  [LLM_PROVIDERS.GOOGLE]: { value: LLM_PROVIDERS.GOOGLE, label: "Google" },
  [LLM_PROVIDERS.CUSTOM]: {
    value: LLM_PROVIDERS.CUSTOM,
    label: "Custom / Other",
  },
} as const;

export const LLM_PROVIDER_OPTIONS = Object.values(LLM_PROVIDER_MAP);

export const LLM_PROVIDER_GROQ = LLM_PROVIDERS.GROQ;
export const LLM_PROVIDER_OPENAI = LLM_PROVIDERS.OPENAI;
export const LLM_PROVIDER_ANTHROPIC = LLM_PROVIDERS.ANTHROPIC;
export const LLM_PROVIDER_GOOGLE = LLM_PROVIDERS.GOOGLE;
export const LLM_PROVIDER_CUSTOM = LLM_PROVIDERS.CUSTOM;
export const LLM_PROVIDER_OTHER = LLM_PROVIDERS.CUSTOM;

// ─── Default LLM Configuration Constants ─────────────────────────────────────
export const DEFAULT_LLM_PROVIDER = LLM_PROVIDERS.GROQ;
export const DEFAULT_LLM_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_LLM_BASE_URL =
  "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_LLM_API_KEY_ENV = "GROQ_API_KEY";
export const DEFAULT_LLM_TEMPERATURE = 0.2;

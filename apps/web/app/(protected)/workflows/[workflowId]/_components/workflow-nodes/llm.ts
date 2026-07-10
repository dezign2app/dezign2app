import { Bot } from "lucide-react";
import type { LlmNodeConfig, WorkflowNodeDefinition } from "../workflow-editor-types";

export const llmNode: WorkflowNodeDefinition = {
  title: "LLM",
  paletteDescription: "Call a configured language model and shape the output.",
  badge: "AI",
  minimapColor: "var(--color-chart-4)",
  accentClassName: "from-chart-4/20 via-chart-4/10 to-transparent border-chart-4/30",
  icon: Bot,
  deletable: true,
  hasTargetHandle: true,
  sourceHandles: [{ id: "out", label: "Next" }],
  createDefaultConfig: () =>
    ({
      provider: "groq",
      model: "openai/gpt-oss-120b",
      systemPrompt: "",
      prompt: "",
      outputMode: "json",
      temperature: 0.2,
      apiKeySecretId: undefined,
    }) satisfies LlmNodeConfig,
  summarize: (config) => {
    const typedConfig = config as LlmNodeConfig;

    return [
      `${typedConfig.provider || "Select provider"} / ${typedConfig.model || "Select model"}`,
      `Output: ${(typedConfig.outputMode || "TEXT").toUpperCase()}`,
    ];
  },
};

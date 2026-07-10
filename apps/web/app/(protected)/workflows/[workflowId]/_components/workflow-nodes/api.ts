import { Globe } from "lucide-react";
import type { ApiNodeConfig, WorkflowNodeDefinition } from "../workflow-editor-types";

export const apiNode: WorkflowNodeDefinition = {
  title: "API Call",
  paletteDescription: "Call any HTTP endpoint with headers, query, and body.",
  badge: "Execution",
  minimapColor: "var(--color-chart-3)",
  accentClassName: "from-chart-3/20 via-chart-3/10 to-transparent border-chart-3/30",
  icon: Globe,
  deletable: true,
  hasTargetHandle: true,
  sourceHandles: [{ id: "out", label: "Next" }],
  createDefaultConfig: () =>
    ({
      method: "GET",
      url: "",
      headers: "",
      query: "",
      body: "",
      authType: "none",
      authSecretId: undefined,
      authHeaderName: "",
      authQueryName: "",
      authUsername: "",
      timeoutMs: 30000,
    }) satisfies ApiNodeConfig,
  summarize: (config) => {
    const typedConfig = config as ApiNodeConfig;

    return [
      `${typedConfig.method} ${typedConfig.url}`,
      !typedConfig.authType || typedConfig.authType === "none"
        ? "No authentication"
        : `Auth: ${typedConfig.authType.replaceAll("_", " ")}`,
    ];
  },
};

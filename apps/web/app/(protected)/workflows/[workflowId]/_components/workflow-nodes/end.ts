import { CircleStop } from "lucide-react";
import type { EndNodeConfig, WorkflowNodeDefinition } from "../workflow-editor-types";

export const endNode: WorkflowNodeDefinition = {
  title: "End",
  paletteDescription: "Final output status of the workflow.",
  badge: "Result",
  minimapColor: "var(--color-chart-5)",
  accentClassName: "from-chart-5/20 via-chart-5/10 to-transparent border-chart-5/30",
  icon: CircleStop,
  deletable: true,
  hasTargetHandle: true,
  sourceHandles: [],
  createDefaultConfig: () =>
    ({
      resultExpression: "{{prev.output}}",
    }) satisfies EndNodeConfig,
  summarize: (config) => {
    const typedConfig = config as EndNodeConfig;
    return [typedConfig.resultExpression || "Set a result expression"];
  },
};

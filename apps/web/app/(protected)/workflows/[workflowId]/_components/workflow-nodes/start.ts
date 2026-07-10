import { CirclePlay } from "lucide-react";
import type { StartNodeConfig, WorkflowNodeDefinition } from "../workflow-editor-types";

export const startNode: WorkflowNodeDefinition = {
  title: "Start",
  paletteDescription: "Entry point for workflow.",
  badge: "Trigger",
  minimapColor: "var(--color-chart-1)",
  accentClassName: "from-chart-1/20 via-chart-1/10 to-transparent border-chart-1/30",
  icon: CirclePlay,
  deletable: true,
  hasTargetHandle: false,
  sourceHandles: [{ id: "out", label: "Next" }],
  createDefaultConfig: () =>
    ({
      triggerType: "manual",
      cronExpression: "",
      timezone: "UTC",
    }) satisfies StartNodeConfig,
  summarize: (config) => {
    const typedConfig = config as StartNodeConfig;

    return typedConfig.triggerType === "cron"
      ? [
          "Cron trigger",
          typedConfig.cronExpression || "Missing cron expression",
          typedConfig.timezone || "Missing timezone",
        ]
      : ["Manual test trigger", "Runs current draft input payload"];
  },
};

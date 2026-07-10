import { GitBranch } from "lucide-react";
import type { ConditionNodeConfig, WorkflowNodeDefinition } from "../workflow-editor-types";

export const conditionNode: WorkflowNodeDefinition = {
  title: "Condition",
  paletteDescription: "Split execution into explicit true and false branches.",
  badge: "Branch",
  minimapColor: "var(--color-chart-2)",
  accentClassName: "from-chart-2/20 via-chart-2/10 to-transparent border-chart-2/30",
  icon: GitBranch,
  deletable: true,
  hasTargetHandle: true,
  sourceHandles: [
    { id: "true", label: "True" },
    { id: "false", label: "False" },
  ],
  createDefaultConfig: () =>
    ({
      leftOperand: "{{prev.output}}",
      operator: "equals",
      rightOperand: "",
    }) satisfies ConditionNodeConfig,
  summarize: (config) => {
    const typedConfig = config as ConditionNodeConfig;

    return [
      typedConfig.leftOperand || "Left operand",
      `${(typedConfig.operator || "equals").replace(/_/g, " ")} ${
        typedConfig.rightOperand || "right operand"
      }`,
    ];
  },
};

import { z } from "zod";

export const leafComparisonSchema = z.object({
  field: z.string(),
  operator: z.enum([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "contains",
    "in",
    "is_not_null",
    "has_tool_calls",
  ]),
  value: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])),
      z.record(z.unknown()),
    ])
    .optional(),
});

export type LeafComparison = z.infer<typeof leafComparisonSchema>;

export type ConditionAst =
  | LeafComparison
  | { and: ConditionAst[] }
  | { or: ConditionAst[] }
  | { not: ConditionAst };

export const conditionAstSchema: z.ZodType<ConditionAst> = z.lazy(() =>
  z.union([
    leafComparisonSchema,
    z.object({ and: z.array(conditionAstSchema) }),
    z.object({ or: z.array(conditionAstSchema) }),
    z.object({ not: conditionAstSchema }),
  ]),
);

export const graphEdgeTargetSchema = z.object({
  id: z.string(),
  kind: z.enum(["step", "port", "end"]),
  targetHandle: z.string().optional(),
});
export type GraphEdgeTarget = z.infer<typeof graphEdgeTargetSchema>;

export const sendConfigSchema = z.object({
  enabled: z.boolean().default(false),
  itemsField: z.string(),
  itemTarget: graphEdgeTargetSchema,
  joinStepId: z.string(),
  batchErrorPolicy: z
    .enum(["fail_fast", "ignore_failures", "collect_errors"])
    .default("fail_fast"),
});
export type SendConfig = z.infer<typeof sendConfigSchema>;

export const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  targets: z.array(graphEdgeTargetSchema).default([]),
  condition: conditionAstSchema.optional(),
  isDefault: z.boolean().default(false),
  sendConfig: sendConfigSchema.optional(),
});
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

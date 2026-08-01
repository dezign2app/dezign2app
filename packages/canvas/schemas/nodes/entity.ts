import { z } from "zod";
import { baseNodeDataSchema } from "./base";

export const entityDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    dbType: z.enum(["relational", "vector"]).optional(),
    embeddingModel: z.string().optional(),
    dimensions: z.number().optional(),
    metric: z.enum(["Cosine", "Dot Product", "Euclidean"]).optional(),
    columns: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        isPrimaryKey: z.boolean().optional(),
        isForeignKey: z.boolean().optional(),
        isNotNull: z.boolean().optional(),
        isUnique: z.boolean().optional(),
        references: z
          .object({
            table: z.string(),
            column: z.string(),
          })
          .optional(),
      }),
    ),
    indexes: z
      .array(
        z.object({
          name: z.string(),
          columns: z.string(),
          isUnique: z.boolean().optional(),
        }),
      )
      .optional(),
  })
  .strict();

export const entityColumnInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  isPrimaryKey: z.boolean().optional(),
  isForeignKey: z.boolean().optional(),
  isNotNull: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  references: z
    .object({
      table: z.string(),
      column: z.string(),
    })
    .optional()
    .describe(
      "If this is a foreign key, which table and column it references in this group",
    ),
});

export const entityDataInputSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  dbType: z.enum(["relational", "vector"]).optional(),
  embeddingModel: z.string().optional(),
  dimensions: z.number().optional(),
  metric: z.enum(["Cosine", "Dot Product", "Euclidean"]).optional(),
  columns: z.array(entityColumnInputSchema),
});

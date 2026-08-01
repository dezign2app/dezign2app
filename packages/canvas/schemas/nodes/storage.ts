import { z } from "zod";
import { baseNodeDataSchema, resourceItemSchema } from "./base";

export const storageDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    buckets: z.array(resourceItemSchema).optional(),
  })
  .strict();

import { defineSchema } from "convex/server";
import { authTables } from "./schema/auth";
import { workflowTables } from "./schema/workflows";
import { featureTables } from "./schema/features";

export default defineSchema({
  ...authTables,
  ...workflowTables,
  ...featureTables,
});

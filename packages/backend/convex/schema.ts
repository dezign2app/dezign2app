import { defineSchema } from "convex/server";
import { authTables } from "./schema/auth";
import { workflowTables } from "./schema/workflows";
import { featureTables } from "./schema/features";
import { requirementsTables } from "./schema/requirements";
import { langgraphTables } from "./schema/langgraph";

export default defineSchema({
  ...authTables,
  ...workflowTables,
  ...featureTables,
  ...requirementsTables,
  ...langgraphTables,
});

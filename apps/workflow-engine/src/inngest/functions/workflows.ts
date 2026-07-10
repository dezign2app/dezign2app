import { Id } from "@workspace/backend/_generated/dataModel";
import { inngest } from "../client";
import { executeWorkflowRun } from "../../workflows/runtime";

export const executeWorkflowRunFunction = inngest.createFunction(
  {
    id: "execute-workflow-run",
    name: "Execute Workflow Run",
  },
  {
    event: "workflow/run.requested",
  },
  async ({ event, step }) => {
    const { runId, sessionToken } = event.data;

    return await step.run(`workflow-run-${runId}`, async () => {
      return await executeWorkflowRun({
        runId: runId as Id<"workflow_runs">,
        sessionToken,
      });
    });
  },
);

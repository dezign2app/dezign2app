import { serve } from "inngest/express";
import { inngest } from "../inngest/client";
import { handleKanbanAction } from "../inngest/functions/kanban";
import { executeWorkflowRunFunction } from "../inngest/functions/workflows";
import { handleWorkflowAction } from "../inngest/functions/workflows-ai";

export const inngestRouter = serve({
  client: inngest,
  functions: [
    handleKanbanAction,
    executeWorkflowRunFunction,
    handleWorkflowAction
  ],
});

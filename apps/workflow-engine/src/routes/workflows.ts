import { Router } from "express";
import { z } from "zod";
import { Id } from "@workspace/backend/_generated/dataModel";
import { inngest } from "../inngest/client";
import {
  enqueueWorkflowRun,
  executeWorkflowRun,
  WorkflowExecutionError,
} from "../workflows/runtime";

const manualRunSchema = z.object({
  workflowId: z.string().min(1),
  input: z.unknown().optional(),
  sessionToken: z.string().min(1),
});

export const workflowsRouter = Router();

workflowsRouter.post("/run", async (req: any, res: any) => {
  const parsedBody = manualRunSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      error: "Invalid workflow run request",
      details: parsedBody.error.flatten(),
    });
    return;
  }

  const { workflowId, input, sessionToken } = parsedBody.data;

  try {
    const run = await enqueueWorkflowRun({
      workflowId: workflowId as Id<"workflows">,
      input,
      sessionToken,
    });

    try {
      await inngest.send({
        name: "workflow/run.requested",
        data: {
          runId: run.runId,
          sessionToken,
        },
      });
    } catch (error) {
      console.warn("Failed to enqueue workflow run with Inngest. Falling back to direct execution.", error);
      void executeWorkflowRun({
        runId: run.runId,
        sessionToken,
      }).catch((executionError) => {
        if (
          !(executionError instanceof WorkflowExecutionError) &&
          (executionError as any)?.name !== "WorkflowExecutionError"
        ) {
          console.error("Workflow execution fallback failed:", executionError);
        }
      });
    }

    res.status(202).json({
      runId: run.runId,
      versionId: run.versionId,
      status: "queued",
      realtimeChannel: run.realtimeChannel,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start workflow run";
    const details =
      error && typeof error === "object" && "data" in error
        ? (error as { data?: unknown }).data
        : undefined;

    res.status(400).json({
      error: message,
      details,
    });
  }
});

workflowsRouter.post("/internal/enqueue", async (req: any, res: any) => {
  const { runId, systemToken } = req.body;

  if (!systemToken || systemToken !== process.env.SYSTEM_CORE_SECRET) {
    res.status(403).json({ error: "Forbidden: Invalid system token" });
    return;
  }

  if (!runId) {
    res.status(400).json({ error: "Missing runId" });
    return;
  }

  try {
    await inngest.send({
      name: "workflow/run.requested",
      data: {
        runId,
        sessionToken: process.env.SYSTEM_CORE_SECRET, // Or undefined if we bypass it in runtime
      },
    });

    res.status(202).json({ success: true, status: "queued" });
  } catch (error) {
    console.error("Failed to enqueue internal run:", error);
    res.status(500).json({ error: "Failed to enqueue internal run" });
  }
});

import { api } from "@workspace/backend/_generated/api";
import type { Id } from "@workspace/backend/_generated/dataModel";
import {
  WorkflowRunContext,
  WorkflowNodeConfig,
  WorkflowRuntimeState,
  WorkflowNodeExecutor,
  WorkflowNodeExecutionArgs,
} from "./types";
import { WorkflowExecutionError } from "./errors";
import {
  tryParseLiteral,
  redactSensitiveValue,
  toErrorPayload,
  createFetchController,
  toObjectFromHeaders,
  getSingleOutgoingEdge,
  resolveConditionBranchEdge,
  evaluateCondition,
} from "./utils";

import {
  resolveTemplateValue,
  normalizeConditionValue,
} from "./template-resolver";
import {
  appendWorkflowEvent,
  markWorkflowRunStarted,
  markWorkflowRunCompleted,
  markWorkflowRunFailed,
} from "./events";
import { buildApiRequest } from "./api-node";
import { invokeLlmProvider } from "./llm-node";
import { getWorkflowMaps } from "./runtime-helpers";
import { getConvexClient } from "@/ai-agent/convex-client";

// Re-export core types and errors for backward compatibility
export * from "./types";
export * from "./errors";

const workflowNodeExecutors: Record<string, WorkflowNodeExecutor> = {
  start: {
    execute({ node, outgoingEdgesByNodeKey, runtimeState }) {
      const nextEdge = getSingleOutgoingEdge(outgoingEdgesByNodeKey, node.nodeKey);

      return {
        output: runtimeState.input ?? null,
        nextNodeKey: nextEdge?.targetNodeKey,
      };
    },
    resolveInputs({ runtimeState }) {
      return runtimeState.input ?? null;
    },
  },
  condition: {
    execute({ node, outgoingEdgesByNodeKey, runtimeState, onFailure }) {
      const config = node.config as WorkflowNodeConfig;
      const leftValue = normalizeConditionValue(
        config.leftOperand,
        runtimeState,
        onFailure,
      );
      const rightValue = normalizeConditionValue(
        config.rightOperand,
        runtimeState,
        onFailure,
      );
      const result = evaluateCondition(
        leftValue,
        String(config.operator ?? "equals"),
        rightValue,
      );
      const nextEdge = resolveConditionBranchEdge(
        outgoingEdgesByNodeKey,
        node.nodeKey,
        result,
      );


      if (!nextEdge) {
        throw new WorkflowExecutionError(
          `Condition node "${node.nodeKey}" does not have a valid ${
            result ? "true" : "false"
          } branch.`,
        );
      }

      return {
        output: {
          result,
          leftValue,
          rightValue,
          operator: config.operator,
        },
        nextNodeKey: nextEdge.targetNodeKey,
      };
    },
    resolveInputs({ node, runtimeState }) {
      const config = node.config as WorkflowNodeConfig;
      return {
        leftValue: normalizeConditionValue(config.leftOperand, runtimeState),
        rightValue: normalizeConditionValue(config.rightOperand, runtimeState),
        operator: config.operator ?? "equals",
      };
    },
  },
  api: {
    async execute(args) {
      const config = args.node.config as WorkflowNodeConfig;
      const timeoutMs = Math.max(Number(config.timeoutMs ?? 30000), 1000);
      const request = await buildApiRequest(args, config);
      const { controller, cleanup } = createFetchController(timeoutMs);

      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          signal: controller.signal,
        });
        const responseText = await response.text();
        const parsedBody = tryParseLiteral(responseText);
        const output = {
          status: response.status,
          statusText: response.statusText,
          headers: toObjectFromHeaders(response.headers),
          body: parsedBody,
          request: request.logRequest,
        };

        if (!response.ok) {
          throw new WorkflowExecutionError(
            `API request failed with status ${response.status}.`,
            output,
          );
        }

        const nextEdge = getSingleOutgoingEdge(
          args.outgoingEdgesByNodeKey,
          args.node.nodeKey,
        );

        return {
          output: redactSensitiveValue(output),
          nextNodeKey: nextEdge?.targetNodeKey,
        };
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          throw new WorkflowExecutionError(
            `API request timed out after ${timeoutMs}ms.`,
          );
        }

        throw error;
      } finally {
        cleanup();
      }
    },
    async resolveInputs(args) {
      const config = args.node.config as WorkflowNodeConfig;
      const request = await buildApiRequest(args, config);
      return request.logRequest;
    },
  },
  llm: {
    async execute(args) {
      const config = args.node.config as WorkflowNodeConfig;
      const result = await invokeLlmProvider(args, {
        provider: String(config.provider ?? "openai"),
        model: String(config.model ?? ""),
        systemPrompt: String(
          resolveTemplateValue(String(config.systemPrompt ?? ""), args.runtimeState, args.onFailure) ?? "",
        ),
        prompt: String(
          resolveTemplateValue(String(config.prompt ?? ""), args.runtimeState, args.onFailure) ?? "",
        ),
        outputMode: String(config.outputMode ?? "text"),
        temperature: Number(config.temperature ?? 0.2),
        apiKeySecretId: config.apiKeySecretId as Id<"workflow_secrets"> | undefined,
      });
      const nextEdge = getSingleOutgoingEdge(
        args.outgoingEdgesByNodeKey,
        args.node.nodeKey,
      );

      return {
        output: redactSensitiveValue(result),
        nextNodeKey: nextEdge?.targetNodeKey,
      };
    },
    resolveInputs({ node, runtimeState, onFailure }) {
      const config = node.config as WorkflowNodeConfig;
      return {
        provider: config.provider ?? "openai",
        model: config.model,
        systemPrompt: resolveTemplateValue(String(config.systemPrompt ?? ""), runtimeState, onFailure),
        prompt: resolveTemplateValue(String(config.prompt ?? ""), runtimeState, onFailure),
        outputMode: config.outputMode ?? "text",
        temperature: config.temperature ?? 0.2,
      };
    },
  },
  end: {
    execute({ node, runtimeState, onFailure }) {
      const config = node.config as WorkflowNodeConfig;
      const output = resolveTemplateValue(
        String(config.resultExpression ?? ""),
        runtimeState,
        onFailure,
      );

      return {
        output,
        completed: true,
      };
    },
    resolveInputs({ node, runtimeState, onFailure }) {
      const config = node.config as WorkflowNodeConfig;
      return {
        resultExpression: config.resultExpression,
        resolvedResult: resolveTemplateValue(String(config.resultExpression ?? ""), runtimeState, onFailure),
      };
    },
  },
};

const executeNode = async (args: WorkflowNodeExecutionArgs) => {
  const executor = workflowNodeExecutors[args.node.type];

  if (!executor) {
    throw new WorkflowExecutionError(
      `Unsupported workflow node type "${args.node.type}".`,
    );
  }

  return await executor.execute(args);
};

export const enqueueWorkflowRun = async (args: {
  workflowId: Id<"workflows">;
  sessionToken: string;
  input?: unknown;
}) => {
  const client = getConvexClient(args.sessionToken);
  return await client.mutation(api.workflows.runs.startManualRun, {
    workflowId: args.workflowId,
    input: args.input,
    systemToken: args.sessionToken,
  });
};

export const executeWorkflowRun = async (args: {
  runId: Id<"workflow_runs">;
  sessionToken: string;
}) => {
  const client = getConvexClient(args.sessionToken);
  const context = (await client.query(api.workflows.runs.getRunExecutionContext, {
    runId: args.runId,
    systemToken: args.sessionToken,
  })) as WorkflowRunContext;
  const { nodesByKey, outgoingEdgesByNodeKey } = getWorkflowMaps(context);
  const startNode = context.nodes.find((node) => node.type === "start");

  if (!startNode) {
    throw new WorkflowExecutionError("Workflow start node was not found.");
  }

  const runtimeState: WorkflowRuntimeState = {
    input: context.run.input ?? null,
    outputs: {},
  };
  const secretCache = new Map<string, string>();

  await markWorkflowRunStarted(client, context.run._id, args.sessionToken);

  let currentNodeKey: string | undefined = startNode.nodeKey;
  let stepsExecuted = 0;
  let resolvedInputs: unknown = null;

  try {
    while (currentNodeKey) {
      const node = nodesByKey.get(currentNodeKey);

      if (!node) {
        throw new WorkflowExecutionError(
          `Workflow node "${currentNodeKey}" was not found in the run graph.`,
        );
      }

      stepsExecuted += 1;

      if (stepsExecuted > context.nodes.length + context.edges.length + 5) {
        throw new WorkflowExecutionError(
          "Workflow execution exceeded the expected node traversal limit.",
        );
      }

      const executor = workflowNodeExecutors[node.type];
      resolvedInputs = null;
      const onFailure = (expr: string) => {
        throw new WorkflowExecutionError(`Failed to resolve template expression: {{${expr}}}`);
      };

      if (executor?.resolveInputs) {
        try {
          resolvedInputs = await executor.resolveInputs({
            client,
            workflow: context.workflow,
            run: context.run,
            node,
            nodesByKey,
            outgoingEdgesByNodeKey,
            runtimeState,
            secretCache,
            onFailure,
          });
        } catch (error) {
          if (
            !(error instanceof WorkflowExecutionError) &&
            (error as any)?.name !== "WorkflowExecutionError"
          ) {
            console.error(`Failed to resolve inputs for node ${node.nodeKey}:`, error);
          }
          throw error;
        }
      }

      await appendWorkflowEvent(client, context.run._id, {
        type: "node_started",
        level: "info",
        nodeKey: node.nodeKey,
        payload: {
          message: `Running ${node.type} node "${node.label ?? node.nodeKey}".`,
          nodeType: node.type,
          label: node.label,
          input: redactSensitiveValue(resolvedInputs),
        },
      }, args.sessionToken);

      const result = await executeNode({
        client,
        workflow: context.workflow,
        run: context.run,
        node,
        nodesByKey,
        outgoingEdgesByNodeKey,
        runtimeState,
        secretCache,
        onFailure,
      });

      runtimeState.outputs[node.nodeKey] = {
        output: result.output,
        nodeType: node.type,
        label: node.label,
      };

      await appendWorkflowEvent(client, context.run._id, {
        type: "node_completed",
        level: "info",
        nodeKey: node.nodeKey,
        payload: {
          message: `Completed ${node.type} node "${node.label ?? node.nodeKey}".`,
          output: redactSensitiveValue(result.output),
        },
      }, args.sessionToken);

      if (result.completed) {
      await markWorkflowRunCompleted(client, context.run._id, result.output, args.sessionToken);
        return {
          status: "completed" as const,
          output: result.output,
        };
      }

      currentNodeKey = result.nextNodeKey;
    }

    throw new WorkflowExecutionError(
      "Workflow reached an invalid terminal state without an end node.",
    );
  } catch (error) {
    const failedNodeKey =
      currentNodeKey && nodesByKey.has(currentNodeKey) ? currentNodeKey : undefined;

      if (failedNodeKey) {
        await appendWorkflowEvent(client, context.run._id, {
          type: "node_failed",
          level: "error",
          nodeKey: failedNodeKey,
          payload: {
            message: `Node "${failedNodeKey}" failed.`,
            error: toErrorPayload(error),
          },
        }, args.sessionToken);
      }

    await markWorkflowRunFailed(client, context.run._id, error, failedNodeKey, args.sessionToken);

    if (
      error instanceof WorkflowExecutionError ||
      (error as any)?.name === "WorkflowExecutionError"
    ) {
      return {
        status: "failed" as const,
        error,
      };
    }

    throw error;
  }
};

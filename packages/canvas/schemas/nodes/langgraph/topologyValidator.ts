import { z } from "zod";
import type { GraphStep } from "./stepsAndChannels";
import type { GraphEdge } from "./conditionsAndEdges";
import type { ToolDefinition, MiddlewareDefinition } from "./toolsAndMiddleware";
import type { AgentDefinition, MemoryDefinition } from "./memoryAndAgents";
import type { OutputPort, OutputChannel } from "./stepsAndChannels";

export interface LangGraphRefinementData {
  graphSteps: GraphStep[];
  toolDefinitions: ToolDefinition[];
  middlewareDefinitions: MiddlewareDefinition[];
  agentDefinitions: AgentDefinition[];
  memoryDefinitions: MemoryDefinition[];
  outputPorts: OutputPort[];
  customLlmNodes?: Array<{ id: string }>;
  outputChannels?: OutputChannel[];
  graphEdges: GraphEdge[];
}

export function validateLangGraphTopology(
  data: LangGraphRefinementData,
  ctx: z.RefinementCtx,
): void {
  const stepIds = new Set(data.graphSteps.map((s) => s.id));
  const toolIds = new Set(
    data.toolDefinitions
      .map((t) => t.toolId || t.id)
      .filter((id): id is string => Boolean(id)),
  );
  const middlewareIds = new Set(
    data.middlewareDefinitions
      .map((m) => m.middlewareId || m.id)
      .filter((id): id is string => Boolean(id)),
  );
  const agentIds = new Set(
    data.agentDefinitions
      .map((a) => a.agentId || a.id)
      .filter((id): id is string => Boolean(id)),
  );
  const memoryIds = new Set(
    data.memoryDefinitions
      .map((m) => m.memoryId || m.id)
      .filter((id): id is string => Boolean(id)),
  );
  const portIds = new Set(data.outputPorts.map((p) => p.id));
  const customLlmIds = new Set(data.customLlmNodes?.map((l) => l.id) || []);
  const outputChannelIds = new Set(
    data.outputChannels?.map((o) => o.id) || [],
  );

  // 1. Enforce Step Type Restrictions on retryPolicy & Tool Integrity
  data.graphSteps.forEach((step, idx) => {
    if (
      ["human_gate", "interrupt", "custom_code"].includes(step.type) &&
      step.retryPolicy !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Step "${step.id}" cannot have retryPolicy defined. Retry policies are strictly restricted to execution steps.`,
        path: ["graphSteps", idx, "retryPolicy"],
      });
    }

    step.tools.forEach((toolId, tIdx) => {
      if (!toolIds.has(toolId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Step "${step.id}" references undefined tool ID "${toolId}".`,
          path: ["graphSteps", idx, "tools", tIdx],
        });
      }
    });
  });

  // 2. Validate Edge Topologies, Mutual Exclusivity, & sendConfig
  const sourcesWithConditionalEdge = new Set<string>();
  const sourcesWithDefaultOrUnconditional = new Set<string>();

  data.graphEdges.forEach((edge, idx) => {
    if (edge.isDefault && edge.condition !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `An edge cannot be marked as isDefault: true while also having a condition defined.`,
        path: ["graphEdges", idx, "isDefault"],
      });
    }

    if (
      edge.source !== "START" &&
      !stepIds.has(edge.source) &&
      !customLlmIds.has(edge.source) &&
      !toolIds.has(edge.source) &&
      !middlewareIds.has(edge.source) &&
      !agentIds.has(edge.source) &&
      !memoryIds.has(edge.source) &&
      !outputChannelIds.has(edge.source) &&
      !edge.source.startsWith("output_")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Edge source "${edge.source}" does not exist in graphSteps, customLlmNodes, toolDefinitions, middlewareDefinitions, agentDefinitions, or memoryDefinitions.`,
        path: ["graphEdges", idx, "source"],
      });
    }

    if (edge.condition !== undefined) {
      sourcesWithConditionalEdge.add(edge.source);
    }
    if (edge.isDefault || edge.condition === undefined) {
      if (
        edge.isDefault &&
        sourcesWithDefaultOrUnconditional.has(edge.source)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Multiple edges from source "${edge.source}" marked as isDefault or unconditional.`,
          path: ["graphEdges", idx, "isDefault"],
        });
      }
      sourcesWithDefaultOrUnconditional.add(edge.source);
    }

    if (edge.sendConfig?.enabled) {
      if (edge.targets.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge cannot have both targets and sendConfig.enabled=true simultaneously.`,
          path: ["graphEdges", idx, "targets"],
        });
      }

      if (!edge.sendConfig.joinStepId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `When sendConfig.enabled is true, joinStepId must be specified.`,
          path: ["graphEdges", idx, "sendConfig", "joinStepId"],
        });
      } else if (!stepIds.has(edge.sendConfig.joinStepId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `sendConfig joinStepId "${edge.sendConfig.joinStepId}" does not exist in graphSteps.`,
          path: ["graphEdges", idx, "sendConfig", "joinStepId"],
        });
      }

      const itemTarget = edge.sendConfig.itemTarget;
      if (
        itemTarget.kind === "step" &&
        itemTarget.id !== "END" &&
        !stepIds.has(itemTarget.id) &&
        !customLlmIds.has(itemTarget.id) &&
        !toolIds.has(itemTarget.id) &&
        !middlewareIds.has(itemTarget.id) &&
        !agentIds.has(itemTarget.id) &&
        !outputChannelIds.has(itemTarget.id) &&
        !itemTarget.id.startsWith("output_")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `sendConfig itemTarget step "${itemTarget.id}" does not exist in graphSteps, customLlmNodes, toolDefinitions, middlewareDefinitions, or agentDefinitions.`,
          path: ["graphEdges", idx, "sendConfig", "itemTarget", "id"],
        });
      } else if (itemTarget.kind === "port" && !portIds.has(itemTarget.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `sendConfig itemTarget port "${itemTarget.id}" does not exist in outputPorts.`,
          path: ["graphEdges", idx, "sendConfig", "itemTarget", "id"],
        });
      }
    }

    edge.targets.forEach((target, tIdx) => {
      if (target.kind === "step") {
        if (target.id === "END") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Target with id "END" must use kind: "end" instead of kind: "step".`,
            path: ["graphEdges", idx, "targets", tIdx, "kind"],
          });
        } else if (
          !stepIds.has(target.id) &&
          !customLlmIds.has(target.id) &&
          !toolIds.has(target.id) &&
          !middlewareIds.has(target.id) &&
          !agentIds.has(target.id) &&
          !outputChannelIds.has(target.id) &&
          !target.id.startsWith("output_")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Edge target step "${target.id}" does not exist in graphSteps, customLlmNodes, toolDefinitions, middlewareDefinitions, or agentDefinitions.`,
            path: ["graphEdges", idx, "targets", tIdx, "id"],
          });
        }
      } else if (target.kind === "port" && !portIds.has(target.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge target port "${target.id}" does not exist in outputPorts.`,
          path: ["graphEdges", idx, "targets", tIdx, "id"],
        });
      }
    });
  });
}

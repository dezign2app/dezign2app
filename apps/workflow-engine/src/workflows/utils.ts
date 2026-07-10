import type { Id } from "@workspace/backend/_generated/dataModel";
import { WorkflowExecutionError } from "./errors";
import { SENSITIVE_KEY_PATTERN } from "./constants";
import { WorkflowEdgeDoc } from "./types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getStreamKey = (runId: Id<"workflow_runs">) => `workflow:stream:${runId}`;
export const getRealtimeChannel = (runId: Id<"workflow_runs">) =>
  `workflow:realtime:${runId}`;

export const getPathValue = (value: unknown, pathSegments: string[]) => {
  let currentValue = value;

  for (const segment of pathSegments) {
    if (currentValue === null || currentValue === undefined) {
      return undefined;
    }

    if (Array.isArray(currentValue)) {
      const index = Number(segment);

      if (!Number.isInteger(index)) {
        return undefined;
      }

      currentValue = currentValue[index];
      continue;
    }

    if (!isRecord(currentValue)) {
      return undefined;
    }

    currentValue = currentValue[segment];
  }

  return currentValue;
};

export const tryParseLiteral = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (
    trimmedValue === "true" ||
    trimmedValue === "false" ||
    trimmedValue === "null"
  ) {
    return JSON.parse(trimmedValue);
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  if (
    (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) ||
    (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) ||
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))
  ) {
    try {
      return JSON.parse(trimmedValue);
    } catch {
      return value;
    }
  }

  return value;
};

export const redactSensitiveValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveValue(entry));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? "[REDACTED]"
        : redactSensitiveValue(entryValue),
    ]),
  );
};

export const toErrorPayload = (error: unknown) => {
  if (error instanceof WorkflowExecutionError) {
    return {
      name: error.name,
      message: error.message,
      details: redactSensitiveValue(error.details),
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: String(error),
  };
};

export const createFetchController = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
};

export const toObjectFromHeaders = (headers: Headers) =>
  Object.fromEntries(headers.entries());

export const getSingleOutgoingEdge = (
  outgoingEdgesByNodeKey: Map<string, WorkflowEdgeDoc[]>,
  nodeKey: string,
) => outgoingEdgesByNodeKey.get(nodeKey)?.[0];

export const resolveConditionBranchEdge = (
  outgoingEdgesByNodeKey: Map<string, WorkflowEdgeDoc[]>,
  nodeKey: string,
  result: boolean,
) =>
  outgoingEdgesByNodeKey
    .get(nodeKey)
    ?.find((edge) =>
      result
        ? edge.sourceHandle === "true" || edge.kind === "true"
        : edge.sourceHandle === "false" || edge.kind === "false",
    );

export const evaluateCondition = (
  leftValue: unknown,
  operator: string,
  rightValue: unknown,
) => {
  switch (operator) {
    case "equals":
      return JSON.stringify(leftValue) === JSON.stringify(rightValue);
    case "not_equals":
      return JSON.stringify(leftValue) !== JSON.stringify(rightValue);
    case "contains":
      if (typeof leftValue === "string") {
        return leftValue.includes(String(rightValue ?? ""));
      }

      if (Array.isArray(leftValue)) {
        return leftValue.some(
          (entry) => JSON.stringify(entry) === JSON.stringify(rightValue),
        );
      }

      return false;
    case "gt":
      return Number(leftValue) > Number(rightValue);
    case "lt":
      return Number(leftValue) < Number(rightValue);
    default:
      throw new WorkflowExecutionError(`Unsupported condition operator "${operator}".`);
  }
};

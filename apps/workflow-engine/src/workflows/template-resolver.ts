import { WorkflowRuntimeState } from "./types";
import { isRecord, getPathValue, tryParseLiteral } from "./utils";
import { EXPRESSION_PATTERN } from "./constants";

export const resolveReference = (
  expression: string,
  runtimeState: WorkflowRuntimeState,
  onFailure?: (expr: string) => void,
) => {
  const pathSegments = expression
    .trim()
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (pathSegments.length === 0) {
    if (onFailure) onFailure(expression);
    return undefined;
  }

  let result: unknown;

  if (pathSegments[0] === "input") {
    result = getPathValue(runtimeState.input, pathSegments.slice(1));
  } else if (pathSegments[0] === "previous" || pathSegments[0] === "prev") {
    const keys = Object.keys(runtimeState.outputs);
    const lastKey = keys.at(-1);
    if (!lastKey) {
      result = undefined;
    } else {
      const prevOutputRecord = runtimeState.outputs[lastKey];
      if (!prevOutputRecord) {
        result = undefined;
      } else if (pathSegments.length === 1) {
        result = prevOutputRecord.output;
      } else {
        const nextSegment = pathSegments[1] ?? "";
        if (
          nextSegment === "output" ||
          nextSegment === "nodeType" ||
          nextSegment === "label"
        ) {
          result = getPathValue(prevOutputRecord, pathSegments.slice(1));
        } else {
          result = getPathValue(prevOutputRecord.output, pathSegments.slice(1));
        }
      }
    }
  } else {
    // 4. Resolve by Node Key or Node Type Alias
    let nodeOutputRecord = runtimeState.outputs[pathSegments[0]];

    // Fallback: If not a direct match by key, check if it's a unique node type
    if (!nodeOutputRecord) {
      const matchingNodeKeys = Object.entries(runtimeState.outputs)
        .filter(([_, record]) => record.nodeType === pathSegments[0])
        .map(([key]) => key);

      if (matchingNodeKeys.length === 1 && matchingNodeKeys[0]) {
        nodeOutputRecord = runtimeState.outputs[matchingNodeKeys[0]];
      }
    }

    if (!nodeOutputRecord) {
      result = undefined;
    } else if (pathSegments.length === 1) {
      result = nodeOutputRecord.output;
    } else {
      const nextSegment = pathSegments[1] ?? "";
      if (
        nextSegment === "output" ||
        nextSegment === "nodeType" ||
        nextSegment === "label"
      ) {
        result = getPathValue(nodeOutputRecord, pathSegments.slice(1));
      } else {
        result = getPathValue(nodeOutputRecord.output, pathSegments.slice(1));
      }
    }
  }

  if (result === undefined && onFailure) {
    onFailure(expression);
  }

  return result;
};

export const stringifyTemplateValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
};

export const resolveTemplateValue = (
  rawValue: string,
  runtimeState: WorkflowRuntimeState,
  onFailure?: (expr: string) => void,
) => {
  const trimmedValue = rawValue.trim();
  const matches = [...trimmedValue.matchAll(EXPRESSION_PATTERN)];
  const pureExpressionMatch =
    matches.length === 1 && matches[0]?.[0] === trimmedValue
      ? matches[0]
      : null;

  if (pureExpressionMatch) {
    return resolveReference(pureExpressionMatch[1] ?? "", runtimeState, onFailure);
  }

  if (matches.length === 0) {
    return tryParseLiteral(rawValue);
  }

  return rawValue.replace(EXPRESSION_PATTERN, (_, expression: string) =>
    stringifyTemplateValue(resolveReference(expression, runtimeState, onFailure)),
  );
};

export const resolveStructuredValue = (
  value: unknown,
  runtimeState: WorkflowRuntimeState,
  onFailure?: (expr: string) => void,
): unknown => {
  if (typeof value === "string") {
    return resolveTemplateValue(value, runtimeState, onFailure);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => resolveStructuredValue(entry, runtimeState, onFailure));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      resolveStructuredValue(entryValue, runtimeState, onFailure),
    ]),
  );
};

export const parseTemplatedValue = (
  rawValue: unknown,
  runtimeState: WorkflowRuntimeState,
  onFailure?: (expr: string) => void,
) => {
  if (typeof rawValue !== "string") {
    return rawValue;
  }

  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmedValue);
    return resolveStructuredValue(parsed, runtimeState, onFailure);
  } catch {
    return resolveTemplateValue(rawValue, runtimeState, onFailure);
  }
};

export const normalizeConditionValue = (
  rawValue: unknown,
  runtimeState: WorkflowRuntimeState,
  onFailure?: (expr: string) => void,
) => {
  if (typeof rawValue !== "string") {
    return rawValue;
  }

  return resolveTemplateValue(rawValue, runtimeState, onFailure);
};

import { Id } from "@workspace/backend/_generated/dataModel";
import { WorkflowNodeConfig, WorkflowNodeExecutionArgs } from "./types";
import { WorkflowExecutionError } from "./errors";
import {
  isRecord,
  tryParseLiteral,
  redactSensitiveValue,
} from "./utils";
import {
  resolveTemplateValue,
  parseTemplatedValue,
} from "./template-resolver";
import {
  resolveSecretValueById,
  resolveSecretValueByName,
} from "./runtime-helpers";

export const buildApiRequest = async (
  args: WorkflowNodeExecutionArgs,
  config: WorkflowNodeConfig,
) => {
  const runtimeState = args.runtimeState;
  const method = String(config.method ?? "GET").toUpperCase();
  const url = String(resolveTemplateValue(String(config.url ?? ""), runtimeState, args.onFailure) ?? "");

  if (!url.trim()) {
    throw new WorkflowExecutionError("API node requires a URL.");
  }

  const headersValue = parseTemplatedValue(config.headers, runtimeState, args.onFailure);
  const queryValue = parseTemplatedValue(config.query, runtimeState, args.onFailure);
  const bodyValue = parseTemplatedValue(config.body, runtimeState, args.onFailure);
  const headers = isRecord(headersValue)
    ? Object.fromEntries(
        Object.entries(headersValue).map(([key, value]) => [key, String(value)]),
      )
    : {};
  const query = isRecord(queryValue)
    ? Object.fromEntries(
        Object.entries(queryValue).map(([key, value]) => [key, String(value)]),
      )
    : {};

  const authType = String(config.authType ?? "none");
  const authSecretId = config.authSecretId as Id<"workflow_secrets"> | undefined;
  const authSecretName = String(config.authSecretName ?? "").trim();

  const authHeaderName = String(
    resolveTemplateValue(String(config.authHeaderName || "x-api-key"), runtimeState, args.onFailure) ?? "x-api-key",
  );
  const authQueryName = String(
    resolveTemplateValue(String(config.authQueryName || "api_key"), runtimeState, args.onFailure) ?? "api_key",
  );
  const authUsername = String(
    resolveTemplateValue(String(config.authUsername || ""), runtimeState, args.onFailure) ?? "",
  );

  if (authType !== "none") {
    if (!authSecretId && !authSecretName) {
      throw new WorkflowExecutionError(
        "API node requires a secret reference for authenticated requests.",
      );
    }

    const secretValue = authSecretId
      ? await resolveSecretValueById(
          args.client,
          args.workflow._id,
          authSecretId,
          args.secretCache,
        )
      : await resolveSecretValueByName(
          args.client,
          args.workflow._id,
          authSecretName,
          args.secretCache,
        );

    switch (authType) {
      case "bearer":
        headers.Authorization = `Bearer ${secretValue}`;
        break;
      case "api_key_header":
        headers[authHeaderName] = secretValue;
        break;
      case "api_key_query":
        query[authQueryName] = secretValue;
        break;
      case "basic":
        const credential = `${authUsername}:${secretValue}`;
        headers.Authorization = `Basic ${Buffer.from(credential).toString("base64")}`;
        break;
      default:
        throw new WorkflowExecutionError(
          `Unsupported API auth type "${authType}".`,
        );
    }
  }

  const requestUrl = new URL(url);

  for (const [key, value] of Object.entries(query)) {
    requestUrl.searchParams.set(key, value);
  }

  let requestBody: BodyInit | undefined;

  const isBodyAllowedMethod = !["GET", "HEAD"].includes(method);
  const isBodyProvided = bodyValue !== undefined && bodyValue !== "";

  if (isBodyAllowedMethod || isBodyProvided) {
    if (typeof bodyValue === "string") {
      requestBody = bodyValue;
    } else {
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }

      requestBody = JSON.stringify(bodyValue);
    }
  }

  const redactedHeaders = redactSensitiveValue(headers) as Record<string, string>;
  const redactedQuery = redactSensitiveValue(query) as Record<string, string>;

  if (authType !== "none") {
    if (authType === "api_key_header" || authType === "bearer" || authType === "basic") {
      const headerToRedact = authType === "bearer" || authType === "basic" ? "Authorization" : authHeaderName;
      if (redactedHeaders[headerToRedact]) {
        redactedHeaders[headerToRedact] = "[REDACTED]";
      }
    }
    if (authType === "api_key_query" && redactedQuery[authQueryName]) {
      redactedQuery[authQueryName] = "[REDACTED]";
    }
  }

  return {
    method,
    url: requestUrl.toString(),
    headers,
    body: requestBody,
    logRequest: {
      method,
      url: requestUrl.toString(),
      headers: redactedHeaders,
      query: redactedQuery,
      body:
        requestBody && typeof requestBody === "string"
          ? redactSensitiveValue(tryParseLiteral(requestBody))
          : undefined,
    },
  };
};

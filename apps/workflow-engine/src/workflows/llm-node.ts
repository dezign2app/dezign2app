import { Id } from "@workspace/backend/_generated/dataModel";
import { WorkflowNodeExecutionArgs } from "./types";
import { WorkflowExecutionError } from "./errors";
import { tryParseLiteral } from "./utils";
import { resolveSecretValueById } from "./runtime-helpers";
import { LLM_PROVIDERS } from "./constants";

export const invokeLlmProvider = async (
  args: WorkflowNodeExecutionArgs,
  config: {
    provider: string;
    model: string;
    systemPrompt: string;
    prompt: string;
    outputMode: string;
    temperature: number;
    apiKeySecretId?: Id<"workflow_secrets">;
  },
) => {
  const provider = config.provider;
  const outputMode = config.outputMode;
  const temperature = Number.isFinite(config.temperature)
    ? config.temperature
    : 0.2;

  let apiKey: string | undefined;

  if (!config.apiKeySecretId) {
    throw new WorkflowExecutionError(
      "LLM node requires an API key secret. Configure one in the node settings.",
    );
  }

  apiKey = await resolveSecretValueById(
    args.client,
    args.workflow._id,
    config.apiKeySecretId,
    args.secretCache,
  );

  if (provider === "openai" || provider === "groq") {
    const baseUrl =
      provider === "groq"
        ? LLM_PROVIDERS.GROQ.baseUrl
        : LLM_PROVIDERS.OPENAI.baseUrl;

    if (!apiKey) {
      throw new WorkflowExecutionError(
        `LLM node requires an API key secret to be configured for provider "${provider}".`,
      );
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature,
        messages: [
          ...(() => {
            let systemPrompt = config.systemPrompt;
            if (
              outputMode === "json" &&
              !systemPrompt.toLowerCase().includes("json") &&
              !config.prompt.toLowerCase().includes("json")
            ) {
              systemPrompt = systemPrompt
                ? `${systemPrompt}\n\nIMPORTANT: Respond in valid JSON format.`
                : "Respond in valid JSON format.";
            }

            return systemPrompt
              ? [{ role: "system", content: systemPrompt }]
              : [];
          })(),
          {
            role: "user",
            content: config.prompt,
          },
        ],
        ...(outputMode === "json"
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new WorkflowExecutionError("LLM request failed.", payload);
    }

    const content = payload?.choices?.[0]?.message?.content ?? "";
    const parsedJson =
      outputMode === "json" && typeof content === "string"
        ? tryParseLiteral(content)
        : undefined;

    return {
      provider,
      model: config.model,
      text: typeof content === "string" ? content : JSON.stringify(content),
      json: parsedJson,
      raw: payload,
    };
  }

  if (provider === "gemini") {
    if (!apiKey) {
      throw new WorkflowExecutionError(
        "Missing Gemini API key secret in the workflow configuration.",
      );
    }

    const response = await fetch(
      LLM_PROVIDERS.GEMINI.baseUrl(config.model, apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: config.prompt }],
            },
          ],
          ...(config.systemPrompt
            ? {
                systemInstruction: {
                  parts: [{ text: config.systemPrompt }],
                },
              }
            : {}),
          generationConfig: {
            temperature,
            ...(outputMode === "json"
              ? { responseMimeType: "application/json" }
              : {}),
          },
        }),
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new WorkflowExecutionError("LLM request failed.", payload);
    }

    const content =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("\n") ?? "";
    const parsedJson =
      outputMode === "json" && typeof content === "string"
        ? tryParseLiteral(content)
        : undefined;

    return {
      provider,
      model: config.model,
      text: content,
      json: parsedJson,
      raw: payload,
    };
  }

  throw new WorkflowExecutionError(`Unsupported LLM provider "${provider}".`);
};

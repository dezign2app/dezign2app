import React from "react";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Field } from "./field";
import type { LlmNodeConfig, WorkflowSecret } from "../workflow-editor-types";
import { Id } from "@workspace/backend/_generated/dataModel";

interface LlmNodeFieldsProps {
  config: LlmNodeConfig;
  workflowSecrets: WorkflowSecret[];
  isReadOnly: boolean;
  updateConfig: (patch: Partial<LlmNodeConfig>) => void;
}

export const LlmNodeFields = ({
  config,
  workflowSecrets,
  isReadOnly,
  updateConfig,
}: LlmNodeFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Provider">
          <Select
            value={config.provider}
            disabled={isReadOnly}
            onValueChange={(value) =>
              updateConfig({
                provider: value as LlmNodeConfig["provider"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Output Mode">
          <Select
            value={config.outputMode}
            disabled={isReadOnly}
            onValueChange={(value) =>
              updateConfig({
                outputMode: value as LlmNodeConfig["outputMode"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select output mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Model">
        <Input
          value={config.model ?? ""}
          disabled={isReadOnly}
          placeholder="gpt-4.1-mini"
          onChange={(event) =>
            updateConfig({ model: event.target.value })
          }
        />
      </Field>

      <Field
        label="API Key Secret"
        description="Select the secret to use as the API key. Manage secrets in the bottom panel."
      >
        <Select
          value={config.apiKeySecretId}
          disabled={isReadOnly}
          onValueChange={(value) =>
            updateConfig({
              apiKeySecretId: value as Id<"workflow_secrets">,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a secret" />
          </SelectTrigger>
          <SelectContent>
            {workflowSecrets.length > 0 ? (
              workflowSecrets.map((secret) => (
                <SelectItem key={secret._id} value={secret._id}>
                  {secret.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-center text-xs text-muted-foreground">
                No secrets found. Add one in the bottom panel.
              </div>
            )}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Temperature">
        <Input
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={config.temperature}
          disabled={isReadOnly}
          onChange={(event) =>
            updateConfig({
              temperature: Number(event.target.value || 0),
            })
          }
        />
      </Field>

      <Field label="System Prompt">
        <Textarea
          className="min-h-20"
          value={config.systemPrompt}
          disabled={isReadOnly}
          onChange={(event) =>
            updateConfig({ systemPrompt: event.target.value })
          }
        />
      </Field>

      <Field
        label="Prompt"
        description="Supports basic variable references from upstream nodes."
      >
        <Textarea
          className="min-h-32"
          value={config.prompt}
          disabled={isReadOnly}
          onChange={(event) =>
            updateConfig({ prompt: event.target.value })
          }
        />
      </Field>
    </div>
  );
};

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
import type { ApiNodeConfig, WorkflowSecret } from "../workflow-editor-types";
import { Id } from "@workspace/backend/_generated/dataModel";

interface ApiNodeFieldsProps {
  config: ApiNodeConfig;
  workflowSecrets: WorkflowSecret[];
  isReadOnly: boolean;
  updateConfig: (patch: Partial<ApiNodeConfig>) => void;
}

export const ApiNodeFields = ({
  config,
  workflowSecrets,
  isReadOnly,
  updateConfig,
}: ApiNodeFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Method">
          <Select
            value={config.method}
            disabled={isReadOnly}
            onValueChange={(value) =>
              updateConfig({ method: value as ApiNodeConfig["method"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Timeout (ms)">
          <Input
            type="number"
            min={1000}
            step={500}
            value={config.timeoutMs}
            disabled={isReadOnly}
            onChange={(event) =>
              updateConfig({
                timeoutMs: Number(event.target.value || 0),
              })
            }
          />
        </Field>
      </div>

      <Field label="URL">
        <Input
          value={config.url ?? ""}
          disabled={isReadOnly}
          placeholder="https://api.example.com/resource"
          onChange={(event) => updateConfig({ url: event.target.value })}
        />
      </Field>

      <Field label="Auth Type">
        <Select
          value={config.authType}
          disabled={isReadOnly}
          onValueChange={(value) => {
            const newAuthType = value as ApiNodeConfig["authType"];
            updateConfig({
              authType: newAuthType,
              authHeaderName: newAuthType === "api_key_header" ? config.authHeaderName : "",
              authQueryName: newAuthType === "api_key_query" ? config.authQueryName : "",
              authUsername: newAuthType === "basic" ? config.authUsername : "",
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select auth type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="bearer">Bearer</SelectItem>
            <SelectItem value="api_key_header">API Key Header</SelectItem>
            <SelectItem value="api_key_query">API Key Query</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {config.authType !== "none" ? (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-3">
          {config.authType === "api_key_header" && (
            <Field label="Header Name">
              <Input
                value={config.authHeaderName ?? ""}
                disabled={isReadOnly}
                placeholder="X-API-Key"
                onChange={(e) =>
                  updateConfig({ authHeaderName: e.target.value })
                }
              />
            </Field>
          )}

          {config.authType === "api_key_query" && (
            <Field label="Parameter Name">
              <Input
                value={config.authQueryName ?? ""}
                disabled={isReadOnly}
                placeholder="api_key"
                onChange={(e) =>
                  updateConfig({ authQueryName: e.target.value })
                }
              />
            </Field>
          )}

          {config.authType === "basic" && (
            <Field label="Username">
              <Input
                value={config.authUsername ?? ""}
                disabled={isReadOnly}
                placeholder="admin"
                onChange={(e) =>
                  updateConfig({ authUsername: e.target.value })
                }
              />
            </Field>
          )}

          <Field
            label={
              config.authType === "bearer"
                ? "Bearer Token"
                : config.authType === "basic"
                  ? "Password"
                  : "API Key"
            }
            description="Select the secret to use. Manage secrets in the bottom panel."
          >
            <Select
              value={config.authSecretId}
              disabled={isReadOnly}
              onValueChange={(value) =>
                updateConfig({
                  authSecretId: value as Id<"workflow_secrets">,
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
        </div>
      ) : null}

      <Field
        label="Headers"
        description="JSON object or template string. Secret values will be injected during execution."
      >
        <Textarea
          className="min-h-24"
          value={config.headers}
          disabled={isReadOnly}
          placeholder='{"Content-Type":"application/json"}'
          onChange={(event) =>
            updateConfig({ headers: event.target.value })
          }
        />
      </Field>

      <Field label="Query Parameters">
        <Textarea
          className="min-h-20"
          value={config.query}
          disabled={isReadOnly}
          placeholder='{"limit":"10"}'
          onChange={(event) =>
            updateConfig({ query: event.target.value })
          }
        />
      </Field>

      <Field label="Body">
        <Textarea
          className="min-h-28"
          value={config.body}
          disabled={isReadOnly}
          placeholder='{"input":"{{start.output}}"}'
          onChange={(event) => updateConfig({ body: event.target.value })}
        />
      </Field>
    </div>
  );
};

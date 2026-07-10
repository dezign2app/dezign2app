import React from "react";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Field } from "./field";
import type { StartNodeConfig } from "../workflow-editor-types";

interface StartNodeFieldsProps {
  config: StartNodeConfig;
  isReadOnly: boolean;
  updateConfig: (patch: Partial<StartNodeConfig>) => void;
}

export const StartNodeFields = ({
  config,
  isReadOnly,
  updateConfig,
}: StartNodeFieldsProps) => {
  return (
    <div className="space-y-4">
      <Field
        label="Trigger Type"
        description="Manual runs execute on demand. Cron activates published runs on a schedule."
      >
        <Select
          value={config.triggerType}
          disabled={isReadOnly}
          onValueChange={(value) =>
            updateConfig({
              triggerType: value as StartNodeConfig["triggerType"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="cron">Cron</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {config.triggerType === "cron" ? (
        <>
          <Field
            label="Cron Expression"
            description="Raw cron string. The publish validator requires this when cron is enabled."
          >
            <Input
              value={config.cronExpression ?? ""}
              disabled={isReadOnly}
              placeholder="0 * * * *"
              onChange={(event) =>
                updateConfig({ cronExpression: event.target.value })
              }
            />
          </Field>

          <Field
            label="Timezone"
            description="Stored directly on the start node for schedule evaluation."
          >
            <Input
              value={config.timezone ?? ""}
              disabled={isReadOnly}
              placeholder="Asia/Calcutta"
              onChange={(event) =>
                updateConfig({ timezone: event.target.value })
              }
            />
          </Field>
        </>
      ) : null}
    </div>
  );
};

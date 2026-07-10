import React from "react";
import { Textarea } from "@workspace/ui/components/textarea";
import { Field } from "./field";
import type { EndNodeConfig } from "../workflow-editor-types";

interface EndNodeFieldsProps {
  config: EndNodeConfig;
  isReadOnly: boolean;
  updateConfig: (patch: Partial<EndNodeConfig>) => void;
}

export const EndNodeFields = ({
  config,
  isReadOnly,
  updateConfig,
}: EndNodeFieldsProps) => {
  return (
    <Field
      label="Result Expression"
      description="Defines the payload returned when the workflow completes on this branch."
    >
      <Textarea
        className="min-h-24"
        value={config.resultExpression}
        disabled={isReadOnly}
        placeholder="{{api.output.body}}"
        onChange={(event) =>
          updateConfig({ resultExpression: event.target.value })
        }
      />
    </Field>
  );
};

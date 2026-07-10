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
import type { ConditionNodeConfig } from "../workflow-editor-types";

interface ConditionNodeFieldsProps {
  config: ConditionNodeConfig;
  isReadOnly: boolean;
  updateConfig: (patch: Partial<ConditionNodeConfig>) => void;
}

export const ConditionNodeFields = ({
  config,
  isReadOnly,
  updateConfig,
}: ConditionNodeFieldsProps) => {
  return (
    <div className="space-y-4">
      <Field
        label="Left Operand"
        description="Use literal values or expression references like {{nodeId.output.field}}."
      >
        <Input
          value={config.leftOperand ?? ""}
          disabled={isReadOnly}
          onChange={(event) => updateConfig({ leftOperand: event.target.value })}
        />
      </Field>

      <Field label="Operator">
        <Select
          value={config.operator}
          disabled={isReadOnly}
          onValueChange={(value) =>
            updateConfig({
              operator: value as ConditionNodeConfig["operator"],
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="gt">Greater than</SelectItem>
            <SelectItem value="lt">Less than</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Right Operand">
        <Input
          value={config.rightOperand ?? ""}
          disabled={isReadOnly}
          onChange={(event) => updateConfig({ rightOperand: event.target.value })}
        />
      </Field>
    </div>
  );
};

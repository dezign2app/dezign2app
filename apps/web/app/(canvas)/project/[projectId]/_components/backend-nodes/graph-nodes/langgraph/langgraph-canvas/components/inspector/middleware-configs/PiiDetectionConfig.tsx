import React from "react";
import { Lock } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalInput } from "../../../../../common";
import type { MiddlewareConfigProps } from "./types";

export function PiiDetectionConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-red-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          PII Detection & Sanitization
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          PII Type
        </Label>
        <Select
          value={data.piiConfig?.piiType || "email"}
          onValueChange={(val: any) =>
            onUpdate({
              piiConfig: {
                ...data.piiConfig,
                piiType: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email Address</SelectItem>
            <SelectItem value="credit_card">Credit Card Number</SelectItem>
            <SelectItem value="ip">IP Address</SelectItem>
            <SelectItem value="mac_address">MAC Address</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="ssn">Social Security Number (SSN)</SelectItem>
            <SelectItem value="phone_number">Phone Number</SelectItem>
            <SelectItem value="api_key">API Secret Keys</SelectItem>
            <SelectItem value="custom">Custom Pattern</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Sanitization Strategy
        </Label>
        <Select
          value={data.piiConfig?.strategy || "redact"}
          onValueChange={(val: any) =>
            onUpdate({
              piiConfig: {
                ...data.piiConfig,
                strategy: val,
              },
            })
          }
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="redact">
              redact (Replace with [REDACTED_TYPE])
            </SelectItem>
            <SelectItem value="mask">
              mask (Partially mask ****-1234)
            </SelectItem>
            <SelectItem value="hash">
              hash (Replace with deterministic hash)
            </SelectItem>
            <SelectItem value="block">
              block (Throw error on detection)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.piiConfig?.piiType === "custom" && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Detector Regex Pattern
          </Label>
          <LocalInput
            value={data.piiConfig?.detectorPattern || ""}
            onChange={(e) =>
              onUpdate({
                piiConfig: {
                  ...data.piiConfig,
                  detectorPattern: e.target.value,
                },
              })
            }
            className="h-7 text-xs font-mono bg-background"
            placeholder="sk-[a-zA-Z0-9]{32}"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 p-2 bg-background border border-border/50 rounded-lg">
        <Label className="text-[11px] font-semibold text-foreground mb-1">
          Enforcement Scope
        </Label>
        <div className="flex items-center justify-between text-xs">
          <Label htmlFor="pii-input" className="text-[11px] cursor-pointer">
            Apply to User Input
          </Label>
          <Switch
            id="pii-input"
            checked={data.piiConfig?.applyToInput ?? true}
            onCheckedChange={(c) =>
              onUpdate({
                piiConfig: { ...data.piiConfig, applyToInput: c },
              })
            }
            className="scale-75 origin-right"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <Label htmlFor="pii-output" className="text-[11px] cursor-pointer">
            Apply to AI Output
          </Label>
          <Switch
            id="pii-output"
            checked={data.piiConfig?.applyToOutput ?? false}
            onCheckedChange={(c) =>
              onUpdate({
                piiConfig: { ...data.piiConfig, applyToOutput: c },
              })
            }
            className="scale-75 origin-right"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <Label htmlFor="pii-tools" className="text-[11px] cursor-pointer">
            Apply to Tool Results
          </Label>
          <Switch
            id="pii-tools"
            checked={data.piiConfig?.applyToToolResults ?? false}
            onCheckedChange={(c) =>
              onUpdate({
                piiConfig: { ...data.piiConfig, applyToToolResults: c },
              })
            }
            className="scale-75 origin-right"
          />
        </div>
      </div>
    </div>
  );
}

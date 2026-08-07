import React from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Layers, Plus, Trash2 } from "lucide-react";
import { UserCustomField } from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthUserSchemaSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
}) => {
  const customFields: UserCustomField[] = data.customFields || [
    { name: "workspaceId", type: "string", required: false },
    { name: "onboarded", type: "boolean", default: "false", required: true },
  ];

  return (
    <AccordionItem
      value="schema"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User Schema Custom Fields
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {customFields.length} fields
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Custom User Table Columns</Label>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-background"
              onClick={() => {
                const updated = [
                  ...customFields,
                  { name: `field_${customFields.length + 1}`, type: "string", required: false },
                ];
                updateData({ customFields: updated });
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {customFields.map((field, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-background border border-border/50 text-xs"
              >
                <div className="col-span-4">
                  <Input
                    className="h-7 text-xs font-mono bg-background"
                    value={field.name}
                    placeholder="field_name"
                    onChange={(e) => {
                      const updated = customFields.map((f, i) => (i === idx ? { ...f, name: e.target.value } : f));
                      updateData({ customFields: updated });
                    }}
                  />
                </div>
                <div className="col-span-3">
                  <Select
                    value={field.type}
                    onValueChange={(val) => {
                      const updated = customFields.map((f, i) => (i === idx ? { ...f, type: val } : f));
                      updateData({ customFields: updated });
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs font-mono bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["string", "number", "boolean", "date", "json"].map((t) => (
                        <SelectItem key={t} value={t} className="text-xs font-mono">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    className="h-7 text-xs font-mono bg-background"
                    value={field.default || ""}
                    placeholder="default value"
                    onChange={(e) => {
                      const updated = customFields.map((f, i) => (i === idx ? { ...f, default: e.target.value } : f));
                      updateData({ customFields: updated });
                    }}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Checkbox
                    checked={field.required}
                    onCheckedChange={(c) => {
                      const updated = customFields.map((f, i) => (i === idx ? { ...f, required: Boolean(c) } : f));
                      updateData({ customFields: updated });
                    }}
                  />
                  <button
                    onClick={() => {
                      const updated = customFields.filter((_, i) => i !== idx);
                      updateData({ customFields: updated });
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

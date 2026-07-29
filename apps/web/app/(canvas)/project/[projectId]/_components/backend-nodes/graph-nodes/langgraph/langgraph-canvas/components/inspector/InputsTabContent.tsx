import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { TabsContent } from "@workspace/ui/components/tabs";
import type { LangGraphInputChannel } from "@/types/canvas";

interface InputsTabContentProps {
  inputChannels: LangGraphInputChannel[];
  setInputChannels: React.Dispatch<React.SetStateAction<LangGraphInputChannel[]>>;
}

export function InputsTabContent({
  inputChannels,
  setInputChannels,
}: InputsTabContentProps) {
  return (
    <TabsContent
      value="inputs"
      className="flex-1 min-h-0 p-4 overflow-y-auto m-0 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Input Payload State
          </span>
          <span className="text-xs text-muted-foreground">
            Fields accepted when invoking graph
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-border gap-1"
          onClick={() => {
            const newChan: LangGraphInputChannel = {
              key: `input_${inputChannels.length + 1}`,
              type: "string",
              required: true,
              description: "",
            };
            setInputChannels([...inputChannels, newChan]);
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {inputChannels.map((input, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-3 p-4 rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <Input
              className="h-7 text-xs font-mono font-medium bg-background flex-1"
              value={input.key}
              onChange={(e) => {
                const updated = { ...input, key: e.target.value };
                setInputChannels(inputChannels.map((c, i) => (i === idx ? updated : c)));
              }}
              placeholder="field_key"
            />
            <Select
              value={input.type}
              onValueChange={(v: string) => {
                const updated = { ...input, type: v as LangGraphInputChannel["type"] };
                setInputChannels(inputChannels.map((c, i) => (i === idx ? updated : c)));
              }}
            >
              <SelectTrigger className="h-7 text-xs w-28 bg-background font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="messages">messages</SelectItem>
                <SelectItem value="json">json</SelectItem>
                <SelectItem value="number">number</SelectItem>
                <SelectItem value="boolean">boolean</SelectItem>
                <SelectItem value="object">object</SelectItem>
                <SelectItem value="array">array</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => setInputChannels(inputChannels.filter((_, i) => i !== idx))}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
            <Input
              className="h-7 text-xs bg-background/50 flex-1"
              value={input.description || ""}
              onChange={(e) => {
                const updated = { ...input, description: e.target.value };
                setInputChannels(inputChannels.map((c, i) => (i === idx ? updated : c)));
              }}
              placeholder="Description (optional)"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Label className="text-xs text-muted-foreground">Req</Label>
              <Switch
                checked={input.required ?? true}
                onCheckedChange={(c) => {
                  const updated = { ...input, required: c };
                  setInputChannels(inputChannels.map((c, i) => (i === idx ? updated : c)));
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </TabsContent>
  );
}

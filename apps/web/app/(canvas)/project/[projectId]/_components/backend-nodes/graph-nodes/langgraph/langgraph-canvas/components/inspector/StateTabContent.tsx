import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { TabsContent } from "@workspace/ui/components/tabs";
import type { LangGraphStateChannel } from "@/types/canvas";

interface StateTabContentProps {
  stateChannels: LangGraphStateChannel[];
  setStateChannels: React.Dispatch<
    React.SetStateAction<LangGraphStateChannel[]>
  >;
}

export function StateTabContent({
  stateChannels,
  setStateChannels,
}: StateTabContentProps) {
  return (
    <TabsContent
      value="state"
      className="flex-1 min-h-0 p-4 overflow-y-auto m-0 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Graph State Schema
          </span>
          <span className="text-xs text-muted-foreground">
            State schema fields & reducer functions
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-border gap-1"
          onClick={() => {
            const newChannel: LangGraphStateChannel = {
              key: "",
              type: "string",
              reducer: "replace",
              defaultValue: "",
            };
            setStateChannels([...stateChannels, newChannel]);
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Field
        </Button>
      </div>

      {stateChannels.map((ch, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-3 p-4 rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <Input
              className="h-7 text-xs font-mono font-medium bg-background flex-1"
              placeholder="field_name"
              autoFocus={!ch.key}
              value={ch.key}
              onChange={(e) => {
                const key = e.target.value;
                setStateChannels(
                  stateChannels.map((c, i) => (i === idx ? { ...c, key } : c)),
                );
              }}
              onBlur={() => {
                if (!ch.key || !ch.key.trim()) {
                  setStateChannels(stateChannels.filter((_, i) => i !== idx));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() =>
                setStateChannels(stateChannels.filter((_, i) => i !== idx))
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border/50">
            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={ch.type}
                onValueChange={(v) => {
                  const type = v as LangGraphStateChannel["type"];
                  const defaultReducer =
                    type === "messages"
                      ? "add_messages"
                      : type === "array"
                        ? "append"
                        : type === "object"
                          ? "merge_object"
                          : "replace";
                  setStateChannels(
                    stateChannels.map((c, i) =>
                      i === idx ? { ...c, type, reducer: defaultReducer } : c,
                    ),
                  );
                }}
              >
                <SelectTrigger className="h-7 text-xs bg-background font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="messages">messages</SelectItem>
                  <SelectItem value="string">string</SelectItem>
                  <SelectItem value="array">array</SelectItem>
                  <SelectItem value="object">object</SelectItem>
                  <SelectItem value="json">json</SelectItem>
                  <SelectItem value="number">number</SelectItem>
                  <SelectItem value="boolean">boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <Label className="text-xs text-muted-foreground">Reducer</Label>
              <Select
                value={ch.reducer}
                onValueChange={(v) => {
                  const reducer = v as LangGraphStateChannel["reducer"];
                  setStateChannels(
                    stateChannels.map((c, i) =>
                      i === idx ? { ...c, reducer } : c,
                    ),
                  );
                }}
              >
                <SelectTrigger className="h-7 text-xs bg-background font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replace">replace (override)</SelectItem>
                  <SelectItem value="add_messages">add_messages</SelectItem>
                  <SelectItem value="append">append (list)</SelectItem>
                  <SelectItem value="concat_array">concat_array</SelectItem>
                  <SelectItem value="merge_object">merge_object</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
    </TabsContent>
  );
}

import React from "react";
import { AnyMessagingResource } from "@/types/canvas";
import { LocalTextarea } from "../../backend-nodes/graph-nodes/shared";
import { ConfigItemData } from "./types";
import {
  PUBLISH_TRIGGER_CONDITIONS,
  DEFAULT_PUBLISH_TRIGGER_CONDITION,
} from "@workspace/canvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface EventDescriptionConfigProps {
  item: ConfigItemData;
  isPublished: boolean;
  handleUpdate: (eventId: string, changes: Partial<AnyMessagingResource>) => void;
}

export const EventDescriptionConfig: React.FC<EventDescriptionConfigProps> = ({
  item,
  isPublished,
  handleUpdate,
}) => {
  const currentValue = item.publishedWhen || DEFAULT_PUBLISH_TRIGGER_CONDITION;
  const isPredefined = PUBLISH_TRIGGER_CONDITIONS.some(
    (cond) => cond.value === currentValue,
  );

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {isPublished ? "Publish Trigger Condition" : "Description"}
      </span>
      {isPublished ? (
        <Select
          value={currentValue}
          onValueChange={(val) =>
            handleUpdate(item.id, {
              publishedWhen: val,
              description: val,
            })
          }
        >
          <SelectTrigger className="bg-background/50 text-sm">
            <SelectValue placeholder="Select trigger condition..." />
          </SelectTrigger>
          <SelectContent>
            {!isPredefined && currentValue && (
              <SelectItem value={currentValue} className="text-xs font-mono">
                {currentValue}
              </SelectItem>
            )}
            {PUBLISH_TRIGGER_CONDITIONS.map((cond) => (
              <SelectItem key={cond.value} value={cond.value} className="text-xs">
                {cond.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <LocalTextarea
          className="min-h-[60px] text-sm resize-none bg-background/50 focus-visible:ring-1"
          placeholder="Describe this resource..."
          value={item.description || ""}
          onBlur={(e) =>
            handleUpdate(item.id, {
              description: e.target.value,
            })
          }
        />
      )}
    </div>
  );
};

import React from "react";
import { AnyMessagingResource } from "@/types/canvas";
import { LocalTextarea } from "../../backend-nodes/graph-nodes/shared";
import { ConfigItemData } from "./types";

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
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {isPublished ? "Publish Trigger Condition" : "Description"}
      </span>
      <LocalTextarea
        className="min-h-[60px] text-sm resize-none bg-background/50 focus-visible:ring-1"
        placeholder={
          isPublished
            ? "Explain the exact logic/condition that causes this event to fire (e.g. 'When a user successfully pays for their order')"
            : "Describe this resource..."
        }
        value={item.publishedWhen || item.description || ""}
        onBlur={(e) =>
          handleUpdate(item.id, {
            publishedWhen: e.target.value,
            description: e.target.value,
          })
        }
      />
    </div>
  );
};

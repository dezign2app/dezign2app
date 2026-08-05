import React from "react";
import { AnyMessagingResource } from "@/types/canvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalInput, LocalTextarea } from "../../backend-nodes/graph-nodes/shared";
import { ConfigItemData } from "./types";

interface ConsumerConfigProps {
  item: ConfigItemData;
  handleUpdate: (eventId: string, changes: Partial<AnyMessagingResource>) => void;
}

export const ConsumerConfig: React.FC<ConsumerConfigProps> = ({
  item,
  handleUpdate,
}) => {
  return (
    <>
      <div className="flex flex-col gap-1.5 border-t pt-4">
        <span className="text-xs font-bold text-muted-foreground">
          Handler Logic
        </span>
        <LocalTextarea
          className="min-h-[80px] text-xs font-mono"
          placeholder="What happens when this event is received?"
          value={item.handlerLogic || ""}
          onBlur={(e) =>
            handleUpdate(item.id, { handlerLogic: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-4 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            Retry Policy
          </span>
          <Select
            value={item.retryPolicy || "NONE"}
            onValueChange={(v) => handleUpdate(item.id, { retryPolicy: v })}
          >
            <SelectTrigger className="w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE" className="text-xs">
                None
              </SelectItem>
              <SelectItem value="EXPONENTIAL_BACKOFF" className="text-xs">
                Exponential Backoff
              </SelectItem>
              <SelectItem value="FIXED_INTERVAL" className="text-xs">
                Fixed Interval
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            Max Retries
          </span>
          <LocalInput
            type="number"
            className="w-24 text-xs text-right"
            placeholder="e.g. 3"
            value={item.maxRetries ?? ""}
            onBlur={(e) =>
              handleUpdate(item.id, { maxRetries: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-muted-foreground">DLQ</span>
          <LocalInput
            className="flex-1 text-xs font-mono"
            placeholder="dlq-topic-name"
            value={item.deadLetterQueue || ""}
            onBlur={(e) =>
              handleUpdate(item.id, { deadLetterQueue: e.target.value })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`idempotent-${item.id}`}
            checked={item.isIdempotent || false}
            onChange={(e) =>
              handleUpdate(item.id, { isIdempotent: e.target.checked })
            }
          />
          <label
            htmlFor={`idempotent-${item.id}`}
            className="text-xs font-bold text-muted-foreground cursor-pointer"
          >
            Idempotent Consumer
          </label>
        </div>
      </div>
    </>
  );
};

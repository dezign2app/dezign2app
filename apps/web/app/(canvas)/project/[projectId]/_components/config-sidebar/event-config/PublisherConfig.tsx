import React from "react";
import { AnyMessagingResource } from "@/types/canvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalInput } from "../../backend-nodes/graph-nodes/shared";
import { ConfigItemData } from "./types";

interface PublisherConfigProps {
  item: ConfigItemData;
  handleUpdate: (eventId: string, changes: Partial<AnyMessagingResource>) => void;
}

export const PublisherConfig: React.FC<PublisherConfigProps> = ({
  item,
  handleUpdate,
}) => {
  return (
    <div className="flex flex-col gap-4 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">
          Version
        </span>
        <LocalInput
          className="w-24 text-xs text-right"
          placeholder="v1"
          value={item.version || "v1"}
          onBlur={(e) =>
            handleUpdate(item.id, { version: e.target.value })
          }
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">
          Category
        </span>
        <Select
          value={item.category || "DOMAIN"}
          onValueChange={(v) => handleUpdate(item.id, { category: v })}
        >
          <SelectTrigger className="w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DOMAIN" className="text-xs">
              Domain
            </SelectItem>
            <SelectItem value="INTEGRATION" className="text-xs">
              Integration
            </SelectItem>
            <SelectItem value="CDC" className="text-xs">
              CDC
            </SelectItem>
            <SelectItem value="AUDIT" className="text-xs">
              Audit
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">
          Delivery
        </span>
        <Select
          value={item.delivery || "AT_LEAST_ONCE"}
          onValueChange={(v) => handleUpdate(item.id, { delivery: v })}
        >
          <SelectTrigger className="w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AT_LEAST_ONCE" className="text-xs">
              At Least Once
            </SelectItem>
            <SelectItem value="AT_MOST_ONCE" className="text-xs">
              At Most Once
            </SelectItem>
            <SelectItem value="EXACTLY_ONCE" className="text-xs">
              Exactly Once
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

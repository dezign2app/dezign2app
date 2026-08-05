import React from "react";
import { BackendNode, AnyMessagingResource } from "@/types/canvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { ConfigItemData } from "./types";

interface BrokerBindingConfigProps {
  item: ConfigItemData;
  isPublished: boolean;
  messagingNodes: BackendNode[];
  availableResources: AnyMessagingResource[];
  handleUpdate: (eventId: string, changes: Partial<AnyMessagingResource>) => void;
}

export const BrokerBindingConfig: React.FC<BrokerBindingConfigProps> = ({
  item,
  isPublished,
  messagingNodes,
  availableResources,
  handleUpdate,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 shadow-sm">
      <span className="text-xs font-bold text-muted-foreground">
        {isPublished ? "Publishes To Broker" : "Consumes From Broker"}
      </span>
      <Select
        value={item.brokerNodeId || ""}
        onValueChange={(v) =>
          handleUpdate(item.id, {
            brokerNodeId: v,
            messagingResourceId: "",
          })
        }
      >
        <SelectTrigger className="text-xs">
          <SelectValue placeholder="Select Messaging Node" />
        </SelectTrigger>
        <SelectContent>
          {messagingNodes.length === 0 && (
            <SelectItem value="none" disabled className="text-xs">
              No messaging nodes found
            </SelectItem>
          )}
          {messagingNodes.map((node) => (
            <SelectItem key={node.id} value={node.id} className="text-xs">
              {node.data.label || "Untitled Messaging"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {item.brokerNodeId ? (
        <Select
          value={item.messagingResourceId || ""}
          onValueChange={(v) => {
            const selectedResource = availableResources.find(
              (resource) => resource.id === v,
            );
            const resourceSchema =
              selectedResource && "payloadSchema" in selectedResource
                ? selectedResource.payloadSchema
                : undefined;
            handleUpdate(item.id, {
              messagingResourceId: v,
              ...(resourceSchema ? { payloadSchema: resourceSchema } : {}),
            });
          }}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Select Topic / Queue / Stream" />
          </SelectTrigger>
          <SelectContent>
            {availableResources.length === 0 && (
              <SelectItem value="none" disabled className="text-xs">
                No resources defined on broker
              </SelectItem>
            )}
            {availableResources.map((res) => (
              <SelectItem key={res.id} value={res.id} className="text-xs">
                {res.name || "Untitled Resource"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="h-9 text-xs text-muted-foreground flex items-center px-3 bg-secondary/20 border rounded-md border-dashed">
          Select a broker first
        </div>
      )}
    </div>
  );
};

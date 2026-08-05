import React from "react";
import { SchemaEditor } from "../backend-nodes/graph-nodes/Editors";
import {
  EventConfigProps,
  useEventConfig,
  EventConfigHeader,
  BrokerBindingConfig,
  EventDescriptionConfig,
  EventConnectionsConfig,
  BucketStorageConfig,
  CacheConfig,
  ConsumerConfig,
  PublisherConfig,
} from "./event-config";

export const EventConfig: React.FC<EventConfigProps> = ({ id, nodeId }) => {
  const {
    item,
    resourceArrayName,
    handleUpdate,
    isPublished,
    isConsumed,
    messagingNodes,
    availableResources,
    edges,
    nodes,
    endpoints,
    events,
  } = useEventConfig(id, nodeId);

  if (!item) return null;

  const isCache = resourceArrayName === "caches" || item.kind === "cache";
  const isBucket = resourceArrayName === "buckets";

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12">
      <EventConfigHeader item={item} resourceArrayName={resourceArrayName} />

      {item.variant !== "definition" && (
        <BrokerBindingConfig
          item={item}
          isPublished={isPublished}
          messagingNodes={messagingNodes}
          availableResources={availableResources}
          handleUpdate={handleUpdate}
        />
      )}

      {!isConsumed && !isCache && (
        <EventDescriptionConfig
          item={item}
          isPublished={isPublished}
          handleUpdate={handleUpdate}
        />
      )}

      {item.variant === "definition" && (
        <EventConnectionsConfig
          item={item}
          resourceArrayName={resourceArrayName}
          edges={edges}
          nodes={nodes}
          endpoints={endpoints}
          events={events}
        />
      )}

      {isBucket && (
        <BucketStorageConfig item={item} handleUpdate={handleUpdate} />
      )}

      {!isCache && (
        <SchemaEditor
          title={
            isBucket
              ? "Metadata"
              : isConsumed
                ? "Expected Payload"
                : isPublished
                  ? "Payload Schema"
                  : "Schema"
          }
          schema={item.payloadSchema}
          onChange={(payloadSchema) =>
            handleUpdate(item.id, { payloadSchema })
          }
        />
      )}

      {isCache && (
        <CacheConfig item={item} nodes={nodes} handleUpdate={handleUpdate} />
      )}

      {isConsumed && (
        <ConsumerConfig item={item} handleUpdate={handleUpdate} />
      )}

      {isPublished && (
        <PublisherConfig item={item} handleUpdate={handleUpdate} />
      )}
    </div>
  );
};

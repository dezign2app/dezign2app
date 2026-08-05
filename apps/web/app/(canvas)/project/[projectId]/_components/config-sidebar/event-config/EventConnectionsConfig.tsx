import React from "react";
import { BackendNode, Endpoint, AnyMessagingResource, BackendEdge } from "@/types/canvas";
import { ConfigItemData, ResourceArrayName } from "./types";

interface EventConnectionsConfigProps {
  item: ConfigItemData;
  resourceArrayName: ResourceArrayName;
  edges: BackendEdge[];
  nodes: BackendNode[];
  endpoints: Endpoint[];
  events: AnyMessagingResource[];
}

export const EventConnectionsConfig: React.FC<EventConnectionsConfigProps> = ({
  item,
  resourceArrayName,
  edges,
  nodes,
  endpoints,
  events,
}) => {
  let pubLabel = "Publishers";
  let subLabel = "Subscribers";
  let noPubText = "No publishers connected";
  let noSubText = "No subscribers connected";

  if (resourceArrayName === "buckets" || resourceArrayName === "caches") {
    pubLabel = "Writers";
    subLabel = "Readers";
    noPubText = "No writers connected";
    noSubText = "No readers connected";
  } else if (
    resourceArrayName === "queues" ||
    resourceArrayName === "streams"
  ) {
    pubLabel = "Producers";
    subLabel = "Consumers";
    noPubText = "No producers connected";
    noSubText = "No consumers connected";
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 flex flex-col gap-2 rounded-xl border bg-card/50 p-4 shadow-sm">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {pubLabel}
        </span>
        {edges.filter((e) => e.targetResourceId === item.id).length === 0 ? (
          <span className="text-xs text-muted-foreground/60 italic">
            {noPubText}
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {edges
              .filter((e) => e.targetResourceId === item.id)
              .map((e, i) => {
                const n = nodes.find((n) => n.id === e.source);
                let eventName = "";
                let eventId = e.sourceResourceId || "";

                if (!eventId) {
                  if (e.sourceHandle?.startsWith("publishedEvents-out-")) {
                    eventId = e.sourceHandle.replace(
                      "publishedEvents-out-",
                      "",
                    );
                  } else if (
                    e.sourceHandle?.startsWith("consumedEvents-out-")
                  ) {
                    eventId = e.sourceHandle.replace(
                      "consumedEvents-out-",
                      "",
                    );
                  } else if (
                    e.sourceHandle?.match(
                      /^(endpoint|endpoints|routeEndpoints)-out-/,
                    )
                  ) {
                    const epId = e.sourceHandle.replace(
                      /^(endpoint|endpoints|routeEndpoints)-out-/,
                      "",
                    );
                    const ep = endpoints.find((ep) => ep.id === epId);
                    if (ep) eventName = `${ep.type} ${ep.name}`;
                  }
                }

                if (!eventName && eventId) {
                  const ev = events.find((ev) => ev.id === eventId);
                  if (ev) {
                    eventName = ev.name;
                  } else {
                    for (const ep of endpoints) {
                      const publishedMatch = ep.publishedEvents?.find(
                        (pev) => pev.id === eventId,
                      );
                      if (publishedMatch) {
                        eventName = publishedMatch.name;
                        break;
                      }
                    }
                  }
                }

                const displayName = eventName
                  ? `${n?.data.label || "Unknown Node"} / ${eventName}`
                  : n?.data.label || "Unknown Node";
                return (
                  <span
                    key={i}
                    className="text-xs font-medium"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                );
              })}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2 rounded-xl border bg-card/50 p-4 shadow-sm">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {subLabel}
        </span>
        {edges.filter((e) => e.sourceResourceId === item.id).length === 0 ? (
          <span className="text-xs text-muted-foreground/60 italic">
            {noSubText}
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {edges
              .filter((e) => e.sourceResourceId === item.id)
              .map((e, i) => {
                const n = nodes.find((n) => n.id === e.target);
                let eventName = "";
                let eventId = e.targetResourceId || "";

                if (!eventId) {
                  if (e.targetHandle?.startsWith("consumedEvents-in-")) {
                    eventId = e.targetHandle.replace(
                      "consumedEvents-in-",
                      "",
                    );
                  } else if (
                    e.targetHandle?.startsWith("publishedEvents-in-")
                  ) {
                    eventId = e.targetHandle.replace(
                      "publishedEvents-in-",
                      "",
                    );
                  } else if (
                    e.targetHandle?.match(
                      /^(endpoint|endpoints|routeEndpoints)-in-/,
                    )
                  ) {
                    const epId = e.targetHandle.replace(
                      /^(endpoint|endpoints|routeEndpoints)-in-/,
                      "",
                    );
                    const ep = endpoints.find((ep) => ep.id === epId);
                    if (ep) eventName = `${ep.type} ${ep.name}`;
                  }
                }

                if (!eventName && eventId) {
                  const ev = events.find((ev) => ev.id === eventId);
                  if (ev) {
                    eventName = ev.name;
                  }
                }

                const displayName = eventName
                  ? `${n?.data.label || "Unknown Node"} / ${eventName}`
                  : n?.data.label || "Unknown Node";
                return (
                  <span
                    key={i}
                    className="text-xs font-medium"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

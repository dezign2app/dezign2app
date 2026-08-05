import React from "react";
import { ConfigItemData, ResourceArrayName } from "./types";

interface EventConfigHeaderProps {
  item: ConfigItemData;
  resourceArrayName: ResourceArrayName;
}

export const EventConfigHeader: React.FC<EventConfigHeaderProps> = ({
  item,
  resourceArrayName,
}) => {
  const isCache = resourceArrayName === "caches" || item.kind === "cache";
  const isBucket = resourceArrayName === "buckets";

  return (
    <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-orange-500/15 text-orange-500 rounded border border-orange-500/20 shadow-sm">
          {isCache ? "CACHE" : isBucket ? "STORAGE" : "EVENT"}
        </span>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {item.name}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        {isCache
          ? "Configure caching details and schema."
          : isBucket
            ? "Configure data persistence, schema and events."
            : "Configure event and messaging details."}
      </span>
    </div>
  );
};

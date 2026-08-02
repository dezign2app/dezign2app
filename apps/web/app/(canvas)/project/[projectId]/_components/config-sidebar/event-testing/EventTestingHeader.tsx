import React from "react";
import type { Endpoint, BackendNode, UIEventItem } from "@/types/canvas";

interface EventTestingHeaderProps {
  event: UIEventItem | undefined;
  endpoint: Endpoint | undefined;
  targetNode: BackendNode | undefined;
}

export const EventTestingHeader: React.FC<EventTestingHeaderProps> = ({
  event,
  endpoint,
  targetNode,
}) => {
  const url = endpoint?.name || "/";

  return (
    <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 shadow-sm uppercase">
          {(event?.event as string) || event?.name || "event"}
        </span>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {event?.name && event.name !== (event.event as string)
            ? event.name
            : "Action Configuration"}
        </span>
      </div>
      <span className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
        Targeting
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-md border text-xs font-mono text-foreground">
          <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground border">
            {endpoint?.type || "GET"}
          </span>
          <span className="font-semibold text-muted-foreground">{url}</span>
        </div>
        on <strong>{targetNode?.data?.label || "Service"}</strong>
      </span>
    </div>
  );
};

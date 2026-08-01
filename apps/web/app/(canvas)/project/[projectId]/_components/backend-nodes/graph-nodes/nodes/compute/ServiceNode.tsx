import React, { useState, useEffect } from "react";
import { NodeProps } from "@xyflow/react";
import { Server, ChevronDown, ChevronUp } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import {
  NodeHeader,
  EndpointList,
  MessagingResourceList,
  useSimulationNodeState,
  getSimulationNodeBorderClass,
} from "../../common/shared";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "sonner";

export const ServiceNode = ({ id, data, selected }: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const addEvent = useBackendCanvasStore((s) => s.addEvent);
  const updateEvent = useBackendCanvasStore((s) => s.updateEvent);
  const deleteEvent = useBackendCanvasStore((s) => s.deleteEvent);
  const nodes = useBackendCanvasStore((s) => s.nodes);

  const simulation = useSimulationNodeState(id);
  const borderClass = getSimulationNodeBorderClass(
    simulation,
    Boolean(selected),
  );

  // Mandatory Port Initialization
  useEffect(() => {
    if (!data.port || !data.port.trim()) {
      const existingPorts = new Set(
        nodes
          .filter((n) => n?.id !== id && n?.type === "service")
          .map((n) => parseInt(n.data?.port?.trim() || "8080", 10))
          .filter((p) => !isNaN(p)),
      );
      let nextPort = 8080;
      while (existingPorts.has(nextPort)) {
        nextPort++;
      }
      updateNode(id, { data: { ...data, port: String(nextPort) } });
    }
  }, [id, data, nodes, updateNode]);

  const consumedEvents = useBackendCanvasStore((s) => s.events).filter(
    (e) => e.nodeId === id && e.variant === "consume",
  );
  const publishedEvents = useBackendCanvasStore((s) => s.events).filter(
    (e) => e.nodeId === id && e.variant === "publish",
  );

  const [configOpen, setConfigOpen] = useState(false);

  const currentPort = data.port?.trim() || "8080";

  const conflictNode = nodes.find(
    (n) =>
      n?.id !== id &&
      n?.type === "service" &&
      (n.data?.port?.trim() || "8080") === currentPort,
  );
  const isPortOccupied = Boolean(conflictNode);

  // When an error exists, ensure configOpen is set to true so panel doesn't close when typing
  useEffect(() => {
    if (isPortOccupied) {
      setConfigOpen(true);
    }
  }, [isPortOccupied]);

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const trimmedVal = val.trim();
    if (trimmedVal) {
      const occupiedByNode = nodes.find(
        (n) =>
          n?.id !== id &&
          n?.type === "service" &&
          (n.data?.port?.trim() || "8080") === trimmedVal,
      );
      if (occupiedByNode) {
        toast.error(
          `Port ${trimmedVal} is already occupied by ${occupiedByNode.data?.label || "another service"}!`,
        );
      }
    }
    updateNode(id, { data: { ...data, port: val } });
  };

  const isConfigExpanded = configOpen || isPortOccupied;

  return (
    <div
      className={cn(
        "shadow-md rounded-xl bg-card border-2 min-w-[300px] max-w-[400px] flex flex-col transition-all duration-300",
        borderClass,
      )}
    >
      <NodeHeader
        id={id}
        data={data}
        nodeType="service"
        icon={Server}
        title="Service / API"
        colorClass="bg-blue-500/10 text-blue-700 dark:text-blue-400"
        selected={selected}
      />

      {/* Description */}
      <div className="px-3 py-2 bg-secondary/5 border-b nodrag">
        <Textarea
          className="min-h-[20px] text-xs bg-transparent border-none shadow-none p-1 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          placeholder="description"
          value={data.description || ""}
          onChange={(e) =>
            updateNode(id, { data: { ...data, description: e.target.value } })
          }
        />
      </div>
      <EndpointList nodeId={id} title="Endpoints / Routes" />

      <MessagingResourceList
        nodeId={id}
        title="Consume Events (Listeners)"
        items={consumedEvents}
        variant="consume"
        resourceType="topics"
        onAdd={(item) => addEvent(id, "consume", item)}
        onUpdate={(eventId, name) => updateEvent(eventId, { name })}
        onDelete={(eventId) => deleteEvent(eventId)}
        onUpdateItem={(eventId, changes) => updateEvent(eventId, changes)}
      />

      <MessagingResourceList
        nodeId={id}
        title="Publish Events (Background)"
        items={publishedEvents}
        variant="publish"
        resourceType="topics"
        onAdd={(item) => addEvent(id, "publish", item)}
        onUpdate={(eventId, name) => updateEvent(eventId, { name })}
        onDelete={(eventId) => deleteEvent(eventId)}
        onUpdateItem={(eventId, changes) => updateEvent(eventId, changes)}
      />

      <div className="p-3 bg-secondary/10 flex flex-col gap-3 rounded-b-xl">
        <div
          className={cn(
            "flex items-center justify-between group",
            isPortOccupied ? "cursor-not-allowed" : "cursor-pointer",
          )}
          onClick={() => {
            if (isPortOccupied) {
              toast.error(
                "Cannot collapse Server Config while there is a port conflict!",
              );
              return;
            }
            setConfigOpen(!configOpen);
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider transition-colors",
                isPortOccupied
                  ? "text-destructive"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              Server Config
            </span>
            {isPortOccupied && (
              <span className="text-[9px] bg-destructive/10 text-destructive font-semibold px-1.5 py-0.5 rounded">
                Error
              </span>
            )}
          </div>
          <div
            className={cn(
              "p-0.5 rounded transition-all",
              isPortOccupied
                ? "text-destructive"
                : "hover:bg-secondary text-muted-foreground group-hover:text-foreground",
            )}
          >
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-300 ease-in-out",
                isConfigExpanded && "rotate-180",
              )}
            />
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            isConfigExpanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none",
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border/50">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`cors-${id}`} className="text-xs">
                    Enable CORS
                  </Label>
                  <Switch
                    id={`cors-${id}`}
                    className="nodrag"
                    checked={data.cors || false}
                    onCheckedChange={(val) =>
                      updateNode(id, { data: { ...data, cors: val } })
                    }
                  />
                </div>
                {data.cors && (
                  <Input
                    className="h-6 text-xs bg-background"
                    placeholder="Allowed Origins (e.g. *, https://domain.com)"
                    value={data.corsOrigins || ""}
                    onChange={(e) =>
                      updateNode(id, {
                        data: { ...data, corsOrigins: e.target.value },
                      })
                    }
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs shrink-0 text-muted-foreground">
                    Port
                  </Label>
                  <Input
                    className={cn(
                      "h-6 text-xs w-24 text-right bg-background nodrag",
                      isPortOccupied &&
                        "border-destructive text-destructive focus-visible:ring-destructive focus-visible:ring-1",
                    )}
                    placeholder="8080"
                    value={data.port || ""}
                    onChange={handlePortChange}
                  />
                </div>
                {isPortOccupied && (
                  <span className="text-[10px] text-destructive text-right font-medium">
                    Port {currentPort} is already in use by{" "}
                    {conflictNode?.data?.label || "another service"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs shrink-0 text-muted-foreground">
                  Rate Limit
                </Label>
                <Input
                  className="h-6 text-xs w-24 text-right bg-background"
                  placeholder="100/m"
                  value={data.rateLimit || ""}
                  onChange={(e) =>
                    updateNode(id, {
                      data: { ...data, rateLimit: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

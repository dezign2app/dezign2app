import React from "react";
import { Zap, Database, Radio } from "lucide-react";
import { TableCrudConfig, PublishedEventInfo } from "../types";
import { toVarName, toPascalCase, toTopicKey } from "../utils";

interface InfrastructurePreviewProps {
  crudConfig?: TableCrudConfig[];
  availableTableNodes?: { id: string; label: string }[];
  publishedEvents?: PublishedEventInfo[];
  endpointMethod?: string;
}

export function InfrastructurePreview({
  crudConfig = [],
  availableTableNodes = [],
  publishedEvents = [],
  endpointMethod = "POST",
}: InfrastructurePreviewProps) {
  const hasDbOps = crudConfig.some((c) => c.tableNodeId && c.operations.length > 0);
  const hasEvents = publishedEvents && publishedEvents.length > 0;

  if (!hasDbOps && !hasEvents) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Auto-Generated Code Executions
          </span>
        </div>
        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
          Compiler Output Preview
        </span>
      </div>

      <div className="flex flex-col gap-2.5 bg-background/90 p-3 rounded-lg border border-border/60 font-mono text-[11px] leading-relaxed shadow-inner">
        {/* Database Prepared Statements Preview */}
        {crudConfig.map((configItem, idx) => {
          if (!configItem.tableNodeId || configItem.operations.length === 0)
            return null;

          const tableObj = availableTableNodes.find(
            (t) => t.id === configItem.tableNodeId,
          );
          const rawLabel = tableObj?.label || "table";
          const tableName = rawLabel.toLowerCase().replace(/[^a-z0-9_]/g, "_");
          const Pascal = toPascalCase(tableName);
          const varName = toVarName(tableName);

          return (
            <div
              key={`${configItem.tableNodeId}_${idx}`}
              className="flex flex-col gap-1.5 pb-2 border-b border-border/30 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                <Database className="w-3 h-3 text-blue-500 shrink-0" />
                <span>import &#123; ... &#125; from "@workspace/db/helpers/{varName}"</span>
              </div>

              {configItem.operations.map((op) => {
                let snippet = "";
                if (op === "create") snippet = `create${Pascal}(body);`;
                else if (op === "read")
                  snippet = `const result = findAll${Pascal}();`;
                else if (op === "update")
                  snippet = `update${Pascal}(req.params.id, body);`;
                else if (op === "delete")
                  snippet = `delete${Pascal}ById(req.params.id);`;

                return (
                  <div
                    key={op}
                    className="flex items-center gap-2 pl-2 border-l-2 border-blue-500/40 text-foreground"
                  >
                    <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      {op}
                    </span>
                    <code className="text-blue-600 dark:text-blue-300 font-semibold">
                      {snippet}
                    </code>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Kafka Event Publisher Preview */}
        {publishedEvents && publishedEvents.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30 first:border-0 first:pt-0">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
              <Radio className="w-3 h-3 text-purple-500 shrink-0" />
              <span>import &#123; publishKafkaEvent, KAFKA_TOPICS &#125; from "@workspace/messaging/publishers"</span>
            </div>
            {publishedEvents.map((ev, idx) => {
              const eventName = ev.name || ev.topic || "EVENT";
              const topicKey = toTopicKey(eventName);
              return (
                <div
                  key={ev.id || idx}
                  className="flex items-center gap-2 pl-2 border-l-2 border-purple-500/40 text-foreground"
                >
                  <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    PUB
                  </span>
                  <code className="text-purple-600 dark:text-purple-300 font-semibold">
                    await publishKafkaEvent(KAFKA_TOPICS.{topicKey}, &#123; action: "{endpointMethod.toLowerCase()}", payload: body &#125;);
                  </code>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { Panel } from "@xyflow/react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Globe,
  Server,
  Waves,
  GitBranch,
  Radio,
  Database,
  HardDrive,
  Cog,
  Search,
  Network,
  Webhook,
  Brain,
  Boxes,
  Key,
} from "lucide-react";
import type { GraphNodeType } from "@workspace/canvas";

interface NodePalettePanelProps {
  onAddNode: (type: GraphNodeType, label: string) => void;
}

export const NodePalettePanel: React.FC<NodePalettePanelProps> = ({
  onAddNode,
}) => {
  return (
    <Panel
      position="top-left"
      className="flex gap-1.5 flex-col bg-background/95 backdrop-blur border rounded-lg p-2.5 shadow-md max-w-[190px] max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden hide-scrollbar"
    >
      <Badge>BETA</Badge>
      {/* COMPUTING */}
      <div className="text-[9px] uppercase font-extrabold text-muted-foreground/60 px-1 pt-1 pb-1">
        Computing
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("webClient", "Client")}
      >
        <Globe className="w-3.5 h-3.5 mr-2 shrink-0" />
        Client
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("service", "Service")}
      >
        <Server className="w-3.5 h-3.5 mr-2" />
        Service
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("worker", "Worker")}
      >
        <Cog className="w-3.5 h-3.5 mr-2 text-amber-500" />
        Worker
      </Button>

      {/* MESSAGING */}
      <div className="text-[9px] uppercase font-extrabold text-muted-foreground/60 px-1 pt-2 pb-1 border-t mt-1">
        Messaging
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("kafka", "Kafka")}
      >
        <Waves className="w-3.5 h-3.5 mr-2 text-emerald-500" />
        Kafka
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("redis-streams", "Redis Streams")}
      >
        <Waves className="w-3.5 h-3.5 mr-2 text-rose-500" />
        Redis Streams
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("redis-pubsub", "Redis Pub/Sub")}
      >
        <Radio className="w-3.5 h-3.5 mr-2 text-red-500" />
        Pub/Sub
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("sqs", "Queue")}
      >
        <GitBranch className="w-3.5 h-3.5 mr-2 text-orange-500" />
        Queue (SQS)
      </Button>

      {/* STORAGE */}
      <div className="text-[9px] uppercase font-extrabold text-muted-foreground/60 px-1 pt-2 pb-1 border-t mt-1">
        Storage
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("db_ref", "Database")}
      >
        <Database className="w-3.5 h-3.5 mr-2" />
        Database
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("redis-cache", "Cache")}
      >
        <Database className="w-3.5 h-3.5 mr-2 text-red-500" />
        Cache
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("storage", "Storage Bucket")}
      >
        <HardDrive className="w-3.5 h-3.5 mr-2 text-amber-500" />
        Storage Bucket
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("vector_db_ref", "Vector DB")}
      >
        <Database className="w-3.5 h-3.5 mr-2 text-violet-500" />
        Vector DB
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("search_index", "Search Index")}
      >
        <Search className="w-3.5 h-3.5 mr-2 text-sky-500" />
        Search Index
      </Button>

      {/* NETWORK */}
      <div className="text-[9px] uppercase font-extrabold text-muted-foreground/60 px-1 pt-2 pb-1 border-t mt-1">
        Network
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("api_gateway", "API Gateway")}
      >
        <Network className="w-3.5 h-3.5 mr-2 text-teal-500" />
        API Gateway
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("identity_provider", "Identity Provider")}
      >
        <Key className="w-3.5 h-3.5 mr-2 text-blue-500" />
        Identity Provider
      </Button>

      {/* EXTERNAL */}
      <div className="text-[9px] uppercase font-extrabold text-muted-foreground/60 px-1 pt-2 pb-1 border-t mt-1">
        External
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("external", "External API")}
      >
        <Globe className="w-3.5 h-3.5 mr-2" />
        External API
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("webhook", "Webhook")}
      >
        <Webhook className="w-3.5 h-3.5 mr-2 text-pink-500" />
        Webhook
      </Button>

      {/* AI */}
      <div className="text-[9px] uppercase font-extrabold text-muted-foreground/60 px-1 pt-2 pb-1 border-t mt-1">
        AI
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("langgraph", "LangGraph Agent")}
      >
        <Network className="w-3.5 h-3.5 mr-2 text-emerald-500" />
        LangGraph Agent
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("llm", "LLM")}
      >
        <Brain className="w-3.5 h-3.5 mr-2 text-purple-500" />
        LLM
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs justify-start h-8 shrink-0"
        onClick={() => onAddNode("mcp_server", "MCP Server")}
      >
        <Boxes className="w-3.5 h-3.5 mr-2 text-indigo-500" />
        MCP Server
      </Button>
    </Panel>
  );
};

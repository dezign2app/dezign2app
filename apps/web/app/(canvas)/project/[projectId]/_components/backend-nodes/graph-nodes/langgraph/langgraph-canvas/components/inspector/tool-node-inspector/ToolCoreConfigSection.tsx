import React from "react";
import { BoxSelect, Box, Server, Globe } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { ToolNodeData, ToolSource } from "@workspace/canvas";
import { LocalInput, LocalTextarea } from "../../../../../common";
import {
  TOOL_SOURCE_INLINE,
  TOOL_SOURCE_MCP_SERVER,
  TOOL_SOURCE_API_ENDPOINT,
} from "../../../constants";

interface ToolCoreConfigSectionProps {
  selectedToolData: ToolNodeData;
  onUpdateTool: (changes: Partial<ToolNodeData>) => void;
  schemaText: string;
  setSchemaText: (val: string) => void;
}

export function ToolCoreConfigSection({
  selectedToolData,
  onUpdateTool,
  schemaText,
  setSchemaText,
}: ToolCoreConfigSectionProps) {
  const handleNameChange = (val: string) => {
    const snake = val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    onUpdateTool({ name: snake });
  };

  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <BoxSelect className="w-4 h-4 text-emerald-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Core Config
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Name (snake_case)
        </Label>
        <LocalInput
          value={selectedToolData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleNameChange(e.target.value)
          }
          className="h-7 text-xs font-mono bg-background"
          placeholder="my_awesome_tool"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Description
        </Label>
        <LocalTextarea
          value={selectedToolData.description || ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onUpdateTool({ description: e.target.value })
          }
          className="text-xs min-h-[60px] resize-y bg-background"
          placeholder="Describe what the tool does for the LLM..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Source
        </Label>
        <Select
          value={selectedToolData.source || TOOL_SOURCE_INLINE}
          onValueChange={(val: ToolSource) => onUpdateTool({ source: val })}
        >
          <SelectTrigger className="h-7 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TOOL_SOURCE_INLINE}>
              <div className="flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-emerald-400" /> Inline Code
              </div>
            </SelectItem>
            <SelectItem value={TOOL_SOURCE_MCP_SERVER}>
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-orange-400" /> MCP Server
              </div>
            </SelectItem>
            <SelectItem value={TOOL_SOURCE_API_ENDPOINT}>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> API Endpoint
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedToolData.source === TOOL_SOURCE_API_ENDPOINT && (
        <div className="flex flex-col gap-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
          <Label className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
            Endpoint URL
          </Label>
          <LocalInput
            value={selectedToolData.endpointUrl || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateTool({ endpointUrl: e.target.value })
            }
            className="h-7 text-xs font-mono bg-background"
            placeholder="https://api.example.com/v1/tool"
          />
        </div>
      )}

      {selectedToolData.source === TOOL_SOURCE_MCP_SERVER && (
        <div className="flex flex-col gap-2 p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
          <Label className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">
            MCP Connection ID
          </Label>
          <LocalInput
            value={selectedToolData.mcpConnectionId || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateTool({ mcpConnectionId: e.target.value })
            }
            className="h-7 text-xs font-mono bg-background"
            placeholder="conn_12345"
          />
          <Label className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mt-2">
            Remote Tool Name
          </Label>
          <LocalInput
            value={selectedToolData.remoteToolName || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateTool({ remoteToolName: e.target.value })
            }
            className="h-7 text-xs font-mono bg-background"
            placeholder="search_files"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <Label className="text-xs font-semibold text-foreground flex justify-between items-center">
          <span>Input Schema (JSON Schema)</span>
          <span className="text-[9px] font-normal text-muted-foreground">
            Zod compatible
          </span>
        </Label>
        <LocalTextarea
          value={schemaText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setSchemaText(e.target.value);
            onUpdateTool({ inputSchema: e.target.value });
          }}
          className="text-[11px] min-h-[100px] resize-y bg-background font-mono leading-relaxed"
          placeholder={
            '{\n  "type": "object",\n  "properties": {\n    "query": { "type": "string" }\n  }\n}'
          }
        />
      </div>
    </div>
  );
}

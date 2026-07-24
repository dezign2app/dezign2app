"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, ServerIcon, TerminalIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

export function McpConfigCard() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const mcpUrl = "https://backend.dezign2app.com/mcp";
  const authHeaderKey = "Authorization";
  const authHeaderValue = "Bearer <your api key>";

  const jsonSnippet = JSON.stringify(
    {
      mcpServers: {
        dezign2app: {
          url: mcpUrl,
          headers: {
            Authorization: "Bearer <your api key>",
          },
        },
      },
    },
    null,
    2
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ServerIcon className="size-4 text-primary" />
            <CardTitle className="text-lg">MCP Configuration</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            MCP Protocol
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Connect Cursor, Claude Desktop, or Windsurf to access project context via Model Context Protocol.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Endpoint URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Server URL
          </label>
          <div className="flex items-center gap-2 bg-muted/60 p-2.5 rounded-md border text-xs font-mono">
            <span className="truncate flex-1 select-all">{mcpUrl}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => copyToClipboard(mcpUrl, "URL")}
              title="Copy URL"
            >
              {copiedField === "URL" ? (
                <CheckIcon className="size-3.5 text-green-500" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Authorization Header */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Authorization Header
          </label>
          <div className="flex items-center gap-2 bg-muted/60 p-2.5 rounded-md border text-xs font-mono">
            <span className="truncate flex-1 select-all">
              {authHeaderKey}: {authHeaderValue}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => copyToClipboard(`${authHeaderKey}: ${authHeaderValue}`, "Header")}
              title="Copy Header"
            >
              {copiedField === "Header" ? (
                <CheckIcon className="size-3.5 text-green-500" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* JSON Snippet */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TerminalIcon className="size-3" />
              Config JSON Snippet
            </label>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 gap-1"
              onClick={() => copyToClipboard(jsonSnippet, "JSON Config")}
            >
              {copiedField === "JSON Config" ? (
                <>
                  <CheckIcon className="size-3 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="size-3" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>
          <pre className="p-3 bg-muted/80 rounded-md border font-mono text-[11px] overflow-x-auto leading-relaxed">
            {jsonSnippet}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

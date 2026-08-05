export type McpServerConnection = {
  id: string;
  name: string;
  url: string;
  transport?: "sse" | "http";
  authRef?: string;
};

export type ToolSource = "inline" | "mcp_server" | "api_endpoint";
export type ToolReturnType = "string" | "object" | "content_blocks" | "command";
export type StateUpdateMode = "set" | "append" | "expression";
export type StoreOperation = "get" | "put" | "delete" | "list";

export type LangGraphToolDefinition = {
  id?: string;
  toolId?: string;
  label?: string;
  name: string;
  description: string;
  inputSchema?: string;

  source: ToolSource;
  endpointUrl?: string;
  mcpConnectionId?: string;
  remoteToolName?: string;

  returnDirect?: boolean;
  returnType?: ToolReturnType;
  outputSchema?: string;
  commandConfig?: {
    stateUpdates: {
      channelKey: string;
      mode?: StateUpdateMode;
      value?: string;
    }[];
  };

  functionBody?: string;
  implementationMode?: "natural_language" | "code";
  prompt?: string;
  executionMode?: "sandboxed_vm" | "disabled";
  headless?: boolean;

  contextAccess?: { enabled?: boolean; fields?: string[] };
  storeAccess?: {
    enabled?: boolean;
    namespace?: string;
    operations?: StoreOperation[];
  };
  streamWriter?: boolean;

  errorHandling?: {
    enabled?: boolean;
    retryCount?: number;
    customErrorMessage?: string;
  };

  position?: { x: number; y: number };
};

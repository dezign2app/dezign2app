import type {
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
  SimulationTestCase,
} from "@/types/canvas";
import type {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  LangGraphLLMNodeData,
  ToolNodeData,
  CanvasNodeData,
  StepNodeData,
  MemoryNodeData,
  MiddlewareNodeData,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/types";

/** Describes one HTTP/event entry point that invokes this LangGraph agent. */
export interface RouteEndpoint {
  kind: "endpoint" | "event" | "task";
  /** HTTP path, e.g. "/chat" or "/analyze-ticket" */
  path: string;
  /** HTTP method to expose this route on */
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Name of the event (for kind=="event") */
  eventName?: string;
  /** Source service/node label for documentation purposes */
  sourceNodeLabel?: string;
  /**
   * Optional per-route payload mapping:
   * key = LangGraph state channel key, value = dot-path into the HTTP body/headers
   * e.g. { "messages": "body.message", "userId": "headers.x-user-id" }
   */
  payloadMapping?: Record<string, string>;
  preInvokeLogicMode?: "natural_language" | "code";
  preInvokePrompt?: string;
  preInvokeCode?: string;
  responseExecutionMode?: "sync" | "stream" | "async_ack";
  responseOutputMode?: "full" | "selected";
  responseFields?: string[];
  postInvokeLogicMode?: "natural_language" | "code";
  postInvokePrompt?: string;
  postInvokeCode?: string;
}

export interface CompileLangGraphInput {
  graphLabel: string;
  stateChannels: LangGraphStateChannel[];
  inputChannels: LangGraphInputChannel[];
  nodes: LangGraphCanvasNode[];
  edges: LangGraphCanvasEdge[];
  memoryConfig?: LangGraphMemoryConfig;
  /** Connected HTTP/event entry points that invoke this agent (from main canvas edges). */
  routeEndpoints?: RouteEndpoint[];
  /** Test scenarios configured for this graph's StartNode. */
  testCases?: SimulationTestCase[];
}

export interface LLMMeta {
  fileName: string;
  varName: string;
}

export interface NodeMeta {
  fileName: string;
  exportName: string;
}

export interface CompileContext {
  input: CompileLangGraphInput;
  llmNodes: Array<{ id: string; data: LangGraphLLMNodeData }>;
  toolNodes: Array<{ id: string; data: ToolNodeData }>;
  agentNodes: Array<{ id: string; data: CanvasNodeData }>;
  stepNodes: Array<{ id: string; data: StepNodeData }>;
  memoryNodes: Array<{ id: string; data: MemoryNodeData }>;
  middlewareNodes: Array<{ id: string; data: MiddlewareNodeData }>;
  hasMemory: boolean;
  hasTools: boolean;
  hasHumanInLoop: boolean;
  usesMessages: boolean;
  agentLLMMap: Map<string, string>;
  agentToolsMap: Map<string, string[]>;
  agentMiddlewareMap: Map<string, string[]>;
  agentMemoryMap: Map<string, string[]>;
  routerStepIds: Set<string>;
  graphId: string;
}

import {
  BackendNode,
  BackendEdge,
  Endpoint,
  LangGraphStepConfig,
  LangGraphEdgeConfig,
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
  CanvasLangGraphNodeData,
  LangGraphToolDefinition,
  LangGraphMiddlewareDefinition,
  LangGraphMemoryDefinition,
  LangGraphAgentDefinition,
} from "@/types/canvas";
import { CompiledServiceResult } from "./types";
import { compileLangGraph, CompileLangGraphInput, RouteEndpoint } from "./langgraph/typescript/v1";
import type {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  LangGraphLLMNode,
  ToolNode,
  MiddlewareNode,
  MemoryNode,
  AgentNode,
  StepNode,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/types";
import {
  NODE_ID_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  NODE_ID_START,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_END,
  NODE_ID_END,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MIDDLEWARE_OUT,
  HANDLE_MEMORY_IN,
  HANDLE_MEMORY_OUT,
  TARGET_KIND_END,
  TARGET_KIND_PORT,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/constants";

/** Resolve which canvas edges connect to this LangGraph node and what they represent. */
export function resolveRouteEndpoints(
  nodeId: string,
  edges: BackendEdge[],
  allNodes: BackendNode[],
  endpoints: Endpoint[],
  events: Array<{ id: string; name?: string; variant?: string }>,
): RouteEndpoint[] {
  const incoming = edges.filter(
    (e) => e.target === nodeId && e.targetHandle === "input-start"
  );

  return incoming.map((edge): RouteEndpoint => {
    const sourceNode = allNodes.find((n) => n.id === edge.source);
    const sourceNodeLabel = sourceNode?.data?.label || edge.source;
    const payloadMapping = edge.data?.payloadMapping;

    if (edge.sourceHandle?.startsWith("endpoint-out-")) {
      const endpointId = edge.sourceHandle.replace("endpoint-out-", "");
      const ep = endpoints.find((e) => e.id === endpointId);
      if (ep) {
        return {
          kind: "endpoint",
          path: ep.name || "/invoke",
          method: (ep.type || "POST") as RouteEndpoint["method"],
          sourceNodeLabel,
          payloadMapping,
        };
      }
    }

    if (edge.sourceHandle?.startsWith("consumedEvents-out-")) {
      const eventId = edge.sourceHandle.replace("consumedEvents-out-", "");
      const ev = events.find((e) => e.id === eventId);
      return {
        kind: "event",
        path: `/${(ev?.name || eventId).toLowerCase().replace(/\s+/g, "-")}`,
        method: "POST",
        eventName: ev?.name || eventId,
        sourceNodeLabel,
        payloadMapping,
      };
    }

    // Fallback — task or plain connection
    return {
      kind: "task",
      path: "/invoke",
      method: "POST",
      sourceNodeLabel,
      payloadMapping,
    };
  });
}

export function extractLangGraphInput(node: BackendNode): CompileLangGraphInput {
  const data: CanvasLangGraphNodeData = node.data || {};
  const graphLabel = data.label || "LangGraph Agent";

  const stateChannels: LangGraphStateChannel[] = data.stateChannels || [
    { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
  ];
  const inputChannels: LangGraphInputChannel[] = data.inputChannels || [];
  const memoryConfig: LangGraphMemoryConfig | undefined = data.memoryConfig;

  // 1. If full canvas nodes & edges are stored directly on node.data
  const canvasNodes = (data as { nodes?: LangGraphCanvasNode[] }).nodes;
  const canvasEdges = (data as { edges?: LangGraphCanvasEdge[] }).edges;

  if (
    Array.isArray(canvasNodes) &&
    Array.isArray(canvasEdges) &&
    canvasNodes.length > 0
  ) {
    return {
      graphLabel,
      stateChannels,
      inputChannels,
      nodes: canvasNodes,
      edges: canvasEdges,
      memoryConfig,
    };
  }

  // 2. Reconstruct nodes & edges from node.data properties
  const reconstructedNodes: LangGraphCanvasNode[] = [
    {
      id: NODE_ID_STATE_GLOBAL,
      type: LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
      position: data.stateNodePosition || { x: 100, y: 60 },
      data: {
        label: "Global Graph State",
        stateChannels,
      },
      deletable: false,
    },
    {
      id: NODE_ID_START,
      type: LANGGRAPH_CANVAS_NODE_START,
      position: data.startNodePosition || { x: 100, y: 320 },
      data: { label: "INPUT State", inputChannels },
      deletable: false,
    },
  ];

  const customLLMs = data.customLlmNodes || [];
  customLLMs.forEach((cLLM) => {
    const customNode: LangGraphLLMNode = {
      id: cLLM.id,
      type: LANGGRAPH_CANVAS_NODE_LLM,
      position: cLLM.position || { x: 340, y: 80 },
      data: {
        label: cLLM.label || "Custom LLM",
        llmId: cLLM.id,
        provider: cLLM.provider || "custom",
        url: cLLM.url || cLLM.baseUrl || "http://localhost:11434/v1/chat/completions",
        baseUrl: cLLM.baseUrl || cLLM.url || "http://localhost:11434/v1",
        method: cLLM.method || "POST",
        headersJson: cLLM.headersJson,
        bodyJson: cLLM.bodyJson,
        model: cLLM.model,
        apiKeyHeader: cLLM.apiKeyHeader,
        temperature: cLLM.temperature,
        maxTokens: cLLM.maxTokens,
      },
    };
    reconstructedNodes.push(customNode);
  });

  const toolDefs: LangGraphToolDefinition[] = data.toolDefinitions || [];
  toolDefs.forEach((toolDef) => {
    const toolId = toolDef.id || toolDef.toolId || `tool_${Date.now()}`;
    const toolNode: ToolNode = {
      id: toolId,
      type: LANGGRAPH_CANVAS_NODE_TOOL,
      position: toolDef.position || { x: 340, y: 160 },
      data: {
        label: toolDef.name || toolDef.label || "Tool",
        toolId: toolId,
        name: toolDef.name || toolDef.label || "my_tool",
        description: toolDef.description || "",
        inputSchema: toolDef.inputSchema,
        source: toolDef.source,
        endpointUrl: toolDef.endpointUrl,
        mcpConnectionId: toolDef.mcpConnectionId,
        remoteToolName: toolDef.remoteToolName,
        returnDirect: toolDef.returnDirect,
        returnType: toolDef.returnType,
        outputSchema: toolDef.outputSchema,
        commandConfig: toolDef.commandConfig,
        functionBody: toolDef.functionBody,
        executionMode: toolDef.executionMode,
        headless: toolDef.headless,
        contextAccess: toolDef.contextAccess,
        storeAccess: toolDef.storeAccess,
        streamWriter: toolDef.streamWriter,
        errorHandling: toolDef.errorHandling,
      },
    };
    reconstructedNodes.push(toolNode);
  });

  const middlewareDefs: LangGraphMiddlewareDefinition[] = data.middlewareDefinitions || [];
  middlewareDefs.forEach((mwDef) => {
    const mwId = mwDef.id || mwDef.middlewareId || `mw_${Date.now()}`;
    const mwNode: MiddlewareNode = {
      id: mwId,
      type: LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
      position: mwDef.position || { x: 340, y: 240 },
      data: {
        label: mwDef.name || "Middleware",
        middlewareId: mwId,
        name: mwDef.name || "Middleware",
        type: mwDef.type,
        humanInTheLoopConfig: mwDef.humanInTheLoopConfig,
        rateLimitConfig: mwDef.rateLimitConfig,
        loggingConfig: mwDef.loggingConfig,
        customBody: mwDef.customBody,
      },
    };
    reconstructedNodes.push(mwNode);
  });

  const memoryDefs: LangGraphMemoryDefinition[] = data.memoryDefinitions || [];
  memoryDefs.forEach((memDef) => {
    const memId = memDef.id || memDef.memoryId || `mem_${Date.now()}`;
    const memNode: MemoryNode = {
      id: memId,
      type: LANGGRAPH_CANVAS_NODE_MEMORY,
      position: memDef.position || { x: 340, y: 320 },
      data: {
        label: memDef.name || "Memory Saver",
        memoryId: memId,
        name: memDef.name || "Memory Saver",
        checkpointer: memDef.checkpointer || "memory",
        threadIdKey: memDef.threadIdKey || "thread_id",
        threadScope: memDef.threadScope || "session",
        autoSummarize: memDef.autoSummarize ?? true,
        saveMessages: memDef.saveMessages ?? true,
      },
    };
    reconstructedNodes.push(memNode);
  });

  const agentDefs: LangGraphAgentDefinition[] = data.agentDefinitions || [];
  agentDefs.forEach((agDef) => {
    const agId = agDef.id || agDef.agentId || `node_${Date.now()}`;
    const agNode: AgentNode = {
      id: agId,
      type: LANGGRAPH_CANVAS_NODE_NODE,
      position: agDef.position || { x: 420, y: 160 },
      data: {
        label: agDef.name || "Node",
        agentId: agId,
        name: agDef.name || "Node",
        systemPrompt: agDef.systemPrompt,
        modelConfig: agDef.modelConfig,
        streamConfig: agDef.streamConfig,
        memoryConfig: agDef.memoryConfig,
        stateUpdates: agDef.stateUpdates || [],
        availableStateChannels: stateChannels,
        tools: agDef.tools || [],
        middleware: agDef.middleware || [],
        memory: agDef.memory || [],
      },
    };
    reconstructedNodes.push(agNode);
  });

  const steps: LangGraphStepConfig[] = data.graphSteps || [];
  steps.forEach((step, idx) => {
    const stepNode: StepNode = {
      id: step.id,
      type: LANGGRAPH_CANVAS_NODE_STEP,
      position: step.position || { x: 420 + idx * 280, y: 190 + (idx % 2 === 0 ? 0 : 60) },
      data: {
        label: step.name || "Step",
        stepId: step.id,
        stepType: step.type,
        modelConfig: step.modelConfig,
        humanGateConfig: step.humanGateConfig,
        customCode: step.customCode,
        routerConfig: step.routerConfig,
        stateUpdates: step.stateUpdates || [],
        availableStateChannels: stateChannels,
      },
    };
    reconstructedNodes.push(stepNode);
  });

  const savedEndNodes = data.endNodes || [];
  savedEndNodes.forEach((endNode) => {
    if (!reconstructedNodes.some((n) => n.id === endNode.id)) {
      reconstructedNodes.push({
        id: endNode.id,
        type: LANGGRAPH_CANVAS_NODE_END,
        position: endNode.position || data.endNodePosition || { x: 750, y: 320 },
        data: { label: endNode.label || "END State" },
      });
    }
  });

  const graphEdges: LangGraphEdgeConfig[] = data.graphEdges || [];
  const hasEndTarget = graphEdges.some((e) =>
    e.targets?.some((t) => t.kind === TARGET_KIND_END || t.id === "END")
  );
  if (
    (hasEndTarget || data.endNodePosition) &&
    !reconstructedNodes.some((n) => n.type === LANGGRAPH_CANVAS_NODE_END)
  ) {
    reconstructedNodes.push({
      id: NODE_ID_END,
      type: LANGGRAPH_CANVAS_NODE_END,
      position: data.endNodePosition || { x: 750, y: 320 },
      data: { label: "END State" },
    });
  }

  const reconstructedEdges: LangGraphCanvasEdge[] = graphEdges
    .filter((e) => !e.id.startsWith("auto_edge_"))
    .filter((e) => !e.targets?.some((t) => t.kind === TARGET_KIND_PORT))
    .flatMap((e) =>
      (e.targets || []).map((t) => {
        const isLLMSource = e.sourceHandle === HANDLE_LLM_OUT || e.source.startsWith("llm_") || customLLMs.some((c) => c.id === e.source);
        const isToolSource = e.sourceHandle === HANDLE_TOOL_OUT || e.source.startsWith("tool_") || toolDefs.some((td) => (td.id || td.toolId) === e.source);
        const isMiddlewareSource = e.sourceHandle === HANDLE_MIDDLEWARE_OUT || e.source.startsWith("mw_") || middlewareDefs.some((m) => (m.id || m.middlewareId) === e.source);
        const isMemorySource = e.sourceHandle === HANDLE_MEMORY_OUT || e.source.startsWith("mem_") || e.source.startsWith("db_") || memoryDefs.some((m) => (m.id || m.memoryId) === e.source);

        const sourceHandle = e.sourceHandle || (isLLMSource ? HANDLE_LLM_OUT : isToolSource ? HANDLE_TOOL_OUT : isMiddlewareSource ? HANDLE_MIDDLEWARE_OUT : isMemorySource ? HANDLE_MEMORY_OUT : undefined);
        const targetHandle = e.targetHandle || t.targetHandle || (isLLMSource ? HANDLE_LLM_IN : isToolSource ? HANDLE_TOOL_IN : isMiddlewareSource ? HANDLE_MIDDLEWARE_IN : isMemorySource ? HANDLE_MEMORY_IN : "in");

        let resolvedTargetId = t.id;
        if (t.kind === TARGET_KIND_END || t.id === "END") {
          const endNode = reconstructedNodes.find((n) => n.type === LANGGRAPH_CANVAS_NODE_END);
          resolvedTargetId = endNode ? endNode.id : NODE_ID_END;
        }

        return {
          id: `${e.id}_${t.id}`,
          source: e.source,
          target: resolvedTargetId,
          ...(sourceHandle ? { sourceHandle } : {}),
          targetHandle: targetHandle || "in",
          animated: true,
        };
      })
    );

  return {
    graphLabel,
    stateChannels,
    inputChannels,
    nodes: reconstructedNodes,
    edges: reconstructedEdges,
    memoryConfig,
  };
}

export function compileLangGraphNode(
  node: BackendNode,
  context?: {
    edges?: BackendEdge[];
    nodes?: BackendNode[];
    endpoints?: Endpoint[];
    events?: Array<{ id: string; name?: string; variant?: string }>;
  },
): CompiledServiceResult {
  const serviceName = node.data?.label || "LangGraph Service";
  const input = extractLangGraphInput(node);

  // Resolve connected route callers from the main canvas edge graph
  if (context) {
    const routeEndpoints = resolveRouteEndpoints(
      node.id,
      context.edges ?? [],
      context.nodes ?? [],
      context.endpoints ?? [],
      context.events ?? [],
    );
    input.routeEndpoints = routeEndpoints;
  }

  const files = compileLangGraph(input);

  return {
    serviceId: node.id,
    serviceName,
    files,
  };
}

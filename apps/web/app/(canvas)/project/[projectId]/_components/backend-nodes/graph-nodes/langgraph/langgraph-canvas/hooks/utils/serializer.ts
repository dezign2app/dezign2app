import type {
  BackendNode,
  LangGraphStepConfig,
  LangGraphEdgeConfig,
  LangGraphAgentDefinition,
  LangGraphToolDefinition,
  LangGraphMiddlewareDefinition,
  LangGraphMemoryDefinition,
  OutputChannelConfig,
  LangGraphInputChannel,
  LangGraphStateChannel,
  LangGraphMemoryConfig,
  LangGraphRouterBranch,
} from "@/types/canvas";
import { ensureLangGraphDataReachability, STEP_TYPE_ROUTER } from "@workspace/canvas/constants";
import {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  StepNode,
  ToolNode,
  MiddlewareNode,
  MemoryNode,
  AgentNode,
  OutputNode,
  LangGraphLLMNode,
  EndNode,
} from "../../types";
import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_END,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_OUTPUT,
  HANDLE_LLM_IN,
  HANDLE_TOOL_IN,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MEMORY_IN,
  NODE_ID_START,
  NODE_ID_END,
  NODE_ID_STATE_GLOBAL,
  NODE_ID_PREFIX_PORT,
  stripPortPrefix,
  STEP_TYPE_LLM_CALL,
  TARGET_KIND_STEP,
  TARGET_KIND_PORT,
  TARGET_KIND_END,
  DEFAULT_MIDDLEWARE_TYPE,
} from "../../constants";

export interface BuildGraphDataParams {
  nodes: LangGraphCanvasNode[];
  edges: LangGraphCanvasEdge[];
  inputChannels: LangGraphInputChannel[];
  stateChannels: LangGraphStateChannel[];
  memoryConfig: LangGraphMemoryConfig;
  data: BackendNode["data"];
}

export function buildGraphData({
  nodes,
  edges,
  inputChannels,
  stateChannels,
  memoryConfig,
  data,
}: BuildGraphDataParams): BackendNode["data"] {
  const customLlmNodes = nodes
    .filter((n): n is LangGraphLLMNode => n.type === LANGGRAPH_CANVAS_NODE_LLM)
    .map((n) => ({
      id: n.id,
      label: n.data.label,
      provider: n.data.provider,
      url: n.data.url,
      baseUrl: n.data.baseUrl,
      method: n.data.method,
      headersJson: n.data.headersJson,
      bodyJson: n.data.bodyJson,
      model: n.data.model,
      apiKeyHeader: n.data.apiKeyHeader,
      temperature: n.data.temperature,
      maxTokens: n.data.maxTokens,
      position: n.position,
    }));
    
  const toolDefinitions: LangGraphToolDefinition[] = nodes
    .filter((n): n is ToolNode => n.type === LANGGRAPH_CANVAS_NODE_TOOL)
    .map((n) => ({
      id: n.data.toolId || n.id,
      toolId: n.data.toolId || n.id,
      label: n.data.label || n.data.name || "Tool",
      name: n.data.name || "my_tool",
      description: n.data.description || "",
      inputSchema: n.data.inputSchema,
      source: n.data.source || "inline",
      endpointUrl: n.data.endpointUrl,
      mcpConnectionId: n.data.mcpConnectionId,
      remoteToolName: n.data.remoteToolName,
      returnDirect: n.data.returnDirect,
      returnType: n.data.returnType,
      outputSchema: n.data.outputSchema,
      commandConfig: n.data.commandConfig,
      functionBody: n.data.functionBody,
      executionMode: n.data.executionMode,
      headless: n.data.headless,
      contextAccess: n.data.contextAccess,
      storeAccess: n.data.storeAccess,
      streamWriter: n.data.streamWriter,
      errorHandling: n.data.errorHandling,
      position: n.position,
    }));

  const middlewareDefinitions: LangGraphMiddlewareDefinition[] = nodes
    .filter((n): n is MiddlewareNode => n.type === LANGGRAPH_CANVAS_NODE_MIDDLEWARE)
    .map((n) => ({
      id: n.data.middlewareId || n.id,
      middlewareId: n.data.middlewareId || n.id,
      name: n.data.name || "Middleware",
      type: n.data.type || DEFAULT_MIDDLEWARE_TYPE,
      humanInTheLoopConfig: n.data.humanInTheLoopConfig,
      rateLimitConfig: n.data.rateLimitConfig,
      loggingConfig: n.data.loggingConfig,
      customBody: n.data.customBody,
      position: n.position,
    }));

  const memoryDefinitions: LangGraphMemoryDefinition[] = nodes
    .filter((n): n is MemoryNode => n.type === LANGGRAPH_CANVAS_NODE_MEMORY)
    .map((n) => ({
      id: n.data.memoryId || n.id,
      memoryId: n.data.memoryId || n.id,
      name: n.data.name || "Memory Saver",
      checkpointer: n.data.checkpointer || "memory",
      threadIdKey: n.data.threadIdKey || "thread_id",
      threadScope: n.data.threadScope || "session",
      autoSummarize: n.data.autoSummarize ?? true,
      saveMessages: n.data.saveMessages ?? true,
      position: n.position,
    }));

  const agentDefinitions: LangGraphAgentDefinition[] = nodes
    .filter((n): n is AgentNode => n.type === LANGGRAPH_CANVAS_NODE_NODE || n.type === LANGGRAPH_CANVAS_NODE_AGENT)
    .map((n) => {
      const llmNodeId = edges.find((e) => e.target === n.id && e.targetHandle === HANDLE_LLM_IN)?.source;
      return {
        id: n.data.agentId || n.id,
        agentId: n.data.agentId || n.id,
        name: n.data.name || "Node",
        systemPrompt: n.data.systemPrompt,
        llmNodeId,
        modelConfig: {
          ...(n.data.modelConfig || {}),
        },
        streamConfig: n.data.streamConfig,
        memoryConfig: n.data.memoryConfig,
        tools: edges
          .filter((e) => e.target === n.id && e.targetHandle === HANDLE_TOOL_IN)
          .map((e) => e.source),
        middleware: edges
          .filter((e) => e.target === n.id && e.targetHandle === HANDLE_MIDDLEWARE_IN)
          .map((e) => e.source),
        memory: edges
          .filter((e) => e.target === n.id && e.targetHandle === HANDLE_MEMORY_IN)
          .map((e) => e.source),
        position: n.position,
      };
    });

  const graphSteps: LangGraphStepConfig[] = nodes
    .filter((n): n is StepNode => n.type === LANGGRAPH_CANVAS_NODE_STEP)
    .map((n) => {
      let routerConfig = n.data.routerConfig;
      if (n.data.stepType === STEP_TYPE_ROUTER && routerConfig?.branches) {
        const updatedBranches = routerConfig.branches.map((branch: LangGraphRouterBranch) => {
          const matchingEdge = edges.find((e) => e.source === n.id && e.sourceHandle === branch.id);
          let targetId = branch.targetId;
          if (matchingEdge) {
            const isEndTarget =
              matchingEdge.target === NODE_ID_END ||
              matchingEdge.target === "END" ||
              matchingEdge.target.startsWith("end_") ||
              nodes.some((tn) => tn.id === matchingEdge.target && tn.type === LANGGRAPH_CANVAS_NODE_END);
            targetId = isEndTarget ? "END" : matchingEdge.target;
          }
          return {
            ...branch,
            ...(targetId ? { targetId } : {}),
          };
        });
        routerConfig = { ...routerConfig, branches: updatedBranches };
      }

      return {
        id: n.data.stepId || n.id,
        name: n.data.label || "Step",
        type: n.data.stepType || STEP_TYPE_LLM_CALL,
        ...(n.data.modelConfig ? { modelConfig: n.data.modelConfig } : {}),
        ...(n.data.humanGateConfig ? { humanGateConfig: n.data.humanGateConfig } : {}),
        ...(n.data.customCode ? { customCode: n.data.customCode } : {}),
        ...(routerConfig ? { routerConfig } : {}),
        ...(n.data.stateUpdates ? { stateUpdates: n.data.stateUpdates } : {}),
        tools: edges
          .filter((e) => e.target === n.id && e.targetHandle === HANDLE_TOOL_IN)
          .map((e) => e.source),
        position: n.position,
      };
    });

  const outputNodes = nodes.filter((n): n is OutputNode => n.type === LANGGRAPH_CANVAS_NODE_OUTPUT);
  const outputNodeIds = new Set(outputNodes.map((n) => n.id));

  const outputChannels: OutputChannelConfig[] = outputNodes.map((n) => {
    const incomingEdge = edges.find((e) => e.target === n.id);
    const sourceStepId = incomingEdge ? incomingEdge.source : n.data.sourceStepId;
    return {
      id: n.data.id || n.id,
      name: n.data.name || n.data.label || "Output Channel",
      type: n.data.type || "sse",
      topicOrEventName: n.data.topicOrEventName,
      targetStateChannel: n.data.targetStateChannel,
      description: n.data.description,
      streamContentMode: n.data.streamContentMode,
      sourceStepId,
      boundRouteIds: n.data.boundRouteIds,
      schemaJson: n.data.schemaJson,
      position: n.position,
    };
  });

  const graphEdges: LangGraphEdgeConfig[] = edges
    .filter((e) => e.source !== NODE_ID_STATE_GLOBAL && e.target !== NODE_ID_STATE_GLOBAL)
    .filter((e) => {
      const isTool = e.targetHandle === HANDLE_TOOL_IN || e.source.startsWith("tool_");
      const isLLM = e.targetHandle === HANDLE_LLM_IN || e.source.startsWith("llm_");
      const isMiddleware = e.targetHandle === HANDLE_MIDDLEWARE_IN || e.source.startsWith("mw_");
      const isMemory = e.targetHandle === HANDLE_MEMORY_IN || e.source.startsWith("mem_") || e.source.startsWith("db_");
      const isOutput = outputNodeIds.has(e.target) || e.target.startsWith("output_");
      return !isTool && !isLLM && !isMiddleware && !isMemory && !isOutput;
    })
    .map((e) => {
      const isEndTarget =
        e.target === NODE_ID_END ||
        e.target === "END" ||
        e.target.startsWith("end_") ||
        nodes.some((n) => n.id === e.target && n.type === LANGGRAPH_CANVAS_NODE_END);

      const isPortTarget = e.target.startsWith(NODE_ID_PREFIX_PORT);

      const targetKind = isEndTarget
        ? TARGET_KIND_END
        : isPortTarget
        ? TARGET_KIND_PORT
        : TARGET_KIND_STEP;

      const targetId = isEndTarget
        ? "END"
        : isPortTarget
        ? stripPortPrefix(e.target)
        : e.target;

      return {
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
        targets: [{
          id: targetId,
          kind: targetKind,
          targetHandle: e.targetHandle || undefined,
        }],
      };
    });

  const startNode = nodes.find((n) => n.id === NODE_ID_START);
  const startNodePosition = startNode ? startNode.position : data.startNodePosition;

  const stateNode = nodes.find((n) => n.id === NODE_ID_STATE_GLOBAL);
  const stateNodePosition = stateNode ? stateNode.position : data.stateNodePosition;

  const endNodes = nodes
    .filter((n): n is EndNode => n.type === LANGGRAPH_CANVAS_NODE_END)
    .map((n) => ({
      id: n.id,
      label: n.data?.label || "END State",
      position: n.position,
    }));

  const defaultEndNode = nodes.find((n) => n.id === NODE_ID_END && n.type === LANGGRAPH_CANVAS_NODE_END);
  const endNodePosition = defaultEndNode
    ? defaultEndNode.position
    : endNodes.length > 0
    ? endNodes[0]?.position
    : data.endNodePosition;

  return ensureLangGraphDataReachability({
    ...data,
    graphSteps,
    graphEdges,
    outputChannels,
    inputChannels,
    stateChannels,
    memoryConfig,
    customLlmNodes,
    toolDefinitions,
    middlewareDefinitions,
    memoryDefinitions,
    agentDefinitions,
    startNodePosition,
    stateNodePosition,
    endNodePosition,
    endNodes,
  });
}

import type {
  BackendNode,
  LangGraphStepConfig,
  LangGraphEdgeConfig,
  LangGraphAgentDefinition,
} from "@/types/canvas";
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
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_OUTPUT,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MIDDLEWARE_OUT,
  HANDLE_MEMORY_IN,
  HANDLE_MEMORY_OUT,
  NODE_ID_START,
  NODE_ID_END,
  NODE_ID_STATE_GLOBAL,
  makePortNodeId,
  TARGET_KIND_STEP,
  TARGET_KIND_PORT,
  TARGET_KIND_END,
} from "../../constants";

export function buildInitialNodes(data: BackendNode["data"]): LangGraphCanvasNode[] {
  const steps: LangGraphStepConfig[] = data.graphSteps || [];

  const result: LangGraphCanvasNode[] = [
    {
      id: NODE_ID_STATE_GLOBAL,
      type: LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
      position: data.stateNodePosition || { x: 100, y: 60 },
      data: {
        label: "Global Graph State",
        stateChannels: data.stateChannels || [
          { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
        ],
      },
      deletable: false,
    },
    {
      id: NODE_ID_START,
      type: LANGGRAPH_CANVAS_NODE_START,
      position: data.startNodePosition || { x: 100, y: 320 },
      data: { label: "INPUT State", inputChannels: data.inputChannels || [] },
      deletable: false,
    },
  ];

  const savedCustomLLMs = data.customLlmNodes || [];
  savedCustomLLMs.forEach((cLLM) => {
    const customNode: LangGraphLLMNode = {
      id: cLLM.id,
      type: LANGGRAPH_CANVAS_NODE_LLM,
      position: cLLM.position || { x: 340, y: 80 },
      data: {
        label: cLLM.label,
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
    result.push(customNode);
  });

  const savedTools = data.toolDefinitions || [];
  savedTools.forEach((toolDef) => {
    const toolId = toolDef.id || toolDef.toolId || `tool_${Date.now()}`;
    const toolNode: ToolNode = {
      id: toolId,
      type: LANGGRAPH_CANVAS_NODE_TOOL,
      position: toolDef.position || { x: 340, y: 160 },
      data: {
        label: toolDef.name,
        toolId: toolId,
        name: toolDef.name,
        description: toolDef.description,
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
    result.push(toolNode);
  });

  const savedMiddlewares = data.middlewareDefinitions || [];
  savedMiddlewares.forEach((mwDef) => {
    const mwNode: MiddlewareNode = {
      id: mwDef.id || mwDef.middlewareId || `mw_${Date.now()}`,
      type: LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
      position: mwDef.position || { x: 340, y: 240 },
      data: {
        label: mwDef.name,
        middlewareId: mwDef.id || mwDef.middlewareId || `mw_${Date.now()}`,
        name: mwDef.name,
        type: mwDef.type,
        humanInTheLoopConfig: mwDef.humanInTheLoopConfig,
        rateLimitConfig: mwDef.rateLimitConfig,
        loggingConfig: mwDef.loggingConfig,
        customBody: mwDef.customBody,
      },
    };
    result.push(mwNode);
  });

  const savedMemories = data.memoryDefinitions || [];
  savedMemories.forEach((memDef) => {
    const memNode: MemoryNode = {
      id: memDef.id || memDef.memoryId || `mem_${Date.now()}`,
      type: LANGGRAPH_CANVAS_NODE_MEMORY,
      position: memDef.position || { x: 340, y: 320 },
      data: {
        label: memDef.name,
        memoryId: memDef.id || memDef.memoryId || `mem_${Date.now()}`,
        name: memDef.name,
        checkpointer: memDef.checkpointer || "memory",
        threadIdKey: memDef.threadIdKey || "thread_id",
        threadScope: memDef.threadScope || "session",
        autoSummarize: memDef.autoSummarize ?? true,
        saveMessages: memDef.saveMessages ?? true,
      },
    };
    result.push(memNode);
  });

  const savedAgents = data.agentDefinitions || [];
  savedAgents.forEach((agDef) => {
    const agNode: AgentNode = {
      id: agDef.id || agDef.agentId || `node_${Date.now()}`,
      type: LANGGRAPH_CANVAS_NODE_NODE,
      position: agDef.position || { x: 420, y: 160 },
      data: {
        label: agDef.name,
        agentId: agDef.id || agDef.agentId || `node_${Date.now()}`,
        name: agDef.name,
        systemPrompt: agDef.systemPrompt,
        modelConfig: agDef.modelConfig,
        streamConfig: agDef.streamConfig,
        memoryConfig: agDef.memoryConfig,
        stateUpdates: agDef.stateUpdates || [],
        availableStateChannels: data.stateChannels || [
          { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
        ],
        tools: agDef.tools || [],
        middleware: agDef.middleware || [],
        memory: agDef.memory || [],
      },
    };
    result.push(agNode);
  });

  steps.forEach((step, idx) => {
    const stepNode: StepNode = {
      id: step.id,
      type: LANGGRAPH_CANVAS_NODE_STEP,
      position: step.position || { x: 420 + idx * 280, y: 190 + (idx % 2 === 0 ? 0 : 60) },
      data: {
        label: step.name,
        stepId: step.id,
        stepType: step.type,
        modelConfig: step.modelConfig,
        humanGateConfig: step.humanGateConfig,
        customCode: step.customCode,
        routerConfig: step.routerConfig,
        stateUpdates: step.stateUpdates || [],
        availableStateChannels: data.stateChannels || [
          { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
        ],
      },
    };
    result.push(stepNode);
  });

  const savedEndNodes = data.endNodes || [];
  savedEndNodes.forEach((endNode) => {
    if (!result.some((n) => n.id === endNode.id)) {
      result.push({
        id: endNode.id,
        type: LANGGRAPH_CANVAS_NODE_END,
        position: endNode.position || data.endNodePosition || { x: 750, y: 320 },
        data: { label: endNode.label || "END State" },
      });
    }
  });

  const hasEndTarget = (data.graphEdges || []).some((e) =>
    e.targets?.some((t) => t.kind === TARGET_KIND_END || t.id === "END")
  );
  if (
    (hasEndTarget || data.endNodePosition) &&
    !result.some((n) => n.type === LANGGRAPH_CANVAS_NODE_END)
  ) {
    result.push({
      id: NODE_ID_END,
      type: LANGGRAPH_CANVAS_NODE_END,
      position: data.endNodePosition || { x: 750, y: 320 },
      data: { label: "END State" },
    });
  }

  const savedOutputs = data.outputChannels || [];
  savedOutputs.forEach((outDef, idx) => {
    const outNodeId = outDef.id ? (outDef.id.startsWith("output_") || outDef.id.startsWith("out_") ? outDef.id : `output_${outDef.id}`) : `output_${Date.now()}_${idx}`;
    if (!result.some((n) => n.id === outNodeId || (n.type === LANGGRAPH_CANVAS_NODE_OUTPUT && n.data.id === outDef.id))) {
      const outputNode: OutputNode = {
        id: outNodeId,
        type: LANGGRAPH_CANVAS_NODE_OUTPUT,
        position: outDef.position || { x: 100, y: 480 + idx * 90 },
        data: {
          id: outDef.id,
          label: outDef.name || "Output Channel",
          name: outDef.name || "Output Channel",
          type: outDef.type || "sse",
          topicOrEventName: outDef.topicOrEventName,
          targetStateChannel: outDef.targetStateChannel,
          description: outDef.description,
          streamContentMode: outDef.streamContentMode,
          sourceStepId: outDef.sourceStepId,
          boundRouteIds: outDef.boundRouteIds,
          schemaJson: outDef.schemaJson,
          position: outDef.position,
        },
      };
      result.push(outputNode);
    }
  });

  return result;
}

export function buildInitialEdges(
  data: BackendNode["data"],
  initialNodes: LangGraphCanvasNode[]
): LangGraphCanvasEdge[] {
  const graphEdges: LangGraphEdgeConfig[] = data.graphEdges || [];
  const steps: LangGraphStepConfig[] = data.graphSteps || [];
  const agentDefs: LangGraphAgentDefinition[] = data.agentDefinitions || [];

  const mainEdges = graphEdges
    .filter((e) => !e.id.startsWith("auto_edge_"))
    .filter((e) => !e.targets?.some((t) => t.kind === TARGET_KIND_PORT))
    .flatMap(
      (e) => (e.targets || []).map((t) => {
        const isLLMSource = e.sourceHandle === HANDLE_LLM_OUT || e.source.startsWith("llm_") || (data.customLlmNodes || []).some((c) => c.id === e.source);
        const isToolSource = e.sourceHandle === HANDLE_TOOL_OUT || e.source.startsWith("tool_") || (data.toolDefinitions || []).some((t) => t.id === e.source);
        const isMiddlewareSource = e.sourceHandle === HANDLE_MIDDLEWARE_OUT || e.source.startsWith("mw_") || (data.middlewareDefinitions || []).some((m) => m.id === e.source);
        const isMemorySource = e.sourceHandle === HANDLE_MEMORY_OUT || e.source.startsWith("mem_") || e.source.startsWith("db_") || (data.memoryDefinitions || []).some((m) => m.id === e.source);

        const sourceStep = steps.find((s) => s.id === e.source);
        const routerBranch = sourceStep?.routerConfig?.branches?.find((b) => b.id === e.sourceHandle);

        const sourceHandle = e.sourceHandle || (isLLMSource ? HANDLE_LLM_OUT : isToolSource ? HANDLE_TOOL_OUT : isMiddlewareSource ? HANDLE_MIDDLEWARE_OUT : isMemorySource ? HANDLE_MEMORY_OUT : undefined);
        const targetHandle = e.targetHandle || t.targetHandle || (isLLMSource ? HANDLE_LLM_IN : isToolSource ? HANDLE_TOOL_IN : isMiddlewareSource ? HANDLE_MIDDLEWARE_IN : isMemorySource ? HANDLE_MEMORY_IN : "in");

        const isLLM = isLLMSource || sourceHandle === HANDLE_LLM_OUT || targetHandle === HANDLE_LLM_IN;
        const isTool = isToolSource || sourceHandle === HANDLE_TOOL_OUT || targetHandle === HANDLE_TOOL_IN;
        const isMiddleware = isMiddlewareSource || sourceHandle === HANDLE_MIDDLEWARE_OUT || targetHandle === HANDLE_MIDDLEWARE_IN;
        const isMemory = isMemorySource || sourceHandle === HANDLE_MEMORY_OUT || targetHandle === HANDLE_MEMORY_IN;

        let resolvedTargetId = t.id;
        if (t.kind === TARGET_KIND_END || t.id === "END") {
          const endNode = initialNodes.find((n) => n.type === LANGGRAPH_CANVAS_NODE_END);
          resolvedTargetId = endNode ? endNode.id : NODE_ID_END;
        } else if (t.kind === TARGET_KIND_PORT) {
          resolvedTargetId = makePortNodeId(t.id);
        }

        const fieldStr = routerBranch?.field ? (routerBranch.field.startsWith("state.") ? routerBranch.field : `state.${routerBranch.field}`) : "state";
        const routerLabel = routerBranch
          ? routerBranch.label || (routerBranch.isDefault ? "Default" : `${fieldStr} ${routerBranch.operator} '${routerBranch.value ?? ""}'`)
          : undefined;

        const edgeLabel = routerBranch
          ? routerLabel
          : e.condition
          ? `${e.condition.field ?? ""} ${e.condition.operator ?? ""}`
          : undefined;

        return {
          id: `${e.id}_${t.id}`,
          source: e.source,
          target: resolvedTargetId,
          ...(sourceHandle ? { sourceHandle } : {}),
          targetHandle: targetHandle || "in",
          animated: true,
          style: isLLM 
            ? { stroke: "#38bdf8", strokeWidth: 2, strokeDasharray: "4 4" } 
            : isTool
            ? { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" }
            : isMiddleware
            ? { stroke: "#a855f7", strokeWidth: 2, strokeDasharray: "4 4" }
            : isMemory
            ? { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" }
            : routerBranch
            ? { stroke: "#38bdf8", strokeWidth: 2 }
            : { stroke: "#a1a1aa", strokeWidth: 2 },
          ...(edgeLabel ? { label: edgeLabel } : {}),
          ...(routerBranch
            ? {
                labelStyle: { fill: "#bae6fd", fontSize: 10, fontWeight: "bold" },
                labelBgStyle: { fill: "#0c4a6e", rx: 4, ry: 4 },
              }
            : e.condition
            ? { labelStyle: { fill: "#a1a1aa", fontSize: 10 } }
            : {}),
        };
      })
    );

  const resourceEdges: LangGraphCanvasEdge[] = [];
  agentDefs.forEach((ag) => {
    const agId = ag.id || ag.agentId;
    if (!agId) return;

    (ag.tools || []).forEach((toolId) => {
      resourceEdges.push({
        id: `edge_${toolId}_${agId}`,
        source: toolId,
        target: agId,
        sourceHandle: HANDLE_TOOL_OUT,
        targetHandle: HANDLE_TOOL_IN,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" },
      });
    });

    (ag.middleware || []).forEach((mwId) => {
      resourceEdges.push({
        id: `edge_${mwId}_${agId}`,
        source: mwId,
        target: agId,
        sourceHandle: HANDLE_MIDDLEWARE_OUT,
        targetHandle: HANDLE_MIDDLEWARE_IN,
        animated: true,
        style: { stroke: "#a855f7", strokeWidth: 2, strokeDasharray: "4 4" },
      });
    });

    (ag.memory || []).forEach((memId) => {
      resourceEdges.push({
        id: `edge_${memId}_${agId}`,
        source: memId,
        target: agId,
        sourceHandle: HANDLE_MEMORY_OUT,
        targetHandle: HANDLE_MEMORY_IN,
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" },
      });
    });

    const connectedLlmId = ag.llmNodeId;
    if (connectedLlmId && (data.customLlmNodes || []).some((llm) => llm.id === connectedLlmId)) {
      resourceEdges.push({
        id: `edge_${connectedLlmId}_${agId}`,
        source: connectedLlmId,
        target: agId,
        sourceHandle: HANDLE_LLM_OUT,
        targetHandle: HANDLE_LLM_IN,
        animated: true,
        style: { stroke: "#38bdf8", strokeWidth: 2, strokeDasharray: "4 4" },
      });
    }
  });

  steps.forEach((step) => {
    (step.tools || []).forEach((toolId) => {
      resourceEdges.push({
        id: `edge_${toolId}_${step.id}`,
        source: toolId,
        target: step.id,
        sourceHandle: HANDLE_TOOL_OUT,
        targetHandle: HANDLE_TOOL_IN,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" },
      });
    });
  });

  const outputChannelEdges: LangGraphCanvasEdge[] = (data.outputChannels || [])
    .filter((ch) => Boolean(ch.sourceStepId))
    .map((ch) => {
      const outNodeId = ch.id ? (ch.id.startsWith("output_") || ch.id.startsWith("out_") ? ch.id : `output_${ch.id}`) : `output_${ch.id}`;
      return {
        id: `edge_${ch.sourceStepId}_${outNodeId}`,
        source: ch.sourceStepId!,
        target: outNodeId,
        sourceHandle: "out",
        targetHandle: "in",
        animated: true,
        style: { stroke: "#c084fc", strokeWidth: 2, strokeDasharray: "4 4" },
      };
    });

  // Older saved graphs can contain resource connections in both `graphEdges`
  // and the agent/step relationship arrays. Keep the first representation so
  // React Flow never receives duplicate edge keys.
  const uniqueEdges = new Map<string, LangGraphCanvasEdge>();
  [...mainEdges, ...resourceEdges, ...outputChannelEdges].forEach((edge) => {
    if (!uniqueEdges.has(edge.id)) uniqueEdges.set(edge.id, edge);
  });

  return Array.from(uniqueEdges.values());
}

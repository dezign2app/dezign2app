import type {
  LangGraphLLMNodeData,
  ToolNodeData,
  CanvasNodeData,
  StepNodeData,
  MemoryNodeData,
  MiddlewareNodeData,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/types";
import {
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_STEP,
  HANDLE_LLM_IN,
  HANDLE_TOOL_IN,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MEMORY_IN,
  MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP,
  LANGGRAPH_CANVAS_NODE_OUTPUT,
} from "@/app/(canvas)/project/[projectId]/_components/backend-nodes/graph-nodes/langgraph/langgraph-canvas/constants";
import type {
  CompileLangGraphInput,
  CompileContext,
  LLMMeta,
  NodeMeta,
} from "./types";
import { toIdentifier, getProviderPackage } from "./utils";

export function buildContext(input: CompileLangGraphInput): CompileContext {
  const { nodes, edges } = input;

  const llmNodes = nodes.filter(
    (n) => n.type === LANGGRAPH_CANVAS_NODE_LLM,
  ) as Array<{ id: string; data: LangGraphLLMNodeData }>;
  const toolNodes = nodes.filter(
    (n) => n.type === LANGGRAPH_CANVAS_NODE_TOOL,
  ) as Array<{ id: string; data: ToolNodeData }>;
  const agentNodes = nodes.filter(
    (n) =>
      n.type === LANGGRAPH_CANVAS_NODE_NODE ||
      n.type === LANGGRAPH_CANVAS_NODE_AGENT,
  ) as Array<{ id: string; data: CanvasNodeData }>;
  const stepNodes = nodes.filter(
    (n) => n.type === LANGGRAPH_CANVAS_NODE_STEP,
  ) as Array<{ id: string; data: StepNodeData }>;
  const memoryNodes = nodes.filter(
    (n) => n.type === LANGGRAPH_CANVAS_NODE_MEMORY,
  ) as Array<{ id: string; data: MemoryNodeData }>;
  const middlewareNodes = nodes.filter(
    (n) => n.type === LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  ) as Array<{ id: string; data: MiddlewareNodeData }>;

  const agentLLMMap = new Map<string, string>();
  const agentToolsMap = new Map<string, string[]>();
  const agentMiddlewareMap = new Map<string, string[]>();
  const agentMemoryMap = new Map<string, string[]>();

  for (const edge of edges) {
    if (edge.targetHandle === HANDLE_LLM_IN) {
      agentLLMMap.set(edge.target, edge.source);
    } else if (edge.targetHandle === HANDLE_TOOL_IN) {
      const existing = agentToolsMap.get(edge.target) || [];
      agentToolsMap.set(edge.target, [...existing, edge.source]);
    } else if (edge.targetHandle === HANDLE_MIDDLEWARE_IN) {
      const existing = agentMiddlewareMap.get(edge.target) || [];
      agentMiddlewareMap.set(edge.target, [...existing, edge.source]);
    } else if (edge.targetHandle === HANDLE_MEMORY_IN) {
      const existing = agentMemoryMap.get(edge.target) || [];
      agentMemoryMap.set(edge.target, [...existing, edge.source]);
    }
  }

  const routerStepIds = new Set(
    stepNodes.filter((n) => n.data.stepType === "router").map((n) => n.id),
  );

  const hasHumanInLoop =
    middlewareNodes.some(
      (m) => m.data.type === MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP,
    ) ||
    stepNodes.some(
      (s) =>
        s.data.stepType === "human_gate" || s.data.stepType === "interrupt",
    );

  const usesMessages = input.stateChannels.some(
    (c) => c.key === "messages" || c.reducer === "add_messages",
  );

  return {
    input,
    llmNodes,
    toolNodes,
    agentNodes,
    stepNodes,
    memoryNodes,
    middlewareNodes,
    hasMemory: memoryNodes.length > 0 || !!input.memoryConfig?.checkpointer,
    hasTools: toolNodes.length > 0,
    hasHumanInLoop,
    usesMessages,
    agentLLMMap,
    agentToolsMap,
    agentMiddlewareMap,
    agentMemoryMap,
    routerStepIds,
    graphId: input.graphLabel || "agent",
  };
}

export function buildLLMMetaMap(ctx: CompileContext): Map<string, LLMMeta> {
  const map = new Map<string, LLMMeta>();
  const used = new Set<string>();

  for (const llmNode of ctx.llmNodes) {
    const d = llmNode.data;
    const raw = d.label || d.model || d.provider || `llm_${llmNode.id}`;
    let base = toIdentifier(raw);
    if (!base) base = `llm_${llmNode.id}`;

    let name = base;
    let counter = 2;
    while (used.has(name)) {
      name = `${base}${counter}`;
      counter++;
    }
    used.add(name);
    map.set(llmNode.id, { fileName: name, varName: name });
  }

  return map;
}

export function buildNodeMetaMap(ctx: CompileContext): Map<string, NodeMeta> {
  const map = new Map<string, NodeMeta>();
  const used = new Set<string>();

  for (const agentNode of ctx.agentNodes) {
    const d = agentNode.data;
    const raw = d.name || d.label || `node_${agentNode.id}`;
    let base = toIdentifier(raw);
    if (!base) base = `node_${agentNode.id}`;

    let fileName = base;
    let counter = 2;
    while (used.has(fileName)) {
      fileName = `${base}${counter}`;
      counter++;
    }
    used.add(fileName);
    map.set(agentNode.id, { fileName, exportName: fileName });
  }

  for (const stepNode of ctx.stepNodes) {
    const d = stepNode.data;
    let raw = d.label || `step_${stepNode.id}`;
    if (d.stepType === "router") {
      raw = d.label || `router_${stepNode.id}`;
    }
    let base = toIdentifier(raw);
    if (!base) base = `step_${stepNode.id}`;

    let fileName = base;
    let counter = 2;
    while (used.has(fileName)) {
      fileName = `${base}${counter}`;
      counter++;
    }
    used.add(fileName);

    const exportName =
      d.stepType === "router"
        ? base.endsWith("Router")
          ? base
          : `${base}Router`
        : base;

    map.set(stepNode.id, { fileName, exportName });
  }

  return map;
}

export function ctxMemoryNeedsStore(ctx: CompileContext): boolean {
  return ctx.memoryNodes.some(
    (m) =>
      m.data.checkpointer === "redis" || m.data.checkpointer === "postgres",
  );
}

export function buildDependencies(ctx: CompileContext): Record<string, string> {
  const deps: Record<string, string> = {
    "@langchain/langgraph": "^1.1.2",
    "@langchain/core": "^1.1.17",
    zod: "^3.24.1",
    dotenv: "^17.3.1",
  };

  for (const llmNode of ctx.llmNodes) {
    const pkg = getProviderPackage(llmNode.data.provider);
    if (pkg) deps[pkg] = "latest";
  }

  const hasWebSocket = ctx.input.nodes.some(
    (n) =>
      n.type === LANGGRAPH_CANVAS_NODE_OUTPUT && n.data.type === "websocket",
  );
  if (hasWebSocket) {
    deps["socket.io"] = "^4.7.5";
  }

  // Add express when routes are connected
  if (ctx.input.routeEndpoints && ctx.input.routeEndpoints.length > 0) {
    deps["express"] = "^4.21.2";
  }

  return deps;
}

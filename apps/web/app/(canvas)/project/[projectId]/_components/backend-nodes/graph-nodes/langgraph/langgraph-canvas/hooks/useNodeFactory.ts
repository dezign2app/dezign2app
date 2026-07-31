import { useCallback } from "react";
import type { LangGraphStateChannel } from "@/types/canvas";
import { STEP_TYPE_ROUTER } from "@workspace/canvas/constants";
import {
  LangGraphCanvasNode,
  LangGraphCanvasEdge,
  EndNode,
  LangGraphLLMNode,
  ToolNode,
  MiddlewareNode,
  MemoryNode,
  CanvasNode,
  OutputNode,
  StepNode,
  LangGraphCanvasNodeAddType,
} from "../types";
import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_END,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_OUTPUT,
  DEFAULT_MIDDLEWARE_TYPE,
  LLM_PROVIDERS,
  LLM_PROVIDER_PRESETS,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_BASE_URL,
  DEFAULT_LLM_API_KEY_ENV,
  DEFAULT_LLM_TEMPERATURE,
} from "../constants";

interface UseNodeFactoryProps {
  setNodes: React.Dispatch<React.SetStateAction<LangGraphCanvasNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<LangGraphCanvasEdge[]>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveSideTab: (tab: "inspector" | "inputs" | "state" | "memory") => void;
  stateChannels: LangGraphStateChannel[];
}

export function useNodeFactory({
  setNodes,
  setEdges,
  setSelectedNodeId,
  setActiveSideTab,
  stateChannels,
}: UseNodeFactoryProps) {
  const handleAddStep = useCallback((type: LangGraphCanvasNodeAddType, label: string) => {
    if (type === LANGGRAPH_CANVAS_NODE_END) {
      const endId = `end_${Date.now().toString(36).slice(-4)}`;
      const newEndNode: EndNode = {
        id: endId,
        type: LANGGRAPH_CANVAS_NODE_END,
        position: { x: 500 + Math.random() * 140, y: 200 + Math.random() * 80 },
        data: { label: label || "END State" },
      };

      setNodes((nds) => [...nds, newEndNode]);
      setSelectedNodeId(endId);
      return;
    }

    if (type === LANGGRAPH_CANVAS_NODE_LLM) {
      const llmId = `llm_${Date.now().toString(36).slice(-4)}`;
      const defaultPreset = LLM_PROVIDER_PRESETS[DEFAULT_LLM_PROVIDER] ?? LLM_PROVIDER_PRESETS[LLM_PROVIDERS.CUSTOM];

      const newLLMNode: LangGraphLLMNode = {
        id: llmId,
        type: LANGGRAPH_CANVAS_NODE_LLM,
        position: { x: 360 + Math.random() * 140, y: 100 + Math.random() * 80 },
        data: {
          label: label || "LLM",
          llmId,
          provider: DEFAULT_LLM_PROVIDER,
          baseUrl: defaultPreset?.defaultUrl ?? DEFAULT_LLM_BASE_URL,
          model: defaultPreset?.defaultModel ?? DEFAULT_LLM_MODEL,
          apiKeyHeader: defaultPreset?.defaultApiKeyEnv ?? DEFAULT_LLM_API_KEY_ENV,
          temperature: DEFAULT_LLM_TEMPERATURE,
          onDeleteLLM: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== llmId));
            setEdges((edges) => edges.filter((edge) => edge.source !== llmId && edge.target !== llmId));
            setSelectedNodeId((curr) => (curr === llmId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newLLMNode]);
      setSelectedNodeId(llmId);
      return;
    }

    if (type === LANGGRAPH_CANVAS_NODE_TOOL) {
      const toolId = `tool_${Date.now().toString(36).slice(-4)}`;
      const newToolNode: ToolNode = {
        id: toolId,
        type: LANGGRAPH_CANVAS_NODE_TOOL,
        position: { x: 360 + Math.random() * 140, y: 160 + Math.random() * 80 },
        data: {
          label: label || "Tool Node",
          toolId,
          name: "my_tool",
          description: "Description of the tool",
          source: "inline",
          executionMode: "sandboxed_vm",
          returnType: "string",
          onDeleteTool: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== toolId));
            setEdges((edges) => edges.filter((edge) => edge.source !== toolId && edge.target !== toolId));
            setSelectedNodeId((curr) => (curr === toolId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newToolNode]);
      setSelectedNodeId(toolId);
      setActiveSideTab("inspector");
      return;
    }

    if (type === LANGGRAPH_CANVAS_NODE_MIDDLEWARE) {
      const mwId = `mw_${Date.now().toString(36).slice(-4)}`;
      const newMiddlewareNode: MiddlewareNode = {
        id: mwId,
        type: LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
        position: { x: 360 + Math.random() * 140, y: 220 + Math.random() * 80 },
        data: {
          label: label || "Middleware",
          middlewareId: mwId,
          name: "middleware",
          type: DEFAULT_MIDDLEWARE_TYPE,
          humanInTheLoopConfig: {
            interruptOn: { writeFile: true },
            approvalPrompt: "Requires approval before writing files...",
          },
          onDeleteMiddleware: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== mwId));
            setEdges((edges) => edges.filter((edge) => edge.source !== mwId && edge.target !== mwId));
            setSelectedNodeId((curr) => (curr === mwId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newMiddlewareNode]);
      setSelectedNodeId(mwId);
      setActiveSideTab("inspector");
      return;
    }

    if (type === LANGGRAPH_CANVAS_NODE_MEMORY) {
      const memId = `mem_${Date.now().toString(36).slice(-4)}`;
      const newMemoryNode: MemoryNode = {
        id: memId,
        type: LANGGRAPH_CANVAS_NODE_MEMORY,
        position: { x: 360 + Math.random() * 140, y: 280 + Math.random() * 80 },
        data: {
          label: label || "Memory Saver",
          memoryId: memId,
          name: "memory_saver",
          checkpointer: "memory",
          threadIdKey: "thread_id",
          threadScope: "session",
          autoSummarize: true,
          saveMessages: true,
          onDeleteMemory: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== memId));
            setEdges((edges) => edges.filter((edge) => edge.source !== memId && edge.target !== memId));
            setSelectedNodeId((curr) => (curr === memId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newMemoryNode]);
      setSelectedNodeId(memId);
      setActiveSideTab("inspector");
      return;
    }

    if (type === LANGGRAPH_CANVAS_NODE_NODE || type === LANGGRAPH_CANVAS_NODE_AGENT) {
      const nodeId = `node_${Date.now().toString(36).slice(-4)}`;
      const newNode: CanvasNode = {
        id: nodeId,
        type: LANGGRAPH_CANVAS_NODE_NODE,
        position: { x: 420 + Math.random() * 140, y: 160 + Math.random() * 80 },
        data: {
          label: label || "Node",
          agentId: nodeId,
          name: label || "Node",
          systemPrompt: "System prompt / instructions for this node...",
          modelConfig: { provider: DEFAULT_LLM_PROVIDER, model: DEFAULT_LLM_MODEL, temperature: DEFAULT_LLM_TEMPERATURE },
          tools: [],
          middleware: [],
          onDeleteAgent: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
            setEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            setSelectedNodeId((curr) => (curr === nodeId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(nodeId);
      setActiveSideTab("inspector");
      return;
    }

    if (type === LANGGRAPH_CANVAS_NODE_OUTPUT) {
      const outId = `output_${Date.now().toString(36).slice(-4)}`;
      const permanentChannelId = `channel_${crypto.randomUUID()}`;
      const newOutputNode: OutputNode = {
        id: outId,
        type: LANGGRAPH_CANVAS_NODE_OUTPUT,
        position: { x: 420 + Math.random() * 140, y: 240 + Math.random() * 80 },
        data: {
          id: permanentChannelId,
          label: label || "Output Channel",
          name: label || "Output Channel",
          type: "sse",
          targetStateChannel: "messages",
          topicOrEventName: "messages",
          onDeleteOutput: () => {
            setNodes((nodes) => nodes.filter((node) => node.id !== outId));
            setEdges((edges) => edges.filter((edge) => edge.source !== outId && edge.target !== outId));
            setSelectedNodeId((curr) => (curr === outId ? null : curr));
          },
        },
      };

      setNodes((nds) => [...nds, newOutputNode]);
      setSelectedNodeId(outId);
      setActiveSideTab("inspector");
      return;
    }

    const stepId = type === STEP_TYPE_ROUTER ? `router_${Date.now().toString(36).slice(-4)}` : `step_${Date.now().toString(36).slice(-4)}`;
    const newNode: StepNode = {
      id: stepId,
      type: LANGGRAPH_CANVAS_NODE_STEP, 
      position: { x: 360 + Math.random() * 180, y: 160 + Math.random() * 100 },
      data: {
        label: label || (type === STEP_TYPE_ROUTER ? "Conditional Router" : "Node"),
        stepId,
        stepType: type,
        ...(type === STEP_TYPE_ROUTER
          ? {
              routerConfig: {
                branches: [],
              },
            }
          : {
              modelConfig: { provider: DEFAULT_LLM_PROVIDER, model: DEFAULT_LLM_MODEL, temperature: DEFAULT_LLM_TEMPERATURE },
            }),
        stateUpdates: [],
        availableStateChannels: stateChannels,
        onDeleteStep: () => {
          setNodes((nodes) => nodes.filter((node) => node.id !== stepId));
          setEdges((edges) => edges.filter((edge) => edge.source !== stepId && edge.target !== stepId));
          setSelectedNodeId((curr) => (curr === stepId ? null : curr));
        },
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(stepId);
    setActiveSideTab("inspector");
  }, [setNodes, setEdges, setSelectedNodeId, setActiveSideTab, stateChannels]);

  return { handleAddStep };
}

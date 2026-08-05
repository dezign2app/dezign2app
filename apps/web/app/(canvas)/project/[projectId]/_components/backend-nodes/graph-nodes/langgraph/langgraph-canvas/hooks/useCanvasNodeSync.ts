import { useEffect } from "react";
import {
  type LangGraphStateChannel,
  type LangGraphInputChannel,
  type LangGraphCanvasNode,
  type LangGraphCanvasEdge,
  type StateGlobalNode,
} from "@workspace/canvas";
import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  NODE_ID_START,
  NODE_ID_STATE_GLOBAL,
} from "../constants";

interface UseCanvasNodeSyncProps {
  nodes: LangGraphCanvasNode[];
  setNodes: React.Dispatch<React.SetStateAction<LangGraphCanvasNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<LangGraphCanvasEdge[]>>;
  inputChannels: LangGraphInputChannel[];
  stateChannels: LangGraphStateChannel[];
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveSideTab: React.Dispatch<
    React.SetStateAction<"inspector" | "inputs" | "state" | "memory">
  >;
  handleAddChannel: () => void;
}

export function useCanvasNodeSync({
  setNodes,
  setEdges,
  inputChannels,
  stateChannels,
  setSelectedNodeId,
  setActiveSideTab,
  handleAddChannel,
}: UseCanvasNodeSyncProps) {
  useEffect(() => {
    setNodes((nds) => {
      const hasStateGlobal = nds.some((n) => n.id === NODE_ID_STATE_GLOBAL);

      let updated = nds.map((n): LangGraphCanvasNode => {
        if (n.id === NODE_ID_START && n.type === LANGGRAPH_CANVAS_NODE_START) {
          return { ...n, data: { ...n.data, inputChannels } };
        }
        if (
          n.id === NODE_ID_STATE_GLOBAL &&
          n.type === LANGGRAPH_CANVAS_NODE_STATE_GLOBAL
        ) {
          return {
            ...n,
            data: {
              ...n.data,
              stateChannels,
              onOpenStateTab: () => setActiveSideTab("state"),
              onAddChannel: handleAddChannel,
            },
          };
        }
        if (n.type === LANGGRAPH_CANVAS_NODE_LLM) {
          return {
            ...n,
            data: {
              ...n.data,
              onDeleteLLM: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) =>
                  edges.filter(
                    (edge) => edge.source !== n.id && edge.target !== n.id,
                  ),
                );
                setSelectedNodeId((curr) => (curr === n.id ? null : curr));
              },
            },
          };
        }
        if (n.type === LANGGRAPH_CANVAS_NODE_TOOL) {
          return {
            ...n,
            data: {
              ...n.data,
              onDeleteTool: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) =>
                  edges.filter(
                    (edge) => edge.source !== n.id && edge.target !== n.id,
                  ),
                );
                setSelectedNodeId((curr) => (curr === n.id ? null : curr));
              },
              onOpenInspector: () => {
                setSelectedNodeId(n.id);
                setActiveSideTab("inspector");
              },
              onSelectNode: () => {
                setSelectedNodeId(n.id);
              },
            },
          };
        }
        if (
          n.type === LANGGRAPH_CANVAS_NODE_NODE ||
          n.type === LANGGRAPH_CANVAS_NODE_AGENT
        ) {
          return {
            ...n,
            data: {
              ...n.data,
              availableStateChannels: stateChannels,
              onOpenInspector: () => {
                setSelectedNodeId(n.id);
                setActiveSideTab("inspector");
              },
              onSelectNode: () => {
                setSelectedNodeId(n.id);
              },
            },
          };
        }
        if (n.type === LANGGRAPH_CANVAS_NODE_STEP) {
          return {
            ...n,
            data: {
              ...n.data,
              availableStateChannels: stateChannels,
              onOpenInspector: () => {
                setSelectedNodeId(n.id);
                setActiveSideTab("inspector");
              },
              onOpenInspectorRoute: (branchId: string) => {
                setSelectedNodeId(n.id);
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === n.id && node.type === LANGGRAPH_CANVAS_NODE_STEP
                      ? {
                          ...node,
                          data: { ...node.data, activeBranchId: branchId },
                        }
                      : node,
                  ),
                );
                setActiveSideTab("inspector");
              },
              onSelectNode: () => {
                setSelectedNodeId(n.id);
              },
              onDeleteStep: () => {
                setNodes((nodes) => nodes.filter((node) => node.id !== n.id));
                setEdges((edges) =>
                  edges.filter(
                    (edge) => edge.source !== n.id && edge.target !== n.id,
                  ),
                );
                setSelectedNodeId((curr) => (curr === n.id ? null : curr));
              },
            },
          };
        }
        return n;
      });

      if (!hasStateGlobal) {
        const stateNode: StateGlobalNode = {
          id: NODE_ID_STATE_GLOBAL,
          type: LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
          position: { x: 100, y: 60 },
          data: {
            label: "Global Graph State",
            stateChannels,
            onOpenStateTab: () => setActiveSideTab("state"),
            onAddChannel: handleAddChannel,
          },
          deletable: false,
        };
        updated = [stateNode, ...updated];
      }

      return updated;
    });
  }, [
    inputChannels,
    stateChannels,
    handleAddChannel,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setActiveSideTab,
  ]);
}

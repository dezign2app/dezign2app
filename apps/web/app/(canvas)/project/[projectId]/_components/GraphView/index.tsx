import React, { useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  useReactFlow,
} from "@xyflow/react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { nodeTypes } from "../backend-nodes/Nodes";
import { ForeignKeyEdge } from "../backend-nodes/ForeignKeyEdge";
import {
  HTTPConnectionEdge,
  MessagingEdge,
  IdentityConnectionEdge,
} from "../backend-nodes/CustomEdges";
import { isValidConnection, type GraphNodeType } from "@workspace/canvas";
import {
  getOffsetPosition,
  useCanvasHandlers,
} from "../hooks/useCanvasHandlers";
import { useAutoLayout } from "../hooks/useAutoLayout";
import { createGraphNodeData } from "./utils";
import { NodePalettePanel } from "./NodePalettePanel";
import { TopToolbarPanel } from "./TopToolbarPanel";
import { TestCaseDialogs } from "./TestCaseDialogs";

const edgeTypes = {
  "foreign-key": ForeignKeyEdge,
  connection: HTTPConnectionEdge,
  message: MessagingEdge,
  "identity-connection": IdentityConnectionEdge,
};

export interface GraphViewProps {
  projectId: string;
}

export function GraphView({ projectId }: GraphViewProps) {
  const { nodes, edges, onEdgesChange, onConnect, addNode } =
    useBackendCanvasStore();
  const simulation = useSimulationStore();
  const selectedCaseId = useSimulationStore((state) => state.selectedCaseId);
  const testCases = useSimulationStore((state) => state.testCases);
  const selectTestCase = useSimulationStore((state) => state.selectTestCase);

  const [caseNameDialog, setCaseNameDialog] = useState<{
    mode: "create" | "rename";
    value: string;
  } | null>(null);
  const [deleteCaseOpen, setDeleteCaseOpen] = useState(false);

  const { handleNodesChange, handleMoveEnd } = useCanvasHandlers(
    projectId,
    "graph",
  );
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { handleLayout } = useAutoLayout();

  const graphNodes = nodes.filter(
    (n) => n.type !== "group" && n.type !== "entity",
  );

  const hasFitted = useRef(false);
  useEffect(() => {
    if (graphNodes.length > 0 && !hasFitted.current) {
      hasFitted.current = true;
      window.requestAnimationFrame(() => {
        fitView({ duration: 600, padding: 0.15 });
      });
    }
  }, [graphNodes.length, fitView]);

  const getCenterPosition = () => {
    if (typeof window === "undefined") return { x: 100, y: 100 };
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  };

  const handleAddGraphNode = (type: GraphNodeType, label: string) => {
    const center = getCenterPosition();
    const { x, y } = getOffsetPosition(center.x - 100, center.y - 100, nodes);
    const data = createGraphNodeData(type, label, nodes);
    const isContainer = type === "webAppGroup";

    addNode({
      id: crypto.randomUUID(),
      type,
      position: { x, y },
      style: isContainer ? { width: 560, height: 380 } : undefined,
      width: isContainer ? 560 : undefined,
      height: isContainer ? 380 : undefined,
      data,
    });
  };

  const sortedGraphNodes = [...graphNodes].sort((a, b) => {
    if (a.type === "webAppGroup") return -1;
    if (b.type === "webAppGroup") return 1;
    return 0;
  });

  const visualGraphNodes = sortedGraphNodes.map((node) => {
    const hasRun = simulation.status !== "idle";
    let isVisited = simulation.activeNodeIds.includes(node.id);
    let isCurrent = simulation.currentNodeId === node.id;

    if (node.type === "db_ref") {
      const activeEndpointIds = simulation.trace
        .slice(0, simulation.activeIndex + 1)
        .filter((t) => t.kind === "endpoint")
        .map((t) => t.id);

      const connectedToActive = edges.some((edge) => {
        if (
          edge.target === node.id &&
          simulation.activeNodeIds.includes(edge.source)
        ) {
          if (edge.sourceHandle?.startsWith("endpoint-out-")) {
            const endpointId = edge.sourceHandle.replace("endpoint-out-", "");
            return activeEndpointIds.includes(endpointId);
          }
          return true;
        }
        if (
          edge.source === node.id &&
          simulation.activeNodeIds.includes(edge.target)
        ) {
          return true;
        }
        return false;
      });
      if (connectedToActive) isVisited = true;

      const currentEndpointIds =
        simulation.trace[simulation.activeIndex]?.kind === "endpoint"
          ? [simulation.trace[simulation.activeIndex]?.id]
          : [];

      const connectedToCurrent = edges.some((edge) => {
        if (
          edge.target === node.id &&
          simulation.currentNodeId === edge.source
        ) {
          if (edge.sourceHandle?.startsWith("endpoint-out-")) {
            const endpointId = edge.sourceHandle.replace("endpoint-out-", "");
            return currentEndpointIds.includes(endpointId);
          }
          return true;
        }
        if (
          edge.source === node.id &&
          simulation.currentNodeId === edge.target
        ) {
          return true;
        }
        return false;
      });
      if (connectedToCurrent) isCurrent = true;
    }

    return {
      ...node,
      style: {
        ...node.style,
        opacity: hasRun && !isVisited ? 0.14 : 1,
        transition: "opacity 180ms ease, filter 180ms ease",
        filter: isCurrent
          ? "drop-shadow(0 0 8px hsl(var(--primary)))"
          : undefined,
      },
    };
  });

  const selectedCaseEntry = testCases.find(
    (testCase) => testCase.id === selectedCaseId,
  );

  React.useEffect(() => {
    if (!selectedCaseEntry && testCases[0]) {
      selectTestCase(testCases[0].id);
    }
  }, [testCases.length, selectedCaseId, selectedCaseEntry, selectTestCase]);

  return (
    <div className="w-full h-full bg-muted/20">
      <ReactFlow
        nodes={visualGraphNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        deleteKeyCode={["Backspace", "Delete"]}
        onConnect={onConnect}
        isValidConnection={(connection: Connection) => {
          const src = nodes.find((n) => n.id === connection.source);
          const tgt = nodes.find((n) => n.id === connection.target);
          if (!src || !tgt) return false;
          return isValidConnection(
            src.type,
            connection.sourceHandle,
            tgt.type,
            connection.targetHandle,
          ).valid;
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onMoveEnd={handleMoveEnd}
        attributionPosition="bottom-right"
      >
        <Background gap={12} size={1} />
        <Controls />
        <MiniMap />
        <TopToolbarPanel onLayout={handleLayout} />
        <NodePalettePanel onAddNode={handleAddGraphNode} />
      </ReactFlow>

      <TestCaseDialogs
        projectId={projectId}
        caseNameDialog={caseNameDialog}
        setCaseNameDialog={setCaseNameDialog}
        deleteCaseOpen={deleteCaseOpen}
        setDeleteCaseOpen={setDeleteCaseOpen}
      />
    </div>
  );
}

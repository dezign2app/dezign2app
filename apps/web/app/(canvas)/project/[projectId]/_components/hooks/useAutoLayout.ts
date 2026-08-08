import { useCallback } from "react";
import { useReactFlow, Position } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import {
  HEAD_TARGET_HANDLES,
  HEAD_NODE_TYPES,
  TARGET_NODE_TYPES,
  type LayoutNode,
  type LayoutEdge,
  type PositionNodeChange,
  type UseAutoLayoutOptions,
} from "./auto-layout/types";
import { getNodeDimensions, getIsPkNode } from "./auto-layout/nodeDimensions";
import { runBarycenterRefinement } from "./auto-layout/barycenterLayout";
import { layoutHeadNodes } from "./auto-layout/headNodeLayout";

export type {
  LayoutNode,
  LayoutEdge,
  PositionNodeChange,
  UseAutoLayoutOptions,
};

export function useAutoLayout(options?: UseAutoLayoutOptions) {
  const { fitView } = useReactFlow();
  const store = useBackendCanvasStore();

  const nodes: LayoutNode[] = options?.nodes ?? store.nodes;
  const edges: LayoutEdge[] = options?.edges ?? store.edges;
  const onNodesChange = options?.onNodesChange ?? store.onNodesChange;

  // Store-level endpoint & event lists for handle-aware barycenter
  const storeEndpoints = store.endpoints;
  const storeEvents = store.events;

  const handleLayout = useCallback(
    (direction: string = "LR") => {
      const isHorizontal = direction === "LR";

      // 1. Identify Target nodes (nodes that can have attached head nodes)
      const targetNodeIds = new Set<string>();
      nodes.forEach((n: LayoutNode) => {
        if (TARGET_NODE_TYPES.has(n.type ?? "")) {
          targetNodeIds.add(n.id);
        }
      });
      edges.forEach((edge: LayoutEdge) => {
        if (HEAD_TARGET_HANDLES.has(edge.targetHandle ?? "")) {
          targetNodeIds.add(edge.target);
        }
      });

      // 2. Identify head-connection edges vs main flow edges
      const isHeadConnectionEdge = (edge: LayoutEdge): boolean => {
        const isTargetMatch = targetNodeIds.has(edge.target);
        const isHeadHandle = HEAD_TARGET_HANDLES.has(edge.targetHandle ?? "");
        const sourceNodeType =
          nodes.find((n: LayoutNode) => n.id === edge.source)?.type ?? "";
        const isHeadSourceType = HEAD_NODE_TYPES.has(sourceNodeType);
        return isTargetMatch && (isHeadHandle || isHeadSourceType);
      };

      const headEdges: LayoutEdge[] = edges.filter(isHeadConnectionEdge);
      const flowEdges: LayoutEdge[] = edges.filter(
        (e: LayoutEdge) => !isHeadConnectionEdge(e),
      );

      // 3. Identify attached head nodes (nodes attached to a target node's top handles)
      const attachedHeadNodeIdSet = new Set<string>(
        headEdges.map((e: LayoutEdge) => e.source),
      );
      const attachedHeadNodes: LayoutNode[] = nodes.filter((n: LayoutNode) =>
        attachedHeadNodeIdSet.has(n.id),
      );
      const flowNodes: LayoutNode[] = nodes.filter(
        (n: LayoutNode) => !attachedHeadNodeIdSet.has(n.id),
      );

      // 4. Run Dagre layout for flowNodes and flowEdges
      const isSchemaView =
        flowNodes.length > 0 && flowNodes.every((n) => n.type === "entity");
      const hasEntityNodes = flowNodes.some((n) => n.type === "entity");

      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({}),
      );
      dagreGraph.setGraph({
        rankdir: direction,
        marginx: 80,
        marginy: 80,
        ranksep: isSchemaView
          ? isHorizontal
            ? 300
            : 240
          : hasEntityNodes
            ? isHorizontal
              ? 280
              : 220
            : isHorizontal
              ? 200
              : 150,
        nodesep: isSchemaView || hasEntityNodes ? 160 : 110,
      });

      flowNodes.forEach((node: LayoutNode) => {
        const { width, height } = getNodeDimensions(node);
        dagreGraph.setNode(node.id, { width, height });
      });

      flowEdges.forEach((edge: LayoutEdge) => {
        if (isSchemaView && edge.type === "foreign-key") {
          const sourceNode = flowNodes.find((n) => n.id === edge.source);
          const targetNode = flowNodes.find((n) => n.id === edge.target);

          const sourceIsPk = getIsPkNode(sourceNode, edge.sourceHandle);
          const targetIsPk = getIsPkNode(targetNode, edge.targetHandle);

          if (sourceIsPk && !targetIsPk) {
            dagreGraph.setEdge(edge.source, edge.target);
          } else if (targetIsPk && !sourceIsPk) {
            dagreGraph.setEdge(edge.target, edge.source);
          } else {
            dagreGraph.setEdge(edge.source, edge.target);
          }
        } else {
          dagreGraph.setEdge(edge.source, edge.target);
        }
      });

      dagre.layout(dagreGraph);

      // 5. Store positions computed by Dagre
      const positionsMap = new Map<string, { x: number; y: number }>();
      flowNodes.forEach((node: LayoutNode) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const { width, height } = getNodeDimensions(node);
        if (nodeWithPosition) {
          positionsMap.set(node.id, {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
          });
        } else {
          positionsMap.set(node.id, { x: node.position.x, y: node.position.y });
        }
      });

      // 5.5. Handle-Aware Barycenter Crossing Minimization (Sugiyama-style)
      runBarycenterRefinement({
        dagreGraph,
        flowNodes,
        flowEdges,
        positionsMap,
        isHorizontal,
        storeEndpoints,
        storeEvents,
      });

      // 6. Layout attached head nodes grouped by category columns above each target node
      layoutHeadNodes({
        targetNodeIds,
        nodes,
        positionsMap,
        headEdges,
        attachedHeadNodes,
      });

      // 7. Update node positions atomically
      if (options?.onNodesChange) {
        const nodeChanges: PositionNodeChange[] = nodes.map((node: LayoutNode) => {
          const pos = positionsMap.get(node.id) ?? {
            x: node.position.x,
            y: node.position.y,
          };
          return {
            id: node.id,
            type: "position",
            position: pos,
          };
        });
        options.onNodesChange(nodeChanges);
      } else {
        useBackendCanvasStore.setState((state) => {
          const updatedNodes = state.nodes.map((node) => {
            const pos = positionsMap.get(node.id);
            if (!pos) return node;
            const isAttachedHead = attachedHeadNodeIdSet.has(node.id);
            return {
              ...node,
              position: pos,
              sourcePosition: isAttachedHead
                ? Position.Bottom
                : isHorizontal
                  ? Position.Right
                  : Position.Bottom,
              targetPosition: isAttachedHead
                ? Position.Top
                : isHorizontal
                  ? Position.Left
                  : Position.Top,
            };
          });

          const movedNodeIds = new Set(positionsMap.keys());
          const upserts = updatedNodes.filter((n) => movedNodeIds.has(n.id));

          return {
            nodes: updatedNodes,
            pendingNodeUpserts: [
              ...state.pendingNodeUpserts.filter((u) => !movedNodeIds.has(u.id)),
              ...upserts,
            ],
          };
        });
      }

      // Smoothly fit view after DOM renders cleanly
      setTimeout(() => {
        fitView({ duration: 300, padding: 0.15 });
      }, 50);
    },
    [nodes, edges, fitView, options?.onNodesChange, storeEndpoints, storeEvents],
  );

  return { handleLayout };
}

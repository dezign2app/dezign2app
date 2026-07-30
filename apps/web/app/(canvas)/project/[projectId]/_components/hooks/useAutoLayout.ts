import { useCallback } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { useBackendCanvasStore } from '@/lib/stores/backendCanvasStore';
import type { BackendNode, BackendEdge } from '@/types/canvas';

const HEAD_TARGET_HANDLES = new Set<string>([
  'llm_in',
  'tool_in',
  'middleware_in',
  'memory_in',
  'HANDLE_LLM_IN',
  'HANDLE_TOOL_IN',
  'HANDLE_MIDDLEWARE_IN',
  'HANDLE_MEMORY_IN',
]);

const HEAD_NODE_TYPES = new Set<string>([
  'langgraph_llm',
  'langgraph_tool',
  'langgraph_middleware',
  'langgraph_memory',
  'db_ref',
  'vector_db_ref',
]);

export type LayoutNode = Node | BackendNode;
export type LayoutEdge = Edge | BackendEdge;

export type PositionNodeChange = {
  id: string;
  type: 'position';
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
};

export interface UseAutoLayoutOptions {
  nodes?: LayoutNode[];
  edges?: LayoutEdge[];
  onNodesChange?: (changes: PositionNodeChange[]) => void;
}

function getNodeDimensions(node: LayoutNode): { width: number; height: number } {
  if (
    'measured' in node &&
    node.measured &&
    typeof node.measured === 'object' &&
    'width' in node.measured &&
    'height' in node.measured &&
    typeof node.measured.width === 'number' &&
    typeof node.measured.height === 'number'
  ) {
    return {
      width: node.measured.width,
      height: node.measured.height,
    };
  }

  switch (node.type) {
    case 'start':
    case 'START':
      return { width: 180, height: 70 };
    case 'state_global':
    case 'STATE_GLOBAL':
      return { width: 240, height: 140 };
    case 'langgraph_agent':
      return { width: 380, height: 440 };
    case 'langgraph_llm':
      return { width: 320, height: 220 };
    case 'langgraph_tool':
      return { width: 300, height: 280 };
    case 'langgraph_middleware':
      return { width: 280, height: 160 };
    case 'langgraph_memory':
    case 'db_ref':
    case 'vector_db_ref':
      return { width: 280, height: 180 };
    case 'step':
      return { width: 300, height: 220 };
    default:
      return { width: 300, height: 200 };
  }
}

export function useAutoLayout(options?: UseAutoLayoutOptions) {
  const { fitView } = useReactFlow();
  const store = useBackendCanvasStore();

  const nodes: LayoutNode[] = options?.nodes ?? store.nodes;
  const edges: LayoutEdge[] = options?.edges ?? store.edges;
  const onNodesChange = options?.onNodesChange ?? store.onNodesChange;

  const handleLayout = useCallback(
    (direction: string = 'LR') => {
      const isHorizontal = direction === 'LR';

      // 1. Identify Agent nodes
      const agentNodes: LayoutNode[] = nodes.filter(
        (n: LayoutNode) => n.type === 'langgraph_agent' || n.type === 'agent'
      );
      const agentIds = new Set<string>(agentNodes.map((n: LayoutNode) => n.id));

      // 2. Identify head-connection edges vs main flow edges
      const isHeadConnectionEdge = (edge: LayoutEdge): boolean => {
        const isAgentTarget = agentIds.has(edge.target);
        const isHeadHandle = HEAD_TARGET_HANDLES.has(edge.targetHandle ?? '');
        const isHeadSourceType = HEAD_NODE_TYPES.has(
          nodes.find((n: LayoutNode) => n.id === edge.source)?.type ?? ''
        );
        return isAgentTarget && (isHeadHandle || isHeadSourceType);
      };

      const headEdges: LayoutEdge[] = edges.filter(isHeadConnectionEdge);
      const flowEdges: LayoutEdge[] = edges.filter((e: LayoutEdge) => !isHeadConnectionEdge(e));

      // 3. Identify attached head nodes (nodes attached to an Agent's top handles)
      const attachedHeadNodeIdSet = new Set<string>(headEdges.map((e: LayoutEdge) => e.source));
      const attachedHeadNodes: LayoutNode[] = nodes.filter((n: LayoutNode) => attachedHeadNodeIdSet.has(n.id));
      const flowNodes: LayoutNode[] = nodes.filter((n: LayoutNode) => !attachedHeadNodeIdSet.has(n.id));

      // 4. Run Dagre layout for flowNodes and flowEdges
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: direction,
        marginx: 60,
        marginy: 60,
        ranksep: isHorizontal ? 120 : 80,
        nodesep: isHorizontal ? 80 : 80,
      });

      flowNodes.forEach((node: LayoutNode) => {
        const { width, height } = getNodeDimensions(node);
        dagreGraph.setNode(node.id, { width, height });
      });

      flowEdges.forEach((edge: LayoutEdge) => {
        dagreGraph.setEdge(edge.source, edge.target);
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

      // 6. Layout attached head nodes grouped by category columns, stacking multiple nodes in the same category vertically
      agentNodes.forEach((agentNode: LayoutNode) => {
        const agentPos = positionsMap.get(agentNode.id);
        if (!agentPos) return;

        const { width: agentW } = getNodeDimensions(agentNode);
        const agentCenterX = agentPos.x + agentW / 2;

        const edgesForAgent = headEdges.filter((e: LayoutEdge) => e.target === agentNode.id);
        const headNodesForAgent = attachedHeadNodes.filter((hn: LayoutNode) =>
          edgesForAgent.some((e: LayoutEdge) => e.source === hn.id)
        );

        if (headNodesForAgent.length === 0) return;

        // Categorize each head node (0: LLM, 1: Tool, 2: Middleware, 3: Memory)
        const getHeadCategoryIdx = (hn: LayoutNode): number => {
          const edge = edgesForAgent.find((e: LayoutEdge) => e.source === hn.id);
          const handle = edge?.targetHandle ?? '';
          if (handle === 'llm_in' || handle === 'HANDLE_LLM_IN' || hn.type === 'langgraph_llm') return 0;
          if (handle === 'tool_in' || handle === 'HANDLE_TOOL_IN' || hn.type === 'langgraph_tool') return 1;
          if (handle === 'middleware_in' || handle === 'HANDLE_MIDDLEWARE_IN' || hn.type === 'langgraph_middleware') return 2;
          if (handle === 'memory_in' || handle === 'HANDLE_MEMORY_IN' || hn.type === 'langgraph_memory' || hn.type === 'db_ref' || hn.type === 'vector_db_ref') return 3;
          return 1;
        };

        // Group into 4 category columns
        const columns: LayoutNode[][] = [[], [], [], []];
        headNodesForAgent.forEach((hn: LayoutNode) => {
          const catIdx = getHeadCategoryIdx(hn);
          const col = columns[catIdx];
          if (col) {
            col.push(hn);
          }
        });

        // Filter out empty category columns while maintaining left-to-right order (LLM -> Tool -> Middleware -> Memory)
        const activeColumns = columns.filter((col) => col.length > 0);
        if (activeColumns.length === 0) return;

        const columnWidths = activeColumns.map((col) =>
          Math.max(...col.map((hn) => getNodeDimensions(hn).width))
        );

        const columnGapX = 40;
        const initialGapY = 80;
        const verticalStackGapY = 40;

        const totalWidth =
          columnWidths.reduce((sum: number, w: number) => sum + w, 0) + (activeColumns.length - 1) * columnGapX;

        let currentX = agentCenterX - totalWidth / 2;

        activeColumns.forEach((colNodes: LayoutNode[], colIdx: number) => {
          const colW = columnWidths[colIdx] ?? 300;
          const colCenterX = currentX + colW / 2;

          // Stack nodes in this column vertically from bottom to top
          let currentBottomY = agentPos.y - initialGapY;

          colNodes.forEach((hn: LayoutNode) => {
            const { width, height } = getNodeDimensions(hn);
            const headX = colCenterX - width / 2;
            const headY = currentBottomY - height;

            positionsMap.set(hn.id, { x: headX, y: headY });

            // Move currentBottomY upwards for the next node stacked above this one
            currentBottomY = headY - verticalStackGapY;
          });

          currentX += colW + columnGapX;
        });
      });

      // 7. Map node positions and handle anchors
      const nodeChanges: PositionNodeChange[] = nodes.map((node: LayoutNode) => {
        const pos = positionsMap.get(node.id) ?? { x: node.position.x, y: node.position.y };
        const isAttachedHead = attachedHeadNodeIdSet.has(node.id);

        const change: PositionNodeChange = {
          id: node.id,
          type: 'position',
          position: pos,
          sourcePosition: isAttachedHead ? 'bottom' : isHorizontal ? 'right' : 'bottom',
          targetPosition: isAttachedHead ? 'top' : isHorizontal ? 'left' : 'top',
        };
        return change;
      });

      // Update positions via store to ensure they sync back to state/DB
      onNodesChange(nodeChanges);

      // Fit view afterwards
      window.requestAnimationFrame(() => {
        fitView({ duration: 800 });
      });
    },
    [nodes, edges, fitView, onNodesChange]
  );

  return { handleLayout };
}



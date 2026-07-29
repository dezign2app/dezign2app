import { useCallback } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { useBackendCanvasStore } from '@/lib/stores/backendCanvasStore';

const nodeWidth = 250;
const nodeHeight = 150;

interface UseAutoLayoutOptions {
  nodes?: Node[];
  edges?: Edge[];
  onNodesChange?: (changes: any[]) => void;
}

export function useAutoLayout(options?: UseAutoLayoutOptions) {
  const { fitView } = useReactFlow();
  const store = useBackendCanvasStore();

  const nodes = options?.nodes ?? store.nodes;
  const edges = options?.edges ?? store.edges;
  const onNodesChange = options?.onNodesChange ?? store.onNodesChange;

  const handleLayout = useCallback(
    (direction = 'LR') => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
      
      const isHorizontal = direction === 'LR';
      dagreGraph.setGraph({
        rankdir: direction,
        marginx: 60,
        marginy: 60,
        ranksep: isHorizontal ? 120 : 80,
        nodesep: isHorizontal ? 60 : 80,
      });

      nodes.forEach((node) => {
        // We use node.measured width and height if available, or type-specific estimates
        const measuredNode = node as typeof node & { measured?: { width?: number; height?: number } };
        const fallbackWidth = node.type === 'start' || node.id === 'START' ? 180 : node.type === 'state_global' || node.id === 'STATE_GLOBAL' ? 240 : 320;
        const fallbackHeight = node.type === 'start' || node.id === 'START' ? 70 : node.type === 'state_global' || node.id === 'STATE_GLOBAL' ? 140 : 220;

        const width = measuredNode.measured?.width ?? fallbackWidth;
        const height = measuredNode.measured?.height ?? fallbackHeight;
        dagreGraph.setNode(node.id, { width, height });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      const nodeChanges = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const measuredNode = node as typeof node & { measured?: { width?: number; height?: number } };
        const fallbackWidth = node.type === 'start' || node.id === 'START' ? 180 : node.type === 'state_global' || node.id === 'STATE_GLOBAL' ? 240 : 320;
        const fallbackHeight = node.type === 'start' || node.id === 'START' ? 70 : node.type === 'state_global' || node.id === 'STATE_GLOBAL' ? 140 : 220;

        const width = measuredNode.measured?.width ?? fallbackWidth;
        const height = measuredNode.measured?.height ?? fallbackHeight;

        // In groups/parent nodes, positions should be relative. 
        // For simplicity, dagre layout applies to top-level elements cleanly.
        return {
          id: node.id,
          type: 'position' as const,
          position: {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
          },
          ...(isHorizontal
            ? { sourcePosition: 'right', targetPosition: 'left' }
            : { sourcePosition: 'bottom', targetPosition: 'top' }),
        };
      });

      // Update positions via store to ensure they sync back to the database
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

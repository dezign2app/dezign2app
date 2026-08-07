import { useCallback } from "react";
import { useReactFlow, Node, Edge, Position } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import type { BackendNode, BackendEdge } from "@/types/canvas";

const HEAD_TARGET_HANDLES = new Set<string>([
  "llm_in",
  "tool_in",
  "middleware_in",
  "memory_in",
  "HANDLE_LLM_IN",
  "HANDLE_TOOL_IN",
  "HANDLE_MIDDLEWARE_IN",
  "HANDLE_MEMORY_IN",
]);

const HEAD_NODE_TYPES = new Set<string>([
  "langgraph_llm",
  "langgraph_tool",
  "langgraph_middleware",
  "langgraph_memory",
  "db_ref",
  "vector_db_ref",
]);

const TARGET_NODE_TYPES = new Set<string>([
  "langgraph_agent",
  "langgraph_node",
  "agent",
  "step",
]);

export type LayoutNode = Node | BackendNode;
export type LayoutEdge = Edge | BackendEdge;

export type PositionNodeChange = {
  id: string;
  type: "position";
  position: { x: number; y: number };
  sourcePosition?: string;
  targetPosition?: string;
};

export interface UseAutoLayoutOptions {
  nodes?: LayoutNode[];
  edges?: LayoutEdge[];
  onNodesChange?: (changes: PositionNodeChange[]) => void;
}

interface NodeHandleData {
  endpoints?: Array<{ id?: string; _id?: string }>;
  events?: Array<{ id?: string; _id?: string }>;
  topics?: Array<{ id?: string; _id?: string; name?: string }>;
  consumedEvents?: Array<string | { id?: string; _id?: string }>;
  publishedEvents?: Array<string | { id?: string; _id?: string }>;
}

function getLayoutNodeData(node: LayoutNode): NodeHandleData | undefined {
  if (!node.data || typeof node.data !== "object") {
    return undefined;
  }
  return node.data as NodeHandleData;
}

function getNodeDimensions(node: LayoutNode): {
  width: number;
  height: number;
} {
  if (
    "measured" in node &&
    node.measured &&
    typeof node.measured === "object" &&
    "width" in node.measured &&
    "height" in node.measured &&
    typeof node.measured.width === "number" &&
    typeof node.measured.height === "number" &&
    node.measured.width > 0 &&
    node.measured.height > 0
  ) {
    return {
      width: node.measured.width,
      height: node.measured.height,
    };
  }

  switch (node.type) {
    case "start":
    case "START":
      return { width: 180, height: 70 };
    case "state_global":
    case "STATE_GLOBAL":
      return { width: 260, height: 140 };
    case "langgraph_agent":
    case "langgraph_node":
    case "agent":
      return { width: 340, height: 180 };
    case "langgraph_llm":
      return { width: 320, height: 220 };
    case "langgraph_tool":
      return { width: 300, height: 260 };
    case "langgraph_middleware":
      return { width: 280, height: 160 };
    case "langgraph_memory":
    case "db_ref":
    case "vector_db_ref":
      return { width: 280, height: 180 };
    case "step":
      return { width: 300, height: 220 };
    case "end":
    case "END":
      return { width: 140, height: 60 };
    case "port":
      return { width: 140, height: 50 };
    case "service":
    case "api_gateway":
    case "express":
    case "fastapi":
    case "web_client_page":
    case "kafka":
    case "pubsub":
    case "queue": {
      const data = getLayoutNodeData(node);
      const count =
        (Array.isArray(data?.endpoints) ? data.endpoints.length : 0) +
        (Array.isArray(data?.events) ? data.events.length : 0) +
        (Array.isArray(data?.topics) ? data.topics.length : 0);
      const estHeight = Math.max(180, 140 + count * 40);
      return { width: 320, height: estHeight };
    }
    case "entity": {
      const data = node.data as
        | {
            columns?: any[];
            indexes?: any[];
            entityFunctions?: any[];
            description?: string;
          }
        | undefined;
      const colCount = data?.columns?.length ?? 1;
      const idxCount = data?.indexes?.length ?? 0;
      const fnCount = data?.entityFunctions?.length ?? 0;
      const hasDesc = Boolean(data?.description);

      let estHeight = 44 + 28 + (hasDesc ? 36 : 0) + 24 + colCount * 36;
      if (idxCount > 0) estHeight += 24 + idxCount * 28;
      if (fnCount > 0) estHeight += 24 + fnCount * 28;
      estHeight += 16;

      return { width: 300, height: Math.max(200, estHeight) };
    }
    default:
      return { width: 300, height: 200 };
  }
}

function getHandleYRatio(node: LayoutNode, handleId?: string | null): number {
  if (!handleId) return 0.5;

  if (node.type === "entity") {
    const colMatch = handleId.match(/^(?:source|target)-(\d+)$/);
    if (colMatch) {
      const colIndex = parseInt(colMatch[1]!, 10);
      const data = node.data as { columns?: any[]; description?: string } | undefined;
      const { height } = getNodeDimensions(node);

      const topOffset = 44 + 28 + (data?.description ? 36 : 0) + 24;
      const targetY = topOffset + colIndex * 36 + 18;

      return Math.min(0.95, Math.max(0.05, targetY / height));
    }
  }

  const data = getLayoutNodeData(node);
  if (!data) return 0.5;

  if (Array.isArray(data.endpoints) && data.endpoints.length > 0) {
    const idx = data.endpoints.findIndex((ep) => {
      const id = ep?.id || ep?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.endpoints.length;
    }
  }

  if (Array.isArray(data.events) && data.events.length > 0) {
    const idx = data.events.findIndex((ev) => {
      const id = ev?.id || ev?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.events.length;
    }
  }

  if (Array.isArray(data.topics) && data.topics.length > 0) {
    const idx = data.topics.findIndex((tp) => {
      const id = tp?.id || tp?._id || tp?.name;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.topics.length;
    }
  }

  if (Array.isArray(data.consumedEvents) && data.consumedEvents.length > 0) {
    const idx = data.consumedEvents.findIndex((ev) => {
      const id = typeof ev === "string" ? ev : ev?.id || ev?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.consumedEvents.length;
    }
  }
  if (Array.isArray(data.publishedEvents) && data.publishedEvents.length > 0) {
    const idx = data.publishedEvents.findIndex((ev) => {
      const id = typeof ev === "string" ? ev : ev?.id || ev?._id;
      return Boolean(id && handleId.includes(String(id)));
    });
    if (idx !== -1) {
      return (idx + 0.5) / data.publishedEvents.length;
    }
  }

  const match = handleId.match(/(\d+)$/);
  if (match) {
    const parsedIdx = parseInt(match[1]!, 10);
    if (!isNaN(parsedIdx) && parsedIdx < 10) {
      return (parsedIdx + 0.5) / 5;
    }
  }

  return 0.5;
}

function getIsPkNode(node?: LayoutNode, handleId?: string | null): boolean {
  if (!node || !handleId || !node.data || typeof node.data !== "object") return false;
  const columns = (node.data as { columns?: any[] }).columns;
  if (!Array.isArray(columns)) return false;
  const match = handleId.match(/^(?:source|target)-(\d+)$/);
  if (!match) return false;
  const idx = parseInt(match[1]!, 10);
  const col = columns[idx];
  return Boolean(col?.isPrimaryKey || col?.name === "_id");
}

function getHandleYOffset(node: LayoutNode, handleId?: string | null): number {
  const { height } = getNodeDimensions(node);
  const ratio = getHandleYRatio(node, handleId);
  return height * ratio;
}

function getHandleXOffset(node: LayoutNode, handleId?: string | null): number {
  const { width } = getNodeDimensions(node);
  const ratio = getHandleYRatio(node, handleId);
  return width * ratio;
}

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

      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({}),
      );
      dagreGraph.setGraph({
        rankdir: direction,
        marginx: 60,
        marginy: 60,
        ranksep: isSchemaView
          ? isHorizontal
            ? 220
            : 160
          : isHorizontal
            ? 140
            : 100,
        nodesep: isSchemaView ? 100 : 80,
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
      const endpointYRatio = new Map<string, number>(); // epId → ratio
      const epsByNode = new Map<string, string[]>(); // nodeId → ordered [epId]
      storeEndpoints.forEach((ep) => {
        if (!epsByNode.has(ep.nodeId)) epsByNode.set(ep.nodeId, []);
        epsByNode.get(ep.nodeId)!.push(ep.id);
      });
      epsByNode.forEach((epIds) => {
        epIds.forEach((epId, idx) => {
          endpointYRatio.set(epId, (idx + 0.5) / epIds.length);
        });
      });

      const eventYRatio = new Map<string, number>(); // evId → ratio
      const evsByNode = new Map<string, string[]>(); // nodeId → ordered [evId]
      storeEvents.forEach((ev) => {
        if (!evsByNode.has(ev.nodeId)) evsByNode.set(ev.nodeId, []);
        evsByNode.get(ev.nodeId)!.push(ev.id);
      });
      evsByNode.forEach((evIds) => {
        evIds.forEach((evId, idx) => {
          eventYRatio.set(evId, (idx + 0.5) / evIds.length);
        });
      });

      const resolveHandleY = (
        neighborId: string,
        handle: string | null | undefined,
        neighborY: number,
        neighborH: number,
      ): number => {
        if (!handle) return neighborY + neighborH / 2;

        const neighborNode = flowNodes.find((n) => n.id === neighborId);
        if (neighborNode && neighborNode.type === "entity") {
          const ratio = getHandleYRatio(neighborNode, handle);
          return neighborY + ratio * neighborH;
        }

        if (
          handle.startsWith("endpoint-in-") ||
          handle.startsWith("endpoint-out-")
        ) {
          const epId = handle.replace(/^endpoint-(in|out)-/, "");
          const ratio = endpointYRatio.get(epId);
          if (ratio !== undefined) return neighborY + ratio * neighborH;
        }
        if (handle.startsWith("events-")) {
          const evId = handle.replace("events-", "");
          const ratio = eventYRatio.get(evId);
          if (ratio !== undefined) return neighborY + ratio * neighborH;
        }
        if (handle.startsWith("publishedEvents-out-")) {
          const evId = handle.replace("publishedEvents-out-", "");
          const ratio = eventYRatio.get(evId);
          if (ratio !== undefined) return neighborY + ratio * neighborH;
        }
        if (handle.startsWith("consumedEvents-in-")) {
          const evId = handle.replace("consumedEvents-in-", "");
          const ratio = eventYRatio.get(evId);
          if (ratio !== undefined) return neighborY + ratio * neighborH;
        }
        return neighborY + neighborH / 2;
      };

      const resolveMyHandleRatio = (
        node: LayoutNode,
        handle: string | null | undefined,
      ): number => {
        if (!handle) return 0.5;

        if (node.type === "entity") {
          return getHandleYRatio(node, handle);
        }

        if (
          handle.startsWith("endpoint-in-") ||
          handle.startsWith("endpoint-out-")
        ) {
          const epId = handle.replace(/^endpoint-(in|out)-/, "");
          return endpointYRatio.get(epId) ?? 0.5;
        }
        if (handle.startsWith("events-")) {
          return eventYRatio.get(handle.replace("events-", "")) ?? 0.5;
        }
        if (handle.startsWith("publishedEvents-out-")) {
          return eventYRatio.get(handle.replace("publishedEvents-out-", "")) ??
            0.5;
        }
        if (handle.startsWith("consumedEvents-in-")) {
          return (
            eventYRatio.get(handle.replace("consumedEvents-in-", "")) ?? 0.5
          );
        }
        return 0.5;
      };

      const rankMap = new Map<number, string[]>();
      flowNodes.forEach((node: LayoutNode) => {
        const dNode = dagreGraph.node(node.id);
        if (!dNode) return;
        const r: number = typeof dNode.rank === "number" ? dNode.rank : 0;
        if (!rankMap.has(r)) rankMap.set(r, []);
        rankMap.get(r)!.push(node.id);
      });

      const ranks = Array.from(rankMap.keys()).sort((a, b) => a - b);

      const computeBarycenter = (nodeId: string): number => {
        const node = flowNodes.find((n) => n.id === nodeId);
        if (!node) return 0;
        const pos = positionsMap.get(nodeId);
        if (!pos) return 0;
        const { height } = getNodeDimensions(node);

        const nodeEdges = flowEdges.filter(
          (e) => e.source === nodeId || e.target === nodeId,
        );
        if (nodeEdges.length === 0) return pos.y + height / 2;

        let sum = 0;
        let count = 0;
        nodeEdges.forEach((edge) => {
          const isSrc = edge.source === nodeId;
          const neighborId = isSrc ? edge.target : edge.source;
          const neighborNode = flowNodes.find((n) => n.id === neighborId);
          if (!neighborNode) return;
          const neighborPos = positionsMap.get(neighborId);
          if (!neighborPos) return;
          const { height: nh } = getNodeDimensions(neighborNode);

          const neighborHandle = isSrc ? edge.targetHandle : edge.sourceHandle;
          const myHandle = isSrc ? edge.sourceHandle : edge.targetHandle;

          if (isHorizontal) {
            const neighborHandleY = resolveHandleY(
              neighborId,
              neighborHandle,
              neighborPos.y,
              nh,
            );
            const myRatio = resolveMyHandleRatio(node, myHandle);
            const idealCenterY = neighborHandleY - myRatio * height + height / 2;
            sum += idealCenterY;
          } else {
            sum += neighborPos.x + getNodeDimensions(neighborNode).width / 2;
          }
          count++;
        });

        return count > 0 ? sum / count : pos.y + height / 2;
      };

      // --- Crossing count between two adjacent rank arrays ---
      // O(n²) per rank pair — fine for typical diagram sizes (dozens of nodes).
      const countCrossings = (rankA: string[], rankB: string[]): number => {
        const posB = new Map(rankB.map((id, i) => [id, i]));
        const pairs: [number, number][] = [];
        flowEdges.forEach((e) => {
          const ai = rankA.indexOf(e.source);
          const bi = posB.get(e.target);
          if (ai !== -1 && bi !== undefined) pairs.push([ai, bi]);
          const ai2 = rankA.indexOf(e.target);
          const bi2 = posB.get(e.source);
          if (ai2 !== -1 && bi2 !== undefined) pairs.push([ai2, bi2]);
        });
        let crossings = 0;
        for (let i = 0; i < pairs.length; i++) {
          for (let j = i + 1; j < pairs.length; j++) {
            const [a1, b1] = pairs[i]!;
            const [a2, b2] = pairs[j]!;
            if ((a1 < a2 && b1 > b2) || (a1 > a2 && b1 < b2)) crossings++;
          }
        }
        return crossings;
      };

      const totalCrossings = (): number => {
        let total = 0;
        for (let i = 0; i < ranks.length - 1; i++) {
          const a = rankMap.get(ranks[i]!);
          const b = rankMap.get(ranks[i + 1]!);
          if (a && b) total += countCrossings(a, b);
        }
        return total;
      };

      // --- Reapply positions for all ranks given their current order in rankMap ---
      const nodeGap = 80;
      const reapplyRankPositions = () => {
        ranks.forEach((r) => {
          const ids = rankMap.get(r);
          if (!ids || ids.length === 0) return;

          let totalLen = 0;
          ids.forEach((id, idx) => {
            const node = flowNodes.find((n) => n.id === id)!;
            const { width, height } = getNodeDimensions(node);
            totalLen += (isHorizontal ? height : width) + (idx > 0 ? nodeGap : 0);
          });

          const avgCenter =
            ids.reduce((s, id) => s + computeBarycenter(id), 0) / ids.length;
          let cursor = avgCenter - totalLen / 2;

          const secondaryPos =
            ids.reduce((s, id) => {
              const pos = positionsMap.get(id);
              if (!pos) return s;
              const node = flowNodes.find((n) => n.id === id)!;
              const { width, height } = getNodeDimensions(node);
              return s + (isHorizontal ? pos.x + width / 2 : pos.y + height / 2);
            }, 0) / ids.length;

          ids.forEach((id) => {
            const node = flowNodes.find((n) => n.id === id)!;
            const { width, height } = getNodeDimensions(node);
            if (isHorizontal) {
              positionsMap.set(id, { x: secondaryPos - width / 2, y: cursor });
              cursor += height + nodeGap;
            } else {
              positionsMap.set(id, { x: cursor, y: secondaryPos - height / 2 });
              cursor += width + nodeGap;
            }
          });
        });
      };

      // --- Transpose refinement: swap adjacent pairs within each rank if it reduces crossings ---
      const transposeRefine = () => {
        let improved = true;
        let iterations = 0;
        while (improved && iterations < 10) {
          improved = false;
          iterations++;
          ranks.forEach((r) => {
            const ids = rankMap.get(r)!;
            for (let i = 0; i < ids.length - 1; i++) {
              const before = totalCrossings();
              // Swap
              const tmp = ids[i]!;
              ids[i] = ids[i + 1]!;
              ids[i + 1] = tmp;
              const after = totalCrossings();
              if (after < before) {
                improved = true; // keep swap
              } else {
                // Revert
                const tmp2 = ids[i]!;
                ids[i] = ids[i + 1]!;
                ids[i + 1] = tmp2;
              }
            }
          });
        }
      };

      // --- Sweep: sort each rank's node order by barycenter (ordering only) ---
      const sweepRanks = (rankOrder: number[]) => {
        rankOrder.forEach((r) => {
          const ids = rankMap.get(r);
          if (!ids || ids.length <= 1) return;
          ids.sort((a, b) => computeBarycenter(a) - computeBarycenter(b));
        });
      };

      // --- Best-of-N tracking: run 6 passes, keep the layout with fewest crossings ---
      let bestOrder: Map<number, string[]> | null = null;
      let bestScore = Infinity;

      for (let pass = 0; pass < 6; pass++) {
        sweepRanks(pass % 2 === 0 ? [...ranks] : [...ranks].reverse());
        transposeRefine();
        reapplyRankPositions();
        const score = totalCrossings();
        if (score < bestScore) {
          bestScore = score;
          bestOrder = new Map(
            Array.from(rankMap.entries()).map(([k, v]) => [k, [...v]]),
          );
        }
      }

      // Restore best-scoring order and reposition
      if (bestOrder) {
        bestOrder.forEach((ids, r) => rankMap.set(r, ids));
      }
      reapplyRankPositions();

      // 6. Layout attached head nodes grouped by category columns above each target node
      targetNodeIds.forEach((targetId: string) => {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (!targetNode) return;

        const targetPos = positionsMap.get(targetId);
        if (!targetPos) return;

        const { width: targetW } = getNodeDimensions(targetNode);
        const targetCenterX = targetPos.x + targetW / 2;

        const edgesForTarget = headEdges.filter(
          (e: LayoutEdge) => e.target === targetId,
        );
        const headNodesForTarget = attachedHeadNodes.filter((hn: LayoutNode) =>
          edgesForTarget.some((e: LayoutEdge) => e.source === hn.id),
        );

        if (headNodesForTarget.length === 0) return;

        // Categorize each head node (0: LLM, 1: Tool, 2: Middleware, 3: Memory)
        const getHeadCategoryIdx = (hn: LayoutNode): number => {
          const edge = edgesForTarget.find(
            (e: LayoutEdge) => e.source === hn.id,
          );
          const handle = edge?.targetHandle ?? "";
          if (
            handle === "llm_in" ||
            handle === "HANDLE_LLM_IN" ||
            hn.type === "langgraph_llm"
          )
            return 0;
          if (
            handle === "tool_in" ||
            handle === "HANDLE_TOOL_IN" ||
            hn.type === "langgraph_tool"
          )
            return 1;
          if (
            handle === "middleware_in" ||
            handle === "HANDLE_MIDDLEWARE_IN" ||
            hn.type === "langgraph_middleware"
          )
            return 2;
          if (
            handle === "memory_in" ||
            handle === "HANDLE_MEMORY_IN" ||
            hn.type === "langgraph_memory" ||
            hn.type === "db_ref" ||
            hn.type === "vector_db_ref"
          )
            return 3;
          return 1;
        };

        // Group into 4 category columns
        const columns: LayoutNode[][] = [[], [], [], []];
        headNodesForTarget.forEach((hn: LayoutNode) => {
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
          Math.max(...col.map((hn) => getNodeDimensions(hn).width)),
        );

        const columnGapX = 30;
        const initialGapY = 60;
        const verticalStackGapY = 30;

        const totalWidth =
          columnWidths.reduce((sum: number, w: number) => sum + w, 0) +
          (activeColumns.length - 1) * columnGapX;

        let currentX = targetCenterX - totalWidth / 2;

        activeColumns.forEach((colNodes: LayoutNode[], colIdx: number) => {
          const colW = columnWidths[colIdx] ?? 300;
          const colCenterX = currentX + colW / 2;

          // Stack nodes in this column vertically from bottom to top
          let currentBottomY = targetPos.y - initialGapY;

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
    [nodes, edges, fitView, options?.onNodesChange],
  );

  return { handleLayout };
}

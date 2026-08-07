import type dagre from "@dagrejs/dagre";
import type { LayoutNode, LayoutEdge } from "./types";
import { getNodeDimensions, getHandleYRatio } from "./nodeDimensions";

export interface BarycenterRefinementParams {
  dagreGraph: any;
  flowNodes: LayoutNode[];
  flowEdges: LayoutEdge[];
  positionsMap: Map<string, { x: number; y: number }>;
  isHorizontal: boolean;
  storeEndpoints: Array<{ id: string; nodeId: string }>;
  storeEvents: Array<{ id: string; nodeId: string }>;
}

export function runBarycenterRefinement({
  dagreGraph,
  flowNodes,
  flowEdges,
  positionsMap,
  isHorizontal,
  storeEndpoints,
  storeEvents,
}: BarycenterRefinementParams): void {
  const endpointYRatio = new Map<string, number>();
  const epsByNode = new Map<string, string[]>();
  storeEndpoints.forEach((ep) => {
    if (!epsByNode.has(ep.nodeId)) epsByNode.set(ep.nodeId, []);
    epsByNode.get(ep.nodeId)!.push(ep.id);
  });
  epsByNode.forEach((epIds) => {
    epIds.forEach((epId, idx) => {
      endpointYRatio.set(epId, (idx + 0.5) / epIds.length);
    });
  });

  const eventYRatio = new Map<string, number>();
  const evsByNode = new Map<string, string[]>();
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
      return (
        eventYRatio.get(handle.replace("publishedEvents-out-", "")) ?? 0.5
      );
    }
    if (handle.startsWith("consumedEvents-in-")) {
      return eventYRatio.get(handle.replace("consumedEvents-in-", "")) ?? 0.5;
    }
    return 0.5;
  };

  const rankMap = new Map<number, string[]>();
  flowNodes.forEach((node: LayoutNode) => {
    const dNode = dagreGraph.node(node.id) as { rank?: number } | undefined;
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
          const tmp = ids[i]!;
          ids[i] = ids[i + 1]!;
          ids[i + 1] = tmp;
          const after = totalCrossings();
          if (after < before) {
            improved = true;
          } else {
            const tmp2 = ids[i]!;
            ids[i] = ids[i + 1]!;
            ids[i + 1] = tmp2;
          }
        }
      });
    }
  };

  const sweepRanks = (rankOrder: number[]) => {
    rankOrder.forEach((r) => {
      const ids = rankMap.get(r);
      if (!ids || ids.length <= 1) return;
      ids.sort((a, b) => computeBarycenter(a) - computeBarycenter(b));
    });
  };

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

  // --- Post-Processing: Elevate intermediate nodes above rank-skipping edges ---
  const adjustIntermediateNodesForSkipEdges = () => {
    const nodeToRank = new Map<string, number>();
    rankMap.forEach((ids, r) => {
      ids.forEach((id) => nodeToRank.set(id, r));
    });

    const skipEdges: Array<{
      edge: LayoutEdge;
      minRank: number;
      maxRank: number;
    }> = [];

    flowEdges.forEach((edge) => {
      const srcRank = nodeToRank.get(edge.source);
      const tgtRank = nodeToRank.get(edge.target);
      if (srcRank !== undefined && tgtRank !== undefined) {
        const minRank = Math.min(srcRank, tgtRank);
        const maxRank = Math.max(srcRank, tgtRank);
        if (maxRank - minRank >= 2) {
          skipEdges.push({ edge, minRank, maxRank });
        }
      }
    });

    if (skipEdges.length === 0) return;

    skipEdges.forEach(({ edge, minRank, maxRank }) => {
      const srcNode = flowNodes.find((n) => n.id === edge.source);
      const tgtNode = flowNodes.find((n) => n.id === edge.target);
      if (!srcNode || !tgtNode) return;

      const srcPos = positionsMap.get(edge.source);
      const tgtPos = positionsMap.get(edge.target);
      if (!srcPos || !tgtPos) return;

      const srcH = getNodeDimensions(srcNode).height;
      const tgtH = getNodeDimensions(tgtNode).height;

      const srcHandleY = resolveHandleY(
        edge.source,
        edge.sourceHandle,
        srcPos.y,
        srcH,
      );
      const tgtHandleY = resolveHandleY(
        edge.target,
        edge.targetHandle,
        tgtPos.y,
        tgtH,
      );

      for (let r = minRank + 1; r < maxRank; r++) {
        const rankNodeIds = rankMap.get(r);
        if (!rankNodeIds || rankNodeIds.length === 0) continue;

        const t = (r - minRank) / (maxRank - minRank);
        const yEdgeAtRank = srcHandleY + t * (tgtHandleY - srcHandleY);

        rankNodeIds.forEach((nodeId) => {
          const nNode = flowNodes.find((n) => n.id === nodeId);
          if (!nNode) return;
          const nPos = positionsMap.get(nodeId);
          if (!nPos) return;
          const { height: nH } = getNodeDimensions(nNode);

          const isConnectedToSkipEdge = flowEdges.some(
            (e) =>
              (e.source === nodeId &&
                (e.target === edge.source || e.target === edge.target)) ||
              (e.target === nodeId &&
                (e.source === edge.source || e.source === edge.target)),
          );

          const nodeBottom = nPos.y + nH;
          const overlapsEdge =
            nPos.y <= yEdgeAtRank + 40 && nodeBottom >= yEdgeAtRank - 40;

          if (isConnectedToSkipEdge || overlapsEdge) {
            const targetY = yEdgeAtRank - nH - 60;
            if (nPos.y > targetY) {
              positionsMap.set(nodeId, { x: nPos.x, y: targetY });
            }
          }
        });
      }
    });

    let minY = Infinity;
    positionsMap.forEach((pos) => {
      if (pos.y < minY) minY = pos.y;
    });

    if (minY < 60) {
      const shiftY = 60 - minY;
      positionsMap.forEach((pos, id) => {
        positionsMap.set(id, { x: pos.x, y: pos.y + shiftY });
      });
    }
  };

  if (bestOrder) {
    bestOrder.forEach((ids, r) => rankMap.set(r, ids));
  }
  reapplyRankPositions();
  adjustIntermediateNodesForSkipEdges();
}

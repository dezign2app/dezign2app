import React, { useState } from "react";
import {
  EdgeProps,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
} from "@xyflow/react";
import { BackendEdge } from "@/types/canvas";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { cn } from "@workspace/ui/lib/utils";
import { X } from "lucide-react";

export type ForeignKeyEdgeProps = EdgeProps<BackendEdge> & {
  sourceHandle?: string | null;
  targetHandle?: string | null;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
};

export const ForeignKeyEdge = (props: ForeignKeyEdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    style,
  } = props;

  const reactFlow = useReactFlow();
  const deleteEdge = useBackendCanvasStore((s) => s.deleteEdge);
  const updateEdge = useBackendCanvasStore((s) => s.updateEdge);
  const [isHovered, setIsHovered] = useState(false);

  const [ edgePath ] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate unique t-offset along bezier path per edge to prevent label collisions
  const hashStr = props.id || "";
  let idHash = 0;
  for (let i = 0; i < hashStr.length; i++) {
    idHash = (idHash << 5) - idHash + hashStr.charCodeAt(i);
  }
  const targetHandle = props.targetHandleId ?? props.targetHandle ?? "";
  const sourceHandle = props.sourceHandleId ?? props.sourceHandle ?? "";
  const match = (targetHandle || sourceHandle || "").match(/(\d+)/);
  const handleIdx = (match ? parseInt(match[1]!, 10) : 0) + Math.abs(idHash % 4);

  const tValues = [0.35, 0.65, 0.44, 0.56];
  const t = tValues[handleIdx % tValues.length]!;

  const dx = Math.abs(targetX - sourceX);
  const c1x = sourceX + (sourcePosition === "left" ? -dx * 0.5 : dx * 0.5);
  const c1y = sourceY;
  const c2x = targetX + (targetPosition === "right" ? dx * 0.5 : -dx * 0.5);
  const c2y = targetY;

  const oneMinusT = 1 - t;
  const labelX =
    Math.pow(oneMinusT, 3) * sourceX +
    3 * Math.pow(oneMinusT, 2) * t * c1x +
    3 * oneMinusT * Math.pow(t, 2) * c2x +
    Math.pow(t, 3) * targetX;

  const labelY =
    Math.pow(oneMinusT, 3) * sourceY +
    3 * Math.pow(oneMinusT, 2) * t * c1y +
    3 * oneMinusT * Math.pow(t, 2) * c2y +
    Math.pow(t, 3) * targetY;

  // Interpret crow's foot markers based on cardinality
  const sourceCard = data?.sourceCardinality || "1";
  const targetCard = data?.targetCardinality || "N";
  const relationshipLabel = `${sourceCard} : ${targetCard}`;

  const CARDINALITY_OPTIONS: Array<[string, string]> = [
    ["1", "N"],
    ["1", "1"],
    ["N", "N"],
    ["N", "1"],
  ];

  const handleCycleCardinality = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIdx = CARDINALITY_OPTIONS.findIndex(
      ([s, t]) => s === sourceCard && t === targetCard,
    );
    const nextIdx = (currentIdx + 1) % CARDINALITY_OPTIONS.length;
    const [nextSource, nextTarget] = CARDINALITY_OPTIONS[nextIdx]!;

    updateEdge(id, {
      data: {
        ...data,
        sourceCardinality: nextSource,
        targetCardinality: nextTarget,
      },
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    updateEdge(id, { zIndex: 1000 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    updateEdge(id, { zIndex: 0 });
  };

  const sourceMarkerId =
    sourceCard === "1" ? "crows-foot-one" : "crows-foot-many";
  const targetMarkerId =
    targetCard === "1" ? "crows-foot-one" : "crows-foot-many";

  const isHighlighted = selected || isHovered;

  return (
    <>
      {/* SVG Definitions for Crow's Foot & Arrow markers */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          overflow: "visible",
          zIndex: isHighlighted ? 9999 : undefined,
        }}
      >
        <defs>
          {/* One (1) / PK Marker: Solid Dot + Vertical Bar */}
          <marker
            id="crows-foot-one"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto-start-reverse"
          >
            <circle cx="4" cy="6" r="2.2" fill="currentColor" />
            <line
              x1="9"
              y1="2"
              x2="9"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </marker>

          {/* Many (N) / FK Marker: Crow's Foot Fork + Vertical Bar */}
          <marker
            id="crows-foot-many"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 2 2 L 10 6 L 2 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="10"
              y1="2"
              x2="10"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </marker>
        </defs>
      </svg>

      {/* Invisible thick interaction path for easy hovering */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Ambient background path */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: isHighlighted ? 6 : 4,
          stroke: selected
            ? "rgba(56, 189, 248, 0.35)"
            : isHovered
            ? "rgba(56, 189, 248, 0.25)"
            : "rgba(226, 232, 240, 0.12)",
          transition: "all 0.15s ease-in-out",
        }}
      />

      {/* Main crisp edge line */}
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#${targetMarkerId})`}
        markerStart={`url(#${sourceMarkerId})`}
        style={{
          ...style,
          strokeWidth: isHighlighted ? 2.5 : 2,
          stroke: isHighlighted ? "#38bdf8" : "#cbd5e1",
          color: isHighlighted ? "#38bdf8" : "#e2e8f0",
          transition: "all 0.15s ease-in-out",
          filter: isHighlighted
            ? "drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))"
            : undefined,
        }}
      />

      {/* Interactive Cardinality Badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            zIndex: isHighlighted ? 9999 : 50,
          }}
          className="nodrag nopan"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            onClick={handleCycleCardinality}
            title="Click to toggle relationship (1:N, 1:1, N:N, N:1)"
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider shadow-sm transition-all border backdrop-blur-md cursor-pointer select-none",
              isHighlighted
                ? "bg-primary text-primary-foreground border-primary scale-110 shadow-md ring-2 ring-primary/20"
                : "bg-background/90 text-foreground/80 border-border/60 hover:border-primary/50 hover:text-foreground",
            )}
          >
            <span>{relationshipLabel}</span>
            {isHovered && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (reactFlow?.deleteElements) {
                    reactFlow.deleteElements({ edges: [{ id }] });
                  } else {
                    deleteEdge(id);
                  }
                }}
                className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/30 hover:text-destructive text-primary-foreground/80 transition-colors"
                title="Delete connection"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};


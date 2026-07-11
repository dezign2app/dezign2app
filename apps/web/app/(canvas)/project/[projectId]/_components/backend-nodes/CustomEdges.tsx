import React from "react";
import {
  EdgeProps,
  getBezierPath,
  BaseEdge,
} from "@xyflow/react";
import { BackendEdge } from "@/types/canvas";

import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";

// Inline styles for animations
const EdgeStyles = () => (
  <style>{`
    @keyframes flow-dash-forward {
      from {
        stroke-dashoffset: 16;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
    .edge-flow-animated {
      stroke-dasharray: 6, 6;
      animation: flow-dash-forward 0.8s linear infinite;
    }
    .edge-flow-animated-fast {
      stroke-dasharray: 4, 4;
      animation: flow-dash-forward 0.5s linear infinite;
    }
  `}</style>
);

// Standard markers for edges
const EdgeMarkers = () => (
  <svg style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0 }}>
    <defs>
      <marker
        id="arrow-blue"
        viewBox="0 0 10 10"
        refX="6"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
      </marker>
      <marker
        id="arrow-purple"
        viewBox="0 0 10 10"
        refX="6"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
      </marker>
      <marker
        id="arrow-amber"
        viewBox="0 0 10 10"
        refX="6"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
      </marker>
    </defs>
  </svg>
);

// 3. Database Reference Edge (Amber/Orange Dashed)
export const DatabaseRefEdge = (props: EdgeProps<BackendEdge>) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <EdgeStyles />
      <EdgeMarkers />

      {/* Base path */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: "rgba(245, 158, 11, 0.1)",
        }}
      />

      {/* Main dashed edge */}
      <BaseEdge
        path={edgePath}
        markerEnd="url(#arrow-amber)"
        style={{
          ...style,
          strokeWidth: 1.5,
          stroke: "#f59e0b", // amber-500
          strokeDasharray: "4, 4",
        }}
      />
    </>
  );
};

// 1. HTTP/API Connection Edge (Blue/Teal)
export const HTTPConnectionEdge = (props: EdgeProps<BackendEdge>) => {
  const targetNode = useBackendCanvasStore(
    (s) => s.nodes.find((n) => n.id === props.target)
  );

  if (targetNode?.type === "database") {
    return <DatabaseRefEdge {...props} />;
  }

  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <EdgeStyles />
      <EdgeMarkers />
      
      {/* Background/Base path */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: "rgba(14, 165, 233, 0.15)",
        }}
      />

      {/* Main coloured edge */}
      <BaseEdge
        path={edgePath}
        markerEnd="url(#arrow-blue)"
        style={{
          ...style,
          strokeWidth: 1.5,
          stroke: "#0ea5e9", // sky-500
        }}
      />

      {/* Animated Flow dots */}
      <path
        d={edgePath}
        fill="none"
        className="edge-flow-animated-fast"
        style={{
          strokeWidth: 1.5,
          stroke: "#e0f2fe", // sky-100 overlay
          pointerEvents: "none",
        }}
      />
    </>
  );
};

// 2. Messaging Edge (Purple/Lavender)
export const MessagingEdge = (props: EdgeProps<BackendEdge>) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <EdgeStyles />
      <EdgeMarkers />

      {/* Base shadow path */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 3.5,
          stroke: "rgba(168, 85, 247, 0.12)",
        }}
      />

      {/* Main purple edge */}
      <BaseEdge
        path={edgePath}
        markerEnd="url(#arrow-purple)"
        style={{
          ...style,
          strokeWidth: 1.5,
          stroke: "#a855f7", // purple-500
        }}
      />

      {/* Animated messaging pulses */}
      <path
        d={edgePath}
        fill="none"
        className="edge-flow-animated"
        style={{
          strokeWidth: 1.5,
          stroke: "#f3e8ff", // purple-100 overlay
          pointerEvents: "none",
        }}
      />
    </>
  );
};


import React from "react";
import { NodeProps } from "@xyflow/react";
import type { CanvasNode, StepNode } from "../types";
import { STEP_TYPE_ROUTER } from "../constants";
import { LangGraphCanvasNode } from "./LangGraphCanvasNode";
import { LangGraphCanvasRouterNode } from "./LangGraphCanvasRouterNode";

/** Dispatches step nodes to their dedicated visual renderer. */
export function LangGraphCanvasStepNode(props: NodeProps<StepNode>) {
  if (props.data.stepType === STEP_TYPE_ROUTER) {
    return <LangGraphCanvasRouterNode {...props} />;
  }
  return <LangGraphCanvasNode {...(props as unknown as NodeProps<CanvasNode>)} />;
}

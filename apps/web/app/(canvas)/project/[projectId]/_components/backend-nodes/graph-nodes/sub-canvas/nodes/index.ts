import { SubCanvasGraphStateNode } from "./SubCanvasGraphStateNode";
import { SubCanvasStepNode } from "./SubCanvasStepNode";
import { SubCanvasStartNode } from "./SubCanvasStartNode";
import { SubCanvasPortNode } from "./SubCanvasPortNode";

export const subCanvasNodeTypes = {
  step: SubCanvasStepNode,
  start: SubCanvasStartNode,
  port: SubCanvasPortNode,
  state_global: SubCanvasGraphStateNode,
};

export {
  SubCanvasGraphStateNode,
  SubCanvasStepNode,
  SubCanvasStartNode,
  SubCanvasPortNode,
};

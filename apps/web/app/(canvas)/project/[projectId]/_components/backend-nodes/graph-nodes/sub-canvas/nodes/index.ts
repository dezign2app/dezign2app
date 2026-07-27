import { SubCanvasGraphStateNode } from "./SubCanvasGraphStateNode";
import { LangGraphCanvasStepNode } from "./LangGraphCanvasStepNode";
import { SubCanvasStartNode } from "./SubCanvasStartNode";
import { SubCanvasPortNode } from "./SubCanvasPortNode";

export const subCanvasNodeTypes = {
  step: LangGraphCanvasStepNode,
  start: SubCanvasStartNode,
  port: SubCanvasPortNode,
  state_global: SubCanvasGraphStateNode,
};

export {
  SubCanvasGraphStateNode,
  LangGraphCanvasStepNode,
  SubCanvasStartNode,
  SubCanvasPortNode,
};

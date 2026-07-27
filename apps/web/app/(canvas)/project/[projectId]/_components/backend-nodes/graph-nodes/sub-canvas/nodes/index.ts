import { LangGraphCanvasStateNode } from "./LangGraphCanvasStateNode";
import { LangGraphCanvasStepNode } from "./LangGraphCanvasStepNode";
import { LangGraphCanvasStartNode } from "./LangGraphCanvasStartNode";
import { LangGraphCanvasPortNode } from "./LangGraphCanvasPortNode";

export const langGraphCanvasNodeTypes = {
  step: LangGraphCanvasStepNode,
  start: LangGraphCanvasStartNode,
  port: LangGraphCanvasPortNode,
  state_global: LangGraphCanvasStateNode,
};

export {
  LangGraphCanvasStateNode,
  LangGraphCanvasStepNode,
  LangGraphCanvasStartNode,
  LangGraphCanvasPortNode,
};

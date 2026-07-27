import { LangGraphCanvasStateNode } from "./LangGraphCanvasStateNode";
import { LangGraphCanvasStepNode } from "./LangGraphCanvasStepNode";
import { LangGraphCanvasStartNode } from "./LangGraphCanvasStartNode";
import { LangGraphCanvasPortNode } from "./LangGraphCanvasPortNode";
import { LangGraphCanvasLLMNode } from "./LangGraphCanvasLLMNode";

export const langGraphCanvasNodeTypes = {
  step: LangGraphCanvasStepNode,
  start: LangGraphCanvasStartNode,
  port: LangGraphCanvasPortNode,
  state_global: LangGraphCanvasStateNode,
  langgraph_llm: LangGraphCanvasLLMNode,
};

export {
  LangGraphCanvasStateNode,
  LangGraphCanvasStepNode,
  LangGraphCanvasStartNode,
  LangGraphCanvasPortNode,
  LangGraphCanvasLLMNode,
};


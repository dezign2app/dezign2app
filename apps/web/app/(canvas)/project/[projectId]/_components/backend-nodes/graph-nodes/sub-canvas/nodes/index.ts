import { LangGraphCanvasStateNode } from "./LangGraphCanvasStateNode";
import { LangGraphCanvasStepNode } from "./LangGraphCanvasStepNode";
import { LangGraphCanvasStartNode } from "./LangGraphCanvasStartNode";
import { LangGraphCanvasPortNode } from "./LangGraphCanvasPortNode";
import { LangGraphCanvasLLMNode } from "./LangGraphCanvasLLMNode";
import { LangGraphCanvasToolNode } from "./LangGraphCanvasToolNode";

import {
  SUB_CANVAS_NODE_STEP,
  SUB_CANVAS_NODE_START,
  SUB_CANVAS_NODE_PORT,
  SUB_CANVAS_NODE_STATE_GLOBAL,
  SUB_CANVAS_NODE_LLM,
  SUB_CANVAS_NODE_TOOL,
} from "../constants";

export const langGraphCanvasNodeTypes = {
  [SUB_CANVAS_NODE_STEP]: LangGraphCanvasStepNode,
  [SUB_CANVAS_NODE_START]: LangGraphCanvasStartNode,
  [SUB_CANVAS_NODE_PORT]: LangGraphCanvasPortNode,
  [SUB_CANVAS_NODE_STATE_GLOBAL]: LangGraphCanvasStateNode,
  [SUB_CANVAS_NODE_LLM]: LangGraphCanvasLLMNode,
  [SUB_CANVAS_NODE_TOOL]: LangGraphCanvasToolNode,
};

export {
  LangGraphCanvasStateNode,
  LangGraphCanvasStepNode,
  LangGraphCanvasStartNode,
  LangGraphCanvasPortNode,
  LangGraphCanvasLLMNode,
  LangGraphCanvasToolNode,
};


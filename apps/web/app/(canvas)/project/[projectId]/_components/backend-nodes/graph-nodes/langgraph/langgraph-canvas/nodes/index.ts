import { LangGraphCanvasStateNode } from "./LangGraphCanvasStateNode";
import { LangGraphCanvasStepNode } from "./LangGraphCanvasStepNode";
import { LangGraphCanvasStartNode } from "./LangGraphCanvasStartNode";
import { LangGraphCanvasPortNode } from "./LangGraphCanvasPortNode";
import { LangGraphCanvasLLMNode } from "./LangGraphCanvasLLMNode";
import { LangGraphCanvasToolNode } from "./LangGraphCanvasToolNode";
import { LangGraphCanvasMiddlewareNode } from "./LangGraphCanvasMiddlewareNode";
import { LangGraphCanvasAgentNode } from "./LangGraphCanvasAgentNode";
import { LangGraphCanvasMemoryNode } from "./LangGraphCanvasMemoryNode";

import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_PORT,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MEMORY,
} from "../constants";

export const langGraphCanvasNodeTypes = {
  [LANGGRAPH_CANVAS_NODE_STEP]: LangGraphCanvasStepNode,
  [LANGGRAPH_CANVAS_NODE_START]: LangGraphCanvasStartNode,
  [LANGGRAPH_CANVAS_NODE_PORT]: LangGraphCanvasPortNode,
  [LANGGRAPH_CANVAS_NODE_STATE_GLOBAL]: LangGraphCanvasStateNode,
  [LANGGRAPH_CANVAS_NODE_LLM]: LangGraphCanvasLLMNode,
  [LANGGRAPH_CANVAS_NODE_TOOL]: LangGraphCanvasToolNode,
  [LANGGRAPH_CANVAS_NODE_MIDDLEWARE]: LangGraphCanvasMiddlewareNode,
  [LANGGRAPH_CANVAS_NODE_AGENT]: LangGraphCanvasAgentNode,
  [LANGGRAPH_CANVAS_NODE_MEMORY]: LangGraphCanvasMemoryNode,
};

export {
  LangGraphCanvasStateNode,
  LangGraphCanvasStepNode,
  LangGraphCanvasStartNode,
  LangGraphCanvasPortNode,
  LangGraphCanvasLLMNode,
  LangGraphCanvasToolNode,
  LangGraphCanvasMiddlewareNode,
  LangGraphCanvasAgentNode,
  LangGraphCanvasMemoryNode,
};


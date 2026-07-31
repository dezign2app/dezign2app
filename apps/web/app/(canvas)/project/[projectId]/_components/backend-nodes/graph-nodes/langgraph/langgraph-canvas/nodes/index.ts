import { LangGraphCanvasStateNode } from "./LangGraphCanvasStateNode";
import { LangGraphCanvasStartNode } from "./LangGraphCanvasStartNode";
import { LangGraphCanvasEndNode } from "./LangGraphCanvasEndNode";
import { LangGraphCanvasPortNode } from "./LangGraphCanvasPortNode";
import { LangGraphCanvasLLMNode } from "./LangGraphCanvasLLMNode";
import { LangGraphCanvasToolNode } from "./LangGraphCanvasToolNode";
import { LangGraphCanvasMiddlewareNode } from "./LangGraphCanvasMiddlewareNode";
import { LangGraphCanvasNode } from "./LangGraphCanvasNode";
import { LangGraphCanvasStepNode } from "./LangGraphCanvasStepNode";
import { LangGraphCanvasRouterNode } from "./LangGraphCanvasRouterNode";
import { LangGraphCanvasMemoryNode } from "./LangGraphCanvasMemoryNode";
import { LangGraphCanvasOutputNode } from "./LangGraphCanvasOutputNode";

import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_END,
  LANGGRAPH_CANVAS_NODE_PORT,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_OUTPUT,
} from "../constants";

export const langGraphCanvasNodeTypes = {
  [LANGGRAPH_CANVAS_NODE_STEP]: LangGraphCanvasStepNode,
  [LANGGRAPH_CANVAS_NODE_START]: LangGraphCanvasStartNode,
  [LANGGRAPH_CANVAS_NODE_END]: LangGraphCanvasEndNode,
  [LANGGRAPH_CANVAS_NODE_PORT]: LangGraphCanvasPortNode,
  [LANGGRAPH_CANVAS_NODE_STATE_GLOBAL]: LangGraphCanvasStateNode,
  [LANGGRAPH_CANVAS_NODE_LLM]: LangGraphCanvasLLMNode,
  [LANGGRAPH_CANVAS_NODE_TOOL]: LangGraphCanvasToolNode,
  [LANGGRAPH_CANVAS_NODE_MIDDLEWARE]: LangGraphCanvasMiddlewareNode,
  [LANGGRAPH_CANVAS_NODE_NODE]: LangGraphCanvasNode,
  [LANGGRAPH_CANVAS_NODE_AGENT]: LangGraphCanvasNode,
  [LANGGRAPH_CANVAS_NODE_MEMORY]: LangGraphCanvasMemoryNode,
  [LANGGRAPH_CANVAS_NODE_OUTPUT]: LangGraphCanvasOutputNode,
};

export {
  LangGraphCanvasStateNode,
  LangGraphCanvasStartNode,
  LangGraphCanvasEndNode,
  LangGraphCanvasPortNode,
  LangGraphCanvasLLMNode,
  LangGraphCanvasToolNode,
  LangGraphCanvasMiddlewareNode,
  LangGraphCanvasNode,
  LangGraphCanvasStepNode,
  LangGraphCanvasRouterNode,
  LangGraphCanvasMemoryNode,
  LangGraphCanvasOutputNode,
};

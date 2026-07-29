import React from "react";
import { LangGraphStudioView } from "./LangGraphStudioView";

/**
 * @deprecated LangGraph Studio has been refactored from a Modal dialog into a dedicated page sub-route:
 * /project/[projectId]/langgraph/[nodeId]
 */
export function LangGraphCanvasModal() {
  return null;
}
export { LangGraphStudioView };

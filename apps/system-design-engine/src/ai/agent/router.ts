import { AIMessage } from "@langchain/core/messages";
import { GraphAnnotation, DEFAULT_REQUIREMENTS, DEFAULT_PLAN } from "../state";

export const routeAfterIntent = (state: typeof GraphAnnotation.State) => {
  const req = state.requirements ?? DEFAULT_REQUIREMENTS;
  if (req.status !== "confirmed") {
    return state.readyForRequirementsSync
      ? "syncRequirements"
      : "requirementsAgent";
  }

  const plan = state.implementationPlan ?? DEFAULT_PLAN;
  const isBuildingPhase =
    plan.status === "approved" ||
    plan.status === "schema_built" ||
    plan.status === "schema_approved" ||
    plan.status === "nodes_built" ||
    plan.status === "nodes_approved" ||
    plan.status === "edges_built";

  if (!isBuildingPhase) {
    if (plan.status === "proposed" && state.planDecision === "approve") {
      return "approvePlan";
    }
    if (state.intent === "CHAT" && state.planDecision === "not_applicable") {
      return "chatAgent";
    }
    return "planAgent";
  }

  if (plan.status === "schema_built") {
    if (state.planDecision === "approve") {
      return "approveSchema";
    }
    if (state.intent === "CHAT" && state.planDecision === "not_applicable") {
      return "chatAgent";
    }
    return "canvasAgent";
  }

  if (plan.status === "nodes_built") {
    if (state.planDecision === "approve") {
      return "approveNodes";
    }
    if (state.intent === "CHAT" && state.planDecision === "not_applicable") {
      return "chatAgent";
    }
    return "canvasAgent";
  }

  if (plan.status === "edges_built") {
    if (state.intent !== "CREATE_SYSTEM" && state.intent !== "EDIT_SYSTEM") {
      return "chatAgent";
    }
    return "canvasAgent";
  }

  if (state.intent !== "CREATE_SYSTEM" && state.intent !== "EDIT_SYSTEM") {
    return "chatAgent";
  }

  return "canvasAgent";
};

export const shouldContinue = (state: typeof GraphAnnotation.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const hasToolCalls =
    lastMessage &&
    "tool_calls" in lastMessage &&
    Array.isArray((lastMessage as AIMessage).tool_calls) &&
    (lastMessage as AIMessage).tool_calls!.length > 0;
  return hasToolCalls ? "tools" : "__end__";
};

export const afterTools = (state: typeof GraphAnnotation.State) => {
  return "reflectAgent";
};

export const shouldContinueReflect = (
  state: typeof GraphAnnotation.State,
) => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (
    lastMessage &&
    "tool_calls" in lastMessage &&
    Array.isArray((lastMessage as AIMessage).tool_calls) &&
    (lastMessage as AIMessage).tool_calls!.length > 0
  ) {
    return "tools";
  }
  return "__end__";
};

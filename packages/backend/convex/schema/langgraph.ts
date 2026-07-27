import { defineTable } from "convex/server";
import { v } from "convex/values";

export const langgraphTables = {
  // 1. Granular LangGraph Pipeline Steps
  canvas_backend_langgraph_steps: defineTable({
    projectId: v.id("projects"),
    nodeId: v.string(), // Parent LangGraph Canvas Node ID
    stepId: v.string(), // Step ID e.g. "classify", "agent_llm"
    name: v.string(),
    type: v.string(), // "llm_call" | "tool_node" | "human_gate" | "interrupt" | "vector_search" | etc.
    modelConfig: v.optional(v.any()),
    humanGateConfig: v.optional(v.any()),
    interruptConfig: v.optional(v.any()),
    vectorSearchConfig: v.optional(v.any()),
    customCode: v.optional(v.any()),
    tools: v.optional(v.array(v.string())),
    retryPolicy: v.optional(v.any()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_node", ["projectId", "nodeId"])
    .index("by_node_step", ["nodeId", "stepId"]),

  // 2. LangGraph Graph Topology Edges & Routers
  canvas_backend_langgraph_edges: defineTable({
    projectId: v.id("projects"),
    nodeId: v.string(), // Parent LangGraph Canvas Node ID
    edgeId: v.string(),
    source: v.string(), // Step ID or "START"
    targets: v.array(v.object({ id: v.string(), kind: v.string() })),
    condition: v.optional(v.any()),
    isDefault: v.optional(v.boolean()),
    sendConfig: v.optional(v.any()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_node", ["projectId", "nodeId"])
    .index("by_node_edge", ["nodeId", "edgeId"]),

  // 3. Thread Execution Checkpoints (Hydration/Dehydration)
  langgraph_checkpoints: defineTable({
    projectId: v.optional(v.id("projects")),
    threadId: v.string(), // Session/User Thread ID
    checkpointId: v.string(),
    status: v.string(), // "RUNNING" | "INTERRUPTED" | "COMPLETED" | "FAILED" | "TIMED_OUT"
    stateSnapshot: v.any(), // Hydrated state (messages, summary, channels)
    waitingPortId: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_status", ["status"]),

  // 4. Single-Use Cryptographic Resume Tokens
  langgraph_resume_tokens: defineTable({
    threadId: v.string(),
    resumeToken: v.string(), // 256-bit CSPRNG token string
    waitingPortId: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["resumeToken"])
    .index("by_thread", ["threadId"]),
};

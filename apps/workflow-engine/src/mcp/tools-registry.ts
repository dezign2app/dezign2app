import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConvexClient } from "@/ai-agent/convex-client";
import { api } from "@workspace/backend/_generated/api";

export async function registerTools(
  server: McpServer,
  userId?: string,
  token?: string,
): Promise<void> {
  server.registerTool(
    "create_task",
    {
      title: "Create Task",
      description: "Creates a new task on the Kanban board",
      inputSchema: {
        title: z.string().describe("The title of the task"),
        description: z.string().optional().describe("A brief description of the task"),
        status: z.enum(["todo", "in-progress", "done"]).default("todo").describe("Initial status"),
      },
    },
    async ({ title, description, status }) => {
      const client = getConvexClient(token);
      await client.mutation(api.kanban.createTask, { 
        title, 
        description, 
        status,
        userId,
      });
      return { 
        content: [{ type: "text", text: `✅ Task "${title}" created successfully.` }] 
      };
    }
  );

  server.registerTool(
    "delete_task",
    {
      title: "Delete Task",
      description: "Deletes a task from the Kanban board by ID",
      inputSchema: {
        taskId: z.string().describe("The ID of the task to delete"),
      },
    },
    async ({ taskId }) => {
      const client = getConvexClient(token);
      await client.mutation(api.kanban.deleteTask, { 
        id: taskId as any 
      });
      return { 
        content: [{ type: "text", text: `✅ Task deleted successfully.` }] 
      };
    }
  );

  server.registerTool(
    "move_task",
    {
      title: "Move Task",
      description: "Moves a task to a different status column on the Kanban board",
      inputSchema: {
        taskId: z.string().describe("The ID of the task to move"),
        status: z.enum(["todo", "in-progress", "done"]).describe("New status"),
        position: z.number().optional().describe("New position (fractional index)"),
      },
    },
    async ({ taskId, status, position }) => {
      const client = getConvexClient(token);
      await client.mutation(api.kanban.moveTask, { 
        id: taskId as any, 
        status, 
        position: position ?? 1024 
      });
      return { 
        content: [{ type: "text", text: `✅ Task moved to ${status} successfully.` }] 
      };
    }
  );
}

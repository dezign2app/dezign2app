import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { createGraph, systemPromptTemplate } from './ai/agent.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const app = new Hono();

app.get('/', (c) => {
  return c.text('System Design Engine is running!');
});

app.post('/canvas-ai', async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, messages, canvasStateContext } = body;

    if (!messages) {
      return c.text("Missing required fields", 400);
    }

    const agent = createGraph();
    
    // Prepare initial state
    const formattedMessages = [
      new SystemMessage(systemPromptTemplate(canvasStateContext || "Canvas is empty.")),
      ...messages.map((m: any) => m.role === 'user' ? new HumanMessage(m.content) : new HumanMessage(m.content)) // Simplified
    ];

    const graphStream = await agent.streamEvents(
      { messages: formattedMessages },
      { version: 'v2' }
    );

    c.header('Content-Type', 'application/x-ndjson');
    c.header('Cache-Control', 'no-cache');

    return stream(c, async (streamWriter: any) => {
      for await (const event of graphStream) {
        if (event.event === 'on_chat_model_stream') {
          const chunk = event.data.chunk;
          if (chunk.content) {
            await streamWriter.write(JSON.stringify({ type: 'text', content: chunk.content }) + '\n');
          }
          if (chunk.tool_calls && chunk.tool_calls.length > 0) {
             for (const call of chunk.tool_calls) {
               // Translate LangChain tool call to CanvasOperation
               let op = null;
               const args = call.args;
               const name = call.name;
               
               if (name === "add_node") {
                 op = { op: "add_node", type: args.type, label: args.label, data: args.data };
               } else if (name === "update_node") {
                 op = { op: "update_node", id: args.id, changes: args.changes };
               } else if (name === "delete_node") {
                 op = { op: "delete_node", id: args.id };
               } else if (name === "add_edge") {
                 op = { op: "add_edge", source: args.source, target: args.target, type: args.type, data: args.data };
               } else if (name === "run_auto_layout") {
                 op = { op: "run_auto_layout" };
               }

               if (op) {
                 await streamWriter.write(JSON.stringify({ type: 'tool_call', op, name }) + '\n');
               }
             }
          }
        }
      }
    });

  } catch (error) {
    console.error("API error:", error);
    return c.text("Internal Server Error", 500);
  }
});

const port = 3002;
console.log(`System Design Engine is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

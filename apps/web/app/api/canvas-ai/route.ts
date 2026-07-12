import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, messages, canvasStateContext } = body;

    if (!projectId || !messages) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Proxy the request to the system-design-engine
    const response = await fetch("http://localhost:3002/canvas-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        messages,
        canvasStateContext,
      }),
    });

    if (!response.ok) {
      console.error("System Design Engine error:", await response.text());
      return new Response("Error from backend AI service", { status: response.status });
    }

    // We can just stream the response body directly back to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

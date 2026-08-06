import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { generateSyncedEndpointCode } from "@/app/(canvas)/project/[projectId]/_components/shared/business-logic-block/generator";

async function generateCodeWithGroq(body: any): Promise<string | null> {
  const apiKeyStr = process.env.GROQ_API_KEY;
  if (!apiKeyStr || apiKeyStr === "dummy_key") {
    return null;
  }

  const apiKeys = apiKeyStr
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (apiKeys.length === 0) return null;

  const model = process.env.GROQ_LLM_MODEL || "openai/gpt-oss-120b";
  const fallbackModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

  const method = (body.endpointMethod || "POST").toUpperCase();
  const path = body.endpointPath || "/";
  const promptText = body.prompt || "";
  const crudList = body.crudConfig || [];
  const publishedEvents = body.publishedEvents || [];
  const tableNodes = body.availableTableNodes || [];

  const tableNames = crudList.map((c: any) => {
    const tableObj = tableNodes.find((t: any) => t.id === c.tableNodeId);
    return tableObj?.label || c.tableName || c.tableNodeId || "Table";
  });

  const eventNames = publishedEvents.map((e: any) => e.name || e.topic || "EVENT");

  let requestBodySchemaStr = "None specified";
  if (body.requestBody) {
    if (Array.isArray(body.requestBody.fields) && body.requestBody.fields.length > 0) {
      const fDefs = body.requestBody.fields
        .filter((f: any) => f && f.name)
        .map((f: any) => `${f.name}${f.required === false ? "?" : ""}: ${f.type || "string"}`);
      if (fDefs.length > 0) {
        requestBodySchemaStr = `{ ${fDefs.join(", ")} }`;
      }
    } else if (typeof body.requestBody.rawJson === "string" && body.requestBody.rawJson.trim()) {
      requestBodySchemaStr = body.requestBody.rawJson.trim();
    }
  }

  const systemPrompt = `You are an expert full-stack TypeScript engineer writing Express.js route handler code for high-performance microservices.

Your objective is to generate ONLY the inner body lines of an Express async handler for ${method} ${path}.

Context & Requirements:
1. Endpoint Method: ${method}
2. Endpoint Path: ${path}
3. Natural Language Business Specification / Directives:
${promptText ? promptText : "(No specific custom directives supplied; implement standard REST logic)"}

4. Configured Request Body Schema:
${requestBodySchemaStr}

5. Database Tables & Operations Available (@workspace/db helpers):
${tableNames.length > 0 ? tableNames.map((t: string, idx: number) => `- Table "${t}": operations [${crudList[idx]?.operations?.join(", ") || "read"}]`).join("\n") : "None"}
- DB helper functions are available as:
  - create<Table>(body)
  - find<Table>ById(req.params.id) / findAll<Table>()
  - update<Table>(req.params.id, body)
  - delete<Table>ById(req.params.id)

6. Kafka Events to Publish (@workspace/kafka/publishers):
${eventNames.length > 0 ? eventNames.map((e: string) => `- Topic: ${e}`).join("\n") : "None"}
- Publish function call format:
  await publishKafkaEvent(KAFKA_TOPICS.<TOPIC_KEY>, { action: "${method.toLowerCase()}", path: "${path}", payload: body });

Strict Rules for Output:
- Output ONLY valid TypeScript code lines that can be directly pasted into an Express handler.
- Do NOT include outer function definitions, imports, or markdown code blocks (\`\`\`ts or \`\`\`).
- Note: \`body\` (validated request payload) is ALREADY defined in handler scope before this block. Do NOT write \`if (!req.body)\` or redefine \`const body = ...\`.
- Check required business logic properties directly on \`body\` (e.g. \`if (!body.name) { return res.status(400).json({ error: "Name is required" }); }\`).
- Pass \`body\` to DB operations (e.g. \`const createdProduct = await createProducts(body);\`).
- Pass \`body\` to Kafka event publishing.
- Return an HTTP response with res.status(statusCode).json({ ... }).
- Use clean, modern TypeScript syntax. Do not output prose or comments explaining the rules.`;

  for (const apiKey of apiKeys) {
    for (const m of [model, ...fallbackModels.filter((fm) => fm !== model)]) {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate the business logic code snippet for ${method} ${path}.` },
          ],
          model: m,
          temperature: 0.1,
          max_tokens: 1500,
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const cleaned = content
            .replace(/^```(typescript|ts)?/gi, "")
            .replace(/```$/g, "")
            .trim();
          if (cleaned) return cleaned;
        }
      } catch (err) {
        console.warn(`Groq direct code generation failed with key on model ${m}:`, err);
      }
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const systemDesignEngineUrl =
      process.env.NEXT_PUBLIC_SYSTEM_DESIGN_ENGINE_URL ||
      process.env.SYSTEM_DESIGN_ENGINE_URL;

    if (systemDesignEngineUrl) {
      try {
        const response = await fetch(`${systemDesignEngineUrl}/generate-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.code) {
            return NextResponse.json(data);
          }
        }
      } catch (err) {
        console.warn("System design engine backend fetch failed, falling back to direct Groq/synced generator:", err);
      }
    }

    // Attempt direct Groq generation in Next.js route
    const aiCode = await generateCodeWithGroq(body);
    if (aiCode) {
      return NextResponse.json({ code: aiCode });
    }

    // Fallback to deterministic code generator
    const fallbackCode = generateSyncedEndpointCode(body);
    return NextResponse.json({ code: fallbackCode });
  } catch (error: any) {
    console.error("API generate-code unexpected error:", error);
    // Fallback to deterministic generator even on total payload parse failure or unexpected error
    try {
      const fallbackCode = generateSyncedEndpointCode({});
      return NextResponse.json({ code: fallbackCode });
    } catch {
      return NextResponse.json(
        { error: error?.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
}


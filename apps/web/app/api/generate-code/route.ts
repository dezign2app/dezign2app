import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { generateSyncedEndpointCode } from "@/app/(canvas)/project/[projectId]/_components/shared/business-logic-block/generator";

async function generateCodeWithGroq(body: any): Promise<string | null> {
  const apiKeyStr = process.env.GROQ_API_KEY;
  if (!apiKeyStr || apiKeyStr === "dummy_key") {
    console.warn("[GENERATE_CODE_API] GROQ_API_KEY is missing or set to dummy_key in environment.");
    return null;
  }

  const apiKeys = apiKeyStr
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (apiKeys.length === 0) {
    console.warn("[GENERATE_CODE_API] GROQ_API_KEY provided no valid non-empty keys.");
    return null;
  }

  const model = process.env.GROQ_LLM_MODEL || "openai/gpt-oss-120b";
  const fallbackModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

  const method = (body.endpointMethod || "POST").toUpperCase();
  const path = body.endpointPath || "/";
  const promptText = body.prompt || "";
  const crudList = body.crudConfig || [];
  const publishedEvents = body.publishedEvents || [];
  const tableNodes = body.availableTableNodes || [];

  console.log(`[GENERATE_CODE_API] Starting direct Groq generation with ${apiKeys.length} key(s). Target method=${method}, path=${path}, model=${model}`);

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

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const apiKey = apiKeys[keyIdx];
    if (!apiKey) continue;
    const maskedKey = `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
    for (const m of [model, ...fallbackModels.filter((fm) => fm !== model)]) {
      try {
        console.log(`[GENERATE_CODE_API] Invoking Groq SDK with key index ${keyIdx} (${maskedKey}) on model=${m}`);
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
          if (cleaned) {
            console.log(`[GENERATE_CODE_API] Successfully generated code via Groq model=${m} (length=${cleaned.length} chars)`);
            return cleaned;
          }
        }
      } catch (err: any) {
        console.warn(`[GENERATE_CODE_API] Groq attempt failed with key index ${keyIdx} (${maskedKey}) on model=${m}: ${err?.message || err}`);
      }
    }
  }

  console.warn("[GENERATE_CODE_API] All Groq API key/model combinations exhausted without returning code.");
  return null;
}

export async function POST(req: NextRequest) {
  console.log(`[GENERATE_CODE_API] Incoming POST request to /api/generate-code`);
  try {
    const body = await req.json();
    console.log(`[GENERATE_CODE_API] Request payload parsed. method=${body.endpointMethod || "POST"}, path=${body.endpointPath || "/"}, promptLength=${body.prompt?.length || 0}`);

    const systemDesignEngineUrl =
      process.env.NEXT_PUBLIC_SYSTEM_DESIGN_ENGINE_URL ||
      process.env.SYSTEM_DESIGN_ENGINE_URL;

    if (systemDesignEngineUrl) {
      console.log(`[GENERATE_CODE_API] Attempting backend engine fetch at: ${systemDesignEngineUrl}/generate-code`);
      try {
        const response = await fetch(`${systemDesignEngineUrl}/generate-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });

        console.log(`[GENERATE_CODE_API] Engine response status: ${response.status} ${response.statusText}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.code) {
            console.log(`[GENERATE_CODE_API] Successfully received code from engine (length=${data.code.length} chars)`);
            return NextResponse.json(data);
          } else {
            console.warn(`[GENERATE_CODE_API] Engine responded 200 but missing data.code payload.`);
          }
        } else {
          const errText = await response.text();
          console.warn(`[GENERATE_CODE_API] Engine responded error ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        console.warn(`[GENERATE_CODE_API] Backend engine fetch failed/timed out: ${err?.message || err}`);
      }
    } else {
      console.log(`[GENERATE_CODE_API] No system design engine URL configured in env.`);
    }

    // Attempt direct Groq generation in Next.js route
    console.log(`[GENERATE_CODE_API] Attempting direct Groq generation in Next.js route handler...`);
    const aiCode = await generateCodeWithGroq(body);
    if (aiCode) {
      return NextResponse.json({ code: aiCode, source: "groq" });
    }

    // Fallback to deterministic code generator
    console.log(`[GENERATE_CODE_API] Falling back to deterministic code generator...`);
    const fallbackCode = generateSyncedEndpointCode(body);
    console.log(`[GENERATE_CODE_API] Deterministic code generated (length=${fallbackCode.length} chars)`);
    return NextResponse.json({ code: fallbackCode, source: "fallback" });
  } catch (error: any) {
    console.error("[GENERATE_CODE_API] Unexpected error in /api/generate-code handler:", error);
    try {
      const fallbackCode = generateSyncedEndpointCode({});
      console.log(`[GENERATE_CODE_API] Emergency deterministic fallback executed after error.`);
      return NextResponse.json({ code: fallbackCode, source: "emergency-fallback" });
    } catch (emergencyErr) {
      console.error("[GENERATE_CODE_API] Emergency fallback also failed:", emergencyErr);
      return NextResponse.json(
        { error: error?.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
}


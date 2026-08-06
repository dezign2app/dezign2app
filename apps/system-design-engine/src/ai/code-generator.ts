import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export interface GenerateCodeParams {
  prompt?: string;
  crudConfig?: Array<{
    tableNodeId?: string;
    tableName?: string;
    operations?: string[];
  }>;
  availableTableNodes?: Array<{ id: string; label: string }>;
  publishedEvents?: Array<{ name?: string; topic?: string }>;
  endpointMethod?: string;
  endpointPath?: string;
  serviceName?: string;
  requestBody?: {
    fields?: Array<{ name: string; type?: string; required?: boolean }>;
    rawJson?: string;
  };
}

export async function generateBusinessLogicCode(params: GenerateCodeParams): Promise<string> {
  const apiKeyStr = process.env.GROQ_API_KEY;
  const initialModel = process.env.GROQ_LLM_MODEL || "openai/gpt-oss-120b";

  const apiKeys = apiKeyStr
    ? apiKeyStr
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0)
    : [];

  const modelsToTry = [initialModel, "openai/gpt-oss-120b", "openai/gpt-oss-20b"].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );

  const method = (params.endpointMethod || "POST").toUpperCase();
  const path = params.endpointPath || "/";
  const promptText = params.prompt || "";
  const crudList = params.crudConfig || [];
  const publishedEvents = params.publishedEvents || [];
  const tableNodes = params.availableTableNodes || [];

  const tableNames = crudList.map((c) => {
    const tableObj = tableNodes.find((t) => t.id === c.tableNodeId);
    return tableObj?.label || c.tableName || c.tableNodeId || "Table";
  });

  const eventNames = publishedEvents.map((e) => e.name || e.topic || "EVENT");

  let requestBodySchemaStr = "None specified";
  if (params.requestBody) {
    if (Array.isArray(params.requestBody.fields) && params.requestBody.fields.length > 0) {
      const fDefs = params.requestBody.fields
        .filter((f: any) => f && f.name)
        .map((f: any) => `${f.name}${f.required === false ? "?" : ""}: ${f.type || "string"}`);
      if (fDefs.length > 0) {
        requestBodySchemaStr = `{ ${fDefs.join(", ")} }`;
      }
    } else if (typeof params.requestBody.rawJson === "string" && params.requestBody.rawJson.trim()) {
      requestBodySchemaStr = params.requestBody.rawJson.trim();
    }
  }

  const systemPrompt = new SystemMessage(
    `You are an expert full-stack TypeScript engineer writing Express.js route handler code for high-performance microservices.

Your objective is to generate ONLY the inner body lines of an Express async handler for ${method} ${path}.

Context & Requirements:
1. Endpoint Method: ${method}
2. Endpoint Path: ${path}
3. Natural Language Business Specification / Directives:
${promptText ? promptText : "(No specific custom directives supplied; implement standard REST logic)"}

4. Configured Request Body Schema:
${requestBodySchemaStr}

5. Database Tables & Operations Available (@workspace/db helpers):
${tableNames.length > 0 ? tableNames.map((t, idx) => `- Table "${t}": operations [${crudList[idx]?.operations?.join(", ") || "read"}]`).join("\n") : "None"}
- DB helper functions are available as:
  - create<Table>(body)
  - find<Table>ById(req.params.id) / findAll<Table>()
  - update<Table>(req.params.id, body)
  - delete<Table>ById(req.params.id)

6. Kafka Events to Publish (@workspace/kafka/publishers):
${eventNames.length > 0 ? eventNames.map((e) => `- Topic: ${e}`).join("\n") : "None"}
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
- Use clean, modern TypeScript syntax. Do not output prose or comments explaining the rules.`,
  );

  const humanPrompt = new HumanMessage(
    `Generate the business logic code snippet for ${method} ${path}.`,
  );

  for (const apiKey of apiKeys) {
    for (const model of modelsToTry) {
      try {
        const llm = new ChatGroq({ apiKey, model, temperature: 0.1, maxTokens: 1500 });
        const response = await llm.invoke([systemPrompt, humanPrompt]);
        const content = response.content.toString();

        const cleaned = content
          .replace(/^```(typescript|ts)?/gi, "")
          .replace(/```$/g, "")
          .trim();

        if (cleaned) {
          return cleaned;
        }
      } catch (err) {
        console.warn(`System design engine Groq attempt failed for model ${model}:`, err);
      }
    }
  }

  // Fallback string if all AI calls fail
  return `// Default fallback logic for ${method} ${path}\nreturn res.status(200).json({ success: true, message: "Successfully executed ${method} ${path}" });`;
}

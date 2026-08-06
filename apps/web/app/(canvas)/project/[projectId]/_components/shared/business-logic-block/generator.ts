import { TableCrudConfig, PublishedEventInfo } from "./types";
import { toVarName, toPascalCase, toTopicKey } from "./utils";

export interface GenerateEndpointCodeParams {
  prompt?: string;
  crudConfig?: TableCrudConfig[];
  availableTableNodes?: { id: string; label: string }[];
  publishedEvents?: PublishedEventInfo[];
  endpointMethod?: string;
  endpointPath?: string;
  requestBody?: {
    fields?: Array<{ name: string; type?: string; required?: boolean }>;
    rawJson?: string;
  };
}

export function generateSyncedEndpointCode({
  prompt,
  crudConfig = [],
  availableTableNodes = [],
  publishedEvents = [],
  endpointMethod = "POST",
  endpointPath = "/",
  requestBody,
}: GenerateEndpointCodeParams): string {
  const lines: string[] = [];

  if (prompt && prompt.trim()) {
    lines.push("// --- Business Logic Specification ---");
    prompt
      .trim()
      .split("\n")
      .forEach((line, idx) => {
        if (line.trim()) lines.push(`// STEP ${idx + 1}: ${line.trim()}`);
      });
    lines.push("");
  }

  // Input field validation from requestBody fields
  const bodyFields = requestBody?.fields || [];
  const requiredFields = bodyFields.filter((f) => f && f.name && f.required !== false);
  if (requiredFields.length > 0) {
    lines.push("// --- Request Payload Validation ---");
    requiredFields.forEach((field) => {
      const fieldName = field.name.trim();
      const typeStr = field.type || "string";
      if (typeStr === "string") {
        lines.push(`if (!body?.${fieldName} || typeof body.${fieldName} !== "string" || !body.${fieldName}.trim()) {`);
        lines.push(`  return res.status(400).json({ error: "${fieldName} is required and must be a non-empty string" });`);
        lines.push(`}`);
      } else {
        lines.push(`if (body?.${fieldName} === undefined || body.${fieldName} === null) {`);
        lines.push(`  return res.status(400).json({ error: "${fieldName} is required" });`);
        lines.push(`}`);
      }
    });
    lines.push("");
  }

  const activeDbConfigs = crudConfig.filter(
    (c) => c.tableNodeId && c.operations && c.operations.length > 0,
  );

  let primaryResultVar = "result";

  if (activeDbConfigs.length > 0) {
    lines.push("// --- Database Operations (via @workspace/db prepared statement) ---");
    activeDbConfigs.forEach((configItem) => {
      const tableObj = availableTableNodes.find(
        (t) => t.id === configItem.tableNodeId,
      );
      const rawLabel = tableObj?.label || "table";
      const tableName = rawLabel.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const Pascal = toPascalCase(tableName);
      const isIdRoute =
        endpointPath.includes(":id") || endpointPath.includes("{id}");

      configItem.operations.forEach((op) => {
        if (op === "create") {
          const varName = `created${Pascal}`;
          lines.push(`const ${varName} = await create${Pascal}(body);`);
          primaryResultVar = varName;
        } else if (op === "read") {
          if (isIdRoute) {
            const varName = `${toVarName(tableName)}`;
            lines.push(`const ${varName} = await find${Pascal}ById(req.params.id);`);
            lines.push(`if (!${varName}) {\n  return res.status(404).json({ error: "${Pascal} not found" });\n}`);
            primaryResultVar = varName;
          } else {
            const varName = `${toVarName(tableName)}List`;
            lines.push(`const ${varName} = await findAll${Pascal}();`);
            primaryResultVar = varName;
          }
        } else if (op === "update") {
          const varName = `updated${Pascal}`;
          lines.push(`const ${varName} = await update${Pascal}(req.params.id, body);`);
          primaryResultVar = varName;
        } else if (op === "delete") {
          const varName = `delete${Pascal}Result`;
          lines.push(`const ${varName} = await delete${Pascal}ById(req.params.id);`);
          primaryResultVar = varName;
        }
      });
    });
    lines.push("");
  }

  if (publishedEvents && publishedEvents.length > 0) {
    lines.push("// --- Kafka Event Publishing ---");
    publishedEvents.forEach((ev) => {
      const eventName = ev.name || ev.topic || "EVENT";
      const topicKey = toTopicKey(eventName);
      lines.push(
        `await publishKafkaEvent(KAFKA_TOPICS.${topicKey}, {\n  action: "${endpointMethod.toLowerCase()}",\n  path: "${endpointPath}",\n  payload: body,\n});`
      );
    });
    lines.push("");
  }

  const methodUpper = (endpointMethod || "POST").toUpperCase();
  const statusCode = methodUpper === "POST" ? 201 : 200;
  lines.push("// --- Response ---");
  if (activeDbConfigs.length > 0) {
    lines.push(`return res.status(${statusCode}).json({ success: true, data: ${primaryResultVar} });`);
  } else {
    lines.push(
      `return res.status(${statusCode}).json({\n  success: true,\n  message: "Successfully executed ${methodUpper} ${endpointPath}"\n});`
    );
  }

  return lines.join("\n");
}

export async function generateCodeWithAI(params: GenerateEndpointCodeParams): Promise<string> {
  try {
    const res = await fetch("/api/generate-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.code && typeof data.code === "string" && data.code.trim()) {
        return data.code.trim();
      }
    }
  } catch (err) {
    console.warn("AI code generation request failed, falling back to schema generator:", err);
  }

  // Fallback to deterministic code generator
  return generateSyncedEndpointCode(params);
}

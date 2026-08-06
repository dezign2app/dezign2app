import { Endpoint } from "@workspace/canvas/types";

/**
 * Converts a TypeScript/JSON field type string to a proto3 scalar type.
 */
function toProtoType(type?: string): string {
  if (!type) return "string";
  const t = type.toLowerCase();
  if (t === "number" || t === "int" || t === "integer") return "int32";
  if (t === "float" || t === "double" || t === "decimal") return "double";
  if (t === "boolean" || t === "bool") return "bool";
  if (t === "array" || t === "string[]") return "repeated string";
  if (t === "number[]" || t === "int[]") return "repeated int32";
  return "string";
}

/**
 * Converts a type string to a clean TypeScript type string without any/unknown.
 */
export function toTsType(type?: string): string {
  if (!type) return "string";
  const t = type.toLowerCase();
  if (t === "number" || t === "int" || t === "integer" || t === "float" || t === "double" || t === "decimal") {
    return "number";
  }
  if (t === "boolean" || t === "bool") return "boolean";
  if (t === "string[]" || t === "array<string>") return "string[]";
  if (t === "number[]" || t === "array<number>") return "number[]";
  if (t === "boolean[]" || t === "array<boolean>") return "boolean[]";
  return "string";
}

export interface ProtoField {
  name: string;
  type?: string;
}

/**
 * Generates a .proto message block from a list of fields.
 */
function generateMessageBlock(
  messageName: string,
  fields: ProtoField[],
): string {
  if (fields.length === 0) {
    return `message ${messageName} {\n  // No fields defined\n}\n`;
  }
  const fieldLines = fields.map((f, i) => {
    const protoType = toProtoType(f.type);
    const safeFieldName = f.name
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^([0-9])/, "_$1");
    return `  ${protoType} ${safeFieldName} = ${i + 1};`;
  });
  return `message ${messageName} {\n${fieldLines.join("\n")}\n}\n`;
}

/**
 * Safely extracts fields from a schemaModel object without any/unknown casts in caller code.
 */
function extractSchemaFields(schema: unknown): ProtoField[] {
  if (!schema || typeof schema !== "object") return [];
  const s = schema as Record<string, unknown>;
  if (Array.isArray(s.fields) && s.fields.length > 0) {
    return s.fields
      .filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object" && typeof f.name === "string")
      .map((f) => ({
        name: f.name as string,
        type: typeof f.type === "string" ? f.type : undefined,
      }));
  }
  return [];
}

export interface GenerateProtoFileParams {
  /** proto3 package name e.g. "payment_service" */
  packageName: string;
  /** PascalCase service name e.g. "PaymentService" */
  serviceName: string;
  /** PascalCase RPC method name e.g. "ProcessCharge" */
  rpcName: string;
  endpoint: Endpoint;
}

export interface GeneratedProtoFile {
  /** Filename relative to the service grpc dir e.g. "process_charge.proto" */
  filename: string;
  content: string;
  reqFields: ProtoField[];
  resFields: ProtoField[];
}

/**
 * Generates a single .proto file for one RPC endpoint with strictly typed fields.
 */
export function generateProtoFile(
  params: GenerateProtoFileParams,
): GeneratedProtoFile {
  const { packageName, serviceName, rpcName, endpoint } = params;

  // Request = path params + query params + body fields
  const pathParamFields: ProtoField[] = (endpoint.pathParams || []).map((p) => ({
    name: p.name,
    type: p.type,
  }));
  const queryParamFields: ProtoField[] = (endpoint.queryParams || []).map((q) => ({
    name: q.name,
    type: q.type,
  }));
  const reqBodyFields = extractSchemaFields(endpoint.requestBody);
  const allReqFields = [...pathParamFields, ...queryParamFields, ...reqBodyFields];

  const reqMessageName = `${rpcName}Request`;
  const resMessageName = `${rpcName}Response`;

  // Response fields — fallback to success/message pair if empty
  const resBodyFields = extractSchemaFields(endpoint.responseBody);
  const allResFields: ProtoField[] =
    resBodyFields.length > 0
      ? resBodyFields
      : [
          { name: "success", type: "boolean" },
          { name: "message", type: "string" },
        ];

  const reqBlock = generateMessageBlock(reqMessageName, allReqFields);
  const resBlock = generateMessageBlock(resMessageName, allResFields);

  // Convert PascalCase rpcName → snake_case for the filename
  const snakeRpcName = rpcName
    .replace(/([A-Z])/g, (m, _ch, offset: number) =>
      offset > 0 ? "_" + m.toLowerCase() : m.toLowerCase(),
    )
    .replace(/^_/, "");

  const content =
    `syntax = "proto3";\n\n` +
    `package ${packageName};\n\n` +
    `service ${serviceName} {\n` +
    `  rpc ${rpcName} (${reqMessageName}) returns (${resMessageName});\n` +
    `}\n\n` +
    reqBlock +
    "\n" +
    resBlock;

  return {
    filename: `${snakeRpcName}.proto`,
    content,
    reqFields: allReqFields,
    resFields: allResFields,
  };
}

import { parseSchemaJson } from "../utils";

export interface ParameterItem {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
}

export interface SchemaItem {
  rawJson?: string;
  fields?: ParameterItem[];
  id?: string;
}

function typeStrToTsAndZod(typeStr: string): { ts: string; zod: string } {
  const t = typeStr.trim().toLowerCase();
  if (
    t === "string" ||
    t === "text" ||
    t === "uuid" ||
    t === "email" ||
    t === "date" ||
    t === "datetime"
  ) {
    return { ts: "string", zod: "z.string()" };
  }
  if (
    t === "number" ||
    t === "int" ||
    t === "integer" ||
    t === "float" ||
    t === "double" ||
    t === "decimal" ||
    t === "real"
  ) {
    return { ts: "number", zod: "z.number()" };
  }
  if (t === "boolean" || t === "bool") {
    return { ts: "boolean", zod: "z.boolean()" };
  }
  if (t === "string[]" || t === "array<string>") {
    return { ts: "string[]", zod: "z.array(z.string())" };
  }
  if (
    t === "number[]" ||
    t === "array<number>" ||
    t === "int[]" ||
    t === "integer[]"
  ) {
    return { ts: "number[]", zod: "z.array(z.number())" };
  }
  if (t === "boolean[]" || t === "array<boolean>") {
    return { ts: "boolean[]", zod: "z.array(z.boolean())" };
  }
  if (t === "any" || t === "unknown") {
    return { ts: "unknown", zod: "z.unknown()" };
  }
  if (t === "object") {
    return { ts: "Record<string, unknown>", zod: "z.record(z.unknown())" };
  }
  if (t === "array") {
    return { ts: "unknown[]", zod: "z.array(z.unknown())" };
  }
  // Default to string fallback
  return { ts: "string", zod: "z.string()" };
}

function valToTsAndZod(val: unknown): { ts: string; zod: string } {
  if (val === null || val === undefined) {
    return { ts: "unknown", zod: "z.unknown()" };
  }
  if (typeof val === "string") {
    return typeStrToTsAndZod(val);
  }
  if (typeof val === "number") {
    return { ts: "number", zod: "z.number()" };
  }
  if (typeof val === "boolean") {
    return { ts: "boolean", zod: "z.boolean()" };
  }
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return { ts: "unknown[]", zod: "z.array(z.unknown())" };
    }
    const elem = valToTsAndZod(val[0]);
    return { ts: `${elem.ts}[]`, zod: `z.array(${elem.zod})` };
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return { ts: "Record<string, unknown>", zod: "z.record(z.unknown())" };
    }
    const tsFields: string[] = [];
    const zodFields: string[] = [];
    for (const key of keys) {
      const res = valToTsAndZod(obj[key]);
      const validKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        ? key
        : JSON.stringify(key);
      tsFields.push(`${validKey}: ${res.ts};`);
      zodFields.push(`${validKey}: ${res.zod}`);
    }
    return {
      ts: `{ ${tsFields.join(" ")} }`,
      zod: `z.object({\n  ${zodFields.join(",\n  ")}\n})`,
    };
  }
  return { ts: "unknown", zod: "z.unknown()" };
}

export function parametersToTsInterface(
  interfaceName: string,
  params?: ParameterItem[],
  defaultRequired = true,
): { code: string; hasContent: boolean } {
  if (!params || params.length === 0) {
    return {
      code: `export type ${interfaceName} = Record<string, string>;\n`,
      hasContent: false,
    };
  }

  const lines: string[] = [];
  for (const p of params) {
    if (!p.name) continue;
    const req = p.required ?? defaultRequired;
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p.name)
      ? p.name
      : JSON.stringify(p.name);
    const typeRes = typeStrToTsAndZod(p.type || "string");
    const optMark = req ? "" : "?";
    lines.push(`  ${key}${optMark}: ${typeRes.ts};`);
  }

  if (lines.length === 0) {
    return {
      code: `export type ${interfaceName} = Record<string, string>;\n`,
      hasContent: false,
    };
  }

  return {
    code: `export interface ${interfaceName} {\n${lines.join("\n")}\n}\n`,
    hasContent: true,
  };
}

export function parametersToZodSchema(
  schemaName: string,
  params?: ParameterItem[],
  defaultRequired = true,
): { code: string; hasContent: boolean } {
  if (!params || params.length === 0) {
    return {
      code: `export const ${schemaName} = z.record(z.string());\n`,
      hasContent: false,
    };
  }

  const lines: string[] = [];
  for (const p of params) {
    if (!p.name) continue;
    const req = p.required ?? defaultRequired;
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p.name)
      ? p.name
      : JSON.stringify(p.name);
    const typeRes = typeStrToTsAndZod(p.type || "string");
    const zodType = req ? typeRes.zod : `${typeRes.zod}.optional()`;
    lines.push(`  ${key}: ${zodType}`);
  }

  if (lines.length === 0) {
    return {
      code: `export const ${schemaName} = z.record(z.string());\n`,
      hasContent: false,
    };
  }

  return {
    code: `export const ${schemaName} = z.object({\n${lines.join(",\n")}\n});\n`,
    hasContent: true,
  };
}

export function schemaToTsInterface(
  interfaceName: string,
  schema?: SchemaItem,
): { code: string; hasContent: boolean } {
  if (!schema) {
    return {
      code: `export type ${interfaceName} = Record<string, unknown>;\n`,
      hasContent: false,
    };
  }

  const parsedJson = parseSchemaJson(schema.rawJson);
  if (parsedJson && typeof parsedJson === "object") {
    const res = valToTsAndZod(parsedJson);
    if (res.ts.startsWith("{")) {
      const bodyStr = res.ts.slice(1, -1).trim();
      const formattedLines = bodyStr
        .split(";")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `  ${l};`);
      return {
        code: `export interface ${interfaceName} {\n${formattedLines.join("\n")}\n}\n`,
        hasContent: true,
      };
    }
    return {
      code: `export type ${interfaceName} = ${res.ts};\n`,
      hasContent: true,
    };
  }

  if (schema.fields && schema.fields.length > 0) {
    return parametersToTsInterface(interfaceName, schema.fields, true);
  }

  return {
    code: `export type ${interfaceName} = Record<string, unknown>;\n`,
    hasContent: false,
  };
}

export function schemaToZodSchema(
  schemaName: string,
  schema?: SchemaItem,
): { code: string; hasContent: boolean } {
  if (!schema) {
    return {
      code: `export const ${schemaName} = z.record(z.unknown());\n`,
      hasContent: false,
    };
  }

  const parsedJson = parseSchemaJson(schema.rawJson);
  if (parsedJson && typeof parsedJson === "object") {
    const res = valToTsAndZod(parsedJson);
    return {
      code: `export const ${schemaName} = ${res.zod};\n`,
      hasContent: true,
    };
  }

  if (schema.fields && schema.fields.length > 0) {
    return parametersToZodSchema(schemaName, schema.fields, true);
  }

  return {
    code: `export const ${schemaName} = z.record(z.unknown());\n`,
    hasContent: false,
  };
}

import { JSONValue } from "@workspace/canvas/types";

export function parseSchemaJson(rawJson?: string): JSONValue {
  if (!rawJson || !rawJson.trim()) return null;
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

export function toVarName(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, "_");
  const camel = clean.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return "item";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

export function toPascalCase(str: string): string {
  const clean = str.replace(/[^a-zA-Z0-9_]/g, "_");
  const camel = clean.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return "Item";
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toTableName(str: string): string {
  return (str || "table").toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

export function mapToDrizzleSqliteType(type?: string): { drizzleType: string; mode?: string } {
  if (!type) return { drizzleType: "text" };
  const t = type.toLowerCase();
  if (t === "number" || t === "int" || t === "integer") return { drizzleType: "integer" };
  if (t === "float" || t === "double" || t === "decimal" || t === "real") return { drizzleType: "real" };
  if (t === "boolean" || t === "bool") return { drizzleType: "integer", mode: '{ mode: "boolean" }' };
  return { drizzleType: "text" };
}

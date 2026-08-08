import { JSONValue } from "@workspace/canvas/types";

export function parseSchemaJson(rawJson?: string): JSONValue {
  if (!rawJson || !rawJson.trim()) return null;
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

export function toSqlIdentifier(str: string, fallback = "item"): string {
  if (!str) return fallback;
  const clean = str
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[^a-zA-Z_]+/, "");
  return clean || fallback;
}

export function toVarName(str: string): string {
  const safe = toSqlIdentifier(str, "item");
  const hasLeadingUnderscore = safe.startsWith("_");
  const core = hasLeadingUnderscore ? safe.slice(1) : safe;
  const camel = core.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return hasLeadingUnderscore ? "_item" : "item";
  const result = camel.charAt(0).toLowerCase() + camel.slice(1);
  return hasLeadingUnderscore ? `_${result}` : result;
}

export function toPascalCase(str: string): string {
  const safe = toSqlIdentifier(str, "Item");
  const hasLeadingUnderscore = safe.startsWith("_");
  const core = hasLeadingUnderscore ? safe.slice(1) : safe;
  const camel = core.replace(/_([a-z0-9])/gi, (_, char) => char.toUpperCase());
  if (!camel) return hasLeadingUnderscore ? "_Item" : "Item";
  const result = camel.charAt(0).toUpperCase() + camel.slice(1);
  return hasLeadingUnderscore ? `_${result}` : result;
}

export function toTableName(str: string): string {
  return toSqlIdentifier((str || "table").toLowerCase(), "table");
}

export function toEnvVarName(str: string): string {
  if (!str) return "SERVICE";
  const clean = str.replace(/[^a-zA-Z0-9]/g, "_").replace(/([a-z])([A-Z])/g, "$1_$2");
  const env = clean.replace(/_+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  return env || "SERVICE";
}


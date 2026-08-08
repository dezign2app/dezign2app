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

export function toSingular(str: string): string {
  if (!str) return str;
  const lower = str.toLowerCase();

  const irregulars: Record<string, string> = {
    people: "person",
    children: "child",
    men: "man",
    women: "woman",
    data: "data",
    media: "media",
    species: "species",
    series: "series",
  };

  if (irregulars[lower]) {
    const s = irregulars[lower];
    return str.charAt(0) === str.charAt(0).toUpperCase()
      ? s.charAt(0).toUpperCase() + s.slice(1)
      : s;
  }

  if (lower.endsWith("ies") && lower.length > 3) {
    return str.slice(0, -3) + (str.charAt(str.length - 3) === "I" ? "Y" : "y");
  }
  if (
    lower.endsWith("sses") ||
    lower.endsWith("shes") ||
    lower.endsWith("ches") ||
    lower.endsWith("xes") ||
    lower.endsWith("zes")
  ) {
    return str.slice(0, -2);
  }
  if (lower.endsWith("ses") && lower.length > 4) {
    if (
      lower.endsWith("status") ||
      lower.endsWith("statuses") ||
      lower.endsWith("process") ||
      lower.endsWith("processes")
    ) {
      return str.slice(0, -2);
    }
    return str.slice(0, -1);
  }
  if (
    lower.endsWith("s") &&
    !lower.endsWith("ss") &&
    !lower.endsWith("us") &&
    !lower.endsWith("is") &&
    lower.length > 2
  ) {
    return str.slice(0, -1);
  }

  return str;
}

export function toPlural(str: string): string {
  if (!str) return str;
  const lower = str.toLowerCase();

  if (
    lower.endsWith("ies") ||
    lower.endsWith("ses") ||
    (lower.endsWith("s") &&
      !lower.endsWith("ss") &&
      !lower.endsWith("us") &&
      !lower.endsWith("is"))
  ) {
    return str;
  }

  const irregulars: Record<string, string> = {
    person: "people",
    child: "children",
    man: "men",
    woman: "women",
    data: "data",
    media: "media",
    species: "species",
    series: "series",
  };

  if (irregulars[lower]) {
    const p = irregulars[lower];
    return str.charAt(0) === str.charAt(0).toUpperCase()
      ? p.charAt(0).toUpperCase() + p.slice(1)
      : p;
  }

  if (lower.endsWith("y") && !/[aeiou]y$/i.test(str)) {
    return str.slice(0, -1) + (str.charAt(str.length - 1) === "Y" ? "IES" : "ies");
  }
  if (
    lower.endsWith("s") ||
    lower.endsWith("sh") ||
    lower.endsWith("ch") ||
    lower.endsWith("x") ||
    lower.endsWith("z")
  ) {
    return str + (str.charAt(str.length - 1) === str.charAt(str.length - 1).toUpperCase() ? "ES" : "es");
  }

  return str + (str.charAt(str.length - 1) === str.charAt(str.length - 1).toUpperCase() ? "S" : "s");
}



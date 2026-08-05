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

export function toTopicKey(name: string): string {
  return (name || "EVENT")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
}

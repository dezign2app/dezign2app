"use client";

import React from "react";

// ─── JSON beautification helpers ─────────────────────────────────────────────

export const tryParseJson = (value: unknown): { isJson: boolean; parsed: unknown } => {
  if (typeof value === "object" && value !== null) {
    return { isJson: true, parsed: value };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return { isJson: true, parsed: JSON.parse(trimmed) };
      } catch {
        // not valid json
      }
    }
  }
  return { isJson: false, parsed: value };
};

type JsonToken =
  | { type: "key"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: string }
  | { type: "boolean"; value: string }
  | { type: "null"; value: string }
  | { type: "punctuation"; value: string }
  | { type: "indent"; value: string };

const tokenizeJsonValue = (value: string): JsonToken[] => {
  const trimmed = value.trim();
  const isBracket =
    trimmed === "{" || trimmed === "}" || trimmed === "[" || trimmed === "]" ||
    trimmed === "{}," || trimmed === "}," || trimmed === "]," || trimmed === "[]," ||
    trimmed === "{}" || trimmed === "[]";
  if (isBracket) return [{ type: "punctuation", value }];

  const trailing = value.endsWith(",") ? "," : "";
  const core = trailing ? value.slice(0, -1) : value;
  const trailingToken: JsonToken[] = trailing ? [{ type: "punctuation", value: trailing }] : [];

  if (core.trim().startsWith('"')) return [{ type: "string", value: core }, ...trailingToken];
  if (core.trim() === "true" || core.trim() === "false") return [{ type: "boolean", value: core }, ...trailingToken];
  if (core.trim() === "null") return [{ type: "null", value: core }, ...trailingToken];
  if (/^\s*-?\d/.test(core)) return [{ type: "number", value: core }, ...trailingToken];

  return [{ type: "punctuation", value }];
};

export const tokenizeJsonLine = (line: string): JsonToken[] => {
  const tokens: JsonToken[] = [];
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";
  const rest = line.slice(indent?.length || 0);

  if (indent) tokens.push({ type: "indent", value: indent });

  const keyValueMatch = rest.match(/^("(?:[^"\\]|\\.)*")\s*(:)\s*(.*)/);
  if (keyValueMatch) {
    tokens.push({ type: "key", value: keyValueMatch[1] || "" });
    tokens.push({ type: "punctuation", value: ": " });
    tokens.push(...tokenizeJsonValue(keyValueMatch[3] || ""));
    return tokens;
  }

  tokens.push(...tokenizeJsonValue(rest));
  return tokens;
};

const tokenToneClass: Record<JsonToken["type"], string> = {
  key: "text-blue-400/90",
  string: "text-green-400/80",
  number: "text-amber-400/80",
  boolean: "text-purple-400/80",
  null: "text-red-400/60",
  punctuation: "text-sidebar-foreground/50",
  indent: "",
};

export const JsonLine = React.memo(({ line }: { line: string }) => {
  const tokens = tokenizeJsonLine(line);
  return (
    <div className="whitespace-pre-wrap break-words leading-5">
      {tokens.map((token, i) => (
        <span key={i} className={tokenToneClass[token.type]}>
          {token.value}
        </span>
      ))}
    </div>
  );
});

JsonLine.displayName = "JsonLine";

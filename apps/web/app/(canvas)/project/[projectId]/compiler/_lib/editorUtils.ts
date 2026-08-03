/**
 * Pure editor utility helpers for the Compiler page.
 * Extracted to keep page.tsx focused on orchestration only.
 *
 * IMPORTANT — Loop-prevention contract:
 * The route generator wraps `endpoint.businessLogic` lines in `// STEP N: `
 * prefixes on every compile pass. Therefore, whatever we persist back into
 * `endpoint.businessLogic` must be the *raw* user instruction text, never the
 * generator-produced `STEP N: <text>` wrapper. `parseEditableSection` enforces
 * this by stripping the prefix before storing.
 */

import { Endpoint } from "@workspace/canvas/types";

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

export function getLanguageFromFilename(filename: string): string {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".yaml") || filename.endsWith(".yml")) return "yaml";
  if (filename.endsWith(".md")) return "markdown";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".py")) return "python";
  if (filename.endsWith(".sh")) return "shell";
  return "plaintext";
}

// ---------------------------------------------------------------------------
// Editable zone detection (for Monaco line-range locking)
// ---------------------------------------------------------------------------

export function getEditableLineRange(
  content: string,
): { startMarkerLine: number; endMarkerLine: number } | null {
  if (!content) return null;
  const lines = content.split("\n");

  let startMarkerLine = -1;
  let endMarkerLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1; // 1-indexed Monaco line number

    if (
      line.includes("// --- EDITABLE FUNCTION BODY START ---") ||
      line.includes("// editable area")
    ) {
      startMarkerLine = lineNumber;
    } else if (
      startMarkerLine === -1 &&
      (line.includes("// --- Business Logic Code Execution ---") ||
        line.includes("// STEP 3:") ||
        line.includes("// STEP 2:") ||
        line.includes("// STEP 1:"))
    ) {
      startMarkerLine = lineNumber - 1;
    }

    if (
      startMarkerLine !== -1 &&
      endMarkerLine === -1 &&
      (line.includes("// --- EDITABLE FUNCTION BODY END ---") ||
        line.includes("// END of editable area") ||
        line.includes("logger.debug(") ||
        line.includes("return res.status(") ||
        line.includes("return res.json(") ||
        line.includes("} catch (error)"))
    ) {
      endMarkerLine = lineNumber;
      break;
    }
  }

  if (
    startMarkerLine !== -1 &&
    endMarkerLine !== -1 &&
    startMarkerLine < endMarkerLine
  ) {
    return { startMarkerLine, endMarkerLine };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Key-press classification (for read-only zone enforcement)
// ---------------------------------------------------------------------------

export function isEditingKey(e: any): boolean {
  const key = e.browserEvent?.key;
  const isCtrlOrCmd = e.browserEvent?.ctrlKey || e.browserEvent?.metaKey;

  if (key === "Backspace" || key === "Delete" || key === "Enter") {
    return true;
  }
  if (isCtrlOrCmd && (key === "v" || key === "x" || key === "z" || key === "y")) {
    return true;
  }
  if (key && key.length === 1 && !isCtrlOrCmd) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Extract the editable section from compiled route file content
// ---------------------------------------------------------------------------

export function extractBusinessLogic(content: string): string {
  if (!content) return "";

  const startMarker = "// --- EDITABLE FUNCTION BODY START ---";
  const endMarker = "// --- EDITABLE FUNCTION BODY END ---";

  if (content.includes(startMarker) && content.includes(endMarker)) {
    let section = content.split(startMarker)[1]?.split(endMarker)[0] || "";
    if (section.startsWith("\r\n")) {
      section = section.slice(2);
    } else if (section.startsWith("\n")) {
      section = section.slice(1);
    }
    if (section.endsWith("\r\n")) {
      section = section.slice(0, -2);
    } else if (section.endsWith("\n")) {
      section = section.slice(0, -1);
    }
    return section;
  }

  const marker = "// --- Business Logic Code Execution ---";
  if (content.includes(marker)) {
    const afterMarker = content.split(marker)[1] || "";
    const endMarkers = [
      "logger.debug(",
      "return res.status(",
      "return res.json(",
      "} catch (error)",
    ];

    let lowestEndIndex = afterMarker.length;
    for (const em of endMarkers) {
      const idx = afterMarker.indexOf(em);
      if (idx !== -1 && idx < lowestEndIndex) {
        lowestEndIndex = idx;
      }
    }

    return afterMarker.substring(0, lowestEndIndex).trim();
  }

  return content;
}

// ---------------------------------------------------------------------------
// Generator structural line detection
//
// FIX (Bug 2): Removed the overly-broad heuristics that matched user-written
// bullet lists (`/^-\s+\w/`) and indented lines (`/^\s{2,}/`). These were
// causing user instructions to be silently discarded on read-back, which then
// caused the generator to re-emit them freshly-wrapped on the next compile.
// Only exact generator-structural markers are classified here.
// ---------------------------------------------------------------------------

export function isGeneratorStructuralLine(trimmedLine: string): boolean {
  return (
    trimmedLine.startsWith("// ===") ||
    trimmedLine.startsWith("// \u{1F916} AI CODING AGENT DIRECTIVE") ||
    trimmedLine.startsWith("// \u{1F4A1} Write custom business logic below:") ||
    trimmedLine.startsWith("// --- Business Logic Code Execution ---") ||
    trimmedLine.startsWith("// --- Natural Language Instructions ---") ||
    trimmedLine.startsWith("// --- EDITABLE FUNCTION BODY START ---") ||
    trimmedLine.startsWith("// --- EDITABLE FUNCTION BODY END ---")
  );
}

export function isGeneratorAnnotationComment(commentContent: string): boolean {
  // Trace-annotation comment bodies emitted by routeGenerator.ts.
  // Must NOT be written back to businessLogic/prompt.
  return (
    commentContent.startsWith("\u{1F4E5} INBOUND TRIGGER") ||
    commentContent.startsWith("\u{1F517} RESOURCE DEPENDENCIES") ||
    commentContent.startsWith("\u{1F5C4}\uFE0F DATABASE OPERATIONS REQUIRED") ||
    commentContent.startsWith("Goal:") ||
    commentContent.startsWith("Data Context:")
  );
}

// ---------------------------------------------------------------------------
// Parse the editable section into { code, businessLogic }
//
// FIX (Bug 1): When a comment line starts with "STEP N: ", we now STRIP the
// prefix before saving it to instructionLines/businessLogic. This is the key
// fix for the exponential growth loop:
//
//   Generator emits:  // STEP 1: Validate user ID
//   User edits to:    // STEP 1: Validate user ID and role
//   Old behaviour:    businessLogic = "STEP 1: Validate user ID and role"
//                     -> generator re-wraps -> "// STEP 1: STEP 1: Validate..."
//   New behaviour:    businessLogic = "Validate user ID and role"
//                     -> generator wraps -> "// STEP 1: Validate user ID and role" OK
//
// FIX (Bug 4 — redundant directive block): The generator wraps every endpoint's
// metadata inside a `// === ... ===` fence. Previously only the fence lines
// themselves were skipped; all the bullet lines inside (e.g.
// `// - Message Broker: "Kafka"`, `//   Broker topic/queue event stream`) were
// saved into businessLogic and re-emitted on every compile, causing the block
// to grow exponentially. We now skip the ENTIRE fence block as a unit.
// ---------------------------------------------------------------------------

export function parseEditableSection(section: string): {
  code: string;
  businessLogic: string;
  fullSection: string;
} {
  const lines = section.split("\n");
  const codeLines: string[] = [];
  const instructionLines: string[] = [];

  // Track whether we are inside a // === ... === generator directive block.
  let insideDirectiveBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Detect the opening / closing `// ===` fence.
    if (trimmed.startsWith("// ===")) {
      // Toggle: first occurrence opens the block, second closes it.
      insideDirectiveBlock = !insideDirectiveBlock;
      continue; // always skip the fence line itself
    }

    // Skip every line that is inside a directive block.
    if (insideDirectiveBlock) {
      continue;
    }

    // Skip entire generator structural lines
    if (isGeneratorStructuralLine(trimmed)) {
      continue;
    }

    if (trimmed.startsWith("//")) {
      // Extract the comment body (strip leading `// `)
      const commentContent = trimmed.replace(/^\/\/\s*/, "");

      // Skip generator trace annotation lines (belt-and-suspenders, in case
      // any annotation appears outside a fence block).
      if (isGeneratorAnnotationComment(commentContent)) {
        continue;
      }

      // FIX: Strip the "STEP N: " prefix that the generator wraps around every
      // businessLogic line. This normalises the text back to its raw form so
      // the generator can wrap it cleanly on the next compile without doubling.
      const stepPrefixMatch = commentContent.match(/^STEP\s+\d+:\s*/i);
      const userText = stepPrefixMatch
        ? commentContent.slice(stepPrefixMatch[0].length).trim()
        : commentContent.trim();

      // Only persist non-empty user-authored comment lines
      if (userText) {
        instructionLines.push(userText);
      }
    } else if (trimmed === "") {
      codeLines.push("");
    } else {
      // Strip one level of indentation (route generator adds 4-space indent)
      let cleanedLine = rawLine;
      if (cleanedLine.startsWith("    ")) {
        cleanedLine = cleanedLine.slice(4);
      }
      codeLines.push(cleanedLine);
    }
  }

  // Trim trailing empty lines but preserve internal ones
  const code = codeLines.join("\n").trimEnd();
  const businessLogic = instructionLines.join("\n");

  return {
    code,
    businessLogic,
    fullSection: section,
  };
}

// ---------------------------------------------------------------------------
// Route file classification and endpoint matching
// ---------------------------------------------------------------------------

export function checkIsRouteFile(filename?: string): boolean {
  if (!filename) return false;
  return (
    filename.includes("/src/routes/") ||
    filename.startsWith("src/routes/") ||
    filename.includes("routes/")
  );
}

export function findEndpointForFile(
  filename: string,
  endpoints: (Endpoint & { nodeId: string })[],
) {
  if (!checkIsRouteFile(filename)) return null;

  const routeFileName =
    filename
      .split(/[\/\\]routes[\/\\]/)
      .pop()
      ?.replace(/\.ts$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "";

  for (const ep of endpoints) {
    const method = (ep.type || "GET").toLowerCase();
    const rawName = (ep.name || ep.id || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (
      rawName &&
      (routeFileName === rawName || routeFileName === `${method}${rawName}`)
    ) {
      return ep;
    }
    if (
      ep.id &&
      routeFileName.includes(ep.id.toLowerCase().replace(/[^a-z0-9]/g, ""))
    ) {
      return ep;
    }
  }

  return null;
}

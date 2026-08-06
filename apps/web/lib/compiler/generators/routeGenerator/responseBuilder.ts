import { Endpoint, TargetDbOperation } from "@workspace/canvas/types";

export function buildResponsePayloadCode(
  ep: Endpoint,
  statusCode: number,
  path: string,
  pickedDbOps: TargetDbOperation[],
  targetVarMap: Map<string, string>,
  responseData: string,
): string {
  const mode = ep.responseMode || "schema_builder";

  if (mode === "custom_expression" && ep.responseExpression?.trim()) {
    return ep.responseExpression.trim();
  }

  if (mode === "inferred") {
    if (pickedDbOps.length > 0) {
      const lastOp = pickedDbOps[pickedDbOps.length - 1];
      const primaryVar =
        lastOp && lastOp.tableNodeId && targetVarMap.get(lastOp.tableNodeId)
          ? targetVarMap.get(lastOp.tableNodeId)!
          : lastOp
            ? `${lastOp.fn.name}Result`
            : "result";
      return `{ success: true, data: ${primaryVar}, timestamp: new Date().toISOString() }`;
    }
    return responseData;
  }

  // mode === "schema_builder"
  if (ep.responseFields && ep.responseFields.length > 0) {
    const fieldEntries: string[] = [];

    for (const f of ep.responseFields) {
      const fieldName = f.name || "field";
      if (!fieldName) continue;

      if (fieldName === "status" || fieldName === "statusCode") {
        fieldEntries.push(`      ${fieldName}: ${statusCode}`);
        continue;
      }
      if (fieldName === "message") {
        fieldEntries.push(`      ${fieldName}: "Successfully executed ${ep.type || "GET"} ${path}"`);
        continue;
      }
      if (fieldName === "timestamp") {
        fieldEntries.push(`      ${fieldName}: new Date().toISOString()`);
        continue;
      }

      // Resolve variable name for DB field or entity payload
      let targetVar: string | null = null;
      if (f.type && f.type.startsWith("db:")) {
        const parts = f.type.split(":");
        const tableNodeId = parts[1];
        if (tableNodeId) {
          const mapVar = targetVarMap.get(tableNodeId);
          if (mapVar) {
            targetVar = mapVar;
          }
        }
      }

      if (!targetVar && pickedDbOps.length > 0) {
        const cleanName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchedOp = pickedDbOps.find((op) => {
          const targetClean = (op.fn.targetName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const fnClean = op.fn.name.toLowerCase();
          return (
            (cleanName && targetClean && (cleanName.includes(targetClean) || targetClean.includes(cleanName))) ||
            (cleanName && fnClean.includes(cleanName))
          );
        });

        if (matchedOp) {
          targetVar = (matchedOp.tableNodeId && targetVarMap.get(matchedOp.tableNodeId)) || `${matchedOp.fn.name}Result`;
        } else if (cleanName === "data" || cleanName === "payload" || cleanName === "result") {
          const lastOp = pickedDbOps[pickedDbOps.length - 1];
          const firstOp = pickedDbOps[0];
          const primaryOp =
            pickedDbOps.find((op) => op.operationKind === "create" || op.operationKind === "update") || lastOp;
          targetVar = primaryOp
            ? (primaryOp.tableNodeId && targetVarMap.get(primaryOp.tableNodeId)) || `${primaryOp.fn.name}Result`
            : firstOp
              ? (firstOp.tableNodeId && targetVarMap.get(firstOp.tableNodeId)) || `${firstOp.fn.name}Result`
              : "result";
        }
      }

      if (f.type && f.type.startsWith("db:")) {
        const isPartial = f.type.includes(":partial");
        const cols: string[] = f.selectedColumns || [];

        if (targetVar) {
          if (isPartial && cols.length > 0) {
            const pickProps = cols.map((c) => `${c}: item.${c}`).join(", ");
            fieldEntries.push(
              `      ${fieldName}: Array.isArray(${targetVar}) ? ${targetVar}.map((item) => ({ ${pickProps} })) : ${targetVar} ? ({ ${cols.map((c) => `${c}: ${targetVar}.${c}`).join(", ")} }) : null`,
            );
          } else {
            fieldEntries.push(`      ${fieldName}: ${targetVar}`);
          }
        } else {
          fieldEntries.push(`      ${fieldName}: null`);
        }
        continue;
      }

      if (targetVar && (fieldName === "data" || fieldName === "payload" || fieldName === "result")) {
        fieldEntries.push(`      ${fieldName}: ${targetVar}`);
        continue;
      }

      switch (f.type) {
        case "string":
          fieldEntries.push(`      ${fieldName}: "success"`);
          break;
        case "number":
          fieldEntries.push(`      ${fieldName}: 0`);
          break;
        case "boolean":
          fieldEntries.push(`      ${fieldName}: true`);
          break;
        case "array":
          fieldEntries.push(`      ${fieldName}: []`);
          break;
        case "object":
          fieldEntries.push(`      ${fieldName}: {}`);
          break;
        default:
          fieldEntries.push(`      ${fieldName}: null`);
      }
    }

    if (fieldEntries.length > 0) {
      return `{\n${fieldEntries.join(",\n")}\n    }`;
    }
  }

  if (pickedDbOps.length > 0) {
    const lastOp = pickedDbOps[pickedDbOps.length - 1];
    const primaryVar =
      lastOp && lastOp.tableNodeId && targetVarMap.get(lastOp.tableNodeId)
        ? targetVarMap.get(lastOp.tableNodeId)!
        : lastOp
          ? `${lastOp.fn.name}Result`
          : "result";
    return `{ status: ${statusCode}, message: "Successfully executed ${ep.type || "GET"} ${path}", data: ${primaryVar} }`;
  }
  return responseData;
}

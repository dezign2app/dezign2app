import { DbOperationFunction } from "@workspace/canvas/types";
import { toSqlIdentifier } from "@/lib/compiler/utils";
import type { BackendNode } from "@/types/canvas";

function toPascal(str: string): string {
  const clean = toSqlIdentifier(str, "table");
  return clean
    .split(/[_\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function toCamel(str: string): string {
  const p = toPascal(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
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

/**
 * Generates default auto-created database operation functions for an entity table,
 * including standard CRUD and index-based fetch functions (fetchByIndex).
 * Populates both natural language prompts and executable TypeScript query code.
 */
export function generateDefaultDbOperations(
  label: string,
  rawColumns: { name: string; type: string; isPrimaryKey?: boolean; isUnique?: boolean; isForeignKey?: boolean }[] = [],
  indexes: { name: string; columns: string; isUnique?: boolean }[] = [],
  allNodes: BackendNode[] = [],
): DbOperationFunction[] {
  const tableName = toSqlIdentifier(label || "table", "table");
  const pascal = toPascal(tableName);
  const pascalSingular = toSingular(pascal);
  const pascalPlural = toPlural(pascal);

  // Sanitize all column names against SQL identifier injections
  const columns = rawColumns.map((c) => ({
    ...c,
    name: toSqlIdentifier(c.name || "col", "col"),
  }));

  const pkCol = columns.find((c) => c.isPrimaryKey) || columns[0];
  const pkColName = pkCol?.name || "id";
  const pkVarName = toCamel(pkColName);
  const pkType =
    (pkCol?.type || "string").toLowerCase() === "number" ||
    (pkCol?.type || "string").toLowerCase() === "integer"
      ? "number"
      : "string";

  const writableCols = columns.filter((c) => !c.isPrimaryKey);
  const insertCols = writableCols.map((c) => c.name).join(", ");
  const insertPlaceholders = writableCols.map(() => "?").join(", ");
  const insertBindArgs = writableCols.map((c) => `data.${toCamel(c.name)}`).join(", ");

  const createCode = writableCols.length > 0
    ? `export function create${pascalSingular}(data: Create${pascal}Data): ${pascal}Row {\n  const info = stmtInsert.run(${insertBindArgs});\n  const _rowId = typeof info.lastInsertRowid === "bigint" ? info.lastInsertRowid.toString() : String(info.lastInsertRowid);\n  return { ${pkColName}: _rowId, ...data } as ${pascal}Row;\n}`
    : `export function create${pascalSingular}(): ${pascal}Row {\n  const info = db.prepare("INSERT INTO ${tableName} DEFAULT VALUES").run();\n  const _rowId = typeof info.lastInsertRowid === "bigint" ? info.lastInsertRowid.toString() : String(info.lastInsertRowid);\n  return { ${pkColName}: _rowId } as ${pascal}Row;\n}`;

  const updateCode = writableCols.length > 0
    ? `export function update${pascalSingular}(${pkVarName}: ${pkType}, data: Update${pascal}Data): ${pascal}Row | undefined {\n  const current = find${pascalSingular}ById(${pkVarName});\n  if (!current) return undefined;\n  const updated = { ...current, ...data };\n  stmtUpdate.run(${writableCols.map((c) => `updated.${toCamel(c.name)}`).join(", ")}, ${pkVarName});\n  return find${pascalSingular}ById(${pkVarName});\n}`
    : `export function update${pascalSingular}(${pkVarName}: ${pkType}): ${pascal}Row | undefined {\n  return find${pascalSingular}ById(${pkVarName});\n}`;

  const ops: DbOperationFunction[] = [
    {
      id: `auto-find-all-${tableName}`,
      name: `findAll${pascalPlural}`,
      kind: "findAll",
      description: `Retrieve all rows from ${tableName}`,
      signature: `findAll${pascalPlural}(limit?: number, offset?: number): ${pascal}Row[]`,
      params: [
        { name: "limit", type: "number", required: false, defaultValue: "20" },
        { name: "offset", type: "number", required: false, defaultValue: "0" },
      ],
      returnType: `${pascal}Row[]`,
      pagination: {
        enabled: true,
        defaultLimit: 20,
        maxLimit: 100,
        mode: "offset",
      },
      logicMode: "natural_language",
      prompt: `Retrieve all records from the ${tableName} table using prepared statements with limit and offset pagination.`,
      code: `export function findAll${pascalPlural}(limit: number = 20, offset: number = 0): ${pascal}Row[] {\n  return stmtFindAll.all(limit, offset) as ${pascal}Row[];\n}`,
      enabled: true,
      isAutoGenerated: true,
    },
    {
      id: `auto-find-by-id-${tableName}`,
      name: `find${pascalSingular}ById`,
      kind: "findById",
      description: `Find a ${tableName} record by ${pkColName}`,
      signature: `find${pascalSingular}ById(${pkVarName}: ${pkType}): ${pascal}Row | undefined`,
      params: [{ name: pkVarName, type: pkType, required: true }],
      returnType: `${pascal}Row | undefined`,
      logicMode: "natural_language",
      prompt: `Find a single record from the ${tableName} table by primary key (${pkColName}). Returns undefined if not found.`,
      code: `export function find${pascalSingular}ById(${pkVarName}: ${pkType}): ${pascal}Row | undefined {\n  return stmtFindById.get(${pkVarName}) as ${pascal}Row | undefined;\n}`,
      enabled: true,
      isAutoGenerated: true,
    },
    {
      id: `auto-create-${tableName}`,
      name: `create${pascalSingular}`,
      kind: "create",
      description: `Create a new record in ${tableName}`,
      signature: `create${pascalSingular}(data: Create${pascal}Data): ${pascal}Row`,
      params: [{ name: "data", type: `Create${pascal}Data`, required: true }],
      returnType: `${pascal}Row`,
      logicMode: "natural_language",
      prompt: `Insert a new record into the ${tableName} table with provided payload fields and return the created record.`,
      code: createCode,
      enabled: true,
      isAutoGenerated: true,
    },
    {
      id: `auto-update-${tableName}`,
      name: `update${pascalSingular}`,
      kind: "update",
      description: `Update a ${tableName} record by ${pkColName}`,
      signature: `update${pascalSingular}(${pkVarName}: ${pkType}, data: Update${pascal}Data): ${pascal}Row | undefined`,
      params: [
        { name: pkVarName, type: pkType, required: true },
        { name: "data", type: `Update${pascal}Data`, required: true },
      ],
      returnType: `${pascal}Row | undefined`,
      logicMode: "natural_language",
      prompt: `Update an existing record in the ${tableName} table by primary key (${pkColName}) with partial fields data.`,
      code: updateCode,
      enabled: true,
      isAutoGenerated: true,
    },
    {
      id: `auto-delete-${tableName}`,
      name: `delete${pascalSingular}ById`,
      kind: "delete",
      description: `Delete a ${tableName} record by ${pkColName}`,
      signature: `delete${pascalSingular}ById(${pkVarName}: ${pkType}): void`,
      params: [{ name: pkVarName, type: pkType, required: true }],
      returnType: "void",
      logicMode: "natural_language",
      prompt: `Delete a record from the ${tableName} table by primary key (${pkColName}).`,
      code: `export function delete${pascalSingular}ById(${pkVarName}: ${pkType}): void {\n  stmtDelete.run(${pkVarName});\n}`,
      enabled: true,
      isAutoGenerated: true,
    },
  ];

  // Combine explicit indexes and auto-discovered foreign key / unique column indexes
  const effectiveIndexes: { name: string; columns: string; isUnique?: boolean }[] = [...indexes];

  columns.forEach((col) => {
    if (col.isPrimaryKey) return;
    if (col.isForeignKey || col.name.toLowerCase().endsWith("_id") || col.name.toLowerCase().endsWith("id")) {
      const exists = effectiveIndexes.some((idx) => {
        const cList = (idx.columns || "").split(",").map((c) => c.trim().toLowerCase());
        return cList.includes(col.name.toLowerCase());
      });
      if (!exists) {
        // Cardinality invariant: FK columns are always the N side of a relationship.
        // They must never be treated as unique — always generate .all() with pagination.
        effectiveIndexes.push({
          name: `idx_${tableName}_${col.name}`,
          columns: col.name,
          isUnique: false,
        });
      }
    }
  });

  // Index-based fetch functions (fetchByIndex)
  effectiveIndexes.forEach((idx, i) => {
    if (!idx.columns) return;
    const colList = idx.columns
      .split(",")
      .map((c) => toSqlIdentifier(c.trim(), ""))
      .filter(Boolean);

    if (colList.length === 0) return;

    const rawIdxName = idx.name || `idx_${colList.join("_")}`;
    const cleanName = rawIdxName.replace(new RegExp(`^idx_${tableName}_|^idx_|^by_`, "i"), "");
    const pascalIdxName = toPascal(cleanName || colList.join("_"));
    const fnName = `findBy${pascalIdxName}`;

    // Cardinality invariant: if the indexed column is a FK column, it is always N-cardinality
    // regardless of how the index was declared. Only truly unique constraints use .get().
    const colIsForeignKey = colList.some((c) =>
      columns.find((col) => col.name.toLowerCase() === c.toLowerCase())?.isForeignKey ||
      c.toLowerCase().endsWith("_id")
    );
    const isUnique = !!idx.isUnique && !colIsForeignKey;

    const paramList: { name: string; type: string; required?: boolean; defaultValue?: string }[] = colList.map((colName) => {
      const colObj = columns.find((c) => c.name.toLowerCase() === colName.toLowerCase());
      const colType =
        (colObj?.type || "string").toLowerCase() === "number" ||
        (colObj?.type || "string").toLowerCase() === "integer"
          ? "number"
          : "string";
      return { name: toCamel(colName), type: colType, required: true };
    });

    if (!isUnique) {
      paramList.push(
        { name: "limit", type: "number", required: false, defaultValue: "20" },
        { name: "offset", type: "number", required: false, defaultValue: "0" },
      );
    }

    const paramSig = paramList
      .map((p) => `${p.name}: ${p.type}${p.defaultValue ? ` = ${p.defaultValue}` : ""}`)
      .join(", ");
    const returnType = isUnique ? `${pascal}Row | undefined` : `${pascal}Row[]`;
    const whereClause = colList.map((c) => `${c} = ?`).join(" AND ");
    const argList = colList.map((c) => toCamel(c)).join(", ") + (isUnique ? "" : ", limit, offset");

    const paramTypes = colList.map((colName) => {
      const colObj = columns.find((c) => c.name.toLowerCase() === colName.toLowerCase());
      const colType =
        (colObj?.type || "string").toLowerCase() === "number" ||
        (colObj?.type || "string").toLowerCase() === "integer"
          ? "number"
          : "string";
      return `${toCamel(colName)}: ${colType}`;
    }).join(", ");

    const indexCode = isUnique
      ? `const stmtFindBy${pascalIdxName} = db.prepare<[${paramTypes}], ${pascal}Row>(\n  "SELECT * FROM ${tableName} WHERE ${whereClause}"\n);\n\nexport function ${fnName}(${paramSig}): ${returnType} {\n  return stmtFindBy${pascalIdxName}.get(${argList}) as ${returnType};\n}`
      : `const stmtFindBy${pascalIdxName} = db.prepare<[${paramTypes}, limit?: number, offset?: number], ${pascal}Row>(\n  "SELECT * FROM ${tableName} WHERE ${whereClause} LIMIT ? OFFSET ?"\n);\n\nexport function ${fnName}(${paramSig}): ${returnType} {\n  return stmtFindBy${pascalIdxName}.all(${argList}) as ${returnType};\n}`;

    ops.push({
      id: `auto-index-${tableName}-${rawIdxName}-${i}`,
      name: fnName,
      kind: "fetchByIndex",
      indexName: rawIdxName,
      description: `Find ${tableName} records by ${colList.join(", ")}`,
      signature: `${fnName}(${paramList.map((p) => `${p.name}${p.required === false ? "?" : ""}: ${p.type}`).join(", ")}): ${returnType}`,
      params: paramList,
      returnType: returnType,
      pagination: isUnique
        ? undefined
        : {
            enabled: true,
            defaultLimit: 20,
            maxLimit: 100,
            mode: "offset",
          },
      logicMode: "natural_language",
      prompt: `Find records from ${tableName} table matching ${whereClause}.`,
      code: indexCode,
      enabled: true,
      isAutoGenerated: true,
    });
  });

  // ── Auto-discover Relational JOIN Functions ──────────────────────────
  const entityNodes = (allNodes || []).filter(
    (n) => n?.type === "entity" || n?.type === "db_ref"
  );

  // 1. Direct FK Columns on this table (N:1 relationships)
  columns.forEach((col) => {
    if (col.isPrimaryKey) return;
    if (
      col.isForeignKey ||
      (col.name.toLowerCase().endsWith("_id") &&
        col.name.toLowerCase() !== "id" &&
        col.name.toLowerCase() !== "_id")
    ) {
      const targetBase = col.name.replace(/_id$/i, "");
      const targetPascal = toPascal(targetBase);
      const targetPascalSingular = toSingular(targetPascal);
      const targetPascalPlural = toPlural(targetPascal);
      const targetTableName = toSqlIdentifier(targetPascalPlural.toLowerCase(), "table");
      const targetVarSingular = toCamel(targetPascalSingular);

      const fnName = `find${pascalSingular}ByIdWith${targetPascalSingular}`;
      const opId = `auto-join-${tableName}-with-${targetTableName}`;

      if (!ops.some((o) => o.name === fnName)) {
        const joinCode = `const stmtFind${pascalSingular}ByIdWith${targetPascalSingular} = db.prepare<[${pkVarName}: ${pkType}]>(\n  "SELECT t.*, json_object('${pkColName}', r.${pkColName}) AS ${targetVarSingular} FROM ${tableName} t LEFT JOIN ${targetTableName} r ON t.${col.name} = r.${pkColName} WHERE t.${pkColName} = ?"\n);\n\nexport function ${fnName}(${pkVarName}: ${pkType}): ${pascalSingular}With${targetPascalSingular}Row | undefined {\n  const row = stmtFind${pascalSingular}ByIdWith${targetPascalSingular}.get(${pkVarName}) as (${pascalSingular}With${targetPascalSingular}Row & Record<string, unknown>) | undefined;\n  if (!row) return undefined;\n  if (typeof row.${targetVarSingular} === "string") {\n    try { (row as Record<string, unknown>).${targetVarSingular} = JSON.parse(row.${targetVarSingular}); } catch {}\n  }\n  return row;\n}`;

        ops.push({
          id: opId,
          name: fnName,
          kind: "join",
          description: `Find a ${pascalSingular} record by ${pkColName} joined with associated ${targetPascalSingular}`,
          signature: `${fnName}(${pkVarName}: ${pkType}): ${pascalSingular}With${targetPascalSingular}Row | undefined`,
          params: [{ name: pkVarName, type: pkType, required: true }],
          returnType: `${pascalSingular}With${targetPascalSingular}Row | undefined`,
          logicMode: "natural_language",
          prompt: `Retrieve a record from ${tableName} by ${pkColName} joined with associated ${targetPascalSingular} record by ${col.name}.`,
          code: joinCode,
          enabled: true,
          isAutoGenerated: true,
        });
      }
    }
  });

  // 2. Inverse FK Relationships from other entity nodes (1:N relationships)
  entityNodes.forEach((otherNode) => {
    const otherLabel = otherNode.data?.label || otherNode.data?.tableRef;
    if (!otherLabel) return;
    const otherTableName = toSqlIdentifier(otherLabel, "table");
    if (otherTableName === tableName) return;

    const otherCols: { name: string; type: string; isPrimaryKey?: boolean; isForeignKey?: boolean }[] =
      otherNode.data?.columns || [];

    const otherPascal = toPascal(otherTableName);
    const otherPascalSingular = toSingular(otherPascal);
    const otherPascalPlural = toPlural(otherPascal);
    const otherVarPlural = toCamel(otherPascalPlural);

    const otherFkCol = otherCols.find((c) => {
      if (c.isPrimaryKey) return false;
      const cName = (c.name || "").toLowerCase();
      return (
        c.isForeignKey ||
        cName === `${toCamel(pascalSingular)}_id` ||
        cName === `${toSingular(tableName).toLowerCase()}_id` ||
        cName === `${tableName.toLowerCase()}_id`
      );
    });

    if (otherFkCol) {
      const fnName = `find${pascalSingular}ByIdWith${otherPascalPlural}`;
      const opId = `auto-join-${tableName}-with-${otherTableName}-list`;

      if (!ops.some((o) => o.name === fnName)) {
        const joinCode = `const stmtFind${pascalSingular}ByIdWith${otherPascalPlural} = db.prepare<[${pkVarName}: ${pkType}]>(\n  "SELECT t.*, json_group_array(json_object('${pkColName}', r.${pkColName})) AS ${otherVarPlural} FROM ${tableName} t LEFT JOIN ${otherTableName} r ON t.${pkColName} = r.${otherFkCol.name} WHERE t.${pkColName} = ? GROUP BY t.${pkColName}"\n);\n\nexport function ${fnName}(${pkVarName}: ${pkType}): ${pascalSingular}With${otherPascalPlural}Row | undefined {\n  const row = stmtFind${pascalSingular}ByIdWith${otherPascalPlural}.get(${pkVarName}) as (${pascalSingular}With${otherPascalPlural}Row & Record<string, unknown>) | undefined;\n  if (!row) return undefined;\n  if (typeof row.${otherVarPlural} === "string") {\n    try { (row as Record<string, unknown>).${otherVarPlural} = JSON.parse(row.${otherVarPlural}); } catch {}\n  }\n  return row;\n}`;

        ops.push({
          id: opId,
          name: fnName,
          kind: "join",
          description: `Find a ${pascalSingular} record by ${pkColName} joined with list of associated ${otherPascalPlural}`,
          signature: `${fnName}(${pkVarName}: ${pkType}): ${pascalSingular}With${otherPascalPlural}Row | undefined`,
          params: [{ name: pkVarName, type: pkType, required: true }],
          returnType: `${pascalSingular}With${otherPascalPlural}Row | undefined`,
          logicMode: "natural_language",
          prompt: `Retrieve a record from ${tableName} table by ${pkColName} joined with its associated ${otherPascalPlural} records as a list by ${otherFkCol.name}.`,
          code: joinCode,
          enabled: true,
          isAutoGenerated: true,
        });
      }
    }
  });

  return ops;
}

/**
 * Helper function to retrieve the active list of DB operation functions for an entity node.
 * If entityNode has dbOperations configured on its data, returns that.
 * Otherwise generates default CRUD, index-based, and relational JOIN operations.
 */
export function getEntityDbOperations(
  entityNode?: { data?: { label?: string; columns?: any[]; indexes?: any[]; dbOperations?: DbOperationFunction[] } } | null,
  allNodes: BackendNode[] = []
): DbOperationFunction[] {
  if (!entityNode || !entityNode.data) return [];
  const label = entityNode.data.label || "table";
  const columns = entityNode.data.columns || [];
  const indexes = entityNode.data.indexes || [];

  if (entityNode.data.dbOperations && entityNode.data.dbOperations.length > 0) {
    return entityNode.data.dbOperations;
  }
  return generateDefaultDbOperations(label, columns, indexes, allNodes);
}




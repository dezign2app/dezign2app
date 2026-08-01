import type {
  BackendEdge,
  BackendNode,
  Endpoint,
  JSONValue,
} from "@/types/canvas";
import { getSimulationTable, saveSimulationTable } from "./database";
import type {
  RuntimeContext,
  SimulationRequest,
  SimulationResult,
  SimulationTraceEntry,
} from "./types";
import {
  clone,
  findEndpointDatabaseRefs,
  getPath,
  getStatusText,
  is2xxStatus,
  resolveObject,
  resolveValue,
  setPath,
  validateSchema,
} from "./utils";

export async function simulateEndpoint(args: {
  service: BackendNode;
  endpoint: Endpoint;
  nodes: BackendNode[];
  edges: BackendEdge[];
  request: SimulationRequest;
  sourceNodeId?: string;
  sourceEventId?: string;
  /** Pre-resolved ingress edge — pass this for chained service-to-service hops
   *  so the trace entry carries the correct edgeId and the arrow animates. */
  resolvedIngressEdge?: BackendEdge;
  mocks?: Record<string, { returnData: JSONValue; status: number }>;
}): Promise<SimulationResult> {
  const { service, endpoint, nodes, edges, request, mocks } = args;
  const trace: SimulationTraceEntry[] = [];
  const context: RuntimeContext = {
    request,
    data: clone(request.body),
    variables: {},
  };
  const entitySeeds: Record<string, Array<Record<string, unknown>>> = {};

  for (const node of nodes) {
    if (node.type === "entity") {
      const seededRows = Array.isArray(node.data.seedRows)
        ? clone(node.data.seedRows)
        : [];
      entitySeeds[node.id] = seededRows;
    }
  }

  const refs = findEndpointDatabaseRefs(service.id, endpoint, nodes, edges);
  // For client→service edges the sourceHandle pattern is `events-{eventId}`.
  // For service→service chained hops the caller already holds the edge, so
  // accept it directly via `resolvedIngressEdge` to avoid a failed lookup.
  const ingressEdge: BackendEdge | undefined =
    args.resolvedIngressEdge ??
    (args.sourceNodeId
      ? edges.find(
          (edge) =>
            edge.source === args.sourceNodeId &&
            edge.target === service.id &&
            edge.sourceHandle === `events-${args.sourceEventId}`,
        )
      : undefined);

  const databaseFor = async (config: Record<string, unknown>) => {
    const requested = resolveValue(config.tableRef, context);
    const ref =
      refs.find(
        (node) => node.id === requested || node.data.tableRef === requested,
      ) ?? refs[0];
    if (!ref)
      throw new Error("This endpoint has no connected database reference.");
    const tableId = ref.data.tableRef || ref.id;
    const rows = await getSimulationTable(tableId, entitySeeds[tableId] ?? []);
    const edge = edges.find(
      (candidate) =>
        candidate.source === service.id &&
        candidate.target === ref.id &&
        (candidate.sourceHandle === `endpoint-out-${endpoint.id}` ||
          candidate.sourceHandle === `endpoints-out-${endpoint.id}`) &&
        (candidate.targetHandle === "database-target" ||
          candidate.targetHandle === "database-source"),
    );
    return { ref, rows, tableId, edge };
  };

  const steps = endpoint.processingSteps ?? [];
  try {
    if (args.sourceNodeId) {
      trace.push({
        id: `${args.sourceEventId ?? endpoint.id}-client`,
        kind: "client",
        label: `Client event → ${endpoint.type} ${endpoint.name}`,
        status: "completed",
        nodeId: args.sourceNodeId,
        edgeId: ingressEdge?.id,
        input: clone(context.data),
      });
    }

    // Resolve mock early — if a mock is defined for this endpoint, it IS the output.
    const endpointMock = mocks?.[endpoint.id];

    if (endpointMock) {
      // Short-circuit: the user has explicitly defined what this endpoint returns.
      const body = clone(endpointMock.returnData);
      const status = endpointMock.status || 200;
      const isSuccess = is2xxStatus(status);
      const statusText = getStatusText(status);
      trace.push({
        id: endpoint.id,
        kind: "endpoint",
        label: `${endpoint.type} ${endpoint.name}`,
        status: isSuccess ? "completed" : "failed",
        nodeId: service.id,
        edgeId: ingressEdge?.id,
        input: clone(context.data),
        output: body,
      });

      if (isSuccess) {
        for (const ref of refs) {
          const dbEdge = edges.find(
            (e) =>
              e.source === service.id &&
              e.target === ref.id &&
              (e.sourceHandle === `endpoint-out-${endpoint.id}` ||
                e.sourceHandle === `endpoints-out-${endpoint.id}`),
          );
          trace.push({
            id: `${ref.id}-db`,
            kind: "database",
            label: `[MOCKED] ${ref.data.label ?? ref.id}`,
            status: "completed",
            nodeId: ref.id,
            edgeId: dbEdge?.id,
            output: body,
          });
        }
      }

      trace.push({
        id: `${endpoint.id}-response`,
        kind: "response",
        label: `[MOCKED] ${status} ${statusText}`,
        status: isSuccess ? "completed" : "failed",
        nodeId: service.id,
        output: clone(body),
        detail: !isSuccess
          ? `Mock returned HTTP ${status} ${statusText}`
          : undefined,
      });
      return {
        status,
        statusText,
        headers: { "content-type": "application/json", "x-simulated": "true" },
        body,
        trace,
      };
    }

    trace.push({
      id: endpoint.id,
      kind: "endpoint",
      label: `${endpoint.type} ${endpoint.name}`,
      status: "completed",
      nodeId: service.id,
      edgeId: ingressEdge?.id,
      input: clone(context.data),
    });

    for (const step of steps) {
      const input = clone(context.data);
      const operation = step.operation ?? "passthrough";
      const config = step.config ?? {};

      if (operation === "passthrough") {
        // Legacy text-only steps remain visible but do not perform unsafe guessing.
      } else if (operation === "validate") {
        const required = Array.isArray(config.required) ? config.required : [];
        for (const path of required) {
          if (resolveValue(`$${String(path)}`, context) === undefined)
            throw new Error(`Missing required value: ${String(path)}`);
        }
      } else if (operation === "pick") {
        const fields = Array.isArray(config.fields) ? config.fields : [];
        const source: Record<string, unknown> =
          context.data !== null && typeof context.data === "object"
            ? { ...(context.data as Record<string, unknown>) }
            : {};
        context.data = Object.fromEntries(
          fields.map((field) => [String(field), source[String(field)]]),
        );
      } else if (operation === "omit") {
        const source: Record<string, unknown> =
          context.data !== null && typeof context.data === "object"
            ? { ...(context.data as Record<string, unknown>) }
            : {};
        for (const field of Array.isArray(config.fields) ? config.fields : [])
          delete source[String(field)];
        context.data = source;
      } else if (operation === "rename") {
        const source: Record<string, unknown> =
          context.data !== null && typeof context.data === "object"
            ? { ...(context.data as Record<string, unknown>) }
            : {};
        for (const [from, to] of Object.entries(config.fields ?? {})) {
          if (from in source) {
            source[String(to)] = source[from];
            delete source[from];
          }
        }
        context.data = source;
      } else if (operation === "set") {
        const target: Record<string, unknown> =
          context.data !== null && typeof context.data === "object"
            ? { ...(context.data as Record<string, unknown>) }
            : {};
        setPath(
          target,
          String(config.path ?? ""),
          resolveObject(config.value, context),
        );
        context.data = target;
      } else if (operation === "filter" || operation === "map") {
        if (!Array.isArray(context.data))
          throw new Error(`${operation} requires an array payload.`);
        const field = String(config.field ?? "");
        const expected = resolveValue(config.equals, context);
        context.data =
          operation === "filter"
            ? context.data.filter((item) => getPath(item, field) === expected)
            : context.data.map((item) => getPath(item, field));
      } else if (operation.startsWith("db_")) {
        const database = await databaseFor(config);
        const resolved = resolveObject(config.where ?? {}, context);
        const where: Record<string, unknown> =
          resolved !== null &&
          typeof resolved === "object" &&
          !Array.isArray(resolved)
            ? (resolved as Record<string, unknown>)
            : {};

        let result: unknown;
        const mock = mocks?.[database.ref.id];

        if (mock) {
          result = clone(mock.returnData);
        } else {
          const matches = (row: Record<string, unknown>) =>
            Object.entries(where).every(([key, value]) => row[key] === value);
          if (operation === "db_get")
            result = database.rows.find(matches) ?? null;
          if (operation === "db_get_many")
            result = database.rows.filter(matches);
          if (operation === "db_insert") {
            const rowResolved = resolveObject(
              config.value ?? context.data,
              context,
            );
            const row: Record<string, unknown> =
              rowResolved !== null &&
              typeof rowResolved === "object" &&
              !Array.isArray(rowResolved)
                ? (rowResolved as Record<string, unknown>)
                : {};
            database.rows.push(clone(row));
            result = row;
          }
          if (operation === "db_update") {
            const row = database.rows.find(matches);
            if (!row) throw new Error("No matching database row found.");
            Object.assign(
              row,
              resolveObject(config.value ?? context.data, context),
            );
            result = row;
          }
          if (operation === "db_delete") {
            const index = database.rows.findIndex(matches);
            result = index >= 0 ? database.rows.splice(index, 1)[0] : null;
          }
          if (
            operation === "db_insert" ||
            operation === "db_update" ||
            operation === "db_delete"
          ) {
            await saveSimulationTable(database.tableId, database.rows);
          }
        }

        context.data = clone(result);
        const assignTo = config.assignTo ? String(config.assignTo) : undefined;
        if (assignTo) context.variables[assignTo] = clone(result);
        trace.push({
          id: `${step.id}-db`,
          kind: "database",
          label: `${mock ? "[MOCKED] " : ""}${operation} ${database.ref.data.label ?? database.tableId}`,
          status: "completed",
          nodeId: database.ref.id,
          edgeId: database.edge?.id,
          input: where,
          output: clone(result),
        });
        continue;
      } else if (operation === "return") {
        context.response = {
          status: Number(config.status ?? 200),
          body: resolveObject(config.body ?? context.data, context),
        };
      }

      trace.push({
        id: step.id,
        kind: "step",
        label: step.text || operation,
        status: "completed",
        nodeId: service.id,
        input,
        output: clone(context.data),
      });
    }

    const body = context.response?.body ?? endpoint.simulationOutput ?? null;
    const status =
      context.response?.status ?? (endpoint.type === "POST" ? 201 : 200);
    const schemaErrors = validateSchema(body, endpoint.responseBody);
    if (schemaErrors.length) throw new Error(schemaErrors.join(" "));
    const isSuccess = is2xxStatus(status);
    const statusText = getStatusText(status);

    if (
      isSuccess &&
      !trace.some((t) => t.kind === "database") &&
      refs.length > 0
    ) {
      for (const ref of refs) {
        const dbEdge = edges.find(
          (e) =>
            e.source === service.id &&
            e.target === ref.id &&
            (e.sourceHandle === `endpoint-out-${endpoint.id}` ||
              e.sourceHandle === `endpoints-out-${endpoint.id}`),
        );
        trace.push({
          id: `${ref.id}-db`,
          kind: "database",
          label: `db_access ${ref.data.label ?? ref.id}`,
          status: "completed",
          nodeId: ref.id,
          edgeId: dbEdge?.id,
          output: body,
        });
      }
    }

    trace.push({
      id: `${endpoint.id}-response`,
      kind: "response",
      label: `${status} ${statusText}`,
      status: isSuccess ? "completed" : "failed",
      nodeId: service.id,
      output: clone(body),
      detail: !isSuccess ? `HTTP ${status} ${statusText}` : undefined,
    });
    return {
      status,
      statusText,
      headers: { "content-type": "application/json", "x-simulated": "true" },
      body,
      trace,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    trace.push({
      id: `${endpoint.id}-error`,
      kind: "response",
      label: "Simulation failed",
      status: "failed",
      nodeId: service.id,
      detail: message,
      output: clone(context.data),
    });
    return {
      status: 422,
      statusText: "Simulation Failed",
      headers: { "content-type": "application/json", "x-simulated": "true" },
      body: { error: message },
      trace,
    };
  }
}

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { GraphAnnotation } from "../state";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { getConvexClient } from "../utils";
import { EDGE_TYPE_MAP } from "@workspace/canvas";
import {
  EndpointInputType,
  ConsumedEventInputType,
  PublishedEventInputType
} from "@workspace/canvas/types";
import {
  serviceDataInputSchema,
  serviceDataSchema,
} from "../schemas";

export type AddServiceNodeInput = z.infer<typeof serviceDataInputSchema>;

export const addServiceNodeTool = tool(
  async (input, config) => {
    console.log("[DEBUG] addServiceNodeTool called with:", JSON.stringify(input, null, 2));
    const { label, description, techStack, port, cors, baseUrl, endpoints, consumedEvents, publishedEvents, inputs, outputs, logic } = input;
    const state = config.configurable?.state as typeof GraphAnnotation.State;
    if (!state?.projectId) {
      console.error("[DEBUG] addServiceNodeTool error: projectId missing");
      return "Error: projectId missing";
    }

    console.log(`[DEBUG] Adding service node for project ${state.projectId}`);
    const convex = getConvexClient(state);

    const elements = await convex.query(api.canvas.getBackendElements, {
      projectId: state.projectId as Id<"projects">,
    });
    
    // Upsert logic: Check if a service node with this label already exists (case-insensitive)
    const existingNode = elements.nodes.find(
      (n) => n.type === "service" && n.data?.label?.toLowerCase() === label.toLowerCase()
    );

    const isUpdate = !!existingNode;
    const nodeId = existingNode?.nodeId || `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    let position = existingNode?.position;
    if (!position) {
      const offsetX = Math.floor(Math.random() * 600) - 300;
      const offsetY = Math.floor(Math.random() * 600) - 300;
      position = state.viewportCenter
        ? { x: state.viewportCenter.x + offsetX, y: state.viewportCenter.y + offsetY }
        : { x: 100 + offsetX, y: 100 + offsetY };
    }
    
    const fractionalIndex = existingNode?.fractionalIndex || ("a0" + Date.now() + Math.random().toString(36).slice(2, 6));

    const makeId = () => Math.random().toString(36).slice(2, 9);
    const processedEndpoints = (endpoints || []).map((ep: EndpointInputType) => ({
      ...ep,
      id: (ep as {id?: string}).id || makeId(),
      headers: (ep.headers ?? []).map((item) => ({ ...item, id: item.id || makeId() })),
      pathParams: (ep.pathParams ?? []).map((item) => ({ ...item, id: item.id || makeId() })),
      queryParams: (ep.queryParams ?? []).map((item) => ({ ...item, id: item.id || makeId() })),
      requestBody: {
        id: ep.requestBody?.id || makeId(),
        fields: (ep.requestBody?.fields ?? []).map((item) => ({ ...item, id: item.id || makeId() })),
      },
      responseBody: {
        id: ep.responseBody?.id || makeId(),
        fields: (ep.responseBody?.fields ?? [{ name: "response", type: "object", required: true, description: ep.output || "Endpoint response" }]).map((item) => ({ ...item, id: item.id || makeId() })),
      },
      processingSteps: (ep.processingSteps ?? []).map((step) => ({ 
        ...step, 
        id: step.id || makeId(),
        // zodToConvex doesn't support ZodCatch, so we manually sanitize enums here
        operation: ["passthrough", "validate", "pick", "omit", "rename", "set", "filter", "map", "db_get", "db_get_many", "db_insert", "db_update", "db_delete", "return"].includes(step.operation as string) ? step.operation : "passthrough"
      })),
      publishedEvents: ep.publishedEvents?.map((pe) => ({ ...pe, id: pe.id || makeId() })),
    }));

    const processedConsumedEvents = (consumedEvents || []).map((ce: ConsumedEventInputType) => ({
      ...ce,
      id: ce.id || makeId(),
      retryPolicy: ["NONE", "IMMEDIATE", "EXPONENTIAL"].includes(ce.retryPolicy as string) ? ce.retryPolicy : "NONE",
      isIdempotent: typeof ce.isIdempotent === "boolean" ? ce.isIdempotent : false,
    }));

    const processedPublishedEvents = (publishedEvents || []).map((pe: PublishedEventInputType) => ({
      ...pe,
      id: pe.id || makeId(),
      version: ["v1", "v2", "v3"].includes(pe.version as string) ? pe.version : "v1",
      category: ["DOMAIN", "INTEGRATION", "INTERNAL", "NOTIFICATION"].includes(pe.category as string) ? pe.category : "DOMAIN",
      delivery: ["EXACTLY_ONCE", "AT_LEAST_ONCE", "AT_MOST_ONCE", "FIRE_AND_FORGET"].includes(pe.delivery as string) ? pe.delivery : "AT_LEAST_ONCE",
      ordering: ["NONE", "GLOBAL", "PER_ENTITY", "PER_AGGREGATE"].includes(pe.ordering as string) ? pe.ordering : "NONE",
      deprecated: typeof pe.deprecated === "boolean" ? pe.deprecated : false,
    }));

    // Reuse the DB schema to parse, sanitize, and inject all defaults!
    const validatedData = serviceDataSchema.parse({
      label,
      description,
      techStack,
      port,
      cors,
      baseUrl,
      endpoints: processedEndpoints,
      consumedEvents: processedConsumedEvents,
      publishedEvents: processedPublishedEvents,
      inputs: inputs || [],
      outputs: outputs || [],
      logic: logic || [],
    });

    try {
      await convex.mutation(api.canvas.upsertBackendNode, {
        projectId: state.projectId as Id<"projects">,
        nodeId,
        type: "service",
        position,
        data: validatedData,
        fractionalIndex,
      });

      const edgesToCreate = [];
      for (const ep of processedEndpoints) {
        if (ep.publishedEvents) {
          for (const pe of ep.publishedEvents) {
            if (pe.targetNodeId) {
              edgesToCreate.push({
                source: nodeId,
                target: pe.targetNodeId,
                sourceHandle: `publishedEvents-out-${pe.id}`,
                targetHandle: pe.targetResourceId ? `topics:in:${pe.targetResourceId}` : undefined,
                type: EDGE_TYPE_MAP["published-event-out→resource-def-in"] || "message",
              });
            }
          }
        }
      }

      for (const ce of processedConsumedEvents) {
        if (ce.targetNodeId) {
          edgesToCreate.push({
            source: ce.targetNodeId,
            target: nodeId,
            sourceHandle: ce.targetResourceId ? `topics:out:${ce.targetResourceId}` : undefined,
            targetHandle: `consumedEvents-in-${ce.id}`,
            type: EDGE_TYPE_MAP["resource-def-out→consumed-event-in"] || "message",
          });
        }
      }

      for (const pe of processedPublishedEvents) {
        if (pe.targetNodeId) {
          edgesToCreate.push({
            source: nodeId,
            target: pe.targetNodeId,
            sourceHandle: `publishedEvents-out-${pe.id}`,
            targetHandle: pe.targetResourceId ? `topics:in:${pe.targetResourceId}` : undefined,
            type: EDGE_TYPE_MAP["published-event-out→resource-def-in"] || "message",
          });
        }
      }

      // Database usage is endpoint-scoped.  Keep this automatic so a model
      // cannot accidentally leave a declared endpoint disconnected from its
      // table reference while building the service node.
      for (const ep of processedEndpoints) {
        const databaseNodeIds = [
          ...(Array.isArray(ep.databaseNodeIds) ? ep.databaseNodeIds : []),
          ...(ep.databaseNodeId ? [ep.databaseNodeId] : []),
        ];
        for (const databaseNodeId of [...new Set(databaseNodeIds)]) {
          edgesToCreate.push({
            source: nodeId,
            target: databaseNodeId,
            sourceHandle: `endpoints-out-${ep.id}`,
            targetHandle: "database-target",
            type: "connection",
          });
        }
      }

      for (const edge of edgesToCreate) {
        const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const edgeFractionalIndex = "a0" + Date.now() + Math.random().toString(36).slice(2, 6);
        await convex.mutation(api.canvas.upsertBackendEdge, {
          projectId: state.projectId as Id<"projects">,
          edgeId,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          fractionalIndex: edgeFractionalIndex,
        });
      }

      let resultStr = `${isUpdate ? 'Updated' : 'Added'} service node ${label} with ID ${nodeId} and ${edgesToCreate.length} edges.`;
      if (processedEndpoints.length > 0) {
        resultStr += `\nEndpoints:\n` + processedEndpoints.map((ep) => `- ${ep.type} ${ep.name}: targetHandle="endpoints-in-${ep.id}", sourceHandle="endpoints-out-${ep.id}"`).join("\n");
      }
      if (processedConsumedEvents.length > 0) {
        resultStr += `\nConsumed Events:\n` + processedConsumedEvents.map((ce) => `- ${ce.name}: targetHandle="consumedEvents-in-${ce.id}"`).join("\n");
      }
      if (processedPublishedEvents.length > 0) {
        resultStr += `\nPublished Events:\n` + processedPublishedEvents.map((pe) => `- ${pe.name}: sourceHandle="publishedEvents-out-${pe.id}"`).join("\n");
      }
      console.log(`[DEBUG] ${isUpdate ? 'Updated' : 'Created'} service node ${nodeId} successfully.`);
      return resultStr;

    } catch (error: unknown) {
      const e = error as Error;
      console.error("[DEBUG] Failed to add/update service node:", e);
      return `Failed to add/update service node: ${e.message || String(error)}`;
    }
  },
  {
    name: "add_service_node",
    description: "Add or update a complete microservice node on the backend canvas, including its REST endpoints, business logic, inputs, outputs, and message broker event publications/subscriptions. Automatically creates edges to connected message brokers (targetNodeId). If a service with the same label already exists, this tool will safely UPDATE it instead of creating duplicates.",
    schema: serviceDataInputSchema.extend({
      label: z.string().describe("Name of the service (e.g., 'User Service')"),
    }) as z.ZodType<AddServiceNodeInput>,
  }
);

import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource, CompiledFile, CompiledServiceResult } from "@workspace/canvas/types";
import { generateCoreFiles } from "./coreGenerator";
import { generateRoutes } from "./routeGenerator";
import { generateEventConsumersAndProducers } from "./eventGenerators";
import { generateServerAndTestFiles } from "./serverAndTestGenerators";
import { generateManifestFiles } from "./manifestGenerators";

export function compileFastAPIService(
  node: BackendNode,
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  testCases: SimulationTestCase[] = [],
): CompiledServiceResult {
  const serviceName = node.data.label || "Service";
  const sanitizedName =
    serviceName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "service";
  const port = node.data.port || "8080";
  const cors = node.data.cors ?? true;
  const corsOrigins = node.data.corsOrigins || "*";

  let nodeEndpoints = endpoints.filter((e) => e.nodeId === node.id);
  if (nodeEndpoints.length === 0 && node.data?.endpoints) {
    nodeEndpoints = node.data.endpoints as (Endpoint & { nodeId: string })[];
  }
  if (node.data?.routeGroups) {
    for (const group of node.data.routeGroups as any[]) {
      if (group.endpoints) {
        nodeEndpoints = [...nodeEndpoints, ...group.endpoints];
      }
    }
  }

  let nodeConsumedEvents = events.filter(
    (e) => e.nodeId === node.id && e.variant === "consume",
  );
  if (nodeConsumedEvents.length === 0 && node.data?.consumedEvents) {
    nodeConsumedEvents = (node.data.consumedEvents as any[]).map((e) => ({
      ...e,
      nodeId: node.id,
      variant: "consume",
    }));
  }

  let nodePublishedEvents = events.filter(
    (e) => e.nodeId === node.id && e.variant === "publish",
  );
  if (nodePublishedEvents.length === 0 && node.data?.publishedEvents) {
    nodePublishedEvents = (node.data.publishedEvents as any[]).map((e) => ({
      ...e,
      nodeId: node.id,
      variant: "publish",
    }));
  }

  const files: CompiledFile[] = [];

  // 1. Core Files
  files.push(...generateCoreFiles({ serviceName, port, corsOrigins }));

  // 2. Routes Files
  const routeResult = generateRoutes({
    node,
    serviceName,
    nodeEndpoints,
    allNodes,
    allEdges,
    endpoints,
  });
  files.push(...routeResult.files);

  // 3 & 4. Consumer and Producer Files
  files.push(
    ...generateEventConsumersAndProducers({
      node,
      serviceName,
      nodeConsumedEvents,
      nodePublishedEvents,
      allNodes,
      allEdges,
    }),
  );

  // 5 & 6. Server & Test Files
  files.push(
    ...generateServerAndTestFiles({
      node,
      serviceName,
      sanitizedName,
      cors,
      corsOrigins,
      nodeEndpoints,
    }),
  );

  // 7. Manifest & Configuration Files
  files.push(
    ...generateManifestFiles({
      node,
      serviceName,
      sanitizedName,
      port,
      nodeEndpoints,
      allNodes,
      allEdges,
      endpoints,
    }),
  );

  return {
    serviceId: node.id,
    serviceName,
    files,
  };
}

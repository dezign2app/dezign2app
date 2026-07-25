import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledFile, CompiledServiceResult } from "./types";
import { generateRoutes } from "./generators/routeGenerator";
import { generateConsumers } from "./generators/consumerGenerator";
import { generateProducers } from "./generators/producerGenerator";
import {
  generateLibFiles,
  generateServerFile,
  generateConfigFiles,
} from "./generators/configGenerator";

/**
 * Compiles a single Service Node into its modular microservice directory structure
 */
export function compileServiceNode(
  node: BackendNode,
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  testCases: SimulationTestCase[] = []
): CompiledServiceResult {
  const serviceName = node.data.label || "Service";
  const sanitizedName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const port = node.data.port || "8080";
  const cors = node.data.cors || false;
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

  let nodeConsumedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "consume");
  if (nodeConsumedEvents.length === 0 && node.data?.consumedEvents) {
    nodeConsumedEvents = (node.data.consumedEvents as any[]).map((e) => ({ ...e, nodeId: node.id, variant: "consume" }));
  }

  let nodePublishedEvents = events.filter((e) => e.nodeId === node.id && e.variant === "publish");
  if (nodePublishedEvents.length === 0 && node.data?.publishedEvents) {
    nodePublishedEvents = (node.data.publishedEvents as any[]).map((e) => ({ ...e, nodeId: node.id, variant: "publish" }));
  }

  const files: CompiledFile[] = [
    ...generateRoutes(serviceName, nodeEndpoints),
    ...generateConsumers(serviceName, nodeConsumedEvents),
    ...generateProducers(serviceName, nodePublishedEvents),
    ...generateLibFiles(),
    generateServerFile(serviceName, port, cors, corsOrigins),
    ...generateConfigFiles(node, sanitizedName, serviceName, port, cors),
  ];

  return {
    serviceId: node.id,
    serviceName,
    files,
  };
}

import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledWebClientResult } from "./types";
import {
  compileNextjsV16WebClient,
  resolveLinkedEndpoint,
  getServicePort,
  LinkedEndpointInfo,
} from "./webClients/nextjs/v16";

export { resolveLinkedEndpoint, getServicePort };
export type { LinkedEndpointInfo };

/**
 * Compiles a collection of WebClient nodes into a project based on techStack and techVersion
 */
export function compileWebClientNodes(
  webClientNodes: BackendNode[],
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & {
    nodeId: string;
    variant: "publish" | "consume";
  })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  projectName: string = "Blueprint Monorepo",
  testCases: SimulationTestCase[] = [],
): CompiledWebClientResult {
  return compileNextjsV16WebClient(
    webClientNodes,
    endpoints,
    events,
    allNodes,
    allEdges,
    projectName,
    testCases,
  );
}

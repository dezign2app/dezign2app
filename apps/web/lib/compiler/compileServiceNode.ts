import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource } from "@workspace/canvas/types";
import { CompiledServiceResult } from "./types";
import { compileExpressV4Service } from "./services/express/v4";
import { compileFastAPIService } from "./services/fastapi/v0";

/**
 * Compiles a single Service Node into its modular microservice directory structure based on selected tech and version
 */
export function compileServiceNode(
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
  const techStack = node.data.techStack || "express";
  const techVersion = node.data.techVersion || "4.x";

  switch (techStack) {
    case "fastapi":
      return compileFastAPIService(
        node,
        endpoints,
        events,
        allNodes,
        allEdges,
        testCases,
      );
    case "express":
    default:
      return compileExpressV4Service(
        node,
        endpoints,
        events,
        allNodes,
        allEdges,
        testCases,
      );
  }
}

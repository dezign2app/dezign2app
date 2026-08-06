import { BackendNode, BackendEdge, SimulationTestCase } from "@/types/canvas";
import { Endpoint, AnyMessagingResource, CompiledServiceResult, ReusableFunction } from "@workspace/canvas/types";
import { compileExpressV4Service } from "./services/express/v4";
import { compileFastAPIService } from "./services/fastapi/v0";
import { compileDatabaseNodes } from "./compileDatabaseNodes";
import { compileKafkaNodes } from "./compileKafkaNodes";

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
  dbFunctions: ReusableFunction[] = [],
  kafkaFunctions: ReusableFunction[] = [],
): CompiledServiceResult {
  const techStack = node.data.techStack || "express";

  if (dbFunctions.length === 0 && allNodes.length > 0) {
    const compiledDb = compileDatabaseNodes(allNodes, allEdges);
    dbFunctions = compiledDb.reusableFunctions || [];
  }

  if (kafkaFunctions.length === 0 && allNodes.length > 0) {
    const compiledKafka = compileKafkaNodes(allNodes, allEdges);
    kafkaFunctions = compiledKafka.reusableFunctions || [];
  }

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
        dbFunctions,
        kafkaFunctions,
      );
  }
}

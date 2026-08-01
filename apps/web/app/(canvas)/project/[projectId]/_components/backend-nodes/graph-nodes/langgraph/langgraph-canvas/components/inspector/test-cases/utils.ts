import type {
  LangGraphStateChannel,
  LangGraphStepConfig,
  JSONValue,
} from "@/types/canvas";
import type { SimulationTestCase } from "@workspace/canvas";

export type TraceEdge = {
  source: string;
  sourceHandle?: string | null;
  target: string;
};

export type TraceNode = {
  id: string;
  label: string;
};

export function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function is2xxStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export function getStableOutgoingEdge(
  sourceId: string,
  step: LangGraphStepConfig | undefined,
  edges: TraceEdge[],
  stepOrder: Map<string, number>,
  selectedBranchId?: string,
): TraceEdge | undefined {
  const outgoing = edges.filter((edge) => edge.source === sourceId);
  if (outgoing.length === 0) return undefined;

  if (step?.type === "router") {
    const branches = step.routerConfig?.branches || [];
    const branch =
      branches.find((candidate) => candidate.id === selectedBranchId) ||
      branches.find((candidate) => candidate.isDefault) ||
      branches[0];
    const branchEdge =
      branch && outgoing.find((edge) => edge.sourceHandle === branch.id);
    if (branchEdge) return branchEdge;
  }

  return [...outgoing].sort((left, right) => {
    const leftOrder = stepOrder.get(left.target) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = stepOrder.get(right.target) ?? Number.MAX_SAFE_INTEGER;
    return (
      leftOrder - rightOrder ||
      compareText(left.target, right.target) ||
      compareText(left.sourceHandle || "", right.sourceHandle || "")
    );
  })[0];
}

export function buildTracePath({
  graphEdges,
  graphNodeLabels,
  graphSteps,
  selectedCase,
}: {
  graphEdges: TraceEdge[];
  graphNodeLabels: Record<string, string>;
  graphSteps: LangGraphStepConfig[];
  selectedCase?: SimulationTestCase;
}): TraceNode[] {
  const stepOrder = new Map(graphSteps.map((step, index) => [step.id, index]));
  const path: TraceNode[] = [];
  const visited = new Set<string>();
  let currentId: string | undefined = "START";

  while (
    currentId &&
    !visited.has(currentId) &&
    path.length <= graphEdges.length + 1
  ) {
    visited.add(currentId);
    path.push({
      id: currentId,
      label:
        currentId === "START"
          ? "START"
          : graphNodeLabels[currentId] || currentId,
    });
    if (currentId === "END") break;

    const currentStep = graphSteps.find((step) => step.id === currentId);
    const nextEdge = getStableOutgoingEdge(
      currentId,
      currentStep,
      graphEdges,
      stepOrder,
      currentStep?.type === "router"
        ? selectedCase?.routerChoices?.[currentId]
        : undefined,
    );
    currentId = nextEdge?.target;
  }

  return path;
}

export function channelDefault(channel: LangGraphStateChannel): JSONValue {
  const val = channel.defaultValue;
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean" ||
    val === null
  ) {
    return val;
  }
  if (Array.isArray(val)) {
    return [];
  }
  if (typeof val === "object" && val !== null) {
    return {};
  }
  if (channel.type === "messages" || channel.type === "array") return [];
  if (channel.type === "object" || channel.type === "json") return {};
  if (channel.type === "number") return 0;
  if (channel.type === "boolean") return false;
  return "";
}

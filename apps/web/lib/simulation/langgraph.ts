import type { BackendNode, SimulationTestCase } from "@/types/canvas";
import type { SimulationTestCaseResult, SimulationTraceEntry } from "./types";
import { clone, getPath } from "./utils";

export function evaluateRouterBranch(
  branch: { field: string; operator: string; value?: string },
  state: Record<string, unknown>,
): boolean {
  const actual = getPath(state, branch.field.replace(/^state\./, ""));
  const expected = branch.value;
  switch (branch.operator) {
    case "eq":
      return String(actual) === String(expected);
    case "neq":
      return String(actual) !== String(expected);
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "contains":
      return Array.isArray(actual)
        ? actual.includes(expected)
        : String(actual ?? "").includes(String(expected ?? ""));
    case "is_not_null":
      return actual !== null && actual !== undefined;
    default:
      return false;
  }
}

/** Simulates a LangGraph graph, preserving every visited node and router edge in the trace. */
export async function simulateLangGraphTestCase(args: {
  graph: BackendNode;
  testCase: SimulationTestCase;
}): Promise<SimulationTestCaseResult> {
  const data = args.graph.data;
  const steps = data.graphSteps ?? [];
  const graphEdges = data.graphEdges ?? [];
  const stepOrder = new Map(steps.map((step, index) => [step.id, index]));
  const state: Record<string, unknown> = {
    ...(args.testCase.initialState ?? {}),
    ...((args.testCase.request?.body as Record<string, unknown> | undefined) ??
      {}),
  };
  const trace: SimulationTraceEntry[] = [
    {
      id: `${args.testCase.id}-start`,
      kind: "step",
      label: "START",
      status: "completed",
      nodeId: "START",
      edgeId: args.testCase.targetRouteId,
      input: clone(state),
    },
  ];
  const assertions: SimulationTestCaseResult["assertions"] = [];
  const visited = new Set<string>();
  const actualPath: string[] = ["START"];
  let executionStatus = 200;
  const firstEdge = graphEdges
    .filter((edge) => edge.source === "START")
    .sort(
      (left, right) =>
        (stepOrder.get(left.targets?.[0]?.id ?? "") ??
          Number.MAX_SAFE_INTEGER) -
          (stepOrder.get(right.targets?.[0]?.id ?? "") ??
            Number.MAX_SAFE_INTEGER) ||
        (left.targets?.[0]?.id ?? "").localeCompare(
          right.targets?.[0]?.id ?? "",
          undefined,
          { numeric: true },
        ) ||
        (left.sourceHandle ?? "").localeCompare(right.sourceHandle ?? ""),
    )[0];
  let currentId = firstEdge?.targets?.[0]?.id;
  let incomingEdge = firstEdge;
  let guard = 0;

  while (
    currentId &&
    currentId !== "END" &&
    guard++ < steps.length + graphEdges.length + 5
  ) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const step = steps.find((candidate) => candidate.id === currentId);
    const agent = data.agentDefinitions?.find(
      (candidate) => (candidate.id || candidate.agentId) === currentId,
    );
    const resource = [
      ...(data.customLlmNodes ?? []),
      ...(data.toolDefinitions ?? []),
      ...(data.middlewareDefinitions ?? []),
      ...(data.memoryDefinitions ?? []),
      ...(data.outputChannels ?? []),
    ].find((candidate) => candidate.id === currentId);
    if (
      !step &&
      !agent &&
      !resource &&
      !graphEdges.some((edge) => edge.source === currentId)
    )
      break;
    actualPath.push(currentId);
    const nodeTrace: SimulationTraceEntry = {
      id: `${args.testCase.id}-${currentId}`,
      kind: "step",
      label:
        step?.name ||
        agent?.name ||
        (resource as { label?: string; name?: string } | undefined)?.label ||
        (resource as { label?: string; name?: string } | undefined)?.name ||
        currentId,
      status: "completed",
      nodeId: currentId,
      edgeId: incomingEdge?.id,
      input: clone(state),
    };
    trace.push(nodeTrace);

    // LangGraph nodes are mocked during test execution. Feed the configured
    // output into the next node instead of attempting to execute the node.
    const configuredOutput = args.testCase.mocks?.[currentId];
    if (configuredOutput) {
      nodeTrace.output = clone(configuredOutput.returnData);
      executionStatus = configuredOutput.status ?? 200;
      if (
        configuredOutput.returnData &&
        typeof configuredOutput.returnData === "object" &&
        !Array.isArray(configuredOutput.returnData)
      ) {
        Object.assign(state, configuredOutput.returnData);
      }
      if (executionStatus >= 400) {
        nodeTrace.status = "failed";
        break;
      }
    }

    for (const update of step?.stateUpdates ?? []) {
      let value: unknown = update.value;
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {
          /* keep plain text state updates */
        }
      }
      state[update.channelKey] =
        update.mode === "append" && Array.isArray(state[update.channelKey])
          ? [...(state[update.channelKey] as unknown[]), value]
          : value;
    }

    const outgoing = graphEdges.filter((edge) => edge.source === currentId);
    const orderedOutgoing = [...outgoing].sort((left, right) => {
      const leftOrder =
        stepOrder.get(left.targets?.[0]?.id ?? "") ?? Number.MAX_SAFE_INTEGER;
      const rightOrder =
        stepOrder.get(right.targets?.[0]?.id ?? "") ?? Number.MAX_SAFE_INTEGER;
      return (
        leftOrder - rightOrder ||
        (left.targets?.[0]?.id ?? "").localeCompare(
          right.targets?.[0]?.id ?? "",
          undefined,
          { numeric: true },
        ) ||
        (left.sourceHandle ?? "").localeCompare(right.sourceHandle ?? "")
      );
    });
    let nextEdge = orderedOutgoing[0];
    if (step?.type === "router" && outgoing.length > 0) {
      const selectedBranchId = args.testCase.routerChoices?.[step.id];
      const selectedBranch = step.routerConfig?.branches?.find(
        (branch) => branch.id === selectedBranchId,
      );
      const matchingBranch =
        selectedBranch ||
        step.routerConfig?.branches?.find(
          (branch) => branch.isDefault || evaluateRouterBranch(branch, state),
        );
      nextEdge =
        outgoing.find((edge) => edge.sourceHandle === matchingBranch?.id) ||
        nextEdge;
      trace.push({
        id: `${args.testCase.id}-${step.id}-route`,
        kind: "step",
        label: `Router → ${matchingBranch?.label || "default"}`,
        status: "completed",
        nodeId: step.id,
        edgeId: nextEdge?.id,
        input: clone(state),
      });
    }
    incomingEdge = nextEdge;
    currentId = nextEdge?.targets?.[0]?.id;
  }

  if (
    currentId === "END" ||
    incomingEdge?.targets?.some(
      (target) => target.kind === "end" || target.id === "END",
    )
  ) {
    actualPath.push("END");
    trace.push({
      id: `${args.testCase.id}-end`,
      kind: "step",
      label: "END",
      status: "completed",
      nodeId: "END",
      edgeId: incomingEdge?.id,
      output: clone(state),
    });
  }

  assertions.push({
    name: "expected status",
    passed:
      args.testCase.expectedStatus === undefined ||
      args.testCase.expectedStatus === executionStatus,
    detail:
      args.testCase.expectedStatus === undefined
        ? undefined
        : `Expected ${args.testCase.expectedStatus}, received ${executionStatus}`,
  });
  assertions.push({
    name: "expected final state",
    passed:
      args.testCase.expectedState === undefined ||
      JSON.stringify(args.testCase.expectedState) === JSON.stringify(state),
    detail:
      args.testCase.expectedState === undefined
        ? undefined
        : "Final graph state differs from expected state",
  });
  assertions.push({
    name: "expected graph path",
    passed:
      args.testCase.expectedPath === undefined ||
      JSON.stringify(args.testCase.expectedPath) === JSON.stringify(actualPath),
    detail:
      args.testCase.expectedPath === undefined
        ? undefined
        : `Expected ${JSON.stringify(args.testCase.expectedPath)}, received ${JSON.stringify(actualPath)}`,
  });
  const passed = assertions.every((assertion) => assertion.passed);
  return {
    status: passed ? executionStatus : 422,
    statusText: passed
      ? executionStatus >= 400
        ? "Node Output Failed"
        : "OK"
      : "Assertion Failed",
    headers: { "x-simulated": "true" },
    body: clone(state),
    trace,
    testCaseId: args.testCase.id,
    testCaseName: args.testCase.name,
    assertions,
  };
}

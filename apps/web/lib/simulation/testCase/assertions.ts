import type { SimulationTestCase } from "@/types/canvas";
import type { SimulationResult, SimulationTraceEntry } from "../types";

export function evaluateTestCaseAssertions(args: {
  testCase: SimulationTestCase;
  result: SimulationResult;
  trace: SimulationTraceEntry[];
}) {
  const { testCase, result, trace } = args;

  const uniqueActualPath = trace
    .map((t) => t.nodeId)
    .filter(
      (id, i, arr): id is string => id !== undefined && id !== arr[i - 1],
    );

  const pathPassed =
    testCase.expectedPath === undefined ||
    JSON.stringify(testCase.expectedPath) ===
      JSON.stringify(uniqueActualPath);

  const assertions = [
    {
      name: "expected status",
      passed:
        testCase.expectedStatus === undefined ||
        testCase.expectedStatus === result.status,
      detail:
        testCase.expectedStatus === undefined
          ? undefined
          : `Expected ${testCase.expectedStatus}, received ${result.status}`,
    },
    {
      name: "expected body",
      passed:
        testCase.expectedBody === undefined ||
        JSON.stringify(testCase.expectedBody) ===
          JSON.stringify(result.body),
      detail:
        testCase.expectedBody === undefined
          ? undefined
          : "Response body differs from expected body",
    },
    {
      name: "expected path",
      passed: pathPassed,
      detail:
        testCase.expectedPath === undefined
          ? undefined
          : `Expected path ${JSON.stringify(testCase.expectedPath)}, but executed ${JSON.stringify(uniqueActualPath)}`,
    },
  ];

  const passed = assertions.every((assertion) => assertion.passed);

  return {
    assertions,
    passed,
  };
}

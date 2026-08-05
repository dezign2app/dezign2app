import type { SimulationTestCase } from "@/types/canvas";

export function buildLangGraphScenariosFile(testCases: SimulationTestCase[]): string {
  const scenarios = testCases.map((testCase) => ({
    id: testCase.id,
    name: testCase.name,
    targetRouteId: testCase.targetRouteId,
    request: testCase.request,
    initialState: testCase.initialState,
    routerChoices: testCase.routerChoices,
    mocks: testCase.mocks,
    expectedStatus: testCase.expectedStatus,
    expectedState: testCase.expectedState,
    expectedPath: testCase.expectedPath,
  }));

  return `/**
 * LangGraph test scenarios generated from the StartNode test-case configuration.
 * Node outputs are intentionally mocked; these scenarios do not execute node implementations.
 */
export const langGraphScenarios = ${JSON.stringify(scenarios, null, 2)} as const;
`;
}

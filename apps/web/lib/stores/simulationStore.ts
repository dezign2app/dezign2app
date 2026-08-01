import { create } from "zustand";
import type { SimulationTraceEntry } from "@/lib/simulation/runtime";
import type { SimulationTestCase } from "@/types/canvas";

export type SimulationStatus = "idle" | "running" | "completed" | "failed";

type SimulationState = {
  status: SimulationStatus;
  trace: SimulationTraceEntry[];
  activeIndex: number;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  currentNodeId?: string;
  currentEdgeId?: string;
  testExplorerOpen: boolean;
  toggleTestExplorer: () => void;
  terminalOpen: boolean;
  selectedCaseId?: string;
  testCases: SimulationTestCase[];
  setTestCases: (testCases: SimulationTestCase[]) => void;
  selectTestCase: (caseId: string | undefined) => void;
  clearSelectedTestCase: () => void;
  addTestCase: (testCase: SimulationTestCase) => void;
  updateTestCase: (id: string, updates: Partial<SimulationTestCase>) => void;
  deleteTestCase: (id: string) => void;
  start: (trace: SimulationTraceEntry[]) => void;
  toggleTerminal: () => void;
  clear: () => void;
};

let activeRun = 0;

export const useSimulationStore = create<SimulationState>((set) => ({
  status: "idle",
  trace: [],
  activeIndex: -1,
  activeNodeIds: [],
  activeEdgeIds: [],
  currentNodeId: undefined,
  currentEdgeId: undefined,
  testExplorerOpen: false,
  toggleTestExplorer: () =>
    set((state) => ({ testExplorerOpen: !state.testExplorerOpen })),
  terminalOpen: true,
  selectedCaseId: undefined,
  testCases: [],
  setTestCases: (testCases) => set({ testCases }),
  selectTestCase: (caseId) => set({ selectedCaseId: caseId }),
  clearSelectedTestCase: () => set({ selectedCaseId: undefined }),
  addTestCase: (testCase) =>
    set((state) => ({ testCases: [...state.testCases, testCase] })),
  updateTestCase: (id, updates) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === id ? { ...tc, ...updates } : tc,
      ),
    })),
  deleteTestCase: (id) =>
    set((state) => ({
      testCases: state.testCases.filter((tc) => tc.id !== id),
      selectedCaseId:
        state.selectedCaseId === id ? undefined : state.selectedCaseId,
    })),
  start: (trace) => {
    const run = ++activeRun;
    const first = trace[0];
    const firstFailed = first?.status === "failed";
    set({
      status:
        trace.length <= 1
          ? firstFailed
            ? "failed"
            : "completed"
          : firstFailed
            ? "failed"
            : "running",
      trace,
      activeIndex: first ? 0 : -1,
      activeNodeIds: first?.nodeId ? [first.nodeId] : [],
      activeEdgeIds: first?.edgeId ? [first.edgeId] : [],
      currentNodeId: first?.nodeId,
      currentEdgeId: first?.edgeId,
      terminalOpen: true,
    });

    if (firstFailed) return;

    let stopped = false;
    trace.slice(1).forEach((entry, offset) => {
      const index = offset + 1;
      window.setTimeout(() => {
        if (run !== activeRun || stopped) return;
        set((state) => {
          const visited = state.trace.slice(0, index + 1);
          const activeNodeIds = [
            ...new Set(
              visited.flatMap((item) => (item.nodeId ? [item.nodeId] : [])),
            ),
          ];
          const activeEdgeIds = [
            ...new Set(
              visited.flatMap((item) => (item.edgeId ? [item.edgeId] : [])),
            ),
          ];
          const isFailed = entry.status === "failed";
          const isFinal = index === trace.length - 1 || isFailed;

          if (isFailed) {
            stopped = true;
          }

          return {
            activeIndex: index,
            activeNodeIds,
            activeEdgeIds,
            currentNodeId: entry.nodeId,
            currentEdgeId: entry.edgeId,
            status: isFailed ? "failed" : isFinal ? "completed" : "running",
          };
        });
      }, index * 550);
    });
  },
  clear: () => {
    activeRun++;
    set({
      status: "idle",
      trace: [],
      activeIndex: -1,
      activeNodeIds: [],
      activeEdgeIds: [],
      currentNodeId: undefined,
      currentEdgeId: undefined,
    });
  },
  toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
}));

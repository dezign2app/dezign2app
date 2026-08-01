import type { Schema } from "@/types/canvas";

export type SimulationRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  params: Record<string, unknown>;
  body: unknown;
};

export type SimulationTraceEntry = {
  id: string;
  kind:
    | "client"
    | "endpoint"
    | "step"
    | "database"
    | "response"
    | "messaging"
    | "push";
  label: string;
  status: "completed" | "failed";
  nodeId?: string;
  edgeId?: string;
  input?: unknown;
  output?: unknown;
  detail?: string;
};

export type SimulationResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  trace: SimulationTraceEntry[];
};

export type SimulationTestCaseResult = SimulationResult & {
  testCaseId: string;
  testCaseName: string;
  assertions: Array<{ name: string; passed: boolean; detail?: string }>;
};

export type RuntimeContext = {
  request: SimulationRequest;
  data: unknown;
  variables: Record<string, unknown>;
  response?: { status?: number; body?: unknown };
};

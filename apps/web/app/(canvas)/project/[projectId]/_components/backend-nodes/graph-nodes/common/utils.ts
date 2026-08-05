import { useSimulationStore } from "@/lib/stores/simulationStore";
import { Endpoint, Parameter, JSONValue } from "@/types/canvas";

export const generateId = () => Math.random().toString(36).substring(2, 9);

export function useSimulationNodeState(nodeId: string) {
  const status = useSimulationStore((s) => s.status);
  const activeNodeIds = useSimulationStore((s) => s.activeNodeIds);
  const currentNodeId = useSimulationStore((s) => s.currentNodeId);
  const trace = useSimulationStore((s) => s.trace);
  const activeIndex = useSimulationStore((s) => s.activeIndex);

  const hasRun = status !== "idle";
  const isVisited = activeNodeIds.includes(nodeId);
  const isCurrent = currentNodeId === nodeId;

  const visitedTrace = trace.slice(
    0,
    activeIndex >= 0 ? activeIndex + 1 : trace.length,
  );
  const nodeEntries = visitedTrace.filter((t) => t.nodeId === nodeId);
  const hasFailed =
    nodeEntries.some((t) => t.status === "failed") ||
    (isCurrent && status === "failed");

  return { hasRun, isVisited, isCurrent, hasFailed, overallStatus: status };
}

export function getSimulationNodeBorderClass(
  simulation: ReturnType<typeof useSimulationNodeState>,
  selected: boolean,
  defaultBorder = "border-border",
) {
  if (!simulation.hasRun) {
    return selected ? "border-primary shadow-sm" : defaultBorder;
  }
  if (simulation.hasFailed) {
    return "border-destructive ring-2 ring-destructive ring-offset-2 ring-offset-background shadow-lg shadow-destructive/40 animate-pulse";
  }
  if (simulation.isCurrent) {
    return "border-sky-500 ring-2 ring-sky-500 ring-offset-2 ring-offset-background shadow-lg shadow-sky-500/40 animate-pulse";
  }
  if (simulation.isVisited) {
    return selected
      ? "border-emerald-500 ring-2 ring-emerald-500/50"
      : "border-emerald-500/80 shadow-md shadow-emerald-500/20";
  }
  return selected ? "border-primary opacity-50" : "border-border/40 opacity-40";
}

export function endpointInputParams(endpoint: Endpoint): Parameter[] {
  if (endpoint.params?.length)
    return endpoint.params.map((param) => ({
      ...param,
      value: param.value ?? param.defaultValue ?? "",
    }));
  return [...(endpoint.pathParams ?? []), ...(endpoint.queryParams ?? [])].map(
    (param) => ({
      ...param,
      key: param.name,
      value: param.value ?? param.defaultValue ?? "",
    }),
  );
}

export function endpointBodyTemplate(endpoint: Endpoint): string {
  if (endpoint.body) return endpoint.body;
  if (endpoint.requestBody?.rawJson) return endpoint.requestBody.rawJson;
  return "";
}

export function getInitialBody(endpoint: Endpoint): JSONValue | undefined {
  const template = endpointBodyTemplate(endpoint);
  if (!template) return undefined;
  try {
    return JSON.parse(template) as JSONValue;
  } catch {
    return undefined;
  }
}

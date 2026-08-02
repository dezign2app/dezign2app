import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Play, FlaskConical } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import type { SimulationTestCase, Endpoint, Parameter, JSONValue } from "@/types/canvas";

import { useSimulationStore } from "@/lib/stores/simulationStore";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import {
  generateId,
  getInitialBody,
  endpointInputParams,
} from "../backend-nodes/graph-nodes/shared";
import {
  simulateEndpoint,
  simulateTestCase,
} from "@/lib/simulation/runtime";

import { EventTestingHeader } from "./event-testing/EventTestingHeader";
import { SimulateTabContent } from "./event-testing/SimulateTabContent";
import { TestCasesTabContent } from "./event-testing/TestCasesTabContent";
import { resolveEndpoint, getDownstreamMocks } from "./event-testing/utils";
import type { SimulatedResponseData } from "./event-testing/SimulatedResponseView";

export interface EventTestingConfigProps {
  id: string; // The event ID
  nodeId: string;
  targetNodeId: string;
  endpointId: string;
  initialTab?: "trigger" | "test-cases";
}

function isJSONValue(val: unknown): val is JSONValue {
  if (val === null || typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return true;
  }
  if (Array.isArray(val)) {
    return val.every(isJSONValue);
  }
  if (typeof val === "object" && val !== null) {
    return Object.values(val).every(isJSONValue);
  }
  return false;
}

export const EventTestingConfig: React.FC<EventTestingConfigProps> = ({
  id,
  nodeId,
  targetNodeId,
  endpointId,
  initialTab = "trigger",
}) => {
  const paramsHook = useParams();
  const rawProjectId = paramsHook.projectId;
  const projectId = typeof rawProjectId === "string" ? (rawProjectId as Id<"projects">) : undefined;

  // Stores
  const testCases = useSimulationStore((s) => s.testCases);
  const addTestCase = useSimulationStore((s) => s.addTestCase);
  const updateTestCase = useSimulationStore((s) => s.updateTestCase);
  const deleteTestCase = useSimulationStore((s) => s.deleteTestCase);
  const selectTestCase = useSimulationStore((s) => s.selectTestCase);
  const startSimulation = useSimulationStore((state) => state.start);
  const clearSimulation = useSimulationStore((state) => state.clear);
  const selectedGlobalCaseId =
    useSimulationStore((state) => state.selectedCaseId) || "none";
  const activeIndex = useSimulationStore((state) => state.activeIndex);
  const simulationStatus = useSimulationStore((state) => state.status);

  const nodes = useBackendCanvasStore((s) => s.nodes);
  const edges = useBackendCanvasStore((s) => s.edges);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);

  // Mutations
  const upsertBackendTestCase = useMutation(api.canvas.upsertBackendTestCase);
  const removeBackendTestCase = useMutation(api.canvas.removeBackendTestCase);

  // Resolution
  const parentNode = nodes.find((n) => n.id === nodeId);
  const event = parentNode?.data?.events?.find((e) => e.id === id);
  const targetNode = nodes.find((n) => n.id === targetNodeId);

  const endpoint = resolveEndpoint(targetNode, endpointId, endpoints);
  const triggerTestCases = event
    ? testCases.filter((tc) => tc.targetEventId === event.id)
    : [];

  // Local state
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [newTcOpen, setNewTcOpen] = useState(false);
  const [newTcName, setNewTcName] = useState("");
  const didAutoSelect = useRef(false);

  const [headers, setHeaders] = useState<Parameter[]>([]);
  const [params, setParams] = useState<Parameter[]>([]);
  const [body, setBody] = useState<JSONValue | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SimulatedResponseData | null>(null);

  const isExecutionFinished =
    simulationStatus === "completed" ||
    simulationStatus === "failed" ||
    (response?.trace ? activeIndex >= response.trace.length - 1 : false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    didAutoSelect.current = false;
  }, [id]);

  useEffect(() => {
    if (
      !didAutoSelect.current &&
      triggerTestCases.length > 0 &&
      triggerTestCases[0]
    ) {
      didAutoSelect.current = true;
      selectTestCase(triggerTestCases[0].id);
    }
  }, [triggerTestCases.length, id, selectTestCase]);

  useEffect(() => {
    if (!endpoint) return;

    if (selectedGlobalCaseId !== "none") {
      const testCase = testCases.find((tc) => tc.id === selectedGlobalCaseId);
      if (testCase) {
        setHeaders(
          endpoint.headers?.map((h) => ({
            ...h,
            key: h.key ?? h.name,
            value: testCase.request?.headers?.[h.name] ?? h.defaultValue ?? "",
          })) || [],
        );
        setParams(
          endpointInputParams(endpoint).map((param) => ({
            ...param,
            value:
              testCase.request?.params?.[param.key || param.name] ??
              param.value ??
              "",
          })),
        );
        setBody(
          testCase.request?.body === undefined
            ? getInitialBody(endpoint)
            : testCase.request.body,
        );
        setResponse(null);
        return;
      }
    }

    setHeaders(
      endpoint.headers?.map((h) => ({
        ...h,
        key: h.key ?? h.name,
        value: h.value ?? h.defaultValue ?? "",
      })) || [],
    );
    setParams(endpointInputParams(endpoint));
    setBody(getInitialBody(endpoint));
    setResponse(null);
  }, [endpoint, selectedGlobalCaseId, testCases]);

  const loadCase = (caseId: string) => {
    selectTestCase(caseId === "none" ? undefined : caseId);
    const testCase = testCases.find((item) => item.id === caseId);
    if (!testCase || !endpoint) return;
    setHeaders(
      endpoint.headers?.map((h) => ({
        ...h,
        key: h.key ?? h.name,
        value: testCase.request?.headers?.[h.name] ?? h.defaultValue ?? "",
      })) || [],
    );
    setParams(
      endpointInputParams(endpoint).map((param) => ({
        ...param,
        value:
          testCase.request?.params?.[param.key || param.name] ??
          param.value ??
          "",
      })),
    );
    setBody(
      testCase.request?.body === undefined
        ? getInitialBody(endpoint)
        : testCase.request.body,
    );
  };

  const handleSend = async () => {
    if (!endpoint || !event || !targetNode) return;
    let parsedBody = body;
    try {
      if (typeof body === "string" && body.trim().startsWith("{")) {
        const jsonResult: unknown = JSON.parse(body);
        if (isJSONValue(jsonResult)) {
          parsedBody = jsonResult;
        }
      }
    } catch (e) {
      console.warn("Failed to parse body as JSON", e);
    }
    setLoading(true);
    setResponse(null);

    const queryParams: Record<string, string> = {};
    params.forEach((p) => {
      if (p.key) queryParams[p.key] = p.value || `[${p.type || "string"}]`;
    });
    const reqHeaders: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key) reqHeaders[h.key.toLowerCase()] = h.value || "";
    });

    const client = nodes.find((node) => node.id === nodeId);
    try {
      const selectedCase =
        selectedGlobalCaseId !== "none"
          ? testCases.find((t) => t.id === selectedGlobalCaseId)
          : undefined;
      const result = client
        ? await simulateTestCase({
            client,
            event,
            testCase: {
              id:
                selectedGlobalCaseId !== "none"
                  ? selectedGlobalCaseId
                  : "scratchpad",
              name: selectedCase?.name || "Test case",
              targetNodeId: client.id,
              request: {
                headers: reqHeaders,
                params: queryParams,
                body: parsedBody,
              },
              mocks: selectedCase?.mocks,
              expectedBody: selectedCase?.expectedBody,
              expectedStatus: selectedCase?.expectedStatus,
            },
            nodes,
            edges,
            endpoints,
          })
        : await simulateEndpoint({
            service: targetNode,
            endpoint,
            nodes,
            edges,
            request: {
              method: endpoint.type || "GET",
              path: endpoint.name || "/",
              headers: reqHeaders,
              params: queryParams,
              body: parsedBody,
            },
            sourceNodeId: nodeId,
            sourceEventId: event.id,
          });
      setResponse(result);
      startSimulation(result.trace);
    } catch (e) {
      console.error(e);
      toast.error("Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const mockables = getDownstreamMocks(
    endpoint,
    targetNode,
    nodes,
    edges,
    endpoints,
  );

  const handleCreateNew = (caseName: string) => {
    if (!endpoint || !event || !caseName.trim()) return;

    let expectedStatus = 200;
    if (
      typeof endpoint.simulationOutput === "object" &&
      endpoint.simulationOutput !== null &&
      "status" in endpoint.simulationOutput &&
      typeof (endpoint.simulationOutput as Record<string, unknown>).status === "number"
    ) {
      expectedStatus = (endpoint.simulationOutput as Record<string, unknown>).status as number;
    }

    let expectedBody: JSONValue | undefined;
    if (isJSONValue(endpoint.simulationOutput)) {
      expectedBody = endpoint.simulationOutput;
    } else if (endpoint.responseBody?.rawJson) {
      try {
        const parsed: unknown = JSON.parse(endpoint.responseBody.rawJson);
        if (isJSONValue(parsed)) {
          expectedBody = parsed;
        }
      } catch {
        expectedBody = undefined;
      }
    }

    const newCase: SimulationTestCase = {
      id: generateId(),
      name: caseName,
      targetNodeId: nodeId,
      targetEventId: event.id,
      request: { headers: {}, params: {}, body: getInitialBody(endpoint) },
      expectedStatus,
      expectedBody,
      mocks: {},
    };

    addTestCase(newCase);
    if (projectId) {
      upsertBackendTestCase({
        projectId,
        testCaseId: newCase.id,
        data: newCase,
      });
    }
  };

  const handleUpdateTc = (updated: SimulationTestCase) => {
    updateTestCase(updated.id, {
      name: updated.name,
      request: updated.request,
      expectedStatus: updated.expectedStatus,
      expectedBody: updated.expectedBody,
      mocks: updated.mocks,
    });
    if (projectId) {
      upsertBackendTestCase({
        projectId,
        testCaseId: updated.id,
        data: updated,
      });
    }
  };

  const handleDeleteTc = (tcId: string) => {
    deleteTestCase(tcId);
    if (projectId) {
      removeBackendTestCase({ projectId, testCaseId: tcId });
    }
    toast.success("Test case deleted");
  };

  if (!event || !endpoint) return null;

  const eventName = event.name;
  const eventEvent = "event" in event && typeof event.event === "string" ? event.event : undefined;

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12 font-sans">
      <EventTestingHeader
        event={event}
        endpoint={endpoint}
        targetNode={targetNode}
      />

      <div className="flex flex-col gap-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger
              value="trigger"
              className="text-sm flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-background! transition-all"
            >
              <Play className="w-4 h-4" />
              Simulate
            </TabsTrigger>
            <TabsTrigger
              value="test-cases"
              className="text-sm flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-background! transition-all"
            >
              <FlaskConical className="w-4 h-4" />
              Test Cases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trigger" className="m-0">
            <SimulateTabContent
              endpoint={endpoint}
              triggerTestCases={triggerTestCases}
              selectedGlobalCaseId={selectedGlobalCaseId}
              loadCase={loadCase}
              params={params}
              setParams={setParams}
              headers={headers}
              setHeaders={setHeaders}
              body={body}
              setBody={setBody}
              loading={loading}
              onSend={handleSend}
              response={response}
              isExecutionFinished={isExecutionFinished}
              activeIndex={activeIndex}
              onClearResponse={() => {
                setResponse(null);
                clearSimulation();
              }}
            />
          </TabsContent>

          <TabsContent value="test-cases" className="m-0">
            <TestCasesTabContent
              eventName={eventName}
              eventEvent={eventEvent}
              triggerTestCases={triggerTestCases}
              newTcOpen={newTcOpen}
              setNewTcOpen={setNewTcOpen}
              newTcName={newTcName}
              setNewTcName={setNewTcName}
              onCreateNew={handleCreateNew}
              onUpdateTc={handleUpdateTc}
              onDeleteTc={handleDeleteTc}
              endpoint={endpoint}
              mockables={mockables}
              parentNodeLabel={parentNode?.data?.label}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

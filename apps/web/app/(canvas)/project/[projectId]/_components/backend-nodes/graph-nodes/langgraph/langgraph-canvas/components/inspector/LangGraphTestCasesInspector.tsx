import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { Plus, Play, Sparkles } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { generateId } from "../../../../shared";
import { api } from "@workspace/backend/_generated/api";
import type { Id } from "@workspace/backend/_generated/dataModel";
import type {
  LangGraphInputChannel,
  LangGraphStateChannel,
  LangGraphStepConfig,
  JSONValue,
} from "@/types/canvas";
import type { SimulationTestCase } from "@workspace/canvas";
import type { ConnectedRouteInfo } from "../../../LangGraphNode";
import type { SimulationTestCaseResult } from "@/lib/simulation/runtime";

import { compareText, channelDefault } from "./test-cases/utils";
import { TestCaseAccordionHeader } from "./test-cases/TestCaseAccordionHeader";
import { LangGraphTestCaseEditor } from "./test-cases/LangGraphTestCaseEditor";
import { SimulateTabContent } from "./test-cases/SimulateTabContent";

type Props = {
  graphNodeId: string;
  inputChannels: LangGraphInputChannel[];
  stateChannels: LangGraphStateChannel[];
  graphSteps: LangGraphStepConfig[];
  graphEdges: Array<{
    source: string;
    sourceHandle?: string | null;
    target: string;
  }>;
  graphNodeLabels: Record<string, string>;
  connectedRoutes: ConnectedRouteInfo[];
  onRunTestCase?: (
    testCase: SimulationTestCase
  ) => Promise<SimulationTestCaseResult | void> | SimulationTestCaseResult | void;
};

export function LangGraphTestCasesInspector({
  graphNodeId,
  inputChannels,
  stateChannels,
  graphSteps,
  graphEdges,
  graphNodeLabels,
  connectedRoutes,
  onRunTestCase,
}: Props) {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const testCases = useSimulationStore((state) => state.testCases);
  const addTestCase = useSimulationStore((state) => state.addTestCase);
  const updateTestCase = useSimulationStore((state) => state.updateTestCase);
  const deleteTestCase = useSimulationStore((state) => state.deleteTestCase);
  const upsertBackendTestCase = useMutation(api.canvas.upsertBackendTestCase);
  const removeBackendTestCase = useMutation(api.canvas.removeBackendTestCase);

  const [activeTab, setActiveTab] = useState<string>("trigger");
  const [newTcOpen, setNewTcOpen] = useState(false);
  const [newTcName, setNewTcName] = useState("");

  const graphTestCases = useMemo(
    () =>
      testCases
        .filter((testCase) => testCase.targetNodeId === graphNodeId)
        .sort(
          (left, right) =>
            compareText(left.name, right.name) ||
            compareText(left.id, right.id)
        ),
    [testCases, graphNodeId]
  );

  const orderedRoutes = useMemo(
    () =>
      [...connectedRoutes].sort(
        (left, right) =>
          compareText(left.method, right.method) ||
          compareText(left.label, right.label) ||
          compareText(left.sourceNodeLabel, right.sourceNodeLabel) ||
          compareText(left.edgeId, right.edgeId)
      ),
    [connectedRoutes]
  );

  const defaultBody = useMemo(
    () =>
      inputChannels.reduce<Record<string, JSONValue>>((body, channel) => {
        body[channel.key] =
          channel.type === "number"
            ? 0
            : channel.type === "boolean"
            ? false
            : channel.type === "array" || channel.type === "messages"
            ? []
            : channel.type === "object" || channel.type === "json"
            ? {}
            : "";
        return body;
      }, {}),
    [inputChannels]
  );

  const defaultState = useMemo(
    () =>
      stateChannels.reduce<Record<string, JSONValue>>((state, channel) => {
        state[channel.key] = channelDefault(channel);
        return state;
      }, {}),
    [stateChannels]
  );

  const handleCreateNew = (caseName: string) => {
    if (!caseName.trim()) return;

    const newCase: SimulationTestCase = {
      id: generateId(),
      name: caseName.trim(),
      targetNodeId: graphNodeId,
      targetRouteId: orderedRoutes[0]?.edgeId,
      request: {
        headers: { "content-type": "application/json" },
        params: {},
        body: defaultBody,
      },
      initialState: defaultState,
      routerChoices: {},
      expectedStatus: 200,
      expectedState: defaultState,
      mocks: {},
    };

    addTestCase(newCase);
    if (projectId) {
      void upsertBackendTestCase({
        projectId,
        testCaseId: newCase.id,
        data: newCase,
      });
    }
    toast.success("Graph test case created");
  };

  const handleAutoGenerate = () => {
    const standardCase: SimulationTestCase = {
      id: generateId(),
      name: "Standard Flow - Success",
      targetNodeId: graphNodeId,
      targetRouteId: orderedRoutes[0]?.edgeId,
      request: {
        headers: { "content-type": "application/json" },
        params: {},
        body: defaultBody,
      },
      initialState: defaultState,
      routerChoices: {},
      expectedStatus: 200,
      expectedState: defaultState,
      mocks: {},
    };

    const edgeCase: SimulationTestCase = {
      id: generateId(),
      name: "Edge Case - Branch Validation",
      targetNodeId: graphNodeId,
      targetRouteId: orderedRoutes[0]?.edgeId,
      request: {
        headers: { "content-type": "application/json" },
        params: {},
        body: defaultBody,
      },
      initialState: defaultState,
      routerChoices: {},
      expectedStatus: 200,
      expectedState: defaultState,
      mocks: {},
    };

    addTestCase(standardCase);
    addTestCase(edgeCase);

    if (projectId) {
      void upsertBackendTestCase({
        projectId,
        testCaseId: standardCase.id,
        data: standardCase,
      });
      void upsertBackendTestCase({
        projectId,
        testCaseId: edgeCase.id,
        data: edgeCase,
      });
    }

    toast.success("Auto-generated Standard & Edge Case graph test cases");
  };

  const handleUpdateTc = (updated: SimulationTestCase) => {
    updateTestCase(updated.id, updated);
    if (projectId) {
      void upsertBackendTestCase({
        projectId,
        testCaseId: updated.id,
        data: updated,
      });
    }
  };

  const handleDeleteTc = (tcId: string) => {
    deleteTestCase(tcId);
    if (projectId) {
      void removeBackendTestCase({ projectId, testCaseId: tcId });
    }
    toast.success("Test case deleted");
  };

  return (
    <div className="border-t border-border/60 p-4 flex flex-col gap-4 shrink-0 font-sans">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger
            value="trigger"
            className="text-xs flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-background! transition-all font-semibold"
          >
            <Play className="w-3.5 h-3.5" />
            Simulate
          </TabsTrigger>
          <TabsTrigger
            value="test-cases"
            className="text-xs flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-background! transition-all font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Test Cases
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Simulate */}
        <TabsContent value="trigger" className="flex flex-col gap-4 p-0 m-0">
          <SimulateTabContent
            graphNodeId={graphNodeId}
            graphTestCases={graphTestCases}
            orderedRoutes={orderedRoutes}
            onRunTestCase={onRunTestCase}
          />
        </TabsContent>

        {/* Tab 2: Test Cases */}
        <TabsContent value="test-cases" className="flex flex-col gap-4 p-0 m-0">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Saved Cases
            </h4>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                onClick={handleAutoGenerate}
              >
                <Sparkles className="h-3 w-3 mr-1 text-indigo-500" /> Auto-Generate
              </Button>

              <Dialog open={newTcOpen} onOpenChange={setNewTcOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    onClick={() =>
                      setNewTcName(`Graph Test ${graphTestCases.length + 1}`)
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> New
                  </Button>
                </DialogTrigger>
                <DialogContent className="font-sans">
                  <DialogHeader>
                    <DialogTitle>Create Graph Test Case</DialogTitle>
                  </DialogHeader>
                  <div className="py-2 flex flex-col gap-2">
                    <Label className="text-xs font-mono text-muted-foreground">
                      Test Case Name
                    </Label>
                    <Input
                      value={newTcName}
                      onChange={(e) => setNewTcName(e.target.value)}
                      placeholder="Enter test case name"
                      autoFocus
                      className="text-xs h-8 bg-background"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTcName.trim()) {
                          handleCreateNew(newTcName);
                          setNewTcOpen(false);
                        }
                      }}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleCreateNew(newTcName);
                        setNewTcOpen(false);
                      }}
                      disabled={!newTcName.trim()}
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Accordion List or Empty State */}
          {graphTestCases.length > 0 ? (
            <Accordion type="multiple" className="w-full flex flex-col gap-2">
              {graphTestCases.map((tc) => (
                <AccordionItem
                  key={tc.id}
                  value={tc.id}
                  className="bg-background border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="text-xs font-semibold px-3 py-2.5 hover:bg-secondary/10 hover:no-underline">
                    <TestCaseAccordionHeader
                      tc={tc}
                      onUpdateName={(newName) =>
                        handleUpdateTc({ ...tc, name: newName })
                      }
                    />
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 pt-0">
                    <LangGraphTestCaseEditor
                      testCase={tc}
                      triggerLabel="LangGraph Agent / Start Trigger"
                      orderedRoutes={orderedRoutes}
                      inputChannels={inputChannels}
                      stateChannels={stateChannels}
                      graphSteps={graphSteps}
                      graphEdges={graphEdges}
                      graphNodeLabels={graphNodeLabels}
                      defaultState={defaultState}
                      defaultBody={defaultBody}
                      onSave={handleUpdateTc}
                      onDelete={() => handleDeleteTc(tc.id)}
                      onRunTestCase={onRunTestCase}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-xs text-muted-foreground p-4 text-center border rounded-lg border-dashed">
              No test cases saved for this graph yet. Click New or Auto-Generate to create one.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

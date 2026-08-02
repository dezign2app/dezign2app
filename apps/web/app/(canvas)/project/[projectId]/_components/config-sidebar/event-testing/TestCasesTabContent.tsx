import React from "react";
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
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Plus, FlaskConical } from "lucide-react";
import type { SimulationTestCase, Endpoint } from "@/types/canvas";
import { TestCaseEditor } from "../TestCaseEditor";
import { TestCaseAccordionHeader } from "./TestCaseAccordionHeader";
import type { MockableItem } from "./utils";

interface TestCasesTabContentProps {
  eventName?: string;
  eventEvent?: string;
  triggerTestCases: SimulationTestCase[];
  newTcOpen: boolean;
  setNewTcOpen: (open: boolean) => void;
  newTcName: string;
  setNewTcName: (name: string) => void;
  onCreateNew: (name: string) => void;
  onUpdateTc: (tc: SimulationTestCase) => void;
  onDeleteTc: (id: string) => void;
  endpoint: Endpoint;
  mockables: MockableItem[];
  parentNodeLabel?: string;
}

export const TestCasesTabContent: React.FC<TestCasesTabContentProps> = ({
  eventName,
  eventEvent,
  triggerTestCases,
  newTcOpen,
  setNewTcOpen,
  newTcName,
  setNewTcName,
  onCreateNew,
  onUpdateTc,
  onDeleteTc,
  endpoint,
  mockables,
  parentNodeLabel,
}) => {
  return (
    <div className="flex flex-col gap-4 p-1 m-0">
      <div className="flex items-center justify-between pb-3 border-b">
        <h4 className="text-sm font-semibold text-foreground">
          Saved Cases
        </h4>
        <Dialog open={newTcOpen} onOpenChange={setNewTcOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs px-3 shadow-sm"
              onClick={() =>
                setNewTcName(`Test for ${eventName || eventEvent}`)
              }
            >
              <Plus className="h-4 w-4 mr-1.5" /> New Test Case
            </Button>
          </DialogTrigger>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Create Test Case</DialogTitle>
            </DialogHeader>
            <div className="py-4 flex flex-col gap-3">
              <Label className="text-sm font-medium text-foreground">
                Test Case Name
              </Label>
              <Input
                value={newTcName}
                onChange={(e) => setNewTcName(e.target.value)}
                placeholder="Enter test case name"
                autoFocus
                className="text-sm h-10 bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTcName.trim()) {
                    onCreateNew(newTcName);
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
                  onCreateNew(newTcName);
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

      {triggerTestCases.length > 0 ? (
        <Accordion
          type="multiple"
          className="w-full flex flex-col gap-3 border-none"
        >
          {triggerTestCases.map((tc) => (
            <AccordionItem
              key={tc.id}
              value={tc.id}
              className="bg-card/50 border rounded-xl overflow-hidden shadow-sm backdrop-blur-sm"
            >
              <AccordionTrigger className="text-sm font-semibold px-4 py-3 hover:bg-secondary/20 hover:no-underline">
                <TestCaseAccordionHeader
                  tc={tc}
                  onUpdateName={(newName) =>
                    onUpdateTc({ ...tc, name: newName })
                  }
                />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <TestCaseEditor
                  initialCase={tc}
                  endpoint={endpoint}
                  mockables={mockables}
                  triggerLabel={`${parentNodeLabel || "Page"} / ${eventName || eventEvent || "Event"} Trigger`}
                  onSave={onUpdateTc}
                  onDelete={() => onDeleteTc(tc.id)}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-sm text-muted-foreground p-8 flex flex-col items-center justify-center text-center border rounded-xl bg-card/30 border-dashed">
          <FlaskConical className="w-8 h-8 text-muted-foreground/30 mb-3" />
          No test cases saved for this event yet.
          <span className="text-xs mt-1">
            Create one to test edge cases and mocks.
          </span>
        </div>
      )}
    </div>
  );
};

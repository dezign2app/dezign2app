import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";

interface TestCaseDialogsProps {
  projectId: string;
  caseNameDialog: { mode: "create" | "rename"; value: string } | null;
  setCaseNameDialog: React.Dispatch<
    React.SetStateAction<{ mode: "create" | "rename"; value: string } | null>
  >;
  deleteCaseOpen: boolean;
  setDeleteCaseOpen: (open: boolean) => void;
}

export const TestCaseDialogs: React.FC<TestCaseDialogsProps> = ({
  projectId,
  caseNameDialog,
  setCaseNameDialog,
  deleteCaseOpen,
  setDeleteCaseOpen,
}) => {
  const selectedCaseId = useSimulationStore((state) => state.selectedCaseId);
  const testCases = useSimulationStore((state) => state.testCases);
  const selectTestCase = useSimulationStore((state) => state.selectTestCase);
  const addTestCase = useSimulationStore((state) => state.addTestCase);
  const updateTestCase = useSimulationStore((state) => state.updateTestCase);
  const deleteTestCase = useSimulationStore((state) => state.deleteTestCase);

  const upsertBackendTestCase = useMutation(api.canvas.upsertBackendTestCase);
  const removeBackendTestCase = useMutation(api.canvas.removeBackendTestCase);

  const selectedCaseEntry = testCases.find(
    (testCase) => testCase.id === selectedCaseId,
  );

  return (
    <>
      <Dialog
        open={caseNameDialog !== null}
        onOpenChange={(open) => !open && setCaseNameDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {caseNameDialog?.mode === "rename"
                ? "Rename test case"
                : "Create test case"}
            </DialogTitle>
            <DialogDescription>
              Choose the name shown in the canvas test-case selector.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={caseNameDialog?.value ?? ""}
            onChange={(event) =>
              setCaseNameDialog((current) =>
                current ? { ...current, value: event.target.value } : current,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter")
                event.currentTarget.form?.requestSubmit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCaseNameDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const name = caseNameDialog?.value.trim();
                if (!name) return;
                const mode = caseNameDialog?.mode;
                if (mode === "create") {
                  const nextCase = {
                    id: `case-${Date.now()}`,
                    name,
                    targetNodeId: "",
                    request: { body: null },
                    enabled: true,
                  };
                  addTestCase(nextCase);
                  selectTestCase(nextCase.id);
                  upsertBackendTestCase({
                    projectId: projectId as Id<"projects">,
                    testCaseId: nextCase.id,
                    data: nextCase,
                  });
                } else if (selectedCaseEntry) {
                  updateTestCase(selectedCaseId!, { name });
                  upsertBackendTestCase({
                    projectId: projectId as Id<"projects">,
                    testCaseId: selectedCaseId!,
                    data: { ...selectedCaseEntry, name },
                  });
                }
                setCaseNameDialog(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteCaseOpen} onOpenChange={setDeleteCaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove “{selectedCaseEntry?.name}” from the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedCaseEntry) return;
                deleteTestCase(selectedCaseId!);
                removeBackendTestCase({
                  projectId: projectId as Id<"projects">,
                  testCaseId: selectedCaseId!,
                });
                setDeleteCaseOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

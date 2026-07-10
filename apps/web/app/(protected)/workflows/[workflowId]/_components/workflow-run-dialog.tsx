"use client";

import React from "react";
import { PlayCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Spinner } from "@workspace/ui/components/spinner";
import { Textarea } from "@workspace/ui/components/textarea";

interface WorkflowRunDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  runInputValue: string;
  onRunInputChange: (value: string) => void;
  isStartingRun: boolean;
  canRunWorkflow: boolean;
  onRunWorkflow: () => void;
}

export const WorkflowRunDialog = ({
  isOpen,
  onOpenChange,
  runInputValue,
  onRunInputChange,
  isStartingRun,
  canRunWorkflow,
  onRunWorkflow,
}: WorkflowRunDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Run current draft</DialogTitle>
          <DialogDescription>
            Manual tests execute the current draft version. Provide an optional
            JSON payload to expose as <code>{"{{input}}"}</code> in the run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            placeholder='e.g. { "userId": 123 }'
            value={runInputValue}
            onChange={(e) => onRunInputChange(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isStartingRun}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canRunWorkflow} onClick={onRunWorkflow}>
            {isStartingRun ? (
              <Spinner className="mr-2 size-3" />
            ) : (
              <PlayCircle className="mr-2 size-3.5" />
            )}
            {isStartingRun ? "Starting run..." : "Execute test run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

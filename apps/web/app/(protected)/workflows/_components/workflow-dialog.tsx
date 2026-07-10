"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Doc } from "@workspace/backend/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WorkflowDialogProps {
  workflow?: Doc<"workflows">;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WorkflowDialog({
  workflow,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: WorkflowDialogProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [name, setName] = useState(workflow?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const isEditing = !!workflow;

  const createWorkflow = useMutation(api.workflows.crud.createWorkflow);
  const renameWorkflow = useMutation(api.workflows.crud.renameWorkflow);

  useEffect(() => {
    setName(workflow?.name ?? "");
  }, [workflow, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing) {
        await renameWorkflow({
          workflowId: workflow._id,
          name: name.trim(),
        });
        toast.success("Workflow renamed");
      } else {
        const workflowId = await createWorkflow({
          name: name.trim(),
        });
        toast.success("Workflow created");
        router.push(`/workflows/${workflowId}`);
      }

      setOpen(false);
    } catch {
      toast.error(
        isEditing ? "Failed to rename workflow" : "Failed to create workflow",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Rename Workflow" : "Create Workflow"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the workflow name without changing its draft or published versions."
                : "Create a new workflow with a draft version and starter graph."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="workflow-name">Name</Label>
              <Input
                id="workflow-name"
                name="workflow-name"
                placeholder="Lead Qualification"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

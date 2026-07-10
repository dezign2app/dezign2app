"use client";

import React, { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock3,
  Pencil,
  Rocket,
  Trash2,
  Workflow,
} from "lucide-react";
import { api } from "@workspace/backend/_generated/api";
import { Doc } from "@workspace/backend/_generated/dataModel";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
import { WorkflowDialog } from "./workflow-dialog";

dayjs.extend(relativeTime);

interface WorkflowCardProps {
  workflow: Doc<"workflows">;
  isReadOnly: boolean;
  onBlockedAction: () => void;
}

export const WorkflowCard = ({
  workflow,
  isReadOnly,
  onBlockedAction,
}: WorkflowCardProps) => {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteWorkflow = useMutation(api.workflows.crud.deleteWorkflow);

  const updatedAtText =
    dayjs(workflow.updatedAt).fromNow() === "a few seconds ago"
      ? "Just now"
      : dayjs(workflow.updatedAt).fromNow();

  const handleDelete = async () => {
    if (isReadOnly) {
      onBlockedAction();
      return;
    }

    setIsDeleting(true);

    try {
      await deleteWorkflow({
        workflowId: workflow._id,
      });
      setIsDeleteOpen(false);
      toast.success("Workflow deleted");
    } catch {
      toast.error("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card/70 transition-shadow hover:shadow-lg">
        <Link href={`/workflows/${workflow._id}`} className="block">
          <CardHeader className="border-b pb-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl border bg-background shadow-sm">
                <Workflow className="size-5" />
              </div>
              <Badge variant="outline" className="gap-1">
                <Clock3 className="size-3" />
                {updatedAtText}
              </Badge>
            </div>
            <CardTitle className="truncate text-base">
              {workflow.name}
            </CardTitle>
            <CardDescription>
              Draft workspace with immutable published snapshots and activation
              state.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Draft</Badge>
              <Badge variant="outline">
                {workflow.publishedVersionId ? `Published` : `Unpublished`}
              </Badge>

              {workflow.activeVersionId ? (
                <Badge variant="default" className="gap-1">
                  <Rocket className="size-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="font-medium text-foreground">Next Publish</p>
                <p>v{workflow.nextVersionNumber}</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="font-medium text-foreground">Published</p>
                <p>{workflow.publishedVersionId ? "Ready" : "No"}</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="font-medium text-foreground">Automation</p>
                <p>{workflow.activeVersionId ? "On" : "Off"}</p>
              </div>
            </div>
          </CardContent>
        </Link>

        <CardFooter className="justify-between border-t pt-4">
          <Button variant="ghost" asChild>
            <Link href={`/workflows/${workflow._id}`}>
              Open Editor
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                isReadOnly ? onBlockedAction() : setIsRenameOpen(true)
              }
            >
              <Pencil className="size-3.5" />
              Rename
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                isReadOnly ? onBlockedAction() : setIsDeleteOpen(true)
              }
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>

      <WorkflowDialog
        workflow={workflow}
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the workflow from active management. Existing
              versions and run history stay intact for auditability.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

"use client";

import React from "react";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useSubscriptionAccess } from "@/providers/subscription-access-context";
import { WorkflowDialog } from "./workflow-dialog";

export const WorkflowListHeader = () => {
  const { isReadOnly, showPaywall } = useSubscriptionAccess();

  return (
    <div className="sticky top-0 z-50 flex w-full items-center justify-between border-b bg-background/80 px-10 py-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-muted/50">
          <Workflow className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Manage workflow drafts, publishing, and activation.
          </p>
        </div>
      </div>

      {isReadOnly ? (
        <Button variant="outline" onClick={() => showPaywall(true)}>
          New Workflow
          <Plus className="size-4" />
        </Button>
      ) : (
        <WorkflowDialog
          trigger={
            <Button variant="outline">
              New Workflow
              <Plus className="size-4" />
            </Button>
          }
        />
      )}
    </div>
  );
};

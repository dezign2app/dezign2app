import React from "react";
import { WorkflowListHeader } from "./workflow-list-header";
import { WorkflowsGrid } from "./workflows-grid";

export const WorkflowsListView = () => {
  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      <WorkflowListHeader />
      <WorkflowsGrid />
    </div>
  );
};

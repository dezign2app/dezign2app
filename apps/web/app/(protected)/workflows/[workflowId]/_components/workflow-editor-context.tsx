"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useWorkflowEditor } from "../hooks/use-workflow-editor";

type WorkflowEditorContextType = ReturnType<typeof useWorkflowEditor>;

const WorkflowEditorContext = createContext<WorkflowEditorContextType | null>(null);

export const WorkflowEditorProvider = ({
  children,
  workflowId,
}: {
  children: ReactNode;
  workflowId: string;
}) => {
  const workflowEditor = useWorkflowEditor(workflowId);
  return (
    <WorkflowEditorContext.Provider value={workflowEditor}>
      {children}
    </WorkflowEditorContext.Provider>
  );
};

export const useWorkflowEditorContext = () => {
  const context = useContext(WorkflowEditorContext);
  if (!context) {
    throw new Error(
      "useWorkflowEditorContext must be used within a WorkflowEditorProvider",
    );
  }
  return context;
};

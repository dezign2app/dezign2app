import React from "react";
import { WorkflowEditorPlaceholder } from "../_components/workflow-editor-placeholder";

const WorkflowEditorPage = async ({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) => {
  const { workflowId } = await params;

  return <WorkflowEditorPlaceholder workflowId={workflowId} />;
};

export default WorkflowEditorPage;

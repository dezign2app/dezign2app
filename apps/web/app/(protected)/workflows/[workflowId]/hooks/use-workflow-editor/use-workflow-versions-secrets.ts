import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@workspace/backend/_generated/api";
import type { Id } from "@workspace/backend/_generated/dataModel";
import type { WorkflowBottomTab } from "../../_components/workflow-editor-types";

interface UseWorkflowVersionsSecretsOptions {
  workflowId: string;
  isReadOnly: boolean;
  flushDraftSave: () => Promise<{
    compileStatus: string;
    compileErrors: string[];
  } | null>;
  setActiveBottomTab: (tab: WorkflowBottomTab) => void;
  handleBlockedAction: () => void;
}

export const useWorkflowVersionsSecrets = ({
  workflowId,
  isReadOnly,
  flushDraftSave,
  setActiveBottomTab,
  handleBlockedAction,
}: UseWorkflowVersionsSecretsOptions) => {
  const publishWorkflow = useMutation(api.workflows.versions.publishWorkflow);
  const unpublishWorkflow = useMutation(
    api.workflows.versions.unpublishWorkflow,
  );
  const restoreWorkflowVersion = useMutation(
    api.workflows.versions.restoreWorkflowVersion,
  );
  const deleteWorkflowVersion = useMutation(
    api.workflows.versions.deleteWorkflowVersion,
  );
  const updateVersionMessage = useMutation(
    api.workflows.versions.updateVersionMessage,
  );
  const upsertWorkflowSecretMutation = useMutation(
    api.workflows.secrets.upsertWorkflowSecret,
  );
  const deleteWorkflowSecretMutation = useMutation(
    api.workflows.secrets.deleteWorkflowSecret,
  );

  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const handlePublish = async (message?: string) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    setIsPublishing(true);
    try {
      const saveResult = await flushDraftSave();

      if (!saveResult || saveResult.compileStatus !== "valid") {
        setActiveBottomTab("validation");
        toast.error(
          "Workflow has validation errors. Fix them before publishing.",
        );
        return;
      }

      await publishWorkflow({
        workflowId: workflowId as Id<"workflows">,
        message,
      });

      toast.success("Workflow published successfully");
      setActiveBottomTab("versions");
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish workflow");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }
    setIsUnpublishing(true);
    try {
      await unpublishWorkflow({ workflowId: workflowId as Id<"workflows"> });
      toast.success("Workflow unpublished successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to unpublish workflow");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleRestoreVersion = async (versionId: Id<"workflow_versions">) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    try {
      await restoreWorkflowVersion({
        workflowId: workflowId as Id<"workflows">,
        versionId,
      });

      toast.success("Workflow restored to version");
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore workflow version");
    }
  };

  const handleDeleteVersion = async (versionId: Id<"workflow_versions">) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    try {
      await deleteWorkflowVersion({
        workflowId: workflowId as Id<"workflows">,
        versionId,
      });

      toast.success("Workflow version deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete workflow version");
    }
  };

  const handleUpdateVersionMessage = async (
    versionId: Id<"workflow_versions">,
    message: string,
  ) => {
    if (isReadOnly) {
      handleBlockedAction();
      return;
    }

    try {
      await updateVersionMessage({
        workflowId: workflowId as Id<"workflows">,
        versionId,
        message,
      });

      toast.success("Version message updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update version message");
    }
  };

  const upsertWorkflowSecret = (
    name: string,
    value: string | undefined,
    provider?: string,
    description?: string,
    secretId?: Id<"workflow_secrets">,
  ) =>
    upsertWorkflowSecretMutation({
      workflowId: workflowId as Id<"workflows">,
      name,
      value,
      provider,
      description,
      secretId,
    }).then(() => {
      toast.success(`Secret ${name} saved`);
    });

  const deleteWorkflowSecret = (secretId: Id<"workflow_secrets">) =>
    deleteWorkflowSecretMutation({
      workflowId: workflowId as Id<"workflows">,
      secretId,
    }).then(() => {
      toast.success("Secret deleted");
    });

  return {
    isPublishing,
    isUnpublishing,
    handlePublish,
    handleUnpublish,
    handleRestoreVersion,
    handleDeleteVersion,
    handleUpdateVersionMessage,
    upsertWorkflowSecret,
    deleteWorkflowSecret,
  };
};

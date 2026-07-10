"use client";

import React from "react";
import { Eye, EyeOff, KeyRound, Plus, ShieldCheck, Trash2, Pencil } from "lucide-react";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Spinner } from "@workspace/ui/components/spinner";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { WorkflowSecret } from "../workflow-editor-types";

import { useWorkflowEditorContext } from "../workflow-editor-context";

interface SecretsTabProps {
  onStartEdit: (secret: WorkflowSecret) => void;
}

const formatTimestamp = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);

export const SecretsTab = ({ onStartEdit }: SecretsTabProps) => {
  const {
    workflowSecrets = [],
    upsertWorkflowSecret: onUpsertSecret,
    deleteWorkflowSecret: onDeleteSecret,
  } = useWorkflowEditorContext();
  const [newSecretName, setNewSecretName] = React.useState("");
  const [newSecretValue, setNewSecretValue] = React.useState("");
  const [isUpserting, setIsUpserting] = React.useState(false);
  const [showSecretValue, setShowSecretValue] = React.useState(false);

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretName || !newSecretValue) return;

    setIsUpserting(true);
    try {
      await onUpsertSecret(
        newSecretName,
        newSecretValue,
        undefined,
        `Workflow secret: ${newSecretName}`,
      );
      setNewSecretName("");
      setNewSecretValue("");
    } finally {
      setIsUpserting(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px]">
      <ScrollArea className="h-full border-r border-sidebar-border overflow-y-auto">
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/80">
              Organization Secrets
            </h3>
          </div>

          <div className="grid gap-2 border-t border-sidebar-border pt-4">
            {workflowSecrets.length > 0 ? (
              workflowSecrets.map((secret) => (
                <div
                  key={secret._id}
                  className="group flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/20 px-4 py-3 transition-colors hover:bg-sidebar-accent/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar shadow-sm">
                      <KeyRound className="size-3.5 text-sidebar-foreground/60" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {secret.name}
                      </p>
                      <p className="text-xs text-sidebar-foreground/45">
                        Added {formatTimestamp(secret.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-sidebar-foreground/40 hover:text-sidebar-foreground"
                      onClick={() => onStartEdit(secret)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-sidebar-foreground/40 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Secret</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the secret{" "}
                            <span className="font-semibold text-foreground">
                              {secret.name}
                            </span>
                            ? This action cannot be undone and may break
                            workflows using this secret.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => onDeleteSecret(secret._id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sidebar-foreground/45">
                <KeyRound className="mb-3 size-8 opacity-20" />
                <p className="text-sm">No organization secrets yet.</p>
                <p className="text-xs">
                  Add a secret to use it in LLM or API nodes.
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="flex min-h-0 flex-col bg-sidebar-accent/30 p-4">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/60">
          Add Secret
        </h3>
        <form onSubmit={handleUpsert} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-sidebar-foreground/50">
              Secret Name
            </Label>
            <Input
              value={newSecretName}
              onChange={(e) => setNewSecretName(e.target.value)}
              placeholder="e.g. openai_key"
              className="h-8 border-sidebar-border bg-sidebar text-xs font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-sidebar-foreground/50">
              Secret Value
            </Label>
            <div className="relative">
              <Input
                type={showSecretValue ? "text" : "password"}
                value={newSecretValue}
                onChange={(e) => setNewSecretValue(e.target.value)}
                placeholder="••••••••••••••••"
                className="h-8 border-sidebar-border bg-sidebar pr-8 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecretValue(!showSecretValue)}
                className="absolute right-2.5 top-1.5 text-sidebar-foreground/40 hover:text-sidebar-foreground"
              >
                {showSecretValue ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isUpserting || !newSecretName || !newSecretValue}
            className="w-full"
            size="sm"
          >
            {isUpserting ? (
              <Spinner className="size-3" />
            ) : (
              <Plus className="mr-2 size-3.5" />
            )}
            {isUpserting ? "Saving..." : "Save Secret"}
          </Button>
          <p className="text-center text-xs text-sidebar-foreground/40">
            Secrets are encrypted using AES-GCM.
          </p>
        </form>
      </div>
    </div>
  );
};

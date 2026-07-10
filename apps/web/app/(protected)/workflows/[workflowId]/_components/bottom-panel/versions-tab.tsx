import React, { useState } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { History, RotateCcw, Clock, Trash2, MessageCircle, Pencil } from "lucide-react";
import { Doc, Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Badge } from "@workspace/ui/components/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";

import { useWorkflowEditorContext } from "../workflow-editor-context";

const formatTimestamp = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);

export const VersionsTab = () => {
  const {
    workflowVersions: versions = [],
    publishedVersionId,
    handleRestoreVersion: onRestore,
    handleDeleteVersion: onDelete,
    handleUpdateVersionMessage: onUpdateMessage,
    isReadOnly,
  } = useWorkflowEditorContext();
  const [isRestoring, setIsRestoring] = useState<Id<"workflow_versions"> | null>(null);
  const [editingVersion, setEditingVersion] = useState<Doc<"workflow_versions"> | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRestore = async (versionId: Id<"workflow_versions">) => {
    setIsRestoring(versionId);
    try {
      await onRestore(versionId);
    } finally {
      setIsRestoring(null);
    }
  };

  const handleStartEdit = (version: Doc<"workflow_versions">) => {
    setEditingVersion(version);
    setEditMessage(version.message || "");
  };

  const handleSaveMessage = async () => {
    if (!editingVersion) return;
    setIsUpdating(true);
    try {
      await onUpdateMessage(editingVersion._id, editMessage);
      setEditingVersion(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="h-full overflow-y-auto">
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/80">
              Workflow Version History
            </h3>
          </div>

          <div className="grid gap-2 border-t border-sidebar-border pt-4">
            {versions && versions.length > 0 ? (
              versions.map((version) => (
                <div
                  key={version._id}
                  className="group flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/20 px-4 py-3 transition-colors hover:bg-sidebar-accent/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 flex-col items-center justify-center rounded-md border border-sidebar-border bg-sidebar shadow-sm capitalize">
                      <span className="text-sm font-bold leading-none">{version.versionNumber}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {version._id === publishedVersionId ? (
                          <Badge
                            className={cn(
                              "h-4 px-1.5 text-[10px] tracking-wider",
                              "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20",
                            )}
                          >
                            Published
                          </Badge>
                        ) : version.kind === "archived" ||
                          version.kind === "published" ? (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px] tracking-wider"
                          >
                            Archived
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px] tracking-wider"
                          >
                            {version.kind}
                          </Badge>
                        )}
                        <span className="text-xs text-sidebar-foreground/60 flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTimestamp(version.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-1.5 group/msg">
                        <div className="mt-0.5 shrink-0">
                          <MessageCircle className="size-3 text-sidebar-foreground/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-xs leading-relaxed",
                            version.message ? "text-sidebar-foreground/80" : "text-sidebar-foreground/40 italic"
                          )}>
                            {version.message || "No message provided"}
                          </span>
                          {!isReadOnly && version.kind !== "draft" && (
                            <button
                              onClick={() => handleStartEdit(version)}
                              className="ml-2 inline-flex items-center opacity-0 group-hover/msg:opacity-100 transition-opacity hover:text-primary"
                            >
                              <Pencil className="size-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isReadOnly || version.kind === "draft" || isRestoring === version._id}
                          className="h-8 border-sidebar-border bg-sidebar text-[11px] uppercase tracking-wider hover:bg-sidebar-accent"
                        >
                          <RotateCcw className={cn("mr-1.5 size-3", isRestoring === version._id && "animate-spin")} />
                          Restore
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore Version {version.versionNumber}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to restore this version? This will overwrite your current unsaved draft with the configuration from this snapshot.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRestore(version._id)}
                          >
                            Replace current draft
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {version._id !== publishedVersionId &&
                      version.kind !== "draft" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isReadOnly}
                              className="size-8 text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Version {version.versionNumber}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this archived
                                version? This action is permanent and cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => onDelete(version._id)}
                              >
                                Delete permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sidebar-foreground/45">
                <History className="mb-3 size-8 opacity-20" />
                <p className="text-sm">No version history found.</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <Dialog open={!!editingVersion} onOpenChange={(open) => !open && setEditingVersion(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Version Message</DialogTitle>
            <DialogDescription>
              Update the description for version {editingVersion?.versionNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-message">Version Message</Label>
              <Textarea
                id="edit-message"
                placeholder="e.g. Added retry logic, Updated API endpoints..."
                className="h-24 resize-none"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingVersion(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMessage}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

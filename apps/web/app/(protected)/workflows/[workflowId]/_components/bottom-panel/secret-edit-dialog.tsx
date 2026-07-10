"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Spinner } from "@workspace/ui/components/spinner";
import { Id } from "@workspace/backend/_generated/dataModel";
import { WorkflowSecret } from "../workflow-editor-types";

interface SecretEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSecret: WorkflowSecret | null;
  onSave: (name: string, value: string | undefined, description?: string, secretId?: Id<"workflow_secrets">) => Promise<void>;
}

export const SecretEditDialog = ({
  isOpen,
  onOpenChange,
  editingSecret,
  onSave,
}: SecretEditDialogProps) => {
  const [editName, setEditName] = React.useState("");
  const [editValue, setEditValue] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (editingSecret) {
      setEditName(editingSecret.name);
      setEditValue("");
    }
  }, [editingSecret]);

  const handleSave = async () => {
    if (!editingSecret || !editName.trim()) return;

    setIsSaving(true);
    try {
      await onSave(
        editName,
        editValue || undefined,
        editingSecret.description,
        editingSecret._id,
      );
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Secret</DialogTitle>
          <DialogDescription>
            Update the secret name or its value. Leave the value blank to keep the existing secret key.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-value">New Value (Optional)</Label>
            <Input
              id="edit-value"
              type="password"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Leave blank to keep current value"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !editName.trim()}>
            {isSaving ? <Spinner className="mr-2 size-3" /> : null}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

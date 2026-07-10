"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Doc } from "@workspace/backend/_generated/dataModel";

interface RevokeKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  keyToRevoke: Doc<"api_keys"> | null;
  handleRevoke: () => void;
}

export function RevokeKeyDialog({ 
  isOpen, 
  onOpenChange, 
  keyToRevoke, 
  handleRevoke 
}: RevokeKeyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke the key <span className="font-semibold text-foreground">"{keyToRevoke?.name}"</span>? 
            This action cannot be undone and any applications using this key will stop working immediately.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleRevoke}>Revoke Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

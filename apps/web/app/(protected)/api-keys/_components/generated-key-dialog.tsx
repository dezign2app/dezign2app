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
import { CopyIcon } from "lucide-react";

interface GeneratedKeyDialogProps {
  justGeneratedKey: string | null;
  setJustGeneratedKey: (key: string | null) => void;
  copyToClipboard: (text: string) => void;
}

export function GeneratedKeyDialog({ 
  justGeneratedKey, 
  setJustGeneratedKey, 
  copyToClipboard 
}: GeneratedKeyDialogProps) {
  return (
    <Dialog open={!!justGeneratedKey} onOpenChange={() => setJustGeneratedKey(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Key Generated</DialogTitle>
          <DialogDescription>
            Make sure to copy your API key now. You won't be able to see it again!
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <label htmlFor="key" className="sr-only">Key</label>
            <div className="flex items-center gap-2 bg-muted p-3 rounded-md border font-mono text-sm break-all">
              {justGeneratedKey}
            </div>
          </div>
          <Button size="icon" className="shrink-0" onClick={() => copyToClipboard(justGeneratedKey!)}>
            <CopyIcon className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start mt-4">
          <Button className="w-full" variant="secondary" onClick={() => setJustGeneratedKey(null)}>
            I've copied the key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

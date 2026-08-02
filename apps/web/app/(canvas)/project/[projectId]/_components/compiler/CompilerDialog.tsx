import React from "react";
import {
  Dialog,
  DialogContent,
} from "@workspace/ui/components/dialog";
import { CompiledFile } from "@/lib/compiler";
import { CompiledCodeViewer } from "./CompiledCodeViewer";

export interface CompilerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  projectId?: string;
  overrideFiles?: CompiledFile[];
  overrideTitle?: string;
}

export function CompilerDialog({
  open,
  onOpenChange,
  projectName,
  projectId,
  overrideFiles,
  overrideTitle,
}: CompilerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        <CompiledCodeViewer
          projectName={projectName}
          projectId={projectId}
          overrideFiles={overrideFiles}
          overrideTitle={overrideTitle}
          showTopBar={true}
        />
      </DialogContent>
    </Dialog>
  );
}

// Alias export for backward compatibility
export const CompilerModal = CompilerDialog;

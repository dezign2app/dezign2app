import React, { useState, useEffect } from "react";
import { Input } from "@workspace/ui/components/input";
import { Check, X, Pencil } from "lucide-react";
import { SimulationTestCase } from "@workspace/canvas";

interface TestCaseAccordionHeaderProps {
  tc: SimulationTestCase;
  onUpdateName: (newName: string) => void;
}

export const TestCaseAccordionHeader: React.FC<TestCaseAccordionHeaderProps> = ({
  tc,
  onUpdateName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(tc.name);

  useEffect(() => {
    setNameInput(tc.name);
  }, [tc.name]);

  const handleSave = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (nameInput.trim() && nameInput.trim() !== tc.name) {
      onUpdateName(nameInput.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNameInput(tc.name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-1.5 flex-1 mr-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave(e);
            if (e.key === "Escape") handleCancel(e);
          }}
          autoFocus
          className="h-6 text-xs bg-background font-medium py-0 px-2 flex-1"
        />
        <span
          role="button"
          tabIndex={0}
          onClick={handleSave}
          className="p-1 hover:bg-emerald-500/15 text-emerald-600 rounded transition-colors cursor-pointer"
          title="Save Name"
        >
          <Check className="w-3.5 h-3.5" />
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={handleCancel}
          className="p-1 hover:bg-secondary text-muted-foreground rounded transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between flex-1 mr-2 group/tc">
      <span className="truncate">{tc.name}</span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsEditing(true);
        }}
        className="p-1 opacity-70 group-hover/tc:opacity-100 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        title="Edit Test Case Name"
      >
        <Pencil className="w-3.5 h-3.5" />
      </span>
    </div>
  );
};

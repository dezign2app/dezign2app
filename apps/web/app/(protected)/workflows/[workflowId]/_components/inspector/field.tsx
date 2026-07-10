import React from "react";
import { Label } from "@workspace/ui/components/label";

interface FieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export const Field = ({ label, description, children }: FieldProps) => (
  <div className="space-y-2">
    <div className="space-y-1">
      <Label>{label}</Label>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {children}
  </div>
);

import React, { useState } from "react";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";

export const LocalInput = ({
  value,
  onChange,
  ...props
}: React.ComponentProps<typeof Input>) => {
  const [localValue, setLocalValue] = useState(value);
  React.useEffect(() => {
    if (value !== localValue) setLocalValue(value);
  }, [value]);
  return (
    <Input
      {...props}
      value={localValue as string | undefined}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        if (onChange) onChange(e);
      }}
    />
  );
};

export const LocalTextarea = ({
  value,
  onChange,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof Textarea>) => {
  const [localValue, setLocalValue] = useState(value);
  React.useEffect(() => {
    if (value !== localValue) setLocalValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentVal = (localValue as string) || "";
      const newValue =
        currentVal.substring(0, start) + "  " + currentVal.substring(end);

      setLocalValue(newValue);

      if (onChange) {
        const syntheticEvent = {
          target: { value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <Textarea
      {...props}
      value={localValue as string | undefined}
      onKeyDown={handleKeyDown}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        if (onChange) onChange(e);
      }}
    />
  );
};

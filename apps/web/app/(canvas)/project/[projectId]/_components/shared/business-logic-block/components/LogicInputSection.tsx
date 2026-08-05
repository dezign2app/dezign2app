import React from "react";
import { Info } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalTextarea } from "../../../backend-nodes/graph-nodes/shared";
import { LogicMode } from "../types";

interface LogicInputSectionProps {
  activeMode: LogicMode;
  prompt?: string;
  onPromptChange?: (val: string) => void;
  promptPlaceholder?: string;
  code?: string;
  onCodeChange?: (val: string) => void;
  codePlaceholder?: string;
  codeLanguageLabel?: string;
}

export function LogicInputSection({
  activeMode,
  prompt = "",
  onPromptChange,
  promptPlaceholder = "Describe the business logic in natural language (e.g., 'Validate user input, query the users table for active status, calculate discount, and return JSON summary')...",
  code = "",
  onCodeChange,
  codePlaceholder = "// Write inner function body statements (editable)\n// e.g.:\nconst usersList = await findAllUsers();\nawait publishKafkaEvent(KAFKA_TOPICS.USER_EVENT, { action: 'post', payload: body });\nreturn res.status(200).json({ success: true, data: usersList });",
  codeLanguageLabel = "TypeScript / JavaScript",
}: LogicInputSectionProps) {
  if (activeMode === "natural_language") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <span>Natural Language Prompt / Spec</span>
          </Label>
          <span className="text-[9px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
            ✨ AI Transformation
          </span>
        </div>

        <LocalTextarea
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onPromptChange?.(e.target.value)}
          placeholder={promptPlaceholder}
          className="text-xs min-h-[120px] resize-y bg-background leading-relaxed placeholder:text-muted-foreground/50 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
        />

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight bg-secondary/20 p-2 rounded border border-border/40">
          <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
          <span>
            Write instructions in plain language. The AI compiler will
            automatically convert this into production code when generating
            the microservice.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-semibold text-muted-foreground font-mono">
          {codeLanguageLabel}
        </Label>
        <span className="text-[9px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
          {"</> Direct Logic"}
        </span>
      </div>

      <LocalTextarea
        value={code}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onCodeChange?.(e.target.value)}
        placeholder={codePlaceholder}
        className="text-[11px] min-h-[140px] resize-y bg-background font-mono leading-relaxed placeholder:text-muted-foreground/40 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
      />

      <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight bg-secondary/20 p-2 rounded border border-border/40 font-mono">
        <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
        <span>
          Write ONLY inner function body statements. Do not include outer
          function signatures or declarations (e.g.{" "}
          <code>async function...</code>).
        </span>
      </div>
    </div>
  );
}


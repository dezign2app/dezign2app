import React, { useState } from "react";
import { Sparkles, Code2, FileText, Loader2, Info } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { LocalTextarea } from "../backend-nodes/graph-nodes/shared";

export type LogicMode = "natural_language" | "code";

export interface BusinessLogicBlockProps {
  mode?: LogicMode;
  onModeChange?: (mode: LogicMode) => void;
  prompt?: string;
  onPromptChange?: (val: string) => void;
  code?: string;
  onCodeChange?: (val: string) => void;
  onGenerateCode?: () => Promise<void> | void;
  isGenerating?: boolean;
  title?: string;
  description?: string;
  promptPlaceholder?: string;
  codePlaceholder?: string;
  codeLanguageLabel?: string;
  className?: string;
}

export function BusinessLogicBlock({
  mode = "natural_language",
  onModeChange,
  prompt = "",
  onPromptChange,
  code = "",
  onCodeChange,
  onGenerateCode,
  isGenerating = false,
  title = "Business Logic",
  description,
  promptPlaceholder = "Describe the business logic in natural language (e.g., 'Validate user input, query the users table for active status, calculate discount, and return JSON summary')...",
  codePlaceholder = "// Write ONLY the function body statements (do not include outer function signature)\n// e.g.:\nconst result = await db.users.findMany();\nreturn res.json(result);",
  codeLanguageLabel = "TypeScript / JavaScript",
  className = "",
}: BusinessLogicBlockProps) {
  const [internalMode, setInternalMode] = useState<LogicMode>(mode);
  const activeMode = onModeChange ? mode : internalMode;

  const handleModeSwitch = (newMode: LogicMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  return (
    <div className={`flex flex-col gap-3 p-3.5 bg-secondary/10 rounded-xl border border-border/60 shadow-sm ${className}`}>
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
              {title}
            </span>
            {description && (
              <span className="text-[10px] text-muted-foreground">{description}</span>
            )}
          </div>
        </div>

        {/* Generate Code Action Button */}
        {onGenerateCode && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isGenerating}
            onClick={onGenerateCode}
            className="h-7 text-[11px] font-semibold shadow-xs gap-1.5 px-2.5 border-border hover:bg-secondary transition-all"
            title="Use AI to transform your natural language description into executable code logic"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Code</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Mode Switch Tabs (Segmented Control) */}
      <div className="flex items-center justify-between gap-2 bg-background/60 p-1 rounded-lg border border-border/50">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => handleModeSwitch("natural_language")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
              activeMode === "natural_language"
                ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Natural Language</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("code")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
              activeMode === "code"
                ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeMode === "natural_language" ? (
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
            onChange={(e) => onPromptChange?.(e.target.value)}
            placeholder={promptPlaceholder}
            className="text-xs min-h-[120px] resize-y bg-background leading-relaxed placeholder:text-muted-foreground/50 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight bg-secondary/20 p-2 rounded border border-border/40">
            <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            <span>
              Write instructions in plain language. The AI compiler will automatically convert this into production code when generating the microservice.
            </span>
          </div>
        </div>
      ) : (
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
            onChange={(e) => onCodeChange?.(e.target.value)}
            placeholder={codePlaceholder}
            className="text-[11px] min-h-[140px] resize-y bg-background font-mono leading-relaxed placeholder:text-muted-foreground/40 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight bg-secondary/20 p-2 rounded border border-border/40 font-mono">
            <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            <span>
              Write ONLY inner function body statements. Do not include outer function signatures or declarations (e.g. <code>async function...</code>).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

interface HeaderToolbarProps {
  title?: string;
  description?: string;
  onGenerateCode?: () => Promise<void> | void;
  isGenerating?: boolean;
}

export function HeaderToolbar({
  title = "Business Logic",
  description,
  onGenerateCode,
  isGenerating = false,
}: HeaderToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
            {title}
          </span>
          {description && (
            <span className="text-[10px] text-muted-foreground">
              {description}
            </span>
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
  );
}

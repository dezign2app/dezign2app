import React, { useState } from "react";
import {
  BusinessLogicBlockProps,
  LogicMode,
} from "./business-logic-block/types";
import { HeaderToolbar } from "./business-logic-block/components/HeaderToolbar";
import { ModeSelector } from "./business-logic-block/components/ModeSelector";
import { LogicInputSection } from "./business-logic-block/components/LogicInputSection";
import { CrudConfigSection } from "./business-logic-block/components/CrudConfigSection";
import { InfrastructurePreview } from "./business-logic-block/components/InfrastructurePreview";

export * from "./business-logic-block/types";
export * from "./business-logic-block/utils";
export * from "./business-logic-block/generator";

export function BusinessLogicBlock({
  mode = "natural_language",
  onModeChange,
  prompt = "",
  onPromptChange,
  code = "",
  onCodeChange,
  onGenerateCode,
  isGenerating: externalIsGenerating = false,
  title = "Business Logic",
  description,
  promptPlaceholder,
  codePlaceholder,
  codeLanguageLabel = "TypeScript / JavaScript",
  className = "",
  crudConfig = [],
  onCrudConfigChange,
  availableTableNodes = [],
  publishedEvents = [],
  endpointMethod = "POST",
  endpointPath = "/",
}: BusinessLogicBlockProps) {
  const [internalMode, setInternalMode] = useState<LogicMode>(mode);
  const [internalIsGenerating, setInternalIsGenerating] = useState(false);

  const activeMode = onModeChange ? mode : internalMode;
  const isGenerating = externalIsGenerating || internalIsGenerating;

  const handleModeSwitch = (newMode: LogicMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  const handleGenerateCodeAction = async () => {
    if (!onGenerateCode || isGenerating) return;
    try {
      setInternalIsGenerating(true);
      await onGenerateCode();
      handleModeSwitch("code");
    } catch (err) {
      console.error("Error generating code:", err);
    } finally {
      setInternalIsGenerating(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 p-3.5 bg-secondary/10 rounded-xl border border-border/60 shadow-sm ${className}`}
    >
      <HeaderToolbar
        title={title}
        description={description}
        onGenerateCode={onGenerateCode ? handleGenerateCodeAction : undefined}
        isGenerating={isGenerating}
      />

      <ModeSelector
        activeMode={activeMode}
        onModeSwitch={handleModeSwitch}
      />

      <LogicInputSection
        activeMode={activeMode}
        prompt={prompt}
        onPromptChange={onPromptChange}
        promptPlaceholder={promptPlaceholder}
        code={code}
        onCodeChange={onCodeChange}
        codePlaceholder={codePlaceholder}
        codeLanguageLabel={codeLanguageLabel}
      />

      {onCrudConfigChange && (
        <CrudConfigSection
          crudConfig={crudConfig}
          onCrudConfigChange={onCrudConfigChange}
          availableTableNodes={availableTableNodes}
        />
      )}

      <InfrastructurePreview
        crudConfig={crudConfig}
        availableTableNodes={availableTableNodes}
        publishedEvents={publishedEvents}
        endpointMethod={endpointMethod}
      />
    </div>
  );
}

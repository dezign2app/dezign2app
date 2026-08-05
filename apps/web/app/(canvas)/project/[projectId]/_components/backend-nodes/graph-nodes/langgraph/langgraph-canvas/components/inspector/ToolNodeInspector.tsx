import React, { useState } from "react";
import type { ToolNodeData } from "@workspace/canvas";
import type { LangGraphStateChannel } from "@/types/canvas";
import { BusinessLogicBlock } from "../../../../../../shared/BusinessLogicBlock";
import {
  ToolNodeHeader,
  ToolCoreConfigSection,
  ToolReturnBehaviorSection,
  ToolHeadlessConfigSection,
  ToolAdvancedServerSection,
  ToolErrorHandlingSection,
} from "./tool-node-inspector";

interface ToolNodeInspectorProps {
  selectedToolData: ToolNodeData;
  onDeleteTool: () => void;
  onUpdateTool: (changes: Partial<ToolNodeData>) => void;
  stateChannels: LangGraphStateChannel[];
}

export function ToolNodeInspector({
  selectedToolData,
  onDeleteTool,
  onUpdateTool,
  stateChannels,
}: ToolNodeInspectorProps) {
  const [schemaText, setSchemaText] = useState(
    selectedToolData.inputSchema || "",
  );
  const [bodyText, setBodyText] = useState(selectedToolData.functionBody || "");

  // Helpers
  const isHeadless = !!selectedToolData.headless;

  const handleUpdateCommandConfig = (
    updates: Partial<NonNullable<ToolNodeData["commandConfig"]>>,
  ) => {
    onUpdateTool({
      commandConfig: {
        stateUpdates: selectedToolData.commandConfig?.stateUpdates || [],
        ...updates,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <ToolNodeHeader
        name={selectedToolData.name}
        toolId={selectedToolData.toolId}
        onDeleteTool={onDeleteTool}
      />

      {/* ─── 1. Core Config ─────────────────────────────────────────────────── */}
      <ToolCoreConfigSection
        selectedToolData={selectedToolData}
        onUpdateTool={onUpdateTool}
        schemaText={schemaText}
        setSchemaText={setSchemaText}
      />

      {/* ─── 2. Return Behavior ─────────────────────────────────────────────── */}
      <ToolReturnBehaviorSection
        selectedToolData={selectedToolData}
        onUpdateTool={onUpdateTool}
        stateChannels={stateChannels}
        handleUpdateCommandConfig={handleUpdateCommandConfig}
      />

      {/* ─── 3. Headless Mode ──────────────────────────────────────────────── */}
      <ToolHeadlessConfigSection
        isHeadless={isHeadless}
        onUpdateTool={onUpdateTool}
      />

      {/* ─── 4. Implementation & Advanced (Server Only) ────────────────────── */}
      {!isHeadless && (
        <>
          <BusinessLogicBlock
            mode={selectedToolData.implementationMode || "natural_language"}
            onModeChange={(implementationMode) =>
              onUpdateTool({ implementationMode })
            }
            prompt={selectedToolData.prompt || ""}
            onPromptChange={(prompt) => onUpdateTool({ prompt })}
            code={bodyText}
            onCodeChange={(val) => {
              setBodyText(val);
              onUpdateTool({ functionBody: val });
            }}
            title="Tool Business Logic"
            description="Define tool behavior in natural language or write a custom function"
            onGenerateCode={() => {
              const specText =
                selectedToolData.prompt || selectedToolData.description;
              if (specText && !selectedToolData.functionBody) {
                const generatedCode = `// Tool: ${selectedToolData.name}\n// Spec: ${specText.split("\n").join("\n// ")}\nreturn { success: true, result: "Tool executed successfully" };`;
                setBodyText(generatedCode);
                onUpdateTool({
                  functionBody: generatedCode,
                  implementationMode: "code",
                });
              }
            }}
          />

          <ToolAdvancedServerSection
            selectedToolData={selectedToolData}
            onUpdateTool={onUpdateTool}
          />
        </>
      )}

      {/* ─── 5. Error Handling ─────────────────────────────────────────────── */}
      <ToolErrorHandlingSection
        selectedToolData={selectedToolData}
        onUpdateTool={onUpdateTool}
      />
    </div>
  );
}

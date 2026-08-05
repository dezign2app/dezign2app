import React from "react";
import { BusinessLogicBlock } from "@/app/(canvas)/project/[projectId]/_components/shared/BusinessLogicBlock";
import { RouteHeader } from "./components/RouteHeader";
import { RouteOverview } from "./components/RouteOverview";
import { StateChannelMappingSection } from "./components/StateChannelMappingSection";
import { OutputDeliverySection } from "./components/OutputDeliverySection";
import { useLangGraphRouteConfig } from "./useLangGraphRouteConfig";
import type { LangGraphRouteConfigProps } from "./types";

export const LangGraphRouteConfig: React.FC<LangGraphRouteConfigProps> = ({
  id,
  nodeId,
}) => {
  const {
    targetNode,
    sourceNode,
    routeLabel,
    method,
    kind,
    stateChannels,
    mapping,
    preInvokeMode,
    setPreInvokeMode,
    preInvokePrompt,
    setPreInvokePrompt,
    preInvokeCode,
    setPreInvokeCode,
    responseExecutionMode,
    setResponseExecutionMode,
    responseOutputMode,
    setResponseOutputMode,
    responseFields,
    setResponseFields,
    postInvokeMode,
    setPostInvokeMode,
    postInvokePrompt,
    setPostInvokePrompt,
    postInvokeCode,
    setPostInvokeCode,
    customFields,
    handleAutoMap,
    handleMappingChange,
    handleRemoveMapping,
    addCustomField,
    updateCustomField,
    removeCustomField,
  } = useLangGraphRouteConfig(id, nodeId);

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {/* Header */}
      <RouteHeader
        method={method}
        routeLabel={routeLabel}
        targetNodeLabel={targetNode?.data?.label || "LangGraph Node"}
      />

      {/* Overview Card */}
      <RouteOverview
        kind={kind}
        sourceNodeLabel={sourceNode?.data?.label || "Source Node"}
        targetNodeLabel={targetNode?.data?.label || "LangGraph Node"}
        edgeId={id}
      />

      {/* Section 1: State Channels Payload Mapping */}
      <StateChannelMappingSection
        stateChannels={stateChannels}
        mapping={mapping}
        customFields={customFields}
        onAutoMap={handleAutoMap}
        onMappingChange={handleMappingChange}
        onRemoveMapping={handleRemoveMapping}
        onAddCustomField={addCustomField}
        onUpdateCustomField={updateCustomField}
        onRemoveCustomField={removeCustomField}
      />

      {/* Section 2: Pre-Invoke Business Logic Block */}
      <BusinessLogicBlock
        title="Pre-LangGraph Invoke Business Logic"
        description="Runs inside the route handler before calling graph.invoke(state)"
        mode={preInvokeMode}
        onModeChange={setPreInvokeMode}
        prompt={preInvokePrompt}
        onPromptChange={setPreInvokePrompt}
        code={preInvokeCode}
        onCodeChange={setPreInvokeCode}
        promptPlaceholder={`Describe what should happen before invoking the graph:\n• Validate the request payload\n• Enrich state with user context (e.g. req.headers["x-user-id"])\n• Transform or format fields before passing into the agent`}
        codePlaceholder={`// Pre-invoke code executes before: await graph.invoke(state)\n// You have access to: req, res, state\n// Example:\nstate.userId = req.headers["x-user-id"] ?? "guest";\nif (!req.body.query) return res.status(400).json({ error: "query is required" });\nstate.query = req.body.query.trim();`}
        codeLanguageLabel="TypeScript (Express Route Body)"
      />

      {/* Section 3: Response Execution Mode & Output Selection */}
      <OutputDeliverySection
        responseExecutionMode={responseExecutionMode}
        onResponseExecutionModeChange={setResponseExecutionMode}
        responseOutputMode={responseOutputMode}
        onResponseOutputModeChange={setResponseOutputMode}
        responseFields={responseFields}
        onResponseFieldsChange={setResponseFields}
        stateChannels={stateChannels}
      />

      {/* Section 4: Post-Invoke Business Logic Block */}
      <BusinessLogicBlock
        title="Post-LangGraph Invoke Business Logic"
        description="Runs after graph execution finishes, before sending output to client"
        mode={postInvokeMode}
        onModeChange={setPostInvokeMode}
        prompt={postInvokePrompt}
        onPromptChange={setPostInvokePrompt}
        code={postInvokeCode}
        onCodeChange={setPostInvokeCode}
        promptPlaceholder={`Describe what to do after the graph completes:\n• Filter or redact sensitive response properties\n• Format final response object\n• Log execution completion`}
        codePlaceholder={`// Post-invoke code executes after: const result = await graph.invoke(state)\n// You have access to: req, res, state, result\n// Example:\nresult.messages = result.messages?.slice(-1); // Keep last message only`}
        codeLanguageLabel="TypeScript (Express Post-Processing)"
      />
    </div>
  );
};

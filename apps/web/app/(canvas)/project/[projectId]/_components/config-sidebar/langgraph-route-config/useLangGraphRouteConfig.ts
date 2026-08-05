import { useState, useEffect } from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import type { LangGraphStateChannel } from "@/types/canvas";
import type { LogicMode } from "@/app/(canvas)/project/[projectId]/_components/shared/BusinessLogicBlock";
import type {
  CustomField,
  ResponseExecutionMode,
  ResponseOutputMode,
  RouteKind,
} from "./types";

export function useLangGraphRouteConfig(id: string, nodeId: string) {
  const edges = useBackendCanvasStore((s) => s.edges);
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const events = useBackendCanvasStore((s) => s.events);
  const updateEdge = useBackendCanvasStore((s) => s.updateEdge);

  const targetEdge = edges.find((e) => e.id === id);
  const targetNode = nodes.find((n) => n.id === nodeId);
  const sourceNode = targetEdge
    ? nodes.find((n) => n.id === targetEdge.source)
    : null;

  // Resolve caller details
  let routeLabel = sourceNode?.data?.label || "Connected Route";
  let method = "POST";
  let kind: RouteKind = "task";

  if (targetEdge?.sourceHandle?.startsWith("endpoint-out-")) {
    kind = "endpoint";
    const endpointId = targetEdge.sourceHandle.replace("endpoint-out-", "");
    const ep = endpoints.find((e) => e.id === endpointId);
    if (ep) {
      routeLabel = ep.name || ep.id;
      method = ep.type || "POST";
    }
  } else if (targetEdge?.sourceHandle?.startsWith("consumedEvents-out-")) {
    kind = "event";
    const eventId = targetEdge.sourceHandle.replace("consumedEvents-out-", "");
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      routeLabel = ev.name || eventId;
      method = "EVENT";
    }
  }

  const stateChannels: LangGraphStateChannel[] = targetNode?.data
    ?.stateChannels || [
    {
      key: "messages",
      type: "messages",
      reducer: "add_messages",
      defaultValue: [],
    },
  ];

  const existingMapping: Record<string, string> =
    targetEdge?.data?.payloadMapping || {};
  const [mapping, setMapping] =
    useState<Record<string, string>>(existingMapping);
  const [preInvokeMode, setPreInvokeMode] = useState<LogicMode>(
    targetEdge?.data?.preInvokeLogicMode || "natural_language",
  );
  const [preInvokePrompt, setPreInvokePrompt] = useState<string>(
    targetEdge?.data?.preInvokePrompt || "",
  );
  const [preInvokeCode, setPreInvokeCode] = useState<string>(
    targetEdge?.data?.preInvokeCode || "",
  );

  // Output & Response Config State
  const [responseExecutionMode, setResponseExecutionMode] = useState<
    ResponseExecutionMode
  >(targetEdge?.data?.responseExecutionMode || "sync");
  const [responseOutputMode, setResponseOutputMode] = useState<
    ResponseOutputMode
  >(targetEdge?.data?.responseOutputMode || "full");
  const [responseFields, setResponseFields] = useState<string[]>(
    targetEdge?.data?.responseFields || [],
  );
  const [postInvokeMode, setPostInvokeMode] = useState<LogicMode>(
    targetEdge?.data?.postInvokeLogicMode || "natural_language",
  );
  const [postInvokePrompt, setPostInvokePrompt] = useState<string>(
    targetEdge?.data?.postInvokePrompt || "",
  );
  const [postInvokeCode, setPostInvokeCode] = useState<string>(
    targetEdge?.data?.postInvokeCode || "",
  );

  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    setMapping(targetEdge?.data?.payloadMapping || {});
    setPreInvokeMode(
      targetEdge?.data?.preInvokeLogicMode || "natural_language",
    );
    setPreInvokePrompt(targetEdge?.data?.preInvokePrompt || "");
    setPreInvokeCode(targetEdge?.data?.preInvokeCode || "");
    setResponseExecutionMode(targetEdge?.data?.responseExecutionMode || "sync");
    setResponseOutputMode(targetEdge?.data?.responseOutputMode || "full");
    setResponseFields(targetEdge?.data?.responseFields || []);
    setPostInvokeMode(
      targetEdge?.data?.postInvokeLogicMode || "natural_language",
    );
    setPostInvokePrompt(targetEdge?.data?.postInvokePrompt || "");
    setPostInvokeCode(targetEdge?.data?.postInvokeCode || "");
  }, [
    id,
    targetEdge?.data?.payloadMapping,
    targetEdge?.data?.preInvokeLogicMode,
    targetEdge?.data?.preInvokePrompt,
    targetEdge?.data?.preInvokeCode,
    targetEdge?.data?.responseExecutionMode,
    targetEdge?.data?.responseOutputMode,
    targetEdge?.data?.responseFields,
    targetEdge?.data?.postInvokeLogicMode,
    targetEdge?.data?.postInvokePrompt,
    targetEdge?.data?.postInvokeCode,
  ]);

  // Autosave Effect
  useEffect(() => {
    if (!targetEdge) return;

    const finalMapping: Record<string, string> = { ...mapping };
    customFields.forEach((cf) => {
      if (cf.key.trim()) {
        finalMapping[cf.key.trim()] = cf.value.trim();
      }
    });

    const currentMapping = targetEdge.data?.payloadMapping || {};
    const isDifferent =
      JSON.stringify(currentMapping) !== JSON.stringify(finalMapping) ||
      targetEdge.data?.preInvokeLogicMode !== preInvokeMode ||
      (targetEdge.data?.preInvokePrompt || "") !== preInvokePrompt.trim() ||
      (targetEdge.data?.preInvokeCode || "") !== preInvokeCode.trim() ||
      (targetEdge.data?.responseExecutionMode || "sync") !==
        responseExecutionMode ||
      (targetEdge.data?.responseOutputMode || "full") !== responseOutputMode ||
      JSON.stringify(targetEdge.data?.responseFields || []) !==
        JSON.stringify(responseFields) ||
      targetEdge.data?.postInvokeLogicMode !== postInvokeMode ||
      (targetEdge.data?.postInvokePrompt || "") !== postInvokePrompt.trim() ||
      (targetEdge.data?.postInvokeCode || "") !== postInvokeCode.trim();

    if (isDifferent) {
      const timeout = setTimeout(() => {
        updateEdge(targetEdge.id, {
          data: {
            ...targetEdge.data,
            payloadMapping: finalMapping,
            preInvokeLogicMode: preInvokeMode,
            preInvokePrompt: preInvokePrompt.trim(),
            preInvokeCode: preInvokeCode.trim(),
            responseExecutionMode,
            responseOutputMode,
            responseFields,
            postInvokeLogicMode: postInvokeMode,
            postInvokePrompt: postInvokePrompt.trim(),
            postInvokeCode: postInvokeCode.trim(),
          },
        });
      }, 500); // Debounce saves
      return () => clearTimeout(timeout);
    }
  }, [
    mapping,
    customFields,
    preInvokeMode,
    preInvokePrompt,
    preInvokeCode,
    responseExecutionMode,
    responseOutputMode,
    responseFields,
    postInvokeMode,
    postInvokePrompt,
    postInvokeCode,
    targetEdge,
    updateEdge,
  ]);

  const handleAutoMap = () => {
    const autoMapped: Record<string, string> = {};
    stateChannels.forEach((ch) => {
      if (ch.key === "messages") {
        autoMapped["messages"] = "body.message";
      } else {
        autoMapped[ch.key] = `body.${ch.key}`;
      }
    });
    setMapping(autoMapped);
  };

  const handleMappingChange = (stateKey: string, sourcePath: string) => {
    setMapping((prev) => ({
      ...prev,
      [stateKey]: sourcePath,
    }));
  };

  const handleRemoveMapping = (stateKey: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      delete next[stateKey];
      return next;
    });
  };

  const addCustomField = () => {
    setCustomFields((prev) => [...prev, { key: "", value: "body." }]);
  };

  const updateCustomField = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setCustomFields((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index][field] = val;
      }
      return next;
    });
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    targetEdge,
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
  };
}

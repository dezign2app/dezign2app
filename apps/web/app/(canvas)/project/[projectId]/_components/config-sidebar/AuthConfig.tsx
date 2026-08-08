import React from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { Accordion } from "@workspace/ui/components/accordion";
import {
  AuthConfigHeader,
  AuthCoreEntitiesSection,
  AuthProvidersSection,
  AuthSessionSection,
  AuthOrgRbacSection,
  AuthUserSchemaSection,
  AuthHooksSection,
  AuthPluginsSection,
  AuthCodePreviewSection,
} from "./auth-config";

export const AuthConfig = ({
  id,
  nodeId,
}: {
  id: string;
  nodeId: string;
}) => {
  const node = useBackendCanvasStore((s) =>
    s.nodes.find((n) => n.id === nodeId),
  );
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const edges = useBackendCanvasStore((s) => s.edges);
  const allNodes = useBackendCanvasStore((s) => s.nodes);

  if (!node) return null;

  const data = node.data;

  const updateData = (changes: Partial<typeof data>) => {
    updateNode(nodeId, { data: { ...data, ...changes } });
  };

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12 text-foreground">
      {/* Header */}
      <AuthConfigHeader label={data.label} />

      {/* Top to Bottom Collapsible Sections matching EndpointConfig card theme */}
      <Accordion
        type="multiple"
        defaultValue={[
          "core-entities",
          "providers",
          "session",
          "org",
          "schema",
          "hooks",
          "plugins",
          "preview",
        ]}
        className="w-full flex flex-col gap-4 border-none"
      >
        <AuthCoreEntitiesSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
        <AuthProvidersSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
        <AuthSessionSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
        <AuthOrgRbacSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
        <AuthUserSchemaSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
        <AuthHooksSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
        <AuthPluginsSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
        <AuthCodePreviewSection
          data={data}
          updateData={updateData}
          allNodes={allNodes}
          edges={edges}
          nodeId={nodeId}
        />
      </Accordion>
    </div>
  );
};

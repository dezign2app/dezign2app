"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useBackendSync } from "../../_components/hooks/useBackendSync";
import { LangGraphStudioView } from "../../_components/backend-nodes/graph-nodes/langgraph/LangGraphStudioView";

export default function LangGraphStudioPage({
  params,
}: {
  params: Promise<{ projectId: string; nodeId: string }>;
}) {
  const { projectId, nodeId } = React.use(params);
  const router = useRouter();

  // Hydrate store from Convex
  const { isLoading } = useBackendSync(projectId, "graph");
  const node = useBackendCanvasStore((s) => s.nodes.find((n) => n.id === nodeId));

  const handleClose = () => {
    router.push(`/project/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading LangGraph Studio...</span>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <h2 className="text-lg font-bold">LangGraph Agent Node Not Found</h2>
        <p className="text-sm text-muted-foreground">The node "{nodeId}" could not be found in this project.</p>
        <Button onClick={handleClose} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Architecture Canvas
        </Button>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <LangGraphStudioView node={node} onClose={handleClose} />
    </ReactFlowProvider>
  );
}

import React from "react";
import { Panel } from "@xyflow/react";
import { Button } from "@workspace/ui/components/button";
import { LayoutTemplate, RotateCcw } from "lucide-react";
import { useSimulationStore } from "@/lib/stores/simulationStore";

interface TopToolbarPanelProps {
  onLayout: (direction: "LR" | "TB") => void;
}

export const TopToolbarPanel: React.FC<TopToolbarPanelProps> = ({
  onLayout,
}) => {
  const simulation = useSimulationStore();

  return (
    <Panel position="top-right" className="flex gap-2 flex-col">
      <Button
        variant="outline"
        size="sm"
        className="bg-sidebar dark:bg-sidebar shadow-sm text-xs"
        onClick={() => onLayout("LR")}
      >
        <LayoutTemplate className="w-3.5 h-3.5 mr-2" />
        Auto layout
      </Button>
      {simulation.status !== "idle" && (
        <Button
          variant="destructive"
          size="sm"
          className="shadow-sm text-xs"
          onClick={simulation.clear}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-2" />
          Reset
        </Button>
      )}
    </Panel>
  );
};

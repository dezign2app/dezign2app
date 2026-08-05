import React from "react";
import { Handle, Position, Connection } from "@xyflow/react";
import { Brain } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { LocalTextarea } from "../../common";
import { HANDLE_LLM_IN, HANDLE_LLM_OUT } from "@workspace/canvas/constants";
import { BackendNode } from "@/types/canvas";

interface LangGraphStepLLMConfigProps {
  id: string;
  data: BackendNode["data"];
  isLLMEnabled: boolean;
  onToggleLLMConfig: (enabled: boolean) => void;
  onUpdateSystemPrompt: (prompt: string) => void;
}

export const LangGraphStepLLMConfig: React.FC<LangGraphStepLLMConfigProps> = ({
  id,
  data,
  isLLMEnabled,
  onToggleLLMConfig,
  onUpdateSystemPrompt,
}) => {
  return (
    <div className="flex flex-col gap-2 border-t border-border/40 pt-2 mt-1 nodrag relative">
      <div className="flex items-center justify-between gap-2">
        <Handle
          type="target"
          position={Position.Left}
          id={HANDLE_LLM_IN}
          isValidConnection={(connection: Connection) =>
            connection.sourceHandle === HANDLE_LLM_OUT ||
            connection.sourceHandle === null ||
            connection.sourceHandle === undefined
          }
          className="!bg-sky-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
          title="Connect LLM"
        />
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-emerald-400" />
          <Label
            htmlFor={`llm-switch-${id}`}
            className="text-[10px] font-semibold text-muted-foreground uppercase cursor-pointer"
          >
            LLM Config
          </Label>
        </div>
        <Switch
          id={`llm-switch-${id}`}
          checked={isLLMEnabled}
          onCheckedChange={onToggleLLMConfig}
          className="nodrag scale-75 origin-right"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform !-right-[7px]"
          title="Outgoing connection"
        />
      </div>

      {isLLMEnabled && (
        <div className="flex flex-col gap-1 mt-1 nodrag">
          <Label className="text-[10px] text-muted-foreground font-medium uppercase">
            AI Instructions
          </Label>
          <LocalTextarea
            className="min-h-[60px] text-xs bg-background/50 border-emerald-500/30 p-2 resize-y nodrag placeholder:text-muted-foreground/50 focus-visible:ring-emerald-400/50"
            placeholder="Enter AI instructions..."
            value={data.modelConfig?.systemPrompt || ""}
            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

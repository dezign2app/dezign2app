import React from "react";
import { BackendNode } from "@/types/canvas";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

export interface VectorConfigProps {
  id: string;
  data: BackendNode["data"];
  updateNode: (id: string, changes: Partial<BackendNode>) => void;
}

export const VectorConfig = ({ id, data, updateNode }: VectorConfigProps) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-secondary/10 border-b border-border/50 nodrag">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Embedding Model
        </span>
        <Input
          className="h-6 text-xs w-[140px] bg-background"
          placeholder="text-embedding-3-small"
          value={data.embeddingModel || ""}
          onChange={(e) =>
            updateNode(id, {
              data: { ...data, embeddingModel: e.target.value },
            })
          }
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Dimensions
        </span>
        <Input
          type="number"
          className="h-6 text-xs w-20 text-right bg-background"
          placeholder="1536"
          value={data.dimensions ?? ""}
          onChange={(e) =>
            updateNode(id, {
              data: {
                ...data,
                dimensions: parseInt(e.target.value) || undefined,
              },
            })
          }
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Metric
        </span>
        <Select
          value={data.metric || "Cosine"}
          onValueChange={(v) =>
            updateNode(id, {
              data: { ...data, metric: v as typeof data.metric },
            })
          }
        >
          <SelectTrigger className="h-6 text-xs w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cosine" className="text-xs">
              Cosine
            </SelectItem>
            <SelectItem value="Dot Product" className="text-xs">
              Dot Product
            </SelectItem>
            <SelectItem value="Euclidean" className="text-xs">
              Euclidean
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

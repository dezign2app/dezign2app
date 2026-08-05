import React from "react";
import { AnyMessagingResource } from "@/types/canvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { LocalInput } from "../../backend-nodes/graph-nodes/shared";
import { ConfigItemData } from "./types";

interface BucketStorageConfigProps {
  item: ConfigItemData;
  handleUpdate: (eventId: string, changes: Partial<AnyMessagingResource>) => void;
}

export const BucketStorageConfig: React.FC<BucketStorageConfigProps> = ({
  item,
  handleUpdate,
}) => {
  return (
    <div className="flex flex-col gap-4 mt-2 mb-2">
      <div className="flex flex-col gap-2.5 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Storage Type
        </span>
        <Select
          value={item.storageType || "s3"}
          onValueChange={(v) => handleUpdate(item.id, { storageType: v })}
        >
          <SelectTrigger className="w-full bg-background/50 h-9">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="s3">AWS S3</SelectItem>
            <SelectItem value="blob">Azure Blob Storage</SelectItem>
            <SelectItem value="gcs">Google Cloud Storage</SelectItem>
            <SelectItem value="local">Local Disk</SelectItem>
            <SelectItem value="custom">Custom / Other</SelectItem>
          </SelectContent>
        </Select>
        {item.storageType === "custom" && (
          <div className="mt-1 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Describe Custom Storage
            </span>
            <LocalInput
              className="h-8 bg-background/50 text-xs"
              placeholder="e.g. MinIO, Cloudflare R2, On-Prem NAS"
              value={item.storageTypeOther || ""}
              onBlur={(e) =>
                handleUpdate(item.id, { storageTypeOther: e.target.value })
              }
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data Types
        </span>
        <span className="text-xs text-muted-foreground mb-1">
          Categorize the kinds of objects stored
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Image",
            "Video",
            "Audio",
            "Document",
            "JSON",
            "Archive",
            "Binary",
            "Other",
          ].map((type) => {
            const currentList = Array.isArray(item.storedDataTypes)
              ? item.storedDataTypes
              : [];
            const isChecked = currentList.includes(type);
            return (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  className="rounded border-border bg-background"
                  checked={isChecked}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const updated = checked
                      ? [...currentList, type]
                      : currentList.filter((t: string) => t !== type);
                    handleUpdate(item.id, { storedDataTypes: updated });
                  }}
                />
                {type}
              </label>
            );
          })}
        </div>
        {(Array.isArray(item.storedDataTypes)
          ? item.storedDataTypes
          : []
        ).includes("Other") && (
          <div className="mt-2 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Other Data Types
            </span>
            <LocalInput
              className="h-8 bg-background/50 text-xs"
              placeholder="e.g. CAD Files, Parquet Files"
              value={item.storedDataTypesOther || ""}
              onBlur={(e) =>
                handleUpdate(item.id, {
                  storedDataTypesOther: e.target.value,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

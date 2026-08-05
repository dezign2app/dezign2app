import React from "react";
import { Search } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import { LocalTextarea } from "../../../../../common";
import type { MiddlewareConfigProps } from "./types";

export function ProviderToolSearchConfig({
  data,
  onUpdate,
}: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-violet-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Provider Tool Search Config
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">
          Searchable / Deferred Tools
        </Label>
        <LocalTextarea
          value={
            data.providerToolSearchConfig?.searchableTools?.join(", ") || ""
          }
          onChange={(e) =>
            onUpdate({
              providerToolSearchConfig: {
                searchableTools: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          className="text-xs min-h-[60px] font-mono bg-background"
          placeholder="lookup_order_status, search_kb, query_db (comma-separated)"
        />
        <p className="text-[10px] text-muted-foreground">
          Tools deferred behind model provider's server-side tool search
          (Anthropic Claude Sonnet 4+ or OpenAI GPT-5.5+).
        </p>
      </div>
    </div>
  );
}

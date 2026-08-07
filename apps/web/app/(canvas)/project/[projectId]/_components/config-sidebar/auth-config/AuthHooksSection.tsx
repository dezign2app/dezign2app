import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Sparkles } from "lucide-react";
import { AuthHookConfig } from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthHooksSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
}) => {
  const hooks = data.hooks || [
    { mode: "naturalLanguage", prompt: "After sign up, send a welcome email and create default workspace." },
  ];

  return (
    <AccordionItem
      value="hooks"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Auth Lifecycle Hooks
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          <div className="p-3.5 bg-background/50 border border-border/40 rounded-lg flex flex-col gap-3">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Custom Lifecycle Prompt
            </Label>
            <Textarea
              className="min-h-[90px] text-xs font-mono bg-background"
              placeholder="e.g. After sign up, create a default workspace and send welcome email..."
              value={hooks[0]?.prompt || ""}
              onChange={(e) => {
                const updated: AuthHookConfig[] = [
                  { mode: "naturalLanguage", prompt: e.target.value },
                ];
                updateData({ hooks: updated });
              }}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

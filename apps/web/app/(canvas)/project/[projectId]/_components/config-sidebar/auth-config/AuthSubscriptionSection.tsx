import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { CreditCard, Database, AlertCircle } from "lucide-react";
import { AuthSubscriptionConfig, PAYMENT_PROVIDER_OPTIONS } from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthSubscriptionSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
}) => {
  const subscription: AuthSubscriptionConfig = data.subscription || {
    enabled: false,
    provider: "stripe",
  };

  const updateSub = (changes: Partial<AuthSubscriptionConfig>) => {
    updateData({
      subscription: {
        ...subscription,
        ...changes,
      },
    });
  };

  return (
    <AccordionItem
      value="subscription"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <CreditCard className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subscriptions & Billing
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {subscription.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          {/* Enable Subscription Toggle */}
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/40">
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs font-semibold">Enable Subscription & Billing Tracking</Label>
              <p className="text-[11px] text-muted-foreground">
                Enable subscription tracking for your Auth service. Associate DB functions in Core Entities section.
              </p>
            </div>
            <Checkbox
              id="enable-subscription"
              checked={subscription.enabled}
              onCheckedChange={(checked) => updateSub({ enabled: Boolean(checked) })}
            />
          </div>

          {subscription.enabled && (
            <div className="p-3.5 bg-background/50 rounded-lg border border-border/40 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Payment Provider</Label>
              <Select
                value={subscription.provider || "stripe"}
                onValueChange={(val) => updateSub({ provider: val })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_PROVIDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

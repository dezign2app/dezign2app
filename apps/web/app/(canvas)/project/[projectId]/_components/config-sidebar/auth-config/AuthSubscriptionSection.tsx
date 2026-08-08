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
  allNodes,
}) => {
  const subscription: AuthSubscriptionConfig = data.subscription || {
    enabled: false,
    provider: "stripe",
    entityId: "",
    statusColumn: "status",
    planColumn: "plan_id",
    customerIdColumn: "customer_id",
    periodEndColumn: "current_period_end",
  };

  const schemaEntities = allNodes.filter((n) => n.type === "entity");
  const selectedSubscriptionEntity = schemaEntities.find(
    (n) => n.id === (subscription.entityId || subscription.schemaId),
  );

  const availableColumns = selectedSubscriptionEntity?.data.columns || [];

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
            Subscriptions & Billing Table
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {subscription.enabled
              ? selectedSubscriptionEntity
                ? selectedSubscriptionEntity.data.label
                : "Enabled (No Table)"
              : "Disabled"}
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
                Bind a canvas Entity table to store subscription statuses, active plans, and customer IDs.
              </p>
            </div>
            <Checkbox
              id="enable-subscription"
              checked={subscription.enabled}
              onCheckedChange={(checked) => updateSub({ enabled: Boolean(checked) })}
            />
          </div>

          {subscription.enabled && (
            <>
              {/* Payment Provider & Table Selector */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                <div className="flex flex-col gap-1.5">
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

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Database className="w-3 h-3 text-primary" /> Subscription Table
                  </Label>
                  <Select
                    value={subscription.entityId || "none"}
                    onValueChange={(val) =>
                      updateSub({
                        entityId: val === "none" ? undefined : val,
                        schemaId: val === "none" ? undefined : val,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select Subscription Table entity..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs text-muted-foreground">
                        Select Subscription Table entity...
                      </SelectItem>
                      {schemaEntities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id} className="text-xs">
                          {entity.data.label || "Untitled Entity"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bound Entity Column Mapping */}
              {selectedSubscriptionEntity ? (
                <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Column Mappings (<code className="font-mono text-primary">{selectedSubscriptionEntity.data.label}</code>)
                    </Label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                      {availableColumns.length} columns found
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-medium text-muted-foreground">Status Column</Label>
                      <Select
                        value={subscription.statusColumn || "status"}
                        onValueChange={(val) => updateSub({ statusColumn: val })}
                      >
                        <SelectTrigger className="h-7 text-xs font-mono bg-background">
                          <SelectValue placeholder="status" />
                        </SelectTrigger>
                        <SelectContent className="font-mono">
                          {availableColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name} className="text-xs font-mono">
                              {col.name} ({col.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-medium text-muted-foreground">Plan / Tier Column</Label>
                      <Select
                        value={subscription.planColumn || "plan_id"}
                        onValueChange={(val) => updateSub({ planColumn: val })}
                      >
                        <SelectTrigger className="h-7 text-xs font-mono bg-background">
                          <SelectValue placeholder="plan_id" />
                        </SelectTrigger>
                        <SelectContent className="font-mono">
                          {availableColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name} className="text-xs font-mono">
                              {col.name} ({col.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-medium text-muted-foreground">Customer ID Column</Label>
                      <Select
                        value={subscription.customerIdColumn || "customer_id"}
                        onValueChange={(val) => updateSub({ customerIdColumn: val })}
                      >
                        <SelectTrigger className="h-7 text-xs font-mono bg-background">
                          <SelectValue placeholder="customer_id" />
                        </SelectTrigger>
                        <SelectContent className="font-mono">
                          {availableColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name} className="text-xs font-mono">
                              {col.name} ({col.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-medium text-muted-foreground">Period End / Expiry Column</Label>
                      <Select
                        value={subscription.periodEndColumn || "current_period_end"}
                        onValueChange={(val) => updateSub({ periodEndColumn: val })}
                      >
                        <SelectTrigger className="h-7 text-xs font-mono bg-background">
                          <SelectValue placeholder="current_period_end" />
                        </SelectTrigger>
                        <SelectContent className="font-mono">
                          {availableColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name} className="text-xs font-mono">
                              {col.name} ({col.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 dark:text-amber-400 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    No subscription table selected. Create or select a Subscription entity table from your canvas to automatically map billing fields.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

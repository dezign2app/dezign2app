import React from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
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
import { SlidersHorizontal, Plus, Trash2 } from "lucide-react";
import {
  SessionClaimConfig,
  DEFAULT_SESSION_CLAIM_SOURCE,
  DEFAULT_SESSION_CLAIM_DELIVERY_MODE,
} from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthSessionSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
}) => {
  const claims: SessionClaimConfig[] = data.session?.claims || [
    { key: "orgRole", source: "orgRole", deliveryMode: DEFAULT_SESSION_CLAIM_DELIVERY_MODE },
    { key: "hasAccess", source: "paymentsAccess", deliveryMode: DEFAULT_SESSION_CLAIM_DELIVERY_MODE },
    { key: "subscriptionStatus", source: "paymentsAccess", deliveryMode: "cookie" },
  ];

  return (
    <AccordionItem
      value="session"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Session & Claims
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {claims.length} claims
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary dark:text-primary">
            <p className="font-semibold mb-1">Session Delivery Recommendations:</p>
            <ul className="list-disc list-inside gap-1 flex flex-col text-[11px] text-muted-foreground">
              <li>
                <strong className="text-foreground">JWT Plugin Mode</strong>: Tokens signed at issue time; middleware evaluates fast boolean gates in <code className="font-mono">proxy.ts</code> with 0 DB roundtrips (Edge runtime recommended).
              </li>
              <li>
                <strong className="text-foreground">Cookie Session Mode</strong>: Live DB resolution per fetch; ideal for live accurate claims inside React layouts and Server Components.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Configured Claims</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background"
                onClick={() => {
                  const newClaim: SessionClaimConfig = {
                    key: `custom_${claims.length + 1}`,
                    source: DEFAULT_SESSION_CLAIM_SOURCE,
                    deliveryMode: DEFAULT_SESSION_CLAIM_DELIVERY_MODE,
                  };
                  const updated: SessionClaimConfig[] = [...claims, newClaim];
                  updateData({ session: { claims: updated } });
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Claim
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {claims.map((claim, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-background border border-border/50 text-xs"
                >
                  <div className="col-span-4">
                    <Input
                      className="h-7 text-xs font-mono bg-background"
                      value={claim.key}
                      onChange={(e) => {
                        const updated = claims.map((c, i) => (i === idx ? { ...c, key: e.target.value } : c));
                        updateData({ session: { claims: updated } });
                      }}
                    />
                  </div>
                  <div className="col-span-4">
                    <Select
                      value={claim.source}
                      onValueChange={(val: SessionClaimConfig["source"]) => {
                        const updated = claims.map((c, i) => (i === idx ? { ...c, source: val } : c));
                        updateData({ session: { claims: updated } });
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orgRole" className="text-xs">Org Role</SelectItem>
                        <SelectItem value="paymentsAccess" className="text-xs">Creem Payments</SelectItem>
                        <SelectItem value="customField" className="text-xs">Custom Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={claim.deliveryMode}
                      onValueChange={(val: SessionClaimConfig["deliveryMode"]) => {
                        const updated = claims.map((c, i) => (i === idx ? { ...c, deliveryMode: val } : c));
                        updateData({ session: { claims: updated } });
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs font-mono bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jwt" className="text-xs font-mono">JWT</SelectItem>
                        <SelectItem value="cookie" className="text-xs font-mono">Cookie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        const updated = claims.filter((_, i) => i !== idx);
                        updateData({ session: { claims: updated } });
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

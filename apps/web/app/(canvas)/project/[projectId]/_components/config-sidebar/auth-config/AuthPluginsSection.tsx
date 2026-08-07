import React from "react";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Lock } from "lucide-react";
import { AuthConfigSectionProps } from "./types";

export const AuthPluginsSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
  edges,
  nodeId,
}) => {
  const enabledPlugins = data.plugins || ["bearer", "admin", "organization", "jwt"];

  // Creem Payments plugin injection check
  const isPaymentsInjected = edges.some(
    (e) => e.target === nodeId && e.targetHandle === "payments-plugin-in",
  );

  const togglePlugin = (plugin: string) => {
    const next = enabledPlugins.includes(plugin)
      ? enabledPlugins.filter((p) => p !== plugin)
      : [...enabledPlugins, plugin];
    updateData({ plugins: next });
  };

  return (
    <AccordionItem
      value="plugins"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Better Auth Plugins
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {enabledPlugins.length} active
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Enabled Plugins List</Label>
            {isPaymentsInjected && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium">
                + Creem Plugin Injected
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 bg-background/50 p-3 rounded-lg border border-border/40">
            {[
              { id: "twoFactor", label: "Two-Factor Auth (2FA)" },
              { id: "organization", label: "Organization / RBAC" },
              { id: "passkey", label: "Passkeys / WebAuthn" },
              { id: "magicLink", label: "Magic Link Email" },
              { id: "emailOtp", label: "Email OTP" },
              { id: "username", label: "Username Login" },
              { id: "phoneNumber", label: "Phone Number OTP" },
              { id: "admin", label: "Admin Management" },
              { id: "apiKey", label: "API Key Management" },
              { id: "bearer", label: "Bearer Tokens" },
              { id: "jwt", label: "JWT Token Plugin" },
              { id: "multiSession", label: "Multi-Session Support" },
              { id: "sso", label: "Enterprise SSO / SAML" },
            ].map((plugin) => {
              const checked = enabledPlugins.includes(plugin.id);
              return (
                <div key={plugin.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-background/60">
                  <Checkbox
                    id={`plugin-${plugin.id}`}
                    checked={checked}
                    onCheckedChange={() => togglePlugin(plugin.id)}
                  />
                  <Label htmlFor={`plugin-${plugin.id}`} className="text-xs font-normal cursor-pointer">
                    {plugin.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

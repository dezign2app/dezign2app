import React from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { ShieldCheck, Globe, ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { RedirectsConfig } from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthSecuritySection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
}) => {
  const redirects: RedirectsConfig = data.redirects || {
    signInRedirectUrl: "/dashboard",
    signUpRedirectUrl: "/onboarding",
    signOutRedirectUrl: "/login",
    callbackUrl: "/api/auth/callback",
  };

  const trustedOrigins: string[] = data.trustedOrigins || [
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  return (
    <AccordionItem
      value="security-redirects"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trusted Origins & Redirects
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {trustedOrigins.length} Origins
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          {/* Redirect URLs Card */}
          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40 text-xs">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-primary" /> Redirect & Callback Routing
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Sign-In Success Redirect</Label>
                <Input
                  className="h-7 text-xs font-mono bg-background"
                  placeholder="/dashboard"
                  value={redirects.signInRedirectUrl || ""}
                  onChange={(e) =>
                    updateData({
                      redirects: { ...redirects, signInRedirectUrl: e.target.value },
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Sign-Up Success Redirect</Label>
                <Input
                  className="h-7 text-xs font-mono bg-background"
                  placeholder="/onboarding"
                  value={redirects.signUpRedirectUrl || ""}
                  onChange={(e) =>
                    updateData({
                      redirects: { ...redirects, signUpRedirectUrl: e.target.value },
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground font-medium">Sign-Out Redirect</Label>
                <Input
                  className="h-7 text-xs font-mono bg-background"
                  placeholder="/login"
                  value={redirects.signOutRedirectUrl || ""}
                  onChange={(e) =>
                    updateData({
                      redirects: { ...redirects, signOutRedirectUrl: e.target.value },
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground font-medium">OAuth Callback URL</Label>
                <Input
                  className="h-7 text-xs font-mono bg-background"
                  placeholder="/api/auth/callback"
                  value={redirects.callbackUrl || ""}
                  onChange={(e) =>
                    updateData({
                      redirects: { ...redirects, callbackUrl: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Trusted Origins / CORS List Card */}
          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Trusted Origins & CORS List
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Allowed web client origins for auth cookies and CORS credentials.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background shrink-0"
                onClick={() => {
                  const updated = [...trustedOrigins, `https://app${trustedOrigins.length + 1}.example.com`].filter(Boolean);
                  updateData({ trustedOrigins: updated });
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Origin
              </Button>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {trustedOrigins.map((origin, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded bg-background border border-border/50 text-xs"
                >
                  <Input
                    className="h-7 text-xs font-mono bg-background flex-1"
                    placeholder="https://yourdomain.com"
                    value={origin}
                    onChange={(e) => {
                      const updated = trustedOrigins.map((o, i) => (i === idx ? e.target.value : o));
                      updateData({ trustedOrigins: updated });
                    }}
                  />
                  <button
                    onClick={() => {
                      const updated = trustedOrigins.filter((_, i) => i !== idx);
                      updateData({ trustedOrigins: updated });
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

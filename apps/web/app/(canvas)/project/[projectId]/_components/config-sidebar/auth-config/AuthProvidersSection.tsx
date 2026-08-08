import React from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { Key, Plus, Trash2, Lock, ShieldCheck, GitMerge } from "lucide-react";
import {
  AUTH_FRAMEWORK_OPTIONS,
  BETTER_AUTH_VERSIONS,
  DEFAULT_AUTH_FRAMEWORK,
  DEFAULT_BETTER_AUTH_VERSION,
  OAuthProviderConfig,
  EmailPasswordConfig,
  AccountLinkingPolicy,
} from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthProvidersSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
}) => {
  const selectedFramework = data.framework || DEFAULT_AUTH_FRAMEWORK;
  const selectedVersion = data.version || DEFAULT_BETTER_AUTH_VERSION;

  const emailPassword: EmailPasswordConfig = data.providers?.emailPassword || {
    enabled: true,
    requireVerification: true,
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    rateLimit: {
      maxAttempts: 5,
      windowSeconds: 60,
      lockoutDurationSeconds: 900,
    },
  };

  const accountLinking: AccountLinkingPolicy = data.providers?.accountLinking || {
    enabled: true,
    policy: "prompt",
    trustedProvidersOnly: true,
  };

  const providers = data.providers || {
    emailPassword,
    socialEnabled: true,
    oauth: [
      { id: "oa-1", provider: "google", clientIdEnv: "GOOGLE_CLIENT_ID", clientSecretEnv: "GOOGLE_CLIENT_SECRET" },
      { id: "oa-2", provider: "github", clientIdEnv: "GITHUB_CLIENT_ID", clientSecretEnv: "GITHUB_CLIENT_SECRET" },
    ],
    accountLinking,
    magicLink: true,
    passkey: false,
  };

  const isSocialEnabled =
    providers.socialEnabled ??
    providers.oauthEnabled ??
    (data.providers ? Boolean(providers.oauth && providers.oauth.length > 0) : true);

  return (
    <AccordionItem
      value="providers"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <Key className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Providers & Password Security
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {emailPassword?.enabled ? "Email" : ""}
            {isSocialEnabled && providers.oauth?.length ? ` + ${providers.oauth.length} OAuth` : ""}
            {!emailPassword?.enabled && (!isSocialEnabled || !providers.oauth?.length) ? "None" : ""}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-4 pt-2">
          {/* Framework Selection */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Framework</Label>
              <Select
                value={selectedFramework}
                onValueChange={(val: string) => {
                  const option = AUTH_FRAMEWORK_OPTIONS.find((o) => o.value === val);
                  if (option) {
                    updateData({ framework: option.value, provider: option.label });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_FRAMEWORK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Version</Label>
              <Select
                value={selectedVersion}
                onValueChange={(val: string) => updateData({ version: val })}
              >
                <SelectTrigger className="h-8 text-xs font-mono bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono">
                  {BETTER_AUTH_VERSIONS.map((ver) => (
                    <SelectItem key={ver.value} value={ver.value} className="text-xs font-mono">
                      {ver.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email / Password & Security Guardrails */}
          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Email & Password Policy</Label>
              <Checkbox
                checked={emailPassword?.enabled}
                onCheckedChange={(checked) =>
                  updateData({
                    providers: {
                      ...providers,
                      emailPassword: {
                        ...emailPassword,
                        enabled: Boolean(checked),
                      },
                    },
                  })
                }
              />
            </div>
            {emailPassword?.enabled && (
              <div className="flex flex-col gap-3 pt-2 text-xs border-t border-border/30">
                {/* Require Email Verification */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="require-verify"
                    checked={emailPassword?.requireVerification}
                    onCheckedChange={(c) =>
                      updateData({
                        providers: {
                          ...providers,
                          emailPassword: {
                            ...emailPassword,
                            requireVerification: Boolean(c),
                          },
                        },
                      })
                    }
                  />
                  <Label htmlFor="require-verify" className="text-xs font-normal cursor-pointer">
                    Require Email Verification
                  </Label>
                </div>

                {/* Password Complexity Rules */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground font-medium">Min Password Length</Label>
                    <Select
                      value={String(emailPassword.minLength || 8)}
                      onValueChange={(val) =>
                        updateData({
                          providers: {
                            ...providers,
                            emailPassword: {
                              ...emailPassword,
                              minLength: parseInt(val, 10),
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs font-mono bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-mono">
                        {[6, 8, 10, 12, 16].map((len) => (
                          <SelectItem key={len} value={String(len)} className="text-xs font-mono">
                            {len} characters
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5 justify-end">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="req-upper"
                        checked={emailPassword.requireUppercase}
                        onCheckedChange={(c) =>
                          updateData({
                            providers: {
                              ...providers,
                              emailPassword: { ...emailPassword, requireUppercase: Boolean(c) },
                            },
                          })
                        }
                      />
                      <Label htmlFor="req-upper" className="text-[11px] font-normal cursor-pointer">
                        Require Uppercase
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="req-num"
                        checked={emailPassword.requireNumbers}
                        onCheckedChange={(c) =>
                          updateData({
                            providers: {
                              ...providers,
                              emailPassword: { ...emailPassword, requireNumbers: Boolean(c) },
                            },
                          })
                        }
                      />
                      <Label htmlFor="req-num" className="text-[11px] font-normal cursor-pointer">
                        Require Numbers
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Brute Force Rate Limiting */}
                <div className="flex flex-col gap-2 p-2.5 rounded bg-background border border-border/40 mt-1">
                  <Label className="text-[11px] font-semibold flex items-center gap-1 text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" /> Brute-Force Rate Limiting & Lockout
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Max Attempts</span>
                      <Input
                        className="h-7 text-xs font-mono bg-background"
                        type="number"
                        value={emailPassword.rateLimit?.maxAttempts ?? 5}
                        onChange={(e) =>
                          updateData({
                            providers: {
                              ...providers,
                              emailPassword: {
                                ...emailPassword,
                                rateLimit: {
                                  maxAttempts: parseInt(e.target.value, 10) || 5,
                                  windowSeconds: emailPassword.rateLimit?.windowSeconds ?? 60,
                                  lockoutDurationSeconds: emailPassword.rateLimit?.lockoutDurationSeconds ?? 900,
                                },
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Window (Sec)</span>
                      <Input
                        className="h-7 text-xs font-mono bg-background"
                        type="number"
                        value={emailPassword.rateLimit?.windowSeconds ?? 60}
                        onChange={(e) =>
                          updateData({
                            providers: {
                              ...providers,
                              emailPassword: {
                                ...emailPassword,
                                rateLimit: {
                                  maxAttempts: emailPassword.rateLimit?.maxAttempts ?? 5,
                                  windowSeconds: parseInt(e.target.value, 10) || 60,
                                  lockoutDurationSeconds: emailPassword.rateLimit?.lockoutDurationSeconds ?? 900,
                                },
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Lockout (Sec)</span>
                      <Input
                        className="h-7 text-xs font-mono bg-background"
                        type="number"
                        value={emailPassword.rateLimit?.lockoutDurationSeconds ?? 900}
                        onChange={(e) =>
                          updateData({
                            providers: {
                              ...providers,
                              emailPassword: {
                                ...emailPassword,
                                rateLimit: {
                                  maxAttempts: emailPassword.rateLimit?.maxAttempts ?? 5,
                                  windowSeconds: emailPassword.rateLimit?.windowSeconds ?? 60,
                                  lockoutDurationSeconds: parseInt(e.target.value, 10) || 900,
                                },
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Linking Policy */}
          {isSocialEnabled && (
            <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40 text-xs">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <GitMerge className="w-3.5 h-3.5 text-primary" /> Multi-Provider Account Linking Policy
                </Label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 capitalize font-medium">
                  {accountLinking.policy || "prompt"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Action when a user signs in with social OAuth after already possessing an email/password account.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["prompt", "merge", "block"] satisfies Array<NonNullable<AccountLinkingPolicy["policy"]>>).map((strat) => (
                  <button
                    key={strat}
                    onClick={() =>
                      updateData({
                        providers: {
                          ...providers,
                          accountLinking: { ...accountLinking, policy: strat },
                        },
                      })
                    }
                    className={`p-2 rounded border text-[11px] font-medium capitalize text-center transition-colors ${
                      accountLinking.policy === strat
                        ? "bg-primary/15 border-primary text-primary font-bold"
                        : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {strat === "prompt" ? "Prompt & Verify" : strat === "merge" ? "Auto-Merge" : "Block Sign-In"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* OAuth Providers Table with Secret Security Indicators */}
          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">OAuth 2.0 / Social Providers</Label>
                <div className="flex items-center gap-1 pt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Stored as encrypted environment variables (process.env.XXXX)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enable-social-auth"
                  checked={isSocialEnabled}
                  onCheckedChange={(checked) => {
                    const enabled = Boolean(checked);
                    const defaultOauth = [
                      { id: "oa-1", provider: "google", clientIdEnv: "GOOGLE_CLIENT_ID", clientSecretEnv: "GOOGLE_CLIENT_SECRET" },
                      { id: "oa-2", provider: "github", clientIdEnv: "GITHUB_CLIENT_ID", clientSecretEnv: "GITHUB_CLIENT_SECRET" },
                    ];
                    updateData({
                      providers: {
                        ...providers,
                        socialEnabled: enabled,
                        oauthEnabled: enabled,
                        oauth: enabled
                          ? (providers.oauth && providers.oauth.length > 0 ? providers.oauth : defaultOauth)
                          : providers.oauth,
                      },
                    });
                  }}
                />
                <Label htmlFor="enable-social-auth" className="text-xs font-normal cursor-pointer text-muted-foreground">
                  {isSocialEnabled ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>

            {isSocialEnabled ? (
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">Configured Providers</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background"
                    onClick={() => {
                      const newOauth = [
                        ...(providers.oauth || []),
                        {
                          id: `oa-${Date.now()}`,
                          provider: "discord",
                          clientIdEnv: "DISCORD_CLIENT_ID",
                          clientSecretEnv: "DISCORD_CLIENT_SECRET",
                        },
                      ];
                      updateData({
                        providers: {
                          ...providers,
                          socialEnabled: true,
                          oauthEnabled: true,
                          oauth: newOauth,
                        },
                      });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Provider
                  </Button>
                </div>

                {providers.oauth && providers.oauth.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {providers.oauth.map((oa: OAuthProviderConfig) => (
                      <div
                        key={oa.id}
                        className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-background border border-border/50 text-xs"
                      >
                        <div className="col-span-3">
                          <Select
                            value={oa.provider}
                            onValueChange={(val) => {
                              const updated = (providers.oauth || []).map((o) =>
                                o.id === oa.id ? { ...o, provider: val } : o,
                              );
                              updateData({ providers: { ...providers, oauth: updated } });
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs font-medium capitalize bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["google", "github", "discord", "apple", "twitter", "microsoft"].map((p) => (
                                <SelectItem key={p} value={p} className="text-xs capitalize">
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4 relative flex items-center">
                          <Input
                            className="h-7 text-xs font-mono bg-background pr-6"
                            value={oa.clientIdEnv}
                            placeholder="CLIENT_ID_ENV"
                            onChange={(e) => {
                              const updated = (providers.oauth || []).map((o) =>
                                o.id === oa.id ? { ...o, clientIdEnv: e.target.value } : o,
                              );
                              updateData({ providers: { ...providers, oauth: updated } });
                            }}
                          />
                          <Lock className="w-3 h-3 text-muted-foreground absolute right-2 pointer-events-none" />
                        </div>
                        <div className="col-span-4 relative flex items-center">
                          <Input
                            className="h-7 text-xs font-mono bg-background pr-6"
                            value={oa.clientSecretEnv}
                            placeholder="CLIENT_SECRET_ENV"
                            onChange={(e) => {
                              const updated = (providers.oauth || []).map((o) =>
                                o.id === oa.id ? { ...o, clientSecretEnv: e.target.value } : o,
                              );
                              updateData({ providers: { ...providers, oauth: updated } });
                            }}
                          />
                          <Lock className="w-3 h-3 text-muted-foreground absolute right-2 pointer-events-none" />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => {
                              const updated = (providers.oauth || []).filter((o) => o.id !== oa.id);
                              updateData({ providers: { ...providers, oauth: updated } });
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-2 text-center bg-background/30 rounded border border-dashed border-border/60">
                    No social providers added. Click &quot;Add Provider&quot; above to configure one.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-normal">
                Enable social authentication to allow signing in with Google, GitHub, Discord, Apple, etc.
              </p>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

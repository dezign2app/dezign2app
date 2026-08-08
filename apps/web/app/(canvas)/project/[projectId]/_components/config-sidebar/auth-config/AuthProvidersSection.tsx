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
import { Key, Plus, Trash2 } from "lucide-react";
import {
  AUTH_FRAMEWORK_OPTIONS,
  BETTER_AUTH_VERSIONS,
  DEFAULT_AUTH_FRAMEWORK,
  DEFAULT_BETTER_AUTH_VERSION,
  OAuthProviderConfig,
} from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthProvidersSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
}) => {
  const selectedFramework = data.framework || DEFAULT_AUTH_FRAMEWORK;
  const selectedVersion = data.version || DEFAULT_BETTER_AUTH_VERSION;

  const providers = data.providers || {
    emailPassword: { enabled: true, requireVerification: true, minLength: 8 },
    socialEnabled: true,
    oauth: [
      { id: "oa-1", provider: "google", clientIdEnv: "GOOGLE_CLIENT_ID", clientSecretEnv: "GOOGLE_CLIENT_SECRET" },
      { id: "oa-2", provider: "github", clientIdEnv: "GITHUB_CLIENT_ID", clientSecretEnv: "GITHUB_CLIENT_SECRET" },
    ],
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
            Providers
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            {providers.emailPassword?.enabled ? "Email" : ""}
            {isSocialEnabled && providers.oauth?.length ? ` + ${providers.oauth.length} OAuth` : ""}
            {!providers.emailPassword?.enabled && (!isSocialEnabled || !providers.oauth?.length) ? "None" : ""}
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

          {/* Email / Password */}
          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Email & Password Auth</Label>
              <Checkbox
                checked={providers.emailPassword?.enabled}
                onCheckedChange={(checked) =>
                  updateData({
                    providers: {
                      ...providers,
                      emailPassword: {
                        enabled: Boolean(checked),
                        requireVerification: providers.emailPassword?.requireVerification ?? true,
                        minLength: providers.emailPassword?.minLength ?? 8,
                      },
                    },
                  })
                }
              />
            </div>
            {providers.emailPassword?.enabled && (
              <div className="flex items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="require-verify"
                    checked={providers.emailPassword?.requireVerification}
                    onCheckedChange={(c) =>
                      updateData({
                        providers: {
                          ...providers,
                          emailPassword: {
                            enabled: providers.emailPassword?.enabled ?? true,
                            requireVerification: Boolean(c),
                            minLength: providers.emailPassword?.minLength ?? 8,
                          },
                        },
                      })
                    }
                  />
                  <Label htmlFor="require-verify" className="text-xs font-normal cursor-pointer">
                    Require Email Verification
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* OAuth Providers Table */}
          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">OAuth 2.0 / Social Providers</Label>
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
                        <div className="col-span-4">
                          <Input
                            className="h-7 text-xs font-mono bg-background"
                            value={oa.clientIdEnv}
                            placeholder="CLIENT_ID_ENV"
                            onChange={(e) => {
                              const updated = (providers.oauth || []).map((o) =>
                                o.id === oa.id ? { ...o, clientIdEnv: e.target.value } : o,
                              );
                              updateData({ providers: { ...providers, oauth: updated } });
                            }}
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            className="h-7 text-xs font-mono bg-background"
                            value={oa.clientSecretEnv}
                            placeholder="CLIENT_SECRET_ENV"
                            onChange={(e) => {
                              const updated = (providers.oauth || []).map((o) =>
                                o.id === oa.id ? { ...o, clientSecretEnv: e.target.value } : o,
                              );
                              updateData({ providers: { ...providers, oauth: updated } });
                            }}
                          />
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

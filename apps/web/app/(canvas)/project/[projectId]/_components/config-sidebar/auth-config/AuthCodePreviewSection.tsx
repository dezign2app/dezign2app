import React from "react";
import { Label } from "@workspace/ui/components/label";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Code2 } from "lucide-react";
import { AuthConfigSectionProps } from "./types";

export const AuthCodePreviewSection: React.FC<AuthConfigSectionProps> = ({
  data,
  allNodes,
  edges,
  nodeId,
}) => {
  const enabledPlugins = data.plugins || ["bearer", "admin", "organization", "jwt"];
  const providers = data.providers || {};
  const emailPassword = providers.emailPassword || { enabled: true, requireVerification: true, minLength: 8 };
  const accountLinking = providers.accountLinking || { policy: "prompt" };
  const session = data.session || {};
  const redirects = data.redirects || {};
  const trustedOrigins = data.trustedOrigins || ["http://localhost:3000"];
  const org = data.organization || { enabled: true };
  const hooks = data.hooks || [];

  const schemaEntities = allNodes.filter((n) => n.type === "entity");
  const selectedOrgSchemaId = org.schemaId || org.entityId;
  const selectedOrgEntity = schemaEntities.find((n) => n.id === selectedOrgSchemaId);

  const selectedUserSchemaId = data.userEntityId || data.userSchemaId;
  const selectedUserEntity = schemaEntities.find((n) => n.id === selectedUserSchemaId);

  const isPaymentsInjected = edges.some(
    (e) => e.target === nodeId && e.targetHandle === "payments-plugin-in",
  );

  const activeHooks = hooks.filter((h) => h.enabled !== false && h.event);

  const generatedCode = `import { betterAuth } from "better-auth";
import { sqliteAdapter } from "better-auth/adapters/sqlite";
${enabledPlugins.includes("jwt") ? 'import { jwt } from "better-auth/plugins";\n' : ''}${enabledPlugins.includes("organization") ? 'import { organization } from "better-auth/plugins";\n' : ''}${isPaymentsInjected ? 'import { creem } from "@creem_io/better-auth";\n' : ''}
export const auth = betterAuth({
  database: sqliteAdapter(db, { provider: "sqlite" }),
  ${selectedUserEntity ? `user: { modelName: "${selectedUserEntity.data.label}" },\n  ` : ''}emailAndPassword: {
    enabled: ${emailPassword.enabled ?? true},
    requireEmailVerification: ${emailPassword.requireVerification ?? true},
    minPasswordLength: ${emailPassword.minLength ?? 8},
  },
  accountLinking: {
    enabled: ${accountLinking.enabled ?? true},
    trustedProviders: ["google", "github"],
  },
  session: {
    expiresIn: ${session.expiresInSeconds ?? 604800},
    updateAge: ${session.updateAgeSeconds ?? 86400},
    freshTokenRotation: ${session.refreshTokenRotation ?? true},
  },
  trustedOrigins: ${JSON.stringify(trustedOrigins)},
  ${activeHooks.length > 0 ? `databaseHooks: {\n    ${activeHooks.map((h) => `${h.event}: {\n      before: async (data, ctx) => {\n        // ${h.prompt || "Custom hook logic"}\n      }\n    }`).join(",\n    ")}\n  },\n  ` : ''}plugins: [
    ${enabledPlugins.map((p) => (p === "organization" && selectedOrgEntity ? `organization({ schema: "${selectedOrgEntity.data.label || "organization"}" })` : `${p}()`)).join(",\n    ")}${isPaymentsInjected ? ',\n    creem({ apiKey: process.env.CREEM_API_KEY!, webhookSecret: process.env.CREEM_WEBHOOK_SECRET! })' : ''}
  ]
});`;

  return (
    <AccordionItem
      value="preview"
      className="rounded-xl border bg-card/50 shadow-sm backdrop-blur-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 text-left flex-1">
          <Code2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated Code Preview
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
            auth.ts
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">
        <div className="flex flex-col gap-3 pt-2">
          <Label className="text-xs font-semibold">Generated <code className="font-mono">auth.ts</code></Label>
          <pre className="p-3 bg-muted/80 rounded-lg text-[11px] font-mono border border-border/60 overflow-x-auto text-foreground whitespace-pre">
            {generatedCode}
          </pre>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

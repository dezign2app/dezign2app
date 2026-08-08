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
import { SessionClaimConfig } from "@workspace/canvas";
import { AuthConfigSectionProps } from "./types";

export const AuthSessionSection: React.FC<AuthConfigSectionProps> = ({
  data,
  updateData,
  allNodes,
}) => {
  const claims: SessionClaimConfig[] = data.session?.claims || [
    { key: "orgRole", source: "orgRole", deliveryMode: "jwt" },
    { key: "subscriptionStatus", source: "subscription", targetValue: "status", deliveryMode: "cookie" },
    { key: "planId", source: "subscription", targetValue: "plan_id", deliveryMode: "jwt" },
  ];

  const schemaEntities = allNodes.filter((n) => n.type === "entity");
  const serviceNodes = allNodes.filter((n) => n.type === "service" || n.type === "webClient");

  const selectedUserSchemaId = data.userEntityId || data.userSchemaId;
  const selectedUserEntity = schemaEntities.find((n) => n.id === selectedUserSchemaId);
  const userColumns = selectedUserEntity?.data.columns || [];

  const subConfig = data.subscription;
  const selectedSubEntity = schemaEntities.find(
    (n) => n.id === (subConfig?.entityId || subConfig?.schemaId),
  );
  const subColumns = selectedSubEntity?.data.columns || [];

  // Collect all available DB operations from entity nodes
  const allDbOps = schemaEntities.flatMap((e) =>
    (e.data.dbOperations || []).map((op) => ({
      id: op.id,
      name: `${e.data.label}.${op.name}`,
    })),
  );

  // Collect all available Service Endpoints
  const allEndpoints = serviceNodes.flatMap((s) =>
    (s.data.endpoints || []).map((ep) => ({
      id: ep.id,
      name: `${s.data.label}: ${ep.type || "GET"} ${ep.name || ""}`,
    })),
  );

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
            <p className="font-semibold mb-1">Session Delivery & Claims Architecture:</p>
            <ul className="list-disc list-inside gap-1 flex flex-col text-[11px] text-muted-foreground">
              <li>
                <strong className="text-foreground">Configurable Claim Sources</strong>: Resolve claims dynamically from User Table columns, Subscription Table fields, DB queries, Service Endpoints, or Custom functions.
              </li>
              <li>
                <strong className="text-foreground">JWT Token Delivery</strong>: Signed into token payload at issue time (0 DB roundtrips on Edge middleware).
              </li>
              <li>
                <strong className="text-foreground">Cookie Session Delivery</strong>: Resolved live per request for React Layouts and Server Components.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 p-3.5 bg-background/50 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Configured Session Claims</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-background"
                onClick={() => {
                  const newClaim: SessionClaimConfig = {
                    key: `claim_${claims.length + 1}`,
                    source: "userColumn",
                    deliveryMode: "jwt",
                  };
                  const updated: SessionClaimConfig[] = [...claims, newClaim];
                  updateData({ session: { claims: updated } });
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Claim
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {claims.map((claim, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 p-2.5 rounded-lg bg-background border border-border/50 text-xs"
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Claim Key */}
                    <div className="col-span-3">
                      <Input
                        className="h-7 text-xs font-mono bg-background"
                        value={claim.key}
                        placeholder="claim_key"
                        onChange={(e) => {
                          const updated = claims.map((c, i) => (i === idx ? { ...c, key: e.target.value } : c));
                          updateData({ session: { claims: updated } });
                        }}
                      />
                    </div>

                    {/* Source Selector */}
                    <div className="col-span-4">
                      <Select
                        value={claim.source}
                        onValueChange={(val: SessionClaimConfig["source"]) => {
                          const updated = claims.map((c, i) => (i === idx ? { ...c, source: val, targetValue: "" } : c));
                          updateData({ session: { claims: updated } });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="userColumn" className="text-xs">User Table Column</SelectItem>
                          <SelectItem value="subscription" className="text-xs">Subscription Table</SelectItem>
                          <SelectItem value="dbFunction" className="text-xs">Direct DB Function</SelectItem>
                          <SelectItem value="serviceEndpoint" className="text-xs">Service Endpoint</SelectItem>
                          <SelectItem value="customFunction" className="text-xs">Custom Function</SelectItem>
                          <SelectItem value="orgRole" className="text-xs">Org Role</SelectItem>
                          <SelectItem value="customField" className="text-xs">Custom Field</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delivery Mode */}
                    <div className="col-span-4">
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
                          <SelectItem value="jwt" className="text-xs font-mono">JWT Token</SelectItem>
                          <SelectItem value="cookie" className="text-xs font-mono">Cookie Session</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delete Button */}
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

                  {/* Secondary Target Selector based on source */}
                  {claim.source === "userColumn" && (
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[11px] text-muted-foreground shrink-0 font-medium">User Column:</span>
                      {userColumns.length > 0 ? (
                        <Select
                          value={claim.targetValue || ""}
                          onValueChange={(val) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: val } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        >
                          <SelectTrigger className="h-6 text-[11px] font-mono bg-background/80">
                            <SelectValue placeholder="Select user column..." />
                          </SelectTrigger>
                          <SelectContent className="font-mono">
                            {userColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name} className="text-xs font-mono">
                                {col.name} ({col.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-6 text-[11px] font-mono bg-background/80"
                          placeholder="e.g. role, plan_id, status"
                          value={claim.targetValue || ""}
                          onChange={(e) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: e.target.value } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        />
                      )}
                    </div>
                  )}

                  {claim.source === "subscription" && (
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Sub Field:</span>
                      {subColumns.length > 0 ? (
                        <Select
                          value={claim.targetValue || ""}
                          onValueChange={(val) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: val } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        >
                          <SelectTrigger className="h-6 text-[11px] font-mono bg-background/80">
                            <SelectValue placeholder="Select subscription column..." />
                          </SelectTrigger>
                          <SelectContent className="font-mono">
                            {subColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name} className="text-xs font-mono">
                                {col.name} ({col.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-6 text-[11px] font-mono bg-background/80"
                          placeholder="e.g. status, plan_id, current_period_end"
                          value={claim.targetValue || ""}
                          onChange={(e) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: e.target.value } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        />
                      )}
                    </div>
                  )}

                  {claim.source === "dbFunction" && (
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[11px] text-muted-foreground shrink-0 font-medium">DB Operation:</span>
                      {allDbOps.length > 0 ? (
                        <Select
                          value={claim.targetValue || ""}
                          onValueChange={(val) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: val } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        >
                          <SelectTrigger className="h-6 text-[11px] font-mono bg-background/80">
                            <SelectValue placeholder="Select DB operation..." />
                          </SelectTrigger>
                          <SelectContent className="font-mono">
                            {allDbOps.map((op) => (
                              <SelectItem key={op.id} value={op.name} className="text-xs font-mono">
                                {op.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-6 text-[11px] font-mono bg-background/80"
                          placeholder="e.g. getUserPermissions, findSubscription"
                          value={claim.targetValue || ""}
                          onChange={(e) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: e.target.value } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        />
                      )}
                    </div>
                  )}

                  {claim.source === "serviceEndpoint" && (
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Endpoint:</span>
                      {allEndpoints.length > 0 ? (
                        <Select
                          value={claim.targetValue || ""}
                          onValueChange={(val) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: val } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        >
                          <SelectTrigger className="h-6 text-[11px] font-mono bg-background/80">
                            <SelectValue placeholder="Select Service Endpoint..." />
                          </SelectTrigger>
                          <SelectContent className="font-mono">
                            {allEndpoints.map((ep) => (
                              <SelectItem key={ep.id} value={ep.name} className="text-xs font-mono">
                                {ep.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-6 text-[11px] font-mono bg-background/80"
                          placeholder="e.g. GET /api/v1/user/claims"
                          value={claim.targetValue || ""}
                          onChange={(e) => {
                            const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: e.target.value } : c));
                            updateData({ session: { claims: updated } });
                          }}
                        />
                      )}
                    </div>
                  )}

                  {claim.source === "customFunction" && (
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Function:</span>
                      <Input
                        className="h-6 text-[11px] font-mono bg-background/80"
                        placeholder="e.g. resolveUserClaims(ctx)"
                        value={claim.targetValue || ""}
                        onChange={(e) => {
                          const updated = claims.map((c, i) => (i === idx ? { ...c, targetValue: e.target.value } : c));
                          updateData({ session: { claims: updated } });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

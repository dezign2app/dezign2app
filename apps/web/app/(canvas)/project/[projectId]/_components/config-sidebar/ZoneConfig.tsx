import React, { useState } from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Lock,
  Plus,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Code2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
} from "lucide-react";
import {
  ConditionNode,
  ConditionPrimitive,
  FailureReason,
  ProtectionRule,
  WebAppZone,
} from "@workspace/canvas";

const PRESET_TRIGGER_OPTIONS: { value: string; label: string; defaultRoute: string }[] = [
  { value: "no-auth", label: "Unauthenticated (no-auth)", defaultRoute: "/login" },
  { value: "no-org", label: "No Organization (no-org)", defaultRoute: "/select-org" },
  { value: "wrong-role", label: "Insufficient Role (wrong-role)", defaultRoute: "/unauthorized" },
  { value: "no-access", label: "No Paid Access (no-access)", defaultRoute: "/pricing" },
  { value: "wrong-plan", label: "Plan Upgrade Needed (wrong-plan)", defaultRoute: "/pricing" },
  { value: "custom-denied", label: "Custom Logic Denied (custom-denied)", defaultRoute: "/login" },
  { value: "default", label: "Default Fallback Redirect", defaultRoute: "/login" },
];

export const ZoneConfig = ({
  id,
  nodeId,
}: {
  id: string; // zoneId
  nodeId: string; // webApp nodeId
}) => {
  const node = useBackendCanvasStore((s) =>
    s.nodes.find((n) => n.id === nodeId),
  );
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const edges = useBackendCanvasStore((s) => s.edges);

  const [isEditingName, setIsEditingName] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    conditions: true,
    redirects: true,
    custom: true,
    preview: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!node) return null;

  const data = node.data;
  const zones: WebAppZone[] = data.zones || [];
  const currentZone = zones.find((z) => z.id === id) || {
    id: id || "zone-private",
    name: "Private Section",
    handleId: "private-in",
    accessType: "protected" as const,
    rule: {
      id: "rule-default",
      scope: "zone" as const,
      conditions: {
        kind: "group" as const,
        op: "AND" as const,
        children: [
          { kind: "leaf" as const, condition: { type: "auth" as const, op: "signedIn" as const } },
        ],
      },
      redirects: { "no-auth": "/login", "no-access": "/pricing", default: "/login" },
    },
  };

  const rule: ProtectionRule = currentZone.rule || {
    id: `rule-${currentZone.id}`,
    scope: "zone",
    conditions: {
      kind: "group",
      op: "AND",
      children: [{ kind: "leaf", condition: { type: "auth", op: "signedIn" } }],
    },
    redirects: { "no-auth": "/login", default: "/login" },
  };

  const updateZoneRule = (updatedRule: ProtectionRule) => {
    const updatedZone: WebAppZone = { ...currentZone, rule: updatedRule };
    const updatedZones = zones.some((z) => z.id === currentZone.id)
      ? zones.map((z) => (z.id === currentZone.id ? updatedZone : z))
      : [...zones, updatedZone];
    updateNode(nodeId, { data: { ...data, zones: updatedZones } });
  };

  const updateZoneName = (name: string) => {
    const updatedZone: WebAppZone = { ...currentZone, name };
    const updatedZones = zones.map((z) => (z.id === currentZone.id ? updatedZone : z));
    updateNode(nodeId, { data: { ...data, zones: updatedZones } });
  };

  // Find connected WebClient pages
  const connectedEdges = edges.filter(
    (e) =>
      (e.target === nodeId && e.targetHandle === currentZone.handleId) ||
      (e.source === nodeId && e.sourceHandle === currentZone.handleId),
  );
  const connectedPages = connectedEdges
    .map((e) => nodes.find((n) => n.id === (e.source === nodeId ? e.target : e.source)))
    .filter((n): n is (typeof nodes)[0] => Boolean(n));

  // Flatten leaf conditions for simple editing
  const getLeafConditions = (condNode: ConditionNode): ConditionPrimitive[] => {
    if (condNode.kind === "leaf") return [condNode.condition];
    return condNode.children.flatMap(getLeafConditions);
  };

  const leaves = getLeafConditions(rule.conditions);

  const handleAddCondition = (primitiveType: ConditionPrimitive["type"]) => {
    let newPrim: ConditionPrimitive;
    if (primitiveType === "auth") newPrim = { type: "auth", op: "signedIn" };
    else if (primitiveType === "org") newPrim = { type: "org", op: "required" };
    else if (primitiveType === "orgRole") newPrim = { type: "orgRole", op: "in", values: ["owner", "admin"] };
    else if (primitiveType === "access") newPrim = { type: "access", op: "granted" };
    else if (primitiveType === "subscriptionStatus")
      newPrim = { type: "subscriptionStatus", op: "statusIn", values: ["active", "trialing"] };
    else if (primitiveType === "plan") newPrim = { type: "plan", op: "in", values: ["pro", "enterprise"] };
    else newPrim = { type: "customClaim", key: "isVip", op: "truthy" };

    const initialChildren: ConditionNode[] =
      rule.conditions.kind === "group"
        ? rule.conditions.children
        : [{ kind: "leaf", condition: rule.conditions.condition }];

    const updatedChildren: ConditionNode[] = [
      ...initialChildren,
      { kind: "leaf", condition: newPrim },
    ];

    updateZoneRule({
      ...rule,
      conditions: { kind: "group", op: "AND", children: updatedChildren },
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (rule.conditions.kind !== "group") return;
    const updatedChildren = rule.conditions.children.filter((_, idx) => idx !== index);
    updateZoneRule({
      ...rule,
      conditions: {
        kind: "group",
        op: "AND",
        children: updatedChildren.length > 0 ? updatedChildren : [{ kind: "leaf", condition: { type: "auth", op: "signedIn" } }],
      },
    });
  };

  // Redirect Map CRUD handlers
  const DEFAULT_REDIRECT_MAP: Record<string, string> = {
    "no-auth": "/login",
    "no-org": "/select-org",
    "wrong-role": "/unauthorized",
    "no-access": "/pricing",
    "wrong-plan": "/pricing",
    default: "/login",
  };

  const redirectsMap: Record<string, string> = {
    ...DEFAULT_REDIRECT_MAP,
    ...(rule.redirects || {}),
  };

  const redirectEntries = Object.entries(redirectsMap);

  const handleSelectPresetOrCustomRedirect = (selectedVal: string) => {
    let keyToAdd = selectedVal;
    let defaultPath = "/login";

    if (selectedVal === "custom_key") {
      keyToAdd = `custom_trigger_${Date.now().toString().slice(-4)}`;
      defaultPath = "/login";
    } else {
      const presetOpt = PRESET_TRIGGER_OPTIONS.find((p) => p.value === selectedVal);
      if (presetOpt) defaultPath = presetOpt.defaultRoute;
    }

    const updatedRedirects = {
      ...redirectsMap,
      [keyToAdd]: defaultPath,
    };
    updateZoneRule({ ...rule, redirects: updatedRedirects });
  };

  const handleDeleteRedirect = (keyToDelete: string) => {
    const updatedRedirects = { ...redirectsMap };
    delete updatedRedirects[keyToDelete];
    updateZoneRule({ ...rule, redirects: updatedRedirects });
  };

  const handleUpdateRedirectKey = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    const updatedRedirects: Record<string, string> = {};
    for (const [k, v] of Object.entries(redirectsMap)) {
      if (k === oldKey) {
        updatedRedirects[newKey.trim()] = v;
      } else {
        updatedRedirects[k] = v;
      }
    }
    updateZoneRule({ ...rule, redirects: updatedRedirects });
  };

  const handleUpdateRedirectRoute = (key: string, route: string) => {
    const updatedRedirects = {
      ...redirectsMap,
      [key]: route,
    };
    updateZoneRule({ ...rule, redirects: updatedRedirects });
  };

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12">
      {/* Header - Styled like EndpointConfig */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 shadow-sm flex items-center gap-1">
            <Lock className="w-3 h-3" /> PROTECTED ZONE
          </span>
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <Input
                className="text-base font-semibold h-8 w-[220px] bg-background/50"
                value={currentZone.name}
                onChange={(e) => updateZoneName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") setIsEditingName(false);
                }}
              />
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <span className="text-lg font-semibold tracking-tight text-foreground">
                {currentZone.name}
              </span>
              <button
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-opacity"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          Configure rule conditions, redirects by failure reason, and custom access logic for this zone cluster.
        </span>
      </div>

      {/* Vertical Stack of Collapsible Cards - Matching EndpointConfig card styling */}
      <div className="flex flex-col gap-6">
        {/* Section 1: Access Conditions */}
        <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div
            onClick={() => toggleSection("conditions")}
            className="flex items-center justify-between cursor-pointer nodrag"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Access Conditions
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {leaves.length} {leaves.length === 1 ? "rule" : "rules"}
              </span>
            </div>
            {openSections.conditions ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {openSections.conditions && (
            <div className="flex flex-col gap-4 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground font-medium">
                  Condition Group (AND Evaluation)
                </Label>

                <Select onValueChange={(val) => handleAddCondition(val as ConditionPrimitive["type"])}>
                  <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
                    <SelectValue placeholder="+ Add Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auth" className="text-xs">Signed In / Out</SelectItem>
                    <SelectItem value="org" className="text-xs">Org Required</SelectItem>
                    <SelectItem value="orgRole" className="text-xs">Org Role (Owner/Admin)</SelectItem>
                    <SelectItem value="access" className="text-xs">Creem Payments Access</SelectItem>
                    <SelectItem value="subscriptionStatus" className="text-xs">Subscription Status</SelectItem>
                    <SelectItem value="plan" className="text-xs">Plan Tier</SelectItem>
                    <SelectItem value="customClaim" className="text-xs">Custom Claim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                {leaves.map((leaf, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-semibold text-indigo-400 uppercase">{leaf.type}</span>
                      <span className="text-muted-foreground">{"->"}</span>
                      <span className="text-foreground">
                        {leaf.type === "auth" && `auth.${leaf.op}`}
                        {leaf.type === "org" && `org.${leaf.op}`}
                        {leaf.type === "orgRole" && `orgRole ${leaf.op} [${leaf.values.join(", ")}]`}
                        {leaf.type === "access" && `access.${leaf.op} (Creem billing cycle)`}
                        {leaf.type === "subscriptionStatus" && `status ${leaf.op} [${leaf.values.join(", ")}]`}
                        {leaf.type === "plan" && `plan ${leaf.op} [${leaf.values.join(", ")}]`}
                        {leaf.type === "customClaim" && `claim[${leaf.key}] ${leaf.op}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveCondition(idx)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Connected Pages in this zone */}
              <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                <Label className="text-xs text-muted-foreground font-medium">
                  Connected WebClient Pages ({connectedPages.length})
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {connectedPages.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      No WebClient pages connected to this zone handle yet.
                    </span>
                  ) : (
                    connectedPages.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded bg-background text-foreground font-mono text-xs border border-border"
                      >
                        {p.data.label || "Page"}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Redirect Map with Presets + Custom Triggers */}
        <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div
            onClick={() => toggleSection("redirects")}
            className="flex items-center justify-between cursor-pointer nodrag"
          >
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Redirect Map
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {redirectEntries.length} {redirectEntries.length === 1 ? "route" : "routes"}
              </span>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Select onValueChange={handleSelectPresetOrCustomRedirect}>
                <SelectTrigger className="h-7 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-medium">
                  <div className="flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Route
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="nodrag">
                  {PRESET_TRIGGER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs font-mono">
                      {opt.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom_key" className="text-xs font-medium text-indigo-400">
                    + Custom Trigger Key
                  </SelectItem>
                </SelectContent>
              </Select>

              {openSections.redirects ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {openSections.redirects && (
            <div className="flex flex-col gap-4 pt-2 border-t border-border/50">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                <p className="font-semibold flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Evaluation Order Precedence:
                </p>
                <p className="text-[11px] font-mono opacity-90">
                  auth → org → orgRole → access → plan → customClaim → customLogic
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {redirectEntries.map(([reasonKey, route]) => {
                  const presetMatch = PRESET_TRIGGER_OPTIONS.find((p) => p.value === reasonKey);

                  return (
                    <div
                      key={reasonKey}
                      className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-background border border-border/50"
                    >
                      <div className="col-span-5 flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground font-mono uppercase">
                          Failure Trigger
                        </Label>
                        {presetMatch ? (
                          <span className="h-8 flex items-center px-2 text-xs font-mono font-medium rounded bg-muted/40 border border-border/40 text-foreground truncate" title={presetMatch.label}>
                            {presetMatch.label}
                          </span>
                        ) : (
                          <Input
                            className="h-8 text-xs font-mono bg-background/50"
                            value={reasonKey}
                            placeholder="custom-trigger"
                            onChange={(e) => handleUpdateRedirectKey(reasonKey, e.target.value)}
                          />
                        )}
                      </div>

                      <div className="col-span-6 flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground font-mono uppercase">
                          Target Redirect Route
                        </Label>
                        <Input
                          className="h-8 text-xs font-mono bg-background/50"
                          value={route}
                          placeholder="/login"
                          onChange={(e) => handleUpdateRedirectRoute(reasonKey, e.target.value)}
                        />
                      </div>

                      <div className="col-span-1 flex justify-end items-end pt-5">
                        <button
                          onClick={() => handleDeleteRedirect(reasonKey)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title={`Delete ${reasonKey} redirect route`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Custom Logic (AI) */}
        <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div
            onClick={() => toggleSection("custom")}
            className="flex items-center justify-between cursor-pointer nodrag"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom Logic (AI Prompt)
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Natural Language
              </span>
            </div>
            {openSections.custom ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {openSections.custom && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                Describe extra granular security conditions. The prompt result will be ANDed onto the structured access rules.
              </span>
              <Textarea
                className="min-h-[90px] text-xs font-mono bg-background"
                placeholder="e.g. Block POST requests during grace period, allow GET requests..."
                value={rule.customLogic?.prompt || ""}
                onChange={(e) =>
                  updateZoneRule({
                    ...rule,
                    customLogic: { mode: "naturalLanguage", prompt: e.target.value },
                  })
                }
              />
            </div>
          )}
        </div>

        {/* Section 4: Code Preview */}
        <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div
            onClick={() => toggleSection("preview")}
            className="flex items-center justify-between cursor-pointer nodrag"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Code Preview
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Generated Middleware
              </span>
            </div>
            {openSections.preview ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {openSections.preview && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-medium">
                Edge Middleware Evaluation Function
              </span>
              <pre className="p-3 bg-muted/80 rounded-lg text-[11px] font-mono border border-border/60 overflow-x-auto text-foreground">
{`// Evaluated deterministically in proxy.ts
export function evaluateZone_${currentZone.id.replace(/[^a-zA-Z0-9]/g, "_")}(claims: SessionClaims) {
  if (!claims.userId) return { allowed: false, redirect: "${rule.redirects["no-auth"] || "/login"}" };
${leaves.some((l) => l.type === "orgRole") ? `  if (!claims.orgRole || !["owner", "admin"].includes(claims.orgRole)) return { allowed: false, redirect: "${rule.redirects["wrong-role"] || "/unauthorized"}" };\n` : ""}${leaves.some((l) => l.type === "access") ? `  if (!claims.hasAccess) return { allowed: false, redirect: "${rule.redirects["no-access"] || "/pricing"}" };\n` : ""}  return { allowed: true };
}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

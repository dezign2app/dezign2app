import React from "react";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import {
  ParameterEditor,
  SchemaEditor,
} from "../backend-nodes/graph-nodes/Editors";
import {
  MessagingResourceList,
  LocalInput,
} from "../backend-nodes/graph-nodes/shared";
import {
  BusinessLogicBlock,
  TableCrudConfig,
  CrudOperation,
} from "../shared/BusinessLogicBlock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { useParams } from "next/navigation";

interface EndpointConfigProps {
  id: string;
  nodeId: string;
}

export const EndpointConfig = ({ id, nodeId }: EndpointConfigProps) => {
  const paramsHook = useParams();
  const projectId = paramsHook.projectId as Id<"projects">;

  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const updateEndpoint = useBackendCanvasStore((s) => s.updateEndpoint);
  const node = useBackendCanvasStore((s) =>
    s.nodes.find((n) => n.id === nodeId),
  );
  const authRules = node?.data.authRules || [];

  const testCases = useSimulationStore((s) => s.testCases);
  const updateTestCase = useSimulationStore((s) => s.updateTestCase);
  const upsertBackendTestCase = useMutation(api.canvas.upsertBackendTestCase);

  const selectedCaseId = useSimulationStore((s) => s.selectedCaseId) || "none";
  const selectTestCase = useSimulationStore((s) => s.selectTestCase);

  const allNodes = useBackendCanvasStore((s) => s.nodes);

  const item = endpoints.find((e) => e.id === id);
  if (!item) return null;

  const availableTableNodes = allNodes
    .filter((n) => n?.type === "db_ref" || n?.type === "database")
    .map((n) => ({
      id: n.id,
      label: n.data?.label || n.data?.tableRef || "Table Reference",
    }));

  const databaseNodeIds =
    item.databaseNodeIds ||
    (item.databaseNodeId && item.databaseNodeId !== "none"
      ? [item.databaseNodeId]
      : []);
  const crudConfig: TableCrudConfig[] = databaseNodeIds.map((tableNodeId) => {
    const rawOps = item.crudOperations?.[tableNodeId];
    const operations: CrudOperation[] = Array.isArray(rawOps)
      ? rawOps
      : ["read"];
    const explanations = item.crudExplanations?.[tableNodeId] as
      | Record<CrudOperation, string>
      | undefined;
    return { tableNodeId, operations, explanations };
  });

  const handleCrudConfigChange = (newCrudConfig: TableCrudConfig[]) => {
    const newDbNodeIds = newCrudConfig
      .map((c) => c.tableNodeId)
      .filter(Boolean);
    const newCrudOps: Record<string, CrudOperation[]> = {};
    const newCrudExplanations: Record<string, Record<string, string>> = {};
    newCrudConfig.forEach((c) => {
      if (c.tableNodeId) {
        newCrudOps[c.tableNodeId] = c.operations;
        if (c.explanations) {
          newCrudExplanations[c.tableNodeId] = c.explanations;
        }
      }
    });
    updateEndpoint(item.id, {
      databaseNodeIds: newDbNodeIds,
      databaseNodeId: newDbNodeIds[0] || "none",
      crudOperations: newCrudOps,
      crudExplanations: newCrudExplanations,
    });
  };

  return (
    <div className="flex flex-col gap-6 mt-6 pb-12">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 shadow-sm">
            {item.type}
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {item.name}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Configure endpoint details and behavior.
        </span>
      </div>

      {node?.type === "api_gateway" && (
        <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Auth Rule
            </span>
            <Select
              value={item.authRuleId || "__none__"}
              onValueChange={(authRuleId) =>
                updateEndpoint(item.id, {
                  authRuleId:
                    authRuleId === "__none__" ? undefined : authRuleId,
                })
              }
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select an auth rule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No auth rule</SelectItem>
                {authRules
                  .filter((rule) => rule.name.trim())
                  .map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name} ({rule.type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              Choose a reusable gateway policy for this endpoint.
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Authorization
            </span>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Required Roles (Comma separated)
                </Label>
                <Input
                  className="h-7 text-xs bg-background"
                  placeholder="e.g. admin, user"
                  value={item.requiredRoles?.join(", ") || ""}
                  onChange={(e) =>
                    updateEndpoint(item.id, {
                      requiredRoles: e.target.value
                        .split(",")
                        .map((r) => r.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Required Scopes (Comma separated)
                </Label>
                <Input
                  className="h-7 text-xs bg-background"
                  placeholder="e.g. read:users, write:users"
                  value={item.requiredScopes?.join(", ") || ""}
                  onChange={(e) =>
                    updateEndpoint(item.id, {
                      requiredScopes: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Audience</Label>
                <Input
                  className="h-7 text-xs bg-background"
                  placeholder="e.g. my-api"
                  value={item.audience || ""}
                  onChange={(e) =>
                    updateEndpoint(item.id, { audience: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Summary
        </Label>
        <Input
          className="bg-background/50"
          placeholder="e.g. Returns all users."
          value={item.summary || ""}
          onChange={(e) => updateEndpoint(item.id, { summary: e.target.value })}
        />
      </div>

      <ParameterEditor
        title="Headers"
        parameters={item.headers || []}
        onChange={(headers) => updateEndpoint(item.id, { headers })}
      />
      <ParameterEditor
        title="Path Params"
        parameters={item.pathParams || []}
        onChange={(pathParams) => updateEndpoint(item.id, { pathParams })}
      />
      <ParameterEditor
        title="Query Params"
        parameters={item.queryParams || []}
        onChange={(queryParams) => updateEndpoint(item.id, { queryParams })}
      />
      <SchemaEditor
        title="Request Body Schema"
        schema={item.requestBody}
        onChange={(requestBody) => updateEndpoint(item.id, { requestBody })}
      />
      <BusinessLogicBlock
        mode={item.logicMode || "natural_language"}
        onModeChange={(logicMode) => updateEndpoint(item.id, { logicMode })}
        prompt={item.businessLogic || item.prompt || ""}
        onPromptChange={(val) =>
          updateEndpoint(item.id, { businessLogic: val, prompt: val })
        }
        code={item.body || item.code || ""}
        onCodeChange={(val) =>
          updateEndpoint(item.id, { body: val, code: val })
        }
        title="Endpoint Business Logic"
        description="Define endpoint processing steps or custom code handler"
        crudConfig={crudConfig}
        onCrudConfigChange={handleCrudConfigChange}
        availableTableNodes={availableTableNodes}
        onGenerateCode={() => {
          if (item.businessLogic && !item.body) {
            updateEndpoint(item.id, {
              logicMode: "code",
              body: `// Logic: ${item.businessLogic.split("\n").join("\n// ")}\nconst result = await db.query();\nreturn res.json({ success: true, result });`,
            });
          }
        }}
      />

      <div className="flex flex-col gap-3 mt-2">
        <MessagingResourceList
          nodeId={nodeId}
          title="Publish Events"
          items={item.publishedEvents || []}
          variant="publish"
          resourceType="topics"
          asCard={true}
          onChange={(publishedEvents) =>
            updateEndpoint(item.id, { publishedEvents })
          }
        />
      </div>

      <SchemaEditor
        title="Response Schema"
        schema={item.responseBody}
        onChange={(responseBody) => updateEndpoint(item.id, { responseBody })}
      />
    </div>
  );
};

"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";

import { WORKFLOW_NODE_REGISTRY } from "./workflow-node-registry";
import type {
  ApiNodeConfig,
  ConditionNodeConfig,
  EndNodeConfig,
  LlmNodeConfig,
  StartNodeConfig,
  WorkflowNodeConfig,
} from "./workflow-editor-types";

import { Field } from "./inspector/field";
import { StartNodeFields } from "./inspector/start-node-fields";
import { ConditionNodeFields } from "./inspector/condition-node-fields";
import { ApiNodeFields } from "./inspector/api-node-fields";
import { LlmNodeFields } from "./inspector/llm-node-fields";
import { EndNodeFields } from "./inspector/end-node-fields";

import { useWorkflowEditorContext } from "./workflow-editor-context";

export const WorkflowNodeInspector = () => {
  const {
    selectedNode,
    workflowSecrets = [],
    isReadOnly,
    handleBlockedAction: onBlockedAction,
    handleLabelChange: onLabelChange,
    handleConfigChange: onConfigChange,
    handleDeleteNode: onDeleteNode,
  } = useWorkflowEditorContext();
  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b px-4 py-4">
          <p className="text-sm font-semibold">Inspector</p>
          <p className="text-xs text-muted-foreground">
            Select a node to configure its inputs and behavior.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">No node selected</p>
            <p className="text-xs text-muted-foreground">
              Click a node on the canvas to edit its configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const definition = WORKFLOW_NODE_REGISTRY[selectedNode.data.nodeType];
  const typedConfig = selectedNode.data.config;

  const updateConfig = (patch: Partial<WorkflowNodeConfig>) => {
    if (isReadOnly) {
      onBlockedAction();
      return;
    }

    onConfigChange(selectedNode.id, {
      ...selectedNode.data.config,
      ...patch,
    } as WorkflowNodeConfig);
  };

  const labelInput = (
    <Field label="Label" description="Internal display label for this node.">
      <Input
        value={selectedNode.data.label ?? ""}
        disabled={isReadOnly}
        onChange={(event) => onLabelChange(selectedNode.id, event.target.value)}
      />
    </Field>
  );

  const renderNodeFields = () => {
    switch (selectedNode.data.nodeType) {
      case "start":
        return (
          <StartNodeFields
            config={typedConfig as StartNodeConfig}
            isReadOnly={isReadOnly}
            updateConfig={updateConfig as any}
          />
        );

      case "condition":
        return (
          <ConditionNodeFields
            config={typedConfig as ConditionNodeConfig}
            isReadOnly={isReadOnly}
            updateConfig={updateConfig as any}
          />
        );

      case "api":
        return (
          <ApiNodeFields
            config={typedConfig as ApiNodeConfig}
            workflowSecrets={workflowSecrets}
            isReadOnly={isReadOnly}
            updateConfig={updateConfig as any}
          />
        );

      case "llm":
        return (
          <LlmNodeFields
            config={typedConfig as LlmNodeConfig}
            workflowSecrets={workflowSecrets}
            isReadOnly={isReadOnly}
            updateConfig={updateConfig as any}
          />
        );

      case "end":
        return (
          <EndNodeFields
            config={typedConfig as EndNodeConfig}
            isReadOnly={isReadOnly}
            updateConfig={updateConfig as any}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Inspector</p>
            <p className="text-xs text-muted-foreground">
              Configure node inputs on the selected card.
            </p>
          </div>
          <Badge variant="outline">{selectedNode.data.nodeType}</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="text-sm font-medium">{definition.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {definition.paletteDescription}
            </p>
          </div>

          {isReadOnly ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium">Read-only workflow access</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Editing is blocked until the subscription is active again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onBlockedAction}
              >
                Unlock editing
              </Button>
            </div>
          ) : null}

          {labelInput}

          <Separator />

          {renderNodeFields()}

          {definition.deletable ? (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Danger Zone</Label>
                <Button
                  variant="destructive"
                  className="w-full justify-center"
                  onClick={() =>
                    isReadOnly
                      ? onBlockedAction()
                      : onDeleteNode(selectedNode.id)
                  }
                >
                  <Trash2 className="size-3.5" />
                  Delete Node
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
};

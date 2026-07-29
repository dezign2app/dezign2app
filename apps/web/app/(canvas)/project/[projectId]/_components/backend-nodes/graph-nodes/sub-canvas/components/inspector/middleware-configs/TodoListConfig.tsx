import React from "react";
import { ListTodo } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { LocalTextarea } from "../../../../shared";
import type { MiddlewareConfigProps } from "./types";

export function TodoListConfig({ data, onUpdate }: MiddlewareConfigProps) {
  return (
    <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
      <div className="flex items-center gap-2">
        <ListTodo className="w-4 h-4 text-teal-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To-do List Planner</h3>
      </div>

      <div className="flex items-center justify-between text-xs">
        <Label htmlFor="todo-write" className="text-xs cursor-pointer">Enable write_todos Tool</Label>
        <Switch
          id="todo-write"
          checked={data.todoListConfig?.enableWriteTodos ?? true}
          onCheckedChange={(c) =>
            onUpdate({
              todoListConfig: { ...data.todoListConfig, enableWriteTodos: c },
            })
          }
          className="scale-75 origin-right"
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <Label htmlFor="todo-prompt" className="text-xs cursor-pointer">Auto-Inject Planning System Prompt</Label>
        <Switch
          id="todo-prompt"
          checked={data.todoListConfig?.autoInjectPrompt ?? true}
          onCheckedChange={(c) =>
            onUpdate({
              todoListConfig: { ...data.todoListConfig, autoInjectPrompt: c },
            })
          }
          className="scale-75 origin-right"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold text-foreground">Initial Tasks / Instructions</Label>
        <LocalTextarea
          value={data.todoListConfig?.initialTasks || ""}
          onChange={(e) =>
            onUpdate({
              todoListConfig: {
                ...data.todoListConfig,
                initialTasks: e.target.value,
              },
            })
          }
          className="text-xs min-h-[60px] bg-background"
          placeholder="e.g. 1. Fetch requirements 2. Process data 3. Generate summary"
        />
      </div>
    </div>
  );
}

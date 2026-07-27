import React from "react";
import {
  Brain, Plus, Zap, Trash2, Sparkles,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import type {
  LangGraphStepConfig,
  LangGraphStateChannel,
  LangGraphInputChannel,
  LangGraphMemoryConfig,
} from "@/types/canvas";
import type { StepNodeData } from "../types";

interface InspectorSidebarProps {
  activeSideTab: "inspector" | "inputs" | "state" | "memory";
  setActiveSideTab: (tab: "inspector" | "inputs" | "state" | "memory") => void;
  selectedStepData: StepNodeData | null;
  onDeleteStep: () => void;
  onUpdateStep: (changes: Partial<StepNodeData>) => void;
  inputChannels: LangGraphInputChannel[];
  setInputChannels: React.Dispatch<React.SetStateAction<LangGraphInputChannel[]>>;
  stateChannels: LangGraphStateChannel[];
  setStateChannels: React.Dispatch<React.SetStateAction<LangGraphStateChannel[]>>;
  memoryConfig: LangGraphMemoryConfig;
  setMemoryConfig: React.Dispatch<React.SetStateAction<LangGraphMemoryConfig>>;
}

export function InspectorSidebar({
  activeSideTab,
  setActiveSideTab,
  selectedStepData,
  onDeleteStep,
  onUpdateStep,
  inputChannels,
  setInputChannels,
  stateChannels,
  setStateChannels,
  memoryConfig,
  setMemoryConfig,
}: InspectorSidebarProps) {
  return (
    <div className="w-[340px] border-l border-border bg-card flex flex-col overflow-hidden shrink-0">
      <Tabs value={activeSideTab} onValueChange={(v) => setActiveSideTab(v as typeof activeSideTab)} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 bg-secondary/30 p-1 rounded-none border-b border-border/40">
          <TabsTrigger value="inspector" className="text-[11px] px-1">Inspector</TabsTrigger>
          <TabsTrigger value="inputs" className="text-[11px] px-1">Inputs ({inputChannels.length})</TabsTrigger>
          <TabsTrigger value="state" className="text-[11px] px-1">State ({stateChannels.length})</TabsTrigger>
          <TabsTrigger value="memory" className="text-[11px] px-1">Memory</TabsTrigger>
        </TabsList>

        {/* ── Inspector ── */}
        <TabsContent value="inspector" className="flex-1 p-4 overflow-y-auto m-0">
          {selectedStepData ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="font-bold text-sm text-foreground">Configure Step</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:bg-red-500/20" onClick={onDeleteStep}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Label</Label>
                <Input className="h-8 text-xs bg-background"
                  value={selectedStepData.label || ""}
                  onChange={(e) => onUpdateStep({ label: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Step Type</Label>
                <Select value={selectedStepData.stepType || "llm_call"}
                  onValueChange={(v: string) => onUpdateStep({ stepType: v as LangGraphStepConfig["type"] })}>
                  <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llm_call">LLM Reasoner</SelectItem>
                    <SelectItem value="tool_node">Tool Executor</SelectItem>
                    <SelectItem value="evaluator">Evaluator</SelectItem>
                    <SelectItem value="summarizer">Summarizer</SelectItem>
                    <SelectItem value="human_gate">Human Gate</SelectItem>
                    <SelectItem value="custom_code">Custom Code</SelectItem>
                    <SelectItem value="vector_search">Vector Search</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model Config Section */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/20 border border-border/50">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> Model Config</span>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">Provider</Label>
                  <Select value={selectedStepData.modelConfig?.provider || "groq"}
                    onValueChange={(v: string) => onUpdateStep({ modelConfig: { ...selectedStepData.modelConfig, provider: v as NonNullable<LangGraphStepConfig["modelConfig"]>["provider"] } })}>
                    <SelectTrigger className="h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">Model</Label>
                  <Input className="h-7 text-xs bg-background font-mono"
                    value={selectedStepData.modelConfig?.model || ""}
                    onChange={(e) => onUpdateStep({ modelConfig: { ...selectedStepData.modelConfig, model: e.target.value } })} />
                </div>
              </div>

              {/* State Channel Updates Section in Inspector */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> State Channel Updates
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-1"
                    onClick={() => {
                      const current = selectedStepData.stateUpdates || [];
                      const defaultKey = stateChannels[0]?.key || "summary";
                      onUpdateStep({
                        stateUpdates: [...current, { channelKey: defaultKey, mode: "set", value: "" }],
                      });
                    }}
                  >
                    <Plus className="w-3 h-3" /> Add Update
                  </Button>
                </div>

                {(selectedStepData.stateUpdates || []).map((su, sIdx) => (
                  <div key={sIdx} className="flex flex-col gap-1.5 p-2 rounded-lg bg-background border border-border/50 text-xs">
                    <div className="flex items-center justify-between gap-1.5">
                      <Select
                        value={su.channelKey}
                        onValueChange={(v) => {
                          const updated = [...(selectedStepData.stateUpdates || [])];
                          const current = updated[sIdx];
                          if (current) {
                            updated[sIdx] = { ...current, channelKey: v };
                            onUpdateStep({ stateUpdates: updated });
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs bg-secondary/30 font-mono flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stateChannels.map((ch) => (
                            <SelectItem key={ch.key} value={ch.key}>
                              {ch.key} ({ch.type})
                            </SelectItem>
                          ))}
                          {!stateChannels.some((c) => c.key === su.channelKey) && su.channelKey && (
                            <SelectItem value={su.channelKey}>{su.channelKey}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      <Select
                        value={su.mode || "set"}
                        onValueChange={(v: "set" | "append" | "expression") => {
                          const updated = [...(selectedStepData.stateUpdates || [])];
                          const current = updated[sIdx];
                          if (current) {
                            updated[sIdx] = { ...current, mode: v };
                            onUpdateStep({ stateUpdates: updated });
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-[11px] w-24 bg-secondary/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="set">Set / Replace</SelectItem>
                          <SelectItem value="append">Append</SelectItem>
                          <SelectItem value="expression">Expression</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:bg-red-500/20 shrink-0"
                        onClick={() => {
                          const updated = (selectedStepData.stateUpdates || []).filter((_, i) => i !== sIdx);
                          onUpdateStep({ stateUpdates: updated });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Input
                      className="h-6 text-[11px] bg-secondary/20 font-mono"
                      placeholder="Value / expression (e.g. state.messages + input)"
                      value={su.value || ""}
                      onChange={(e) => {
                        const updated = [...(selectedStepData.stateUpdates || [])];
                        const current = updated[sIdx];
                        if (current) {
                          updated[sIdx] = { ...current, value: e.target.value };
                          onUpdateStep({ stateUpdates: updated });
                        }
                      }}
                    />
                  </div>
                ))}

                {(!selectedStepData.stateUpdates || selectedStepData.stateUpdates.length === 0) && (
                  <span className="text-[10px] text-muted-foreground italic text-center py-1">
                    No state updates configured for this step node.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-4 text-muted-foreground">
              <Sparkles className="w-8 h-8 text-muted-foreground/40" />
              <span className="text-xs font-semibold text-foreground">Select a node</span>
              <span className="text-[11px]">Click any step on the canvas to configure it</span>
            </div>
          )}
        </TabsContent>

        {/* ── Input State ── */}
        <TabsContent value="inputs" className="flex-1 p-4 overflow-y-auto m-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">Input Payload State</span>
              <span className="text-[10px] text-muted-foreground font-normal">Fields accepted when invoking graph</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs border-border gap-1"
              onClick={() => {
                const newChan: LangGraphInputChannel = { key: `input_${inputChannels.length + 1}`, type: "string", required: true, description: "" };
                setInputChannels([...inputChannels, newChan]);
              }}>
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>

          {inputChannels.map((input, idx) => (
            <div key={idx} className="flex flex-col gap-2 p-2.5 rounded-xl bg-secondary/20 border border-border/50 text-xs">
              <div className="flex items-center justify-between gap-2">
                <Input
                  className="h-7 text-xs font-mono font-bold bg-background flex-1"
                  value={input.key}
                  onChange={(e) => {
                    const updated = { ...input, key: e.target.value };
                    setInputChannels(inputChannels.map((c, i) => i === idx ? updated : c));
                  }}
                  placeholder="field_key"
                />
                <Select
                  value={input.type}
                  onValueChange={(v: string) => {
                    const updated = { ...input, type: v as LangGraphInputChannel["type"] };
                    setInputChannels(inputChannels.map((c, i) => i === idx ? updated : c));
                  }}
                >
                  <SelectTrigger className="h-7 text-[11px] w-24 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">string</SelectItem>
                    <SelectItem value="messages">messages</SelectItem>
                    <SelectItem value="json">json</SelectItem>
                    <SelectItem value="number">number</SelectItem>
                    <SelectItem value="boolean">boolean</SelectItem>
                    <SelectItem value="object">object</SelectItem>
                    <SelectItem value="array">array</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/20 shrink-0"
                  onClick={() => setInputChannels(inputChannels.filter((_, i) => i !== idx))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
                <Input
                  className="h-6 text-[10px] bg-background/50 flex-1"
                  value={input.description || ""}
                  onChange={(e) => {
                    const updated = { ...input, description: e.target.value };
                    setInputChannels(inputChannels.map((c, i) => i === idx ? updated : c));
                  }}
                  placeholder="Description (optional)"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Label className="text-[10px] text-muted-foreground">Req</Label>
                  <Switch
                    checked={input.required ?? true}
                    onCheckedChange={(c) => {
                      const updated = { ...input, required: c };
                      setInputChannels(inputChannels.map((c, i) => i === idx ? updated : c));
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── State Schema ── */}
        <TabsContent value="state" className="flex-1 p-4 overflow-y-auto m-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">Graph State Schema</span>
              <span className="text-[10px] text-muted-foreground font-normal">State schema fields & reducer functions</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs border-border gap-1"
              onClick={() => {
                const newChannel: LangGraphStateChannel = { key: ``, type: "string", reducer: "replace", defaultValue: "" };
                setStateChannels([...stateChannels, newChannel]);
              }}>
              <Plus className="w-3 h-3" /> Add Field
            </Button>
          </div>
          {stateChannels.map((ch, idx) => (
            <div key={idx} className="flex flex-col gap-2 p-2.5 rounded-xl bg-secondary/20 border border-border/50 text-xs">
              <div className="flex items-center justify-between gap-2">
                <Input
                  className="h-7 text-xs font-mono font-bold bg-background flex-1"
                  placeholder="field_name"
                  value={ch.key}
                  onChange={(e) => {
                    const key = e.target.value;
                    setStateChannels(stateChannels.map((c, i) => i === idx ? { ...c, key } : c));
                  }}
                />
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/20 shrink-0"
                  onClick={() => setStateChannels(stateChannels.filter((_, i) => i !== idx))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex gap-2 pt-1 border-t border-border/30">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-muted-foreground">Type</Label>
                  <Select
                    value={ch.type}
                    onValueChange={(v) => {
                      const type = v as LangGraphStateChannel["type"];
                      const defaultReducer = type === "messages" ? "add_messages"
                        : type === "array" ? "append"
                        : type === "object" ? "merge_object"
                        : "replace";
                      setStateChannels(stateChannels.map((c, i) => i === idx ? { ...c, type, reducer: defaultReducer } : c));
                    }}
                  >
                    <SelectTrigger className="h-7 text-[11px] bg-background font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="messages">messages</SelectItem>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="array">array</SelectItem>
                      <SelectItem value="object">object</SelectItem>
                      <SelectItem value="json">json</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-muted-foreground">Reducer</Label>
                  <Select
                    value={ch.reducer}
                    onValueChange={(v) => {
                      const reducer = v as LangGraphStateChannel["reducer"];
                      setStateChannels(stateChannels.map((c, i) => i === idx ? { ...c, reducer } : c));
                    }}
                  >
                    <SelectTrigger className="h-7 text-[11px] bg-background font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replace">replace (override)</SelectItem>
                      <SelectItem value="add_messages">add_messages</SelectItem>
                      <SelectItem value="append">append (list)</SelectItem>
                      <SelectItem value="concat_array">concat_array</SelectItem>
                      <SelectItem value="merge_object">merge_object</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── Memory ── */}
        <TabsContent value="memory" className="flex-1 p-4 overflow-y-auto m-0 flex flex-col gap-4">
          <span className="text-xs font-bold text-foreground">Checkpointer</span>
          <Select value={memoryConfig.checkpointer || "convex"}
            onValueChange={(v: string) => setMemoryConfig({ ...memoryConfig, checkpointer: v as LangGraphMemoryConfig["checkpointer"] })}>
            <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="convex">Convex DB</SelectItem>
              <SelectItem value="redis">Redis</SelectItem>
              <SelectItem value="postgres">PostgreSQL</SelectItem>
              <SelectItem value="memory">In-Memory</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Auto-Summarize</span>
              <span className="text-[10px] text-muted-foreground">Compress history to save tokens</span>
            </div>
            <Switch checked={memoryConfig.autoSummarize ?? true}
              onCheckedChange={(c) => setMemoryConfig({ ...memoryConfig, autoSummarize: c })} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Loader2, Send } from "lucide-react";
import type { SimulationTestCase } from "@/types/canvas";
import type { Endpoint, Parameter, JSONValue } from "@/types/canvas";
import { JsonPayloadEditor } from "../../backend-nodes/graph-nodes/Editors";
import { SimulatedResponseView, SimulatedResponseData } from "./SimulatedResponseView";

interface SimulateTabContentProps {
  endpoint: Endpoint | undefined;
  triggerTestCases: SimulationTestCase[];
  selectedGlobalCaseId: string;
  loadCase: (caseId: string) => void;
  params: Parameter[];
  setParams: (params: Parameter[]) => void;
  headers: Parameter[];
  setHeaders: (headers: Parameter[]) => void;
  body: JSONValue | undefined;
  setBody: (body: JSONValue | undefined) => void;
  loading: boolean;
  onSend: () => void;
  response: SimulatedResponseData | null;
  isExecutionFinished: boolean;
  activeIndex: number;
  onClearResponse: () => void;
}

export const SimulateTabContent: React.FC<SimulateTabContentProps> = ({
  endpoint,
  triggerTestCases,
  selectedGlobalCaseId,
  loadCase,
  params,
  setParams,
  headers,
  setHeaders,
  body,
  setBody,
  loading,
  onSend,
  response,
  isExecutionFinished,
  activeIndex,
  onClearResponse,
}) => {
  return (
    <div className="flex flex-col gap-6 p-1 m-0">
      <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Select
            value={selectedGlobalCaseId}
            onValueChange={(value) => value !== "none" && loadCase(value)}
          >
            <SelectTrigger className="h-9 flex-1 text-sm bg-background">
              <SelectValue placeholder="Load a global test case" />
            </SelectTrigger>
            <SelectContent>
              {triggerTestCases.map((testCase) => (
                <SelectItem key={testCase.id} value={testCase.id}>
                  {testCase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {params.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Query / Path Parameters
            </h4>
            <div className="grid gap-3 border p-3 rounded-lg bg-background/50">
              {params.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="grid grid-cols-3 items-center gap-2"
                >
                  <Label className="text-xs font-mono text-muted-foreground flex flex-col gap-0.5">
                    <span>{p.key}</span>
                    <span className="text-[9px] font-normal opacity-60">
                      ({p.type || "string"})
                    </span>
                  </Label>
                  <Input
                    className="col-span-2 h-8 text-xs font-mono bg-background"
                    placeholder={`value (${p.type || "string"})`}
                    value={p.value}
                    onChange={(e) => {
                      const next = [...params];
                      if (next[idx]) next[idx].value = e.target.value;
                      setParams(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {headers.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Defined Headers
            </h4>
            <div className="grid gap-3 border p-3 rounded-lg bg-background/50">
              {headers.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="flex items-center gap-3"
                >
                  <span className="h-8 flex items-center w-1/3 text-xs font-mono text-muted-foreground truncate">
                    {h.name || h.key}
                  </span>
                  <Input
                    className="h-8 text-xs font-mono flex-1 bg-background"
                    placeholder="Value"
                    value={h.value}
                    onChange={(e) => {
                      const next = [...headers];
                      if (next[idx]) next[idx].value = e.target.value;
                      setHeaders(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint?.requestBody && (
          <div className="pb-2">
            <JsonPayloadEditor
              key={`mock-body-${selectedGlobalCaseId}-${endpoint.id}`}
              title="Request Body (JSON)"
              schema={endpoint.requestBody}
              value={body}
              onChange={(val) => setBody(val)}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              className="text-xs font-medium h-8 px-5"
              onClick={onSend}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Simulate
                  <Send className="ml-2 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {response && (
        <SimulatedResponseView
          response={response}
          isExecutionFinished={isExecutionFinished}
          activeIndex={activeIndex}
          onClear={onClearResponse}
        />
      )}
    </div>
  );
};

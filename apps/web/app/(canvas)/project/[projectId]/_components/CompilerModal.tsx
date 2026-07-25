"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { compileServiceNode, CompiledServiceResult } from "@/lib/compiler/compileServiceNode";
import { Copy, Check, Download, Server, FileCode, Cpu, ExternalLink, Code } from "lucide-react";
import { useSimulationStore } from "@/lib/stores/simulationStore";
import { toast } from "sonner";
import sdk from "@stackblitz/sdk";

interface CompilerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompilerModal({ open, onOpenChange }: CompilerModalProps) {
  const nodes = useBackendCanvasStore((s) => s.nodes);
  const endpoints = useBackendCanvasStore((s) => s.endpoints);
  const events = useBackendCanvasStore((s) => s.events);
  const edges = useBackendCanvasStore((s) => s.edges);
  const testCases = useSimulationStore((s) => s.testCases);

  const serviceNodes = nodes.filter((n) => n.type === "service");

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedFilename, setSelectedFilename] = useState<string>("server.ts");
  const [copied, setCopied] = useState<boolean>(false);

  // Set default selected service when opening
  React.useEffect(() => {
    if (open && serviceNodes.length > 0 && (!selectedServiceId || !serviceNodes.some(s => s.id === selectedServiceId))) {
      setSelectedServiceId(serviceNodes[0]!.id);
    }
  }, [open, serviceNodes, selectedServiceId]);

  const activeServiceNode = serviceNodes.find((n) => n.id === selectedServiceId) || serviceNodes[0];

  const compiledResult: CompiledServiceResult | null = activeServiceNode
    ? compileServiceNode(activeServiceNode, endpoints, events, nodes, edges, testCases)
    : null;

  const activeFile = compiledResult?.files.find((f) => f.filename === selectedFilename) || compiledResult?.files[0];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    toast.success(`Copied ${activeFile.filename} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${activeFile.filename}`);
  };

  const handleRunInCloud = () => {
    if (!compiledResult) return;

    const fileMap: Record<string, string> = {};
    compiledResult.files.forEach((f) => {
      fileMap[f.filename] = f.content;
    });

    sdk.openProject(
      {
        title: `${compiledResult.serviceName} - Blueprint Microservice`,
        description: `Generated microservice template for ${compiledResult.serviceName}`,
        template: "node",
        files: fileMap,
        settings: {
          compile: {
            trigger: "auto",
            clearConsole: false,
          },
        },
      },
      {
        newWindow: true,
        openFile: "server.ts",
      }
    );
    toast.success(`Opening ${compiledResult.serviceName} live in StackBlitz Cloud IDE!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  Service Compiler Engine
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Converts service graph nodes into deployable server templates & live cloud environments
                </DialogDescription>
              </div>
            </div>

            {compiledResult && (
              <Button
                onClick={handleRunInCloud}
                size="sm"
              >
                <Code className="w-4 h-4" />
                  Open IDE
                <ExternalLink className="w-3 h-3 opacity-80" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {serviceNodes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Server className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No Service Nodes Found</p>
            <p className="text-xs text-muted-foreground/70 max-w-sm">
              Add a Service/API node on the canvas to generate backend code templates.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Service selector tabs if multiple service nodes exist */}
            {serviceNodes.length > 1 && (
              <div className="flex items-center gap-1.5 px-6 py-2 border-b border-border/40 bg-muted/10 overflow-x-auto">
                <span className="text-xs text-muted-foreground mr-2 font-medium">Services:</span>
                {serviceNodes.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      srv.id === (activeServiceNode?.id)
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "hover:bg-accent text-muted-foreground"
                    }`}
                  >
                    <Server className="w-3 h-3" />
                    {srv.data.label || "Service"}
                  </button>
                ))}
              </div>
            )}

            {/* File Tabs & Actions bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/60">
              <div className="flex items-center gap-1 overflow-x-auto">
                {compiledResult?.files.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => setSelectedFilename(file.filename)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                      file.filename === activeFile?.filename
                        ? "bg-background text-foreground shadow-xs font-semibold border border-border/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-primary/80" />
                    {file.filename}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownload} className="h-8 text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>
            </div>

            {/* Code Output Box */}
            <div className="flex-1 min-h-[350px] p-4 bg-[#0d1117] overflow-auto font-mono text-xs leading-relaxed text-slate-200">
              {activeFile ? (
                <pre className="whitespace-pre">
                  <code>{activeFile.content}</code>
                </pre>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

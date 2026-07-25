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
import {
  compileServiceNode,
  compileDatabaseNodes,
  CompiledServiceResult,
  CompiledDatabaseResult,
  CompiledFile,
} from "@/lib/compiler/compileServiceNode";
import { Copy, Check, Download, Server, FileCode, Cpu, ExternalLink, Code, Database } from "lucide-react";
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
  const entityNodes = nodes.filter((n) => n.type === "entity" || n.type === "db_ref");

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedFilename, setSelectedFilename] = useState<string>("src/index.ts");
  const [copied, setCopied] = useState<boolean>(false);

  // Set default selected service when opening
  React.useEffect(() => {
    if (open) {
      if (serviceNodes.length > 0 && (!selectedServiceId || (!serviceNodes.some((s) => s.id === selectedServiceId) && selectedServiceId !== "db_schemas"))) {
        setSelectedServiceId(serviceNodes[0]!.id);
      } else if (serviceNodes.length === 0 && entityNodes.length > 0) {
        setSelectedServiceId("db_schemas");
      }
    }
  }, [open, serviceNodes, entityNodes, selectedServiceId]);

  const activeServiceNode = serviceNodes.find((n) => n.id === selectedServiceId) || serviceNodes[0];
  const isDbSelected = selectedServiceId === "db_schemas";

  const compiledDatabase: CompiledDatabaseResult = compileDatabaseNodes(nodes, edges);

  const compiledResult: CompiledServiceResult | null = activeServiceNode
    ? compileServiceNode(activeServiceNode, endpoints, events, nodes, edges, testCases)
    : null;

  const currentFiles: CompiledFile[] = isDbSelected
    ? compiledDatabase.files
    : compiledResult?.files || [];

  const activeFile = currentFiles.find((f) => f.filename === selectedFilename) || currentFiles[0];

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
    a.download = activeFile.filename.split("/").pop() || activeFile.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${activeFile.filename}`);
  };

  const handleRunInCloud = () => {
    if (serviceNodes.length === 0 && entityNodes.length === 0) return;

    const fileMap: Record<string, string> = {};

    // 1. Compile Database Schemas into top-level db/ folder
    compiledDatabase.files.forEach((f) => {
      fileMap[`db/${f.filename}`] = f.content;
    });

    // 2. Compile Service Nodes into services/<serviceName>/ folders
    const devScripts: string[] = [];
    const serviceNames: string[] = [];

    serviceNodes.forEach((srvNode) => {
      const res = compileServiceNode(srvNode, endpoints, events, nodes, edges, testCases);
      const folderName = (res.serviceName || "service").toLowerCase().replace(/[^a-z0-9]/g, "-");
      serviceNames.push(res.serviceName);

      res.files.forEach((f) => {
        fileMap[`services/${folderName}/${f.filename}`] = f.content;
      });

      devScripts.push(`"npm run dev --prefix services/${folderName}"`);
    });

    if (serviceNodes.length > 0) {
      fileMap["package.json"] = JSON.stringify(
        {
          name: "blueprint-microservices-monorepo",
          version: "1.0.0",
          private: true,
          workspaces: ["db", "services/*"],
          scripts: {
            dev: devScripts.length > 0 ? `concurrently ${devScripts.join(" ")}` : "npm run build --prefix db",
            start: devScripts.length > 0 ? `concurrently ${devScripts.map((s) => s.replace("run dev", "start")).join(" ")}` : "node index.js",
          },
          devDependencies: {
            concurrently: "^8.2.2",
          },
        },
        null,
        2
      );

      fileMap["README.md"] = `# Blueprint System Architecture Workspace\n\nThis project contains ${serviceNodes.length} generated microservice(s) and database schemas:\n\n- **Database Schemas**: \`db/\`\n${serviceNames
        .map((s) => `- **${s}**: \`services/${s.toLowerCase().replace(/[^a-z0-9]/g, "-")}\``)
        .join("\n")}\n\n## Getting Started\n\nRun \`npm run dev\` to start all microservices concurrently.\n`;
    }

    const title =
      serviceNodes.length === 1 && activeServiceNode
        ? `${activeServiceNode.data.label || "Service"} Architecture`
        : `Blueprint Microservices System (${serviceNodes.length} Services)`;

    const defaultOpenFile =
      serviceNodes.length > 0
        ? `services/${(serviceNodes[0]?.data.label || "service").toLowerCase().replace(/[^a-z0-9]/g, "-")}/src/index.ts`
        : `db/schema/index.ts`;

    sdk.openProject(
      {
        title,
        description: `Generated microservices architecture workspace for Blueprint project`,
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
        openFile: defaultOpenFile,
      }
    );
    toast.success(`Opening architecture workspace live in StackBlitz Cloud IDE!`);
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
                  Service & DB Compiler Engine
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Converts architecture nodes into modular microservices & Drizzle database schemas
                </DialogDescription>
              </div>
            </div>

            {(serviceNodes.length > 0 || entityNodes.length > 0) && (
              <Button onClick={handleRunInCloud} size="sm">
                <Code className="w-4 h-4" />
                Open IDE
                <ExternalLink className="w-3 h-3 opacity-80" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {serviceNodes.length === 0 && entityNodes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Server className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No Nodes Found</p>
            <p className="text-xs text-muted-foreground/70 max-w-sm">
              Add Service or Database Entity nodes on the canvas to generate backend code templates.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Service & Database selector tabs */}
            <div className="flex items-center gap-1.5 px-6 py-2 border-b border-border/40 bg-muted/10 overflow-x-auto">
              <span className="text-xs text-muted-foreground mr-2 font-medium">Nodes:</span>

              {entityNodes.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedServiceId("db_schemas");
                    setSelectedFilename("schema/index.ts");
                  }}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    isDbSelected
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 font-semibold"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  Database (db/)
                </button>
              )}

              {serviceNodes.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => {
                    setSelectedServiceId(srv.id);
                    setSelectedFilename("src/index.ts");
                  }}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    srv.id === activeServiceNode?.id && !isDbSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <Server className="w-3 h-3" />
                  {srv.data.label || "Service"}
                </button>
              ))}
            </div>

            {/* File Tabs & Actions bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/60">
              <div className="flex items-center gap-1 overflow-x-auto">
                {currentFiles.map((file) => (
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

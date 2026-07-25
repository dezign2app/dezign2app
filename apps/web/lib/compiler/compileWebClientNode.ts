import { BackendNode, BackendEdge } from "@/types/canvas";
import { Endpoint, AnyMessagingResource, UIEventItem } from "@workspace/canvas/types";
import { CompiledFile, CompiledWebClientResult } from "./types";

export interface LinkedEndpointInfo {
  targetNodeId: string;
  targetNodeName: string;
  targetNodePort: string;
  endpointId?: string;
  endpointName: string;
  method: string;
  path: string;
  fullUrl: string;
}

/**
 * Retrieves the mandatory port assigned to a target Service Node.
 */
export function getServicePort(targetNode: BackendNode): string {
  return targetNode.data?.port?.trim() || "8080";
}

/**
 * Recursively resolves the target API endpoint and port connected to a WebClient event.
 * Performs edge traversal, handle parsing, endpoint schema lookup, and path parameter replacement.
 */
export function resolveLinkedEndpoint(
  fromNodeId: string,
  eventId: string,
  allNodes: BackendNode[],
  allEdges: BackendEdge[],
  allEndpoints: (Endpoint & { nodeId: string })[] = [],
  depth: number = 0
): LinkedEndpointInfo | null {
  if (depth > 5) return null; // guard against cycle loops

  // 1. Find edge originating from WebClient event handle
  const edge = allEdges.find(
    (e) =>
      e.source === fromNodeId &&
      (e.sourceHandle === `events-${eventId}` ||
        e.sourceHandle === eventId ||
        e.sourceHandle?.endsWith(eventId))
  );

  if (!edge || !edge.target) return null;

  const targetNode = allNodes.find((n) => n.id === edge.target);
  if (!targetNode) return null;

  const targetHandle = edge.targetHandle || "";

  // 2. Chained connection (e.g. pageload-in-, sse-in-, ws-in-, event-in- on another WebClient or intermediate node)
  if (
    targetHandle.startsWith("pageload-in-") ||
    targetHandle.startsWith("sse-in-") ||
    targetHandle.startsWith("websocket-in-") ||
    targetHandle.startsWith("ws-in-") ||
    targetHandle.startsWith("event-in-")
  ) {
    const nextEventId = targetHandle.replace(/^(pageload|sse|websocket|ws|event)-in-/, "");
    return resolveLinkedEndpoint(edge.target, nextEventId, allNodes, allEdges, allEndpoints, depth + 1);
  }

  // 3. Service Node target
  if (targetNode.type === "service") {
    const targetPort = getServicePort(targetNode);
    const targetServiceName = targetNode.data?.label || "Service";

    // Extract endpointId from targetHandle
    let endpointId = targetHandle
      ? targetHandle.replace(/^(endpoint-in-|endpoint-out-|endpoints-in-|endpoints-out-|events-in-|events-out-)/, "")
      : undefined;

    if (endpointId && endpointId.includes("-in-")) {
      const parts = endpointId.split("-in-");
      endpointId = parts[parts.length - 1];
    }

    let ep: Endpoint | undefined;

    // Search 1: in allEndpoints store
    if (endpointId) {
      ep = allEndpoints.find((e) => e.nodeId === targetNode.id && (e.id === endpointId || e.name === endpointId));

      // Search 2: in targetNode.data.endpoints
      if (!ep && targetNode.data?.endpoints) {
        ep = (targetNode.data.endpoints as Endpoint[]).find((e) => e.id === endpointId || e.name === endpointId);
      }

      // Search 3: in targetNode.data.routeGroups
      if (!ep && targetNode.data?.routeGroups) {
        for (const group of targetNode.data.routeGroups as any[]) {
          if (group.endpoints) {
            ep = group.endpoints.find((e: Endpoint) => e.id === endpointId || e.name === endpointId);
            if (ep) break;
          }
        }
      }
    }

    // Search 4: check consumed / published events on targetNode
    if (!ep && endpointId) {
      const consumed = targetNode.data?.consumedEvents?.find((e: any) => e.id === endpointId || e.name === endpointId);
      const published = targetNode.data?.publishedEvents?.find((e: any) => e.id === endpointId || e.name === endpointId);
      const eventMatch = consumed || published;
      if (eventMatch) {
        ep = {
          id: eventMatch.id,
          name: eventMatch.name ? (eventMatch.name.startsWith("/") ? eventMatch.name : `/events/${eventMatch.name}`) : "/events",
          type: "POST",
        };
      }
    }

    // Fallback: If no specific endpoint matched, use the first endpoint of the service
    if (!ep) {
      const srvEndpoints = allEndpoints.filter((e) => e.nodeId === targetNode.id);
      if (srvEndpoints.length > 0) {
        ep = srvEndpoints[0];
      } else if (targetNode.data?.endpoints && (targetNode.data.endpoints as Endpoint[]).length > 0) {
        ep = (targetNode.data.endpoints as Endpoint[])[0];
      }
    }

    const method = (ep?.type || "GET").toUpperCase();
    const rawPath = ep?.name || "api/data";
    let path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

    // Clean up dynamic path parameters (e.g. /users/:id -> /users/1, /products/{id} -> /products/1)
    path = path.replace(/:\w+|\{\w+\}/g, "1");

    const fullUrl = `http://localhost:${targetPort}${path}`;

    return {
      targetNodeId: targetNode.id,
      targetNodeName: targetServiceName,
      targetNodePort: targetPort,
      endpointId: ep?.id,
      endpointName: ep?.name || "Endpoint",
      method,
      path,
      fullUrl,
    };
  }

  // 4. API Gateway / Load Balancer target
  if (targetNode.type === "api_gateway" || targetNode.type === "load_balancer") {
    const gatewayPort = targetNode.data?.port || "8000";
    const outgoingEdge = allEdges.find((e) => e.source === targetNode.id);
    if (outgoingEdge) {
      const downstreamNode = allNodes.find((n) => n.id === outgoingEdge.target);
      if (downstreamNode && downstreamNode.type === "service") {
        const downstreamPort = getServicePort(downstreamNode);
        const resolved = resolveLinkedEndpoint(targetNode.id, eventId, allNodes, allEdges, allEndpoints, depth + 1);
        if (resolved) {
          return resolved;
        }
        return {
          targetNodeId: downstreamNode.id,
          targetNodeName: downstreamNode.data?.label || "Service",
          targetNodePort: downstreamPort,
          endpointName: "Gateway Route",
          method: "GET",
          path: "/api/v1",
          fullUrl: `http://localhost:${downstreamPort}/api/v1`,
        };
      }
    }

    return {
      targetNodeId: targetNode.id,
      targetNodeName: targetNode.data?.label || "API Gateway",
      targetNodePort: gatewayPort,
      endpointName: "Gateway Endpoint",
      method: "GET",
      path: "/api/gateway",
      fullUrl: `http://localhost:${gatewayPort}/api/gateway`,
    };
  }

  // 5. Messaging / Broker target
  const messagingTypes = ["kafka", "sqs", "redis-streams", "redis-pubsub", "pubsub", "eventstream", "queue"];
  if (messagingTypes.includes(targetNode.type)) {
    const resourceList =
      targetNode.data?.topics ||
      targetNode.data?.queues ||
      targetNode.data?.streams ||
      targetNode.data?.channels ||
      [];
    const resource = resourceList[0];
    const resourceName = resource?.name || targetNode.data?.label || "topic";
    const path = `/api/messages/${resourceName}`;
    const fullUrl = `http://localhost:8080${path}`;

    return {
      targetNodeId: targetNode.id,
      targetNodeName: targetNode.data?.label || "Broker",
      targetNodePort: "8080",
      endpointName: resourceName,
      method: "POST",
      path,
      fullUrl,
    };
  }

  return null;
}

function labelToSlug(label: string, index: number): string {
  const clean = label.trim().toLowerCase();
  if (clean === "home" || clean === "index" || clean === "/") {
    return "home";
  }
  const slug = clean.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `page-${index + 1}`;
}

function slugToComponentName(slug: string): string {
  if (slug === "home") return "HomePage";
  const camel = slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
  return camel.charAt(0).toUpperCase() + camel.slice(1) + "Page";
}

/**
 * Compiles a collection of WebClient nodes into a Next.js App Router project
 */
export function compileWebClientNodes(
  webClientNodes: BackendNode[],
  endpoints: (Endpoint & { nodeId: string })[] = [],
  events: (AnyMessagingResource & { nodeId: string; variant: "publish" | "consume" })[] = [],
  allNodes: BackendNode[] = [],
  allEdges: BackendEdge[] = [],
  projectName: string = "Blueprint Monorepo"
): CompiledWebClientResult {
  const files: CompiledFile[] = [];

  const pagesInfo: {
    nodeId: string;
    label: string;
    description?: string;
    slug: string;
    routePath: string;
    componentName: string;
    isRoot: boolean;
  }[] = [];

  const usedSlugs = new Set<string>();

  webClientNodes.forEach((node, idx) => {
    const rawLabel = node.data.label || `Page ${idx + 1}`;
    let slug = labelToSlug(rawLabel, idx);

    if (usedSlugs.has(slug)) {
      slug = `${slug}-${idx + 1}`;
    }
    usedSlugs.add(slug);

    const isRoot = idx === 0 && (slug === "home" || webClientNodes.length === 1);
    const routePath = isRoot ? "/" : `/${slug}`;
    const componentName = slugToComponentName(slug);

    pagesInfo.push({
      nodeId: node.id,
      label: rawLabel,
      description: node.data.description,
      slug,
      routePath,
      componentName,
      isRoot,
    });
  });

  // 1. Next.js package.json
  const packageJson = JSON.stringify(
    {
      name: "@workspace/web-client",
      version: "0.0.1",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        "@workspace/ui": "workspace:*",
        "@workspace/logger": "workspace:*",
        next: "^16.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "lucide-react": "^0.475.0",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4.0.0",
        "@types/node": "^20.19.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@workspace/typescript-config": "workspace:*",
        tailwindcss: "^4.0.0",
        typescript: "^5.9.0",
      },
    },
    null,
    2
  );
  files.push({
    filename: "package.json",
    language: "json",
    content: packageJson,
  });

  // 1.2 .env
  files.push({
    filename: ".env",
    language: "dotenv",
    content: `NEXT_PUBLIC_LOG_LEVEL=info\n`,
  });

  // 1.5 postcss.config.mjs
  files.push({
    filename: "postcss.config.mjs",
    language: "javascript",
    content: `export { default } from "@workspace/ui/postcss.config";\n`,
  });

  // 2. tsconfig.json
  const tsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [
          {
            name: "next",
          },
        ],
        paths: {
          "@/*": ["./*"],
        },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: tsconfig,
  });

  // 3. next.config.mjs
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@workspace/ui", "@workspace/logger"],
};

export default nextConfig;
`;
  files.push({
    filename: "next.config.mjs",
    language: "javascript",
    content: nextConfig,
  });

  // 4. app/globals.css
  const globalsCss = `@import "@workspace/ui/globals.css";
`;
  files.push({
    filename: "app/globals.css",
    language: "css",
    content: globalsCss,
  });

  // 5. app/layout.tsx
  const pagesNavLinks = pagesInfo
    .map(
      (p) =>
        `<Link href="${p.routePath}" className="hover:text-indigo-400 transition-colors font-medium">${p.label}</Link>`
    )
    .join("\n              ");

  const layoutCode = `import type { Metadata } from "next";
import Link from "next/link";
import "@workspace/ui/globals.css";

export const metadata: Metadata = {
  title: "${projectName} Web Client",
  description: "Next.js Web Client generated from Blueprint architecture canvas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col font-sans">
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="font-bold text-white flex items-center gap-2 text-sm hover:opacity-90 transition-opacity">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Web Client App</span>
            </Link>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              ${pagesNavLinks}
            </div>
          </div>
        </nav>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
`;
  files.push({
    filename: "app/layout.tsx",
    language: "typescript",
    content: layoutCode,
  });

  const hasExplicitRoot = pagesInfo.some((p) => p.routePath === "/");

  // 6. Generate Page Files for each WebClientNode
  webClientNodes.forEach((node, idx) => {
    const pageMeta = pagesInfo[idx]!;
    const rawEvents: UIEventItem[] = (node.data.events as UIEventItem[]) || [];

    const pageLoadEvents = rawEvents.filter((evt) => {
      const eStr = (evt.event || evt.name || "").toLowerCase();
      return eStr === "pageload" || eStr === "onload";
    });

    const actionEvents = rawEvents.filter((evt) => !pageLoadEvents.includes(evt));

    let pageLoadFetchStatements = "";
    if (pageLoadEvents.length === 0) {
      pageLoadFetchStatements = `setPageLoadData({ status: "idle", message: "No pageLoad event triggers attached to this page node." });`;
    } else {
      const statements: string[] = [];
      pageLoadEvents.forEach((evt, eIdx) => {
        const link = resolveLinkedEndpoint(node.id, evt.id, allNodes, allEdges, endpoints);
        const eventNameStr = evt.name || "pageLoad";
        if (link) {
          statements.push(`
        try {
          const res_${eIdx} = await fetch("${link.fullUrl}", {
            method: "${link.method}",
            headers: { "Content-Type": "application/json" },
          });
          const json_${eIdx} = await res_${eIdx}.json();
          results["${eventNameStr}"] = json_${eIdx};
        } catch (err: any) {
          results["${eventNameStr}"] = { error: err.message, endpoint: "${link.fullUrl}" };
        }`);
        } else {
          statements.push(`
        results["${eventNameStr}"] = {
          status: "simulated",
          message: "pageLoad event triggered on mount (no target endpoint connected in canvas)",
        };`);
        }
      });

      pageLoadFetchStatements = `setPageLoadLoading(true);
      setPageLoadError(null);
      try {
        const results: Record<string, any> = {};
        ${statements.join("\n")}
        setPageLoadData(${pageLoadEvents.length === 1} ? results["${pageLoadEvents[0]?.name || "pageLoad"}"] : results);
      } catch (err: any) {
        setPageLoadError(err.message || "Failed to load page data");
      } finally {
        setPageLoadLoading(false);
      }`;
    }

    let actionButtonsJsx = "";
    if (actionEvents.length === 0) {
      actionButtonsJsx = `<p className="text-slate-500 text-sm italic">No click or trigger events configured for this page node.</p>`;
    } else {
      const buttonElems = actionEvents.map((evt) => {
        const link = resolveLinkedEndpoint(node.id, evt.id, allNodes, allEdges, endpoints);
        const url = link ? link.fullUrl : "";
        const method = link ? link.method : "POST";
        const evtName = evt.name || "Action";
        const evtType = evt.event || "click";
        return `
              <Button
                onClick={() => handleTriggerAction("${evtName}", "${evtType}", "${url}", "${method}")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-indigo-500/30"
              >
                <span>${evtName}</span>
                <span className="text-xs opacity-75 font-mono">(${evtType})</span>
              </Button>`;
      });
      actionButtonsJsx = `<div className="flex flex-wrap gap-3">\n${buttonElems.join("\n")}\n          </div>`;
    }

    const pageCode = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

export default function ${pageMeta.componentName}() {
  const [pageLoadData, setPageLoadData] = useState<any>(null);
  const [pageLoadLoading, setPageLoadLoading] = useState<boolean>(false);
  const [pageLoadError, setPageLoadError] = useState<string | null>(null);

  const [triggerLogs, setTriggerLogs] = useState<Array<{
    id: string;
    eventName: string;
    eventType: string;
    timestamp: string;
    url: string;
    method: string;
    status?: number;
    data: any;
    error?: string;
  }>>([]);

  useEffect(() => {
    async function loadPageData() {
      ${pageLoadFetchStatements}
    }
    loadPageData();
  }, []);

  const handleTriggerAction = async (eventName: string, eventType: string, url: string, method: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logId = Math.random().toString(36).substring(2, 9);
    try {
      const options: RequestInit = {
        method: method || "POST",
        headers: { "Content-Type": "application/json" },
      };
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        options.body = JSON.stringify({
          triggeredAt: new Date().toISOString(),
          eventName,
          eventType,
        });
      }

      let resData: any = null;
      let status: number | undefined = undefined;

      if (url && url !== "#") {
        const res = await fetch(url, options);
        status = res.status;
        resData = await res.json().catch(() => ({ statusText: res.statusText }));
      } else {
        resData = {
          success: true,
          message: "Action '" + eventName + "' (" + eventType + ") triggered successfully (Simulated - no endpoint connected)",
          timestamp: new Date().toISOString(),
        };
      }

      setTriggerLogs((prev) => [
        {
          id: logId,
          eventName,
          eventType,
          timestamp,
          url: url || "N/A",
          method: method || "TRIGGER",
          status,
          data: resData,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setTriggerLogs((prev) => [
        {
          id: logId,
          eventName,
          eventType,
          timestamp,
          url: url || "N/A",
          method: method || "TRIGGER",
          error: err.message || "Request failed",
          data: null,
        },
        ...prev,
      ]);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <header className="border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">${pageMeta.label}</h1>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                Next.js Page
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              ${pageMeta.description || "Interactive Next.js page generated for WebClient canvas node."}
            </p>
          </div>
          <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium border border-indigo-500/30 px-3 py-1.5 rounded-lg bg-indigo-500/10">
            &larr; Back to Index
          </Link>
        </header>

        {/* Section 1: Page Load Data (Stringified JSON) */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-200">Page Load Data</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Stringified JSON data loaded automatically on page mount
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-slate-800 text-emerald-400 font-mono border-slate-700">
              {pageLoadLoading ? "Loading..." : pageLoadError ? "Error" : "pageLoad"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-emerald-400 overflow-x-auto shadow-inner min-h-[120px]">
              <pre className="whitespace-pre-wrap font-mono">
                {pageLoadLoading
                  ? "// Loading page data from API endpoint..."
                  : pageLoadError
                  ? "// Error: " + pageLoadError
                  : pageLoadData !== null
                  ? JSON.stringify(pageLoadData, null, 2)
                  : "// No pageLoad data available."}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Page Buttons & Action Triggers */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-200">Page Actions & Triggers</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Click buttons to trigger API requests and event handlers
            </CardDescription>
          </CardHeader>
          <CardContent>
            ${actionButtonsJsx}
          </CardContent>
        </Card>

        {/* Section 3: Trigger Output Logs */}
        <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-200">Trigger Results Log</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Real-time output logs from user clicks and actions
              </CardDescription>
            </div>
            {triggerLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTriggerLogs([])}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear logs
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {triggerLogs.length === 0 ? (
              <div className="text-slate-500 text-sm italic py-6 text-center border border-dashed border-slate-800 rounded-lg">
                No actions triggered yet. Click a button above to execute trigger logic.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {triggerLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                      <span className="font-semibold text-indigo-400">{log.eventName} ({log.eventType})</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">{log.method}</span>
                      <span className="text-slate-300 truncate">{log.url}</span>
                      {log.status && <span className="ml-auto text-slate-400">HTTP {log.status}</span>}
                    </div>
                    {log.error ? (
                      <div className="text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/50">
                        Error: {log.error}
                      </div>
                    ) : (
                      <pre className="text-slate-300 bg-slate-900/80 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
`;

    const targetFilePath = pageMeta.isRoot
      ? "app/page.tsx"
      : `app/${pageMeta.slug}/page.tsx`;

    files.push({
      filename: targetFilePath,
      language: "typescript",
      content: pageCode,
    });
  });

  // 7. If no page was mapped to root `/`, generate root `app/page.tsx` as Index Navigation Dashboard
  if (!hasExplicitRoot) {
    const indexCards = pagesInfo
      .map(
        (p) => `
          <Link href="${p.routePath}" className="block bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 transition-all hover:shadow-lg group">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">${p.label}</h2>
              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 font-mono">${p.routePath}</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">${p.description || "Interactive Next.js page"}</p>
            <div className="flex items-center text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
              Open Page &rarr;
            </div>
          </Link>`
      )
      .join("\n");

    const rootIndexPage = `import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";

export default function WebClientIndexPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">${projectName} Web Client</h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Next.js App
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">
            Select a WebClient page below to interact with API trigger buttons and stringified JSON page load data.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${indexCards}
        </div>
      </div>
    </main>
  );
}
`;

    files.push({
      filename: "app/page.tsx",
      language: "typescript",
      content: rootIndexPage,
    });
  }

  return {
    webClientId: "web-client-app",
    webClientName: "Web Client",
    files,
  };
}

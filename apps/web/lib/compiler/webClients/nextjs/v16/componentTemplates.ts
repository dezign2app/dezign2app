import { PageInfo } from "./types";

export function generateRootLayout(
  projectName: string,
  pagesNavLinks: string,
): string {
  return `import type { Metadata } from "next";
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
}

export function generatePageCode(
  pageMeta: PageInfo,
  pageLoadFetchStatements: string,
  actionButtonsJsx: string,
): string {
  return `"use client";

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

        {/* Section 1: Page Load Data */}
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
}

export function generateRootIndexPage(
  projectName: string,
  indexCards: string,
): string {
  return `import Link from "next/link";
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
}

"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function ApiKeyHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1 text-sm">
            <ArrowLeftIcon className="size-3" /> Back to Projects
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your API keys for connecting external applications and MCP clients.
        </p>
      </div>
      <div className="flex items-center gap-4">
        {/* Summary Stats could go here */}
      </div>
    </div>
  );
}

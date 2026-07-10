"use client";

import { ShieldCheckIcon } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";

export function SecurityTip() {
  return (
    <Card className="bg-primary/5 border-primary/10">
      <CardContent className="p-4 flex gap-3">
        <div className="size-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <ShieldCheckIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Security Tip</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Never share your API keys or commit them to public repositories. If a key is compromised, revoke it immediately.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

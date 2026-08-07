import React from "react";
import { ShieldCheck } from "lucide-react";

interface AuthConfigHeaderProps {
  label?: string;
}

export const AuthConfigHeader: React.FC<AuthConfigHeaderProps> = ({ label }) => {
  return (
    <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-primary/15 text-primary rounded border border-primary/20 shadow-sm flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> AUTH SERVER
        </span>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {label || "Auth Server"}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        Configure authentication providers, session & claims delivery, RBAC organizations, user schema fields, and Better Auth plugins.
      </span>
    </div>
  );
};

"use client";

import React from "react";
import { ProjectDialog } from "@/app/(protected)/projects/_components/project-dialog";
import { Button } from "@workspace/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

import { useSubscriptionAccess } from "@/providers/subscription-access-context";

export const ProjectListHeader = () => {
  const { isReadOnly, showPaywall } = useSubscriptionAccess();

  return (
    <div className="w-full flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md px-10 py-4 z-50 border-b">
      <h1>Projects</h1>
      {isReadOnly ? (
        <Button variant="outline" onClick={() => showPaywall(true)}>
          New Project
          <HugeiconsIcon icon={Add01Icon} />
        </Button>
      ) : (
        <ProjectDialog 
          trigger={
            <Button variant="outline">
              New Project
              <HugeiconsIcon icon={Add01Icon} />
            </Button>
          }
        />
      )}
    </div>
  );
}; 

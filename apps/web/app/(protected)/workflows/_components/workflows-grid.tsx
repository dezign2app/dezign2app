"use client";

import React from "react";
import { usePaginatedQuery } from "convex/react";
import { Boxes, Sparkles } from "lucide-react";
import { api } from "@workspace/backend/_generated/api";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Spinner } from "@workspace/ui/components/spinner";
import { useSubscriptionAccess } from "@/providers/subscription-access-context";
import { WorkflowCard } from "./workflow-card";

export const WorkflowsGrid = () => {
  const { isReadOnly, showPaywall } = useSubscriptionAccess();
  const {
    results: workflows,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.workflows.crud.listByOrganization,
    {},
    { initialNumItems: 18 },
  );

  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (status !== "CanLoadMore") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore(9);
        }
      },
      { threshold: 0.5 },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, status]);

  if (workflows === undefined) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col pb-10">
      <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 xl:grid-cols-3">
        {workflows.map((workflow) => (
          <WorkflowCard
            key={workflow._id}
            workflow={workflow}
            isReadOnly={isReadOnly}
            onBlockedAction={() => showPaywall(true)}
          />
        ))}
      </div>

      {(status === "CanLoadMore" || status === "LoadingMore") && (
        <div
          ref={sentinelRef}
          className="mt-2 flex min-h-[40px] justify-center"
        >
          {status === "LoadingMore" ? <Spinner className="size-6" /> : null}
        </div>
      )}

      {workflows.length === 0 && status === "Exhausted" ? (
        <div className="px-8 pb-8">
          <Empty className="min-h-[360px] border-2 bg-muted/20">
            <EmptyMedia variant="icon">
              <Boxes className="size-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No workflows yet</EmptyTitle>
              <EmptyDescription>
                Create your first workflow to start building draft graphs,
                publishing versions, and scheduling automation.
              </EmptyDescription>
            </EmptyHeader>
            <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline size-3" />
              Start with a manual trigger and publish once the graph compiles.
            </div>
          </Empty>
        </div>
      ) : null}
    </div>
  );
};

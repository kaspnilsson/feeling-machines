"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import { NewComparisonDialog } from "@/components/new-comparison-dialog";
import { RunGroupCard } from "@/components/run-group-card";
import { HowItWorksBanner } from "@/components/how-it-works-banner";

export default function Home() {
  const runGroups = useQuery(api.analytics.listRunGroups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const isLoading = runGroups === undefined;
  const hasRunGroups = !!runGroups && runGroups.length > 0;
  const totalArtworks = useMemo(
    () =>
      runGroups
        ? runGroups.reduce(
            (acc: number, group: any) => acc + group.totalRuns,
            0
          )
        : 0,
    [runGroups]
  );

  return (
    <main className="pb-24 pt-16">
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6">
        <PageHeader
          headline={
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Model comparison batches
            </span>
          }
          actions={
            <Button size="lg" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New model comparison
            </Button>
          }
        >
          <div className="space-y-8">
            <PageTitle>Feeling Machines</PageTitle>
            <PageDescription>
              Benchmark how different reasoning models explain an identical
              creative brief, then see how an image model renders each
              instruction.
            </PageDescription>
            {hasRunGroups && (
              <p className="text-sm text-muted-foreground">
                {runGroups?.length} active model batches • {totalArtworks} total
                outputs rendered
              </p>
            )}
          </div>
        </PageHeader>

        <NewComparisonDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />

        <HowItWorksBanner />

        <Separator className="border-border/60" />

        {isLoading && (
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6).keys()].map((i) => (
              <Card
                key={i}
                className="overflow-hidden border-border/40 bg-card p-8"
              >
                <div className="space-y-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasRunGroups && (
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
            {runGroups!.map((group: any) => (
              <RunGroupCard
                key={group.runGroupId}
                runGroupId={group.runGroupId}
                artists={group.artists}
                totalRuns={group.totalRuns}
                completedRuns={group.completedRuns}
                createdAt={group.createdAt}
                onClick={() => router.push(`/compare/${group.runGroupId}`)}
              />
            ))}
          </div>
        )}

        {!isLoading && !hasRunGroups && (
          <EmptyState
            icon={<Plus className="h-6 w-6" />}
            title="Start your first comparison"
            description="Select the reasoning models and shared image model you want to evaluate, then review their outputs side-by-side."
            action={
              <Button size="lg" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create model comparison
              </Button>
            }
          />
        )}
      </div>
    </main>
  );
}

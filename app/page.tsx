"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewComparisonDialog } from "@/components/new-comparison-dialog";
import { RunGroupCard } from "@/components/run-group-card";

export default function Home() {
  const runGroups = useQuery(api.analytics.listRunGroups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-transparent to-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <section className="mb-8">
          <h1 className="title-gradient heading-tight text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Feeling Machines
          </h1>
          <p className="text-muted-foreground text-balance max-w-2xl text-lg md:text-xl">
            Compare how different AI models imagine and express art. Each Artist
            (LLM) describes what it wants to create; each Brush (image model)
            renders that vision.
          </p>
        </section>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="mb-10 shadow-lg hover:shadow-xl transition-shadow"
          size="lg"
        >
          <Plus />
          New Comparison
        </Button>

        <NewComparisonDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />

        {/* Loading skeleton */}
        {!runGroups && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
              </Card>
            ))}
          </div>
        )}

        {/* Run Groups Grid */}
        {runGroups && runGroups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runGroups.map((group: any) => (
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

        {/* Empty state */}
        {runGroups?.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No comparisons yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first comparison to see how different AI models
              imagine art
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus />
              Create Comparison
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

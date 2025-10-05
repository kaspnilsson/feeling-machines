"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionHeading } from "@/components/patterns/section-heading";
import { MetricCard } from "@/components/patterns/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Clock3, AlertTriangle } from "lucide-react";

export default function ConsoleDashboardPage() {
  const stats = useQuery(api.analytics.getOverallStats);
  const runGroups = useQuery(api.analytics.listRunGroups);

  const isLoading = !stats || !runGroups;

  const activeBatches = runGroups?.filter(
    (g) => g.completedRuns < g.totalRuns
  ).length ?? 0;

  const successRate =
    stats?.byStatus.done && stats?.totalRuns
      ? ((stats.byStatus.done / stats.totalRuns) * 100).toFixed(1)
      : "—";

  const avgLatency =
    stats?.totalRuns && stats?.totalRuns > 0
      ? Object.values(stats.byArtist).reduce(
          (sum, a) => sum + a.avgLatency,
          0
        ) / Object.keys(stats.byArtist).length / 1000
      : 0;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow={
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Lab overview
          </span>
        }
        title="Operations dashboard"
        description="Monitor batch throughput, runtime health, and open tasks."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/60 bg-card">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active batches"
            value={activeBatches.toString()}
            helper={`${runGroups.length} total run groups`}
            tone="default"
          />
          <MetricCard
            label="Success rate"
            value={`${successRate}%`}
            helper={`${stats.byStatus.done}/${stats.totalRuns} completed`}
            tone="default"
          />
          <MetricCard
            label="Avg latency"
            value={`${avgLatency.toFixed(1)}s`}
            helper="Prompt → image pipeline"
            tone="default"
          />
          <MetricCard
            label="Total spend"
            value={`$${stats.totalCost.toFixed(4)}`}
            helper="Artist + brush costs"
            tone="default"
          />
        </div>
      )}

      <Separator className="border-border/70" />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card">
            <CardContent className="space-y-3 p-6">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock3 className="h-4 w-4" />
                Queue status
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Queued</span>
                  <span className="font-medium text-foreground">
                    {stats.byStatus.queued}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generating</span>
                  <span className="font-medium text-foreground">
                    {stats.byStatus.generating}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Done</span>
                  <span className="font-medium text-foreground">
                    {stats.byStatus.done}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card">
            <CardContent className="space-y-3 p-6">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Failure summary
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed runs</span>
                  <span className="font-medium text-destructive">
                    {stats.byStatus.failed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failure rate</span>
                  <span className="font-medium text-foreground">
                    {stats.totalRuns > 0
                      ? ((stats.byStatus.failed / stats.totalRuns) * 100).toFixed(
                          1
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

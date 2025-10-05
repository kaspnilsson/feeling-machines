"use client";

import { useMemo } from "react";

import { AlertTriangle, Check, Clock3, Loader2, Sparkles } from "lucide-react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { PageShell } from "@/components/layout/page-shell";
import { ComparisonViewer } from "@/components/patterns/comparison-viewer";
import { SectionHeading } from "@/components/patterns/section-heading";
import { MetricCard } from "@/components/patterns/metric-card";
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompareView() {
  const params = useParams();
  const runGroupId = params.runGroupId as string;

  const stats = useQuery(api.analytics.getRunGroupStats, { runGroupId });

  const derivedStats = useMemo(() => {
    if (!stats?.stats) return null;
    const {
      completed,
      done,
      total,
      totalCost,
      avgLatency,
      generating,
      queued,
      failed,
    } = stats.stats;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      completed,
      done,
      total,
      totalCost,
      avgLatency,
      generating,
      queued,
      failed,
      percentage,
    };
  }, [stats]);

  if (!stats || !derivedStats) {
    return (
      <PageShell className="space-y-12 py-16">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3).keys()].map((i) => (
            <Card key={i} className="border-border/40 bg-card p-8">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </Card>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-14 py-16">
      <CompareHeader stats={derivedStats} runGroupId={runGroupId} />

      <SectionHeading
        title="Comparison report"
        description="Select an Artist to inspect their statement, the prompt forwarded to the shared brush, and the metadata we capture for transparency."
      />

      <ComparisonViewer runs={stats.runs} />

      <section className="space-y-6">
        <Separator className="border-border/70" />
        <SectionHeading
          title="Batch progress"
          description="Monitor throughput, efficiency, and outstanding work for this run group."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Completed"
            value={`${derivedStats.completed}/${derivedStats.total}`}
            helper="Model outputs finished"
          />
          <MetricCard
            label="Average latency"
            value={`${(derivedStats.avgLatency / 1000).toFixed(1)}s`}
            helper="Prompt → image"
          />
          <MetricCard
            label="Total cost"
            value={`$${derivedStats.totalCost.toFixed(6)}`}
            helper="Reasoning + brush"
          />
          <MetricCard
            label="Status"
            value={`${derivedStats.generating} in flight`}
            helper={`${derivedStats.queued} queued • ${derivedStats.failed} failed`}
          />
        </div>
      </section>
    </PageShell>
  );
}

function CompareHeader({
  stats,
  runGroupId,
}: {
  stats: {
    completed: number;
    done: number;
    total: number;
    totalCost: number;
    avgLatency: number;
    generating: number;
    queued: number;
    failed: number;
    percentage: number;
  };
  runGroupId: string;
}) {
  return (
    <PageHeader
      headline={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Run group {runGroupId.slice(0, 8)}
        </span>
      }
      className="gap-10"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <PageTitle>Compare models</PageTitle>
          <PageDescription>
            Track generation progress, cost, and narrative context for each
            reasoning model paired with the shared image renderer. Expand a card
            to inspect the prompt that was sent to the brush and the model’s
            explanation.
          </PageDescription>
        </div>

        <div className="space-y-3">
          <Progress value={stats.percentage} aria-valuenow={stats.percentage} />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {stats.completed} of {stats.total} model outputs completed
            </span>
            <span>{stats.percentage}% complete</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {stats.done > 0 && (
            <Badge variant="default">
              <Check className="mr-1 h-3.5 w-3.5" /> {stats.done} done
            </Badge>
          )}
          {stats.generating > 0 && (
            <Badge variant="secondary">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {stats.generating} in flight
            </Badge>
          )}
          {stats.queued > 0 && (
            <Badge variant="outline">
              <Clock3 className="mr-1 h-3.5 w-3.5" /> {stats.queued} queued
            </Badge>
          )}
          {stats.failed > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {stats.failed}{" "}
              failed
            </Badge>
          )}
        </div>
      </div>
    </PageHeader>
  );
}

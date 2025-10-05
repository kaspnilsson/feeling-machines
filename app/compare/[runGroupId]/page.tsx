"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Check,
  Clock3,
  Loader2,
  MonitorDown,
  Sparkles,
} from "lucide-react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

import { api } from "@/convex/_generated/api";
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6">
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-16 sm:px-6">
      <CompareHeader stats={derivedStats} runGroupId={runGroupId} />

      <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {stats.runs.map((run: any) => (
          <ArtworkCard key={run._id} run={run} />
        ))}
      </section>

      <section className="space-y-6">
        <Separator className="border-border/70" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Completed"
            value={`${derivedStats.completed}/${derivedStats.total}`}
            helper="Model outputs finished"
          />
          <StatCard
            label="Average latency"
            value={`${(derivedStats.avgLatency / 1000).toFixed(1)}s`}
            helper="Prompt to image time"
          />
          <StatCard
            label="Total cost"
            value={`$${derivedStats.totalCost.toFixed(6)}`}
            helper="Reasoning + image pipeline"
          />
          <StatCard
            label="Status"
            value={`${derivedStats.generating} in flight`}
            helper={`${derivedStats.queued} queued • ${derivedStats.failed} failed`}
          />
        </div>
      </section>
    </div>
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

function ArtworkCard({ run }: { run: any }) {
  const statusBadge = getStatusBadge(run.status);
  const hasMeta = Boolean(
    run.meta?.artist?.tokens ||
      run.meta?.artist?.costEstimate ||
      run.meta?.brush?.costEstimate ||
      run.meta?.totalLatencyMs
  );

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <div className="relative aspect-[4/3] bg-muted">
        {run.status === "done" && run.imageUrl ? (
          <img
            src={run.imageUrl}
            alt={`${run.artistSlug} artwork`}
            className="h-full w-full object-cover"
          />
        ) : run.status === "generating" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : run.status === "failed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/5 p-6 text-center">
            <MonitorDown className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Generation failed
            </p>
            {run.errorMessage && (
              <p className="text-xs text-muted-foreground">
                {run.errorMessage}
              </p>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Queued</p>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-col gap-2">
          <Badge
            variant="default"
            className="bg-card/90 text-foreground shadow w-fit"
          >
            LLM · {run.artistSlug}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-card/90 text-foreground shadow w-fit"
          >
            Image · {run.brushSlug}
          </Badge>
        </div>

        <div className="absolute right-4 top-4">{statusBadge}</div>
      </div>

      <CardContent className="space-y-7 p-8">
        {(run.status === "done" || run.status === "failed") && (
          <div className="space-y-5 rounded-2xl">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Model statement
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                {run.artistStmt || "No statement provided."}
              </p>
            </div>

            <Separator className="border-border/50" />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Prompt sent to image model
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                {run.imagePrompt || "No prompt available."}
              </p>
            </div>
          </div>
        )}

        {hasMeta && (
          <div className="flex flex-wrap gap-2.5 text-xs">
            {run.meta?.artist?.tokens && (
              <Badge variant="outline">
                LLM tokens · {run.meta.artist.tokens}
              </Badge>
            )}
            <Badge variant="outline">
              Pipeline cost · $
              {(
                (run.meta?.artist?.costEstimate || 0) +
                (run.meta?.brush?.costEstimate || 0)
              ).toFixed(6)}
            </Badge>
            {run.meta?.totalLatencyMs && (
              <Badge variant="outline">
                Pipeline time · {(run.meta.totalLatencyMs / 1000).toFixed(1)}s
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-2.5 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  if (status === "done") {
    return (
      <Badge variant="default">
        <Check className="mr-1 h-3.5 w-3.5" /> Done
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Failed
      </Badge>
    );
  }
  if (status === "generating") {
    return (
      <Badge variant="secondary">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Generating
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <Clock3 className="mr-1 h-3.5 w-3.5" /> Queued
    </Badge>
  );
}

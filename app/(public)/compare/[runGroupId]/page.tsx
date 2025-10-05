"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Check,
  Clock3,
  Loader2,
  Sparkles,
  LayoutGrid,
  TableIcon,
} from "lucide-react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { PageShell } from "@/components/layout/page-shell";
import { ComparisonViewer } from "@/components/patterns/comparison-viewer";
import { ComparisonTable } from "@/components/patterns/comparison-table";
import { ComparisonGallery } from "@/components/patterns/comparison-gallery";
import { SectionHeading } from "@/components/patterns/section-heading";
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompareView() {
  const params = useParams();
  const runGroupId = params.runGroupId as string;
  const [viewMode, setViewMode] = useState<"gallery" | "table">("gallery");
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>();

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
    <PageShell className="py-16">
      <div className="space-y-8 mb-8">
        <CompareHeader stats={derivedStats} runGroupId={runGroupId} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column: Hero view (sticky on desktop) */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          <ComparisonViewer
            runs={stats.runs}
            selectedRunId={selectedRunId}
            onRunSelect={setSelectedRunId}
          />
        </div>

        {/* Right column: Gallery/Table (flows with page scroll) */}
        <div className="space-y-8">
          <section className="space-y-6">
            <SectionHeading
              title="All runs"
              description="View all runs in this batch."
              actions={
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "gallery" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("gallery")}
                  >
                    <LayoutGrid className="h-4 w-4" /> Gallery
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <TableIcon className="h-4 w-4" /> Table
                  </Button>
                </div>
              }
            />

            {viewMode === "gallery" ? (
              <ComparisonGallery
                runs={stats.runs}
                selectedRunId={selectedRunId}
                onRunSelect={setSelectedRunId}
              />
            ) : (
              <ComparisonTable
                runs={stats.runs}
                selectedRunId={selectedRunId}
                onRunSelect={setSelectedRunId}
              />
            )}
          </section>
        </div>
      </div>
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
            reasoning model paired with the shared image renderer.
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
          {stats.avgLatency > 0 && (
            <Badge variant="outline">
              Avg latency · {(stats.avgLatency / 1000).toFixed(1)}s
            </Badge>
          )}
          <Badge variant="outline">
            Total cost · ${stats.totalCost.toFixed(6)}
          </Badge>
        </div>
      </div>
    </PageHeader>
  );
}

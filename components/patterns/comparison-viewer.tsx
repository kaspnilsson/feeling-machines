"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightBadge } from "@/components/patterns/insight-badge";
import { ComparisonStrip } from "@/components/patterns/comparison-strip";
import { cn } from "@/lib/utils";

interface RunMeta {
  artist?: {
    tokens?: number;
    costEstimate?: number;
  };
  brush?: {
    costEstimate?: number;
  };
  totalLatencyMs?: number;
}

export interface ComparisonRun {
  _id: string;
  status: string;
  artistSlug: string;
  brushSlug: string;
  artistStmt?: string;
  imagePrompt?: string;
  imageUrl?: string | null;
  meta?: RunMeta;
  errorMessage?: string;
}

interface ComparisonViewerProps {
  runs: ComparisonRun[];
}

export function ComparisonViewer({ runs }: ComparisonViewerProps) {
  const [activeId, setActiveId] = useState<string | undefined>(runs[0]?._id);

  const activeRun = useMemo(() => {
    if (!activeId) return runs[0];
    return runs.find((run) => run._id === activeId) ?? runs[0];
  }, [activeId, runs]);

  if (!runs.length || !activeRun) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="space-y-3 p-10 text-center text-sm text-muted-foreground">
          No runs available yet.
        </CardContent>
      </Card>
    );
  }

  const isPending = activeRun.status !== "done" && !activeRun.imageUrl;

  const items = runs.map((run) => ({
    id: run._id,
    label: run.artistSlug,
    status:
      run.status === "done"
        ? "Done"
        : run.status === "failed"
          ? "Failed"
          : run.status === "generating"
            ? "In flight"
            : "Queued",
    isActive: run._id === activeRun._id,
    onSelect: () => setActiveId(run._id),
  }));

  return (
    <div className="space-y-6">
      <ComparisonStrip items={items} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="p-0">
            <div className="relative aspect-[4/3] w-full bg-muted">
              {activeRun.imageUrl && activeRun.status === "done" ? (
                <img
                  src={activeRun.imageUrl}
                  alt={`${activeRun.artistSlug} artwork`}
                  className="h-full w-full object-cover"
                />
              ) : isPending ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <p className="text-sm text-muted-foreground">Generating artwork…</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/60 text-center">
                  <p className="text-sm font-medium text-foreground">No image available</p>
                  {activeRun.errorMessage && (
                    <p className="max-w-xs text-xs text-muted-foreground">
                      {activeRun.errorMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">LLM · {activeRun.artistSlug}</Badge>
              <Badge variant="outline">Image · {activeRun.brushSlug}</Badge>
              <InsightBadge>{statusLabel(activeRun.status)}</InsightBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              Inspect the model statement, the exact prompt we sent to the brush, and the metadata we log for transparency.
            </p>
          </div>

          {(activeRun.artistStmt || activeRun.imagePrompt) && (
            <Card className="border-border/70 bg-card">
              <CardContent className="space-y-4 p-6">
                {activeRun.artistStmt && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Model statement</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {activeRun.artistStmt}
                    </p>
                  </div>
                )}
                {activeRun.imagePrompt && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Prompt sent to brush</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {activeRun.imagePrompt}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Pipeline metadata</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {activeRun.meta?.artist?.tokens && (
                <Badge variant="outline">
                  LLM tokens · {activeRun.meta.artist.tokens}
                </Badge>
              )}
              <Badge variant="outline">
                Pipeline cost · $
                {(
                  (activeRun.meta?.artist?.costEstimate || 0) +
                  (activeRun.meta?.brush?.costEstimate || 0)
                ).toFixed(6)}
              </Badge>
              {activeRun.meta?.totalLatencyMs && (
                <Badge variant="outline">
                  Pipeline time · {(activeRun.meta.totalLatencyMs / 1000).toFixed(1)}s
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator className="border-border/70" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {runs.map((run) => (
          <Card
            key={run._id}
            className={cn(
              "overflow-hidden border-border/60 bg-card transition-transform hover:-translate-y-[2px]",
              run._id === activeRun._id && "border-primary/60"
            )}
          >
            <button
              type="button"
              className="flex w-full flex-col text-left"
              onClick={() => setActiveId(run._id)}
            >
              <div className="relative aspect-[4/3] bg-muted">
                {run.imageUrl && run.status === "done" ? (
                  <img
                    src={run.imageUrl}
                    alt={`${run.artistSlug} artwork thumbnail`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    {statusLabel(run.status)}
                  </div>
                )}
              </div>
              <CardContent className="space-y-1.5 p-4">
                <p className="text-sm font-medium text-foreground">{run.artistSlug}</p>
                <p className="text-xs text-muted-foreground">Image · {run.brushSlug}</p>
              </CardContent>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "done") return "Done";
  if (status === "failed") return "Failed";
  if (status === "generating") return "Generating";
  if (status === "queued") return "Queued";
  return status;
}

"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightBadge } from "@/components/patterns/insight-badge";
import { AlertCircle, XCircle } from "lucide-react";

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
  selectedRunId?: string;
  onRunSelect?: (runId: string) => void;
}

export function ComparisonViewer({
  runs,
  selectedRunId,
  onRunSelect,
}: ComparisonViewerProps) {
  const [internalActiveId, setInternalActiveId] = useState<string | undefined>(
    runs[0]?._id
  );

  // Use controlled selectedRunId if provided, otherwise use internal state
  const activeId = selectedRunId ?? internalActiveId;
  const _setActiveId = onRunSelect ?? setInternalActiveId;

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

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border bg-card">
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] w-full bg-muted">
            {activeRun.imageUrl && activeRun.status === "done" ? (
              <img
                src={activeRun.imageUrl}
                alt={`${activeRun.artistSlug} artwork`}
                className="h-full w-full object-cover"
              />
            ) : activeRun.status === "failed" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/5 text-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-destructive">
                    Generation failed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Error details below
                  </p>
                </div>
              </div>
            ) : isPending ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <Skeleton className="h-16 w-16 rounded-full" />
                <p className="text-sm text-muted-foreground">
                  Generating artwork…
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/60 text-center">
                <p className="text-sm font-medium text-foreground">
                  No image available
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">LLM · {activeRun.artistSlug}</Badge>
            <Badge variant="outline">Image · {activeRun.brushSlug}</Badge>
            {activeRun.meta?.artist?.tokens && (
              <Badge variant="outline">
                Tokens · {activeRun.meta.artist.tokens.toLocaleString()}
              </Badge>
            )}
            {activeRun.meta?.totalLatencyMs && (
              <Badge variant="outline">
                Time · {(activeRun.meta.totalLatencyMs / 1000).toFixed(1)}s
              </Badge>
            )}
            <Badge variant="outline">
              Cost · $
              {(
                (activeRun.meta?.artist?.costEstimate || 0) +
                (activeRun.meta?.brush?.costEstimate || 0)
              ).toFixed(6)}
            </Badge>
          </div>
        </div>

        {activeRun.status === "failed" && activeRun.errorMessage && (
          <Card className="border-destructive/50 bg-card">
            <CardContent className="space-y-3 p-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-destructive">
                    Error details
                  </h3>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-destructive/10 p-3 text-xs leading-relaxed text-foreground">
                    {activeRun.errorMessage}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(activeRun.artistStmt || activeRun.imagePrompt) && (
          <Card className="border-border/70 bg-card">
            <CardContent className="space-y-4 p-6 max-h-96 overflow-y-auto">
              {activeRun.artistStmt && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Model statement
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {activeRun.artistStmt}
                  </p>
                </div>
              )}
              {activeRun.imagePrompt && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Prompt sent to brush
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {activeRun.imagePrompt}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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

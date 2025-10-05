"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function CompareView() {
  const params = useParams();
  const runGroupId = params.runGroupId as string;

  const stats = useQuery(api.analytics.getRunGroupStats, { runGroupId });

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header with stats */}
      <CompareHeader stats={stats.stats} runGroupId={runGroupId} />

      {/* Grid of artworks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {stats.runs.map((run: any) => (
          <ArtworkCard key={run._id} run={run} />
        ))}
      </div>

      {/* Side-by-side statement comparison */}
      <StatementComparison runs={stats.runs} />
    </div>
  );
}

function CompareHeader({
  stats,
  runGroupId,
}: {
  stats: any;
  runGroupId: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Compare Artists</h1>
          <p className="text-muted-foreground">
            {stats.completed} of {stats.total} artworks completed
          </p>
          <p className="text-sm text-muted-foreground">
            Run Group: {runGroupId.slice(0, 8)}...
          </p>
        </div>

        <div className="flex gap-4">
          <Badge variant="outline">
            ${stats.totalCost.toFixed(6)} total cost
          </Badge>
          <Badge variant="outline">
            {(stats.avgLatency / 1000).toFixed(1)}s avg latency
          </Badge>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-2">
        {stats.completed > 0 && (
          <Badge variant="default">✓ {stats.completed} done</Badge>
        )}
        {stats.generating > 0 && (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
            {stats.generating} generating
          </Badge>
        )}
        {stats.queued > 0 && (
          <Badge variant="outline">{stats.queued} queued</Badge>
        )}
        {stats.failed > 0 && (
          <Badge variant="destructive">{stats.failed} failed</Badge>
        )}
      </div>
    </div>
  );
}

function ArtworkCard({ run }: { run: any }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {run.status === "done" && run.imageUrl ? (
          <img
            src={run.imageUrl}
            alt={`${run.artistSlug} artwork`}
            className="object-cover w-full h-full"
          />
        ) : run.status === "generating" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
          </div>
        ) : run.status === "failed" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-destructive">Failed</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">Queued...</p>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="default">{run.artistSlug}</Badge>
          <Badge variant="secondary">{run.brushSlug}</Badge>
        </div>

        {run.status === "done" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide" : "Show"} details
            </Button>

            {showDetails && (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground line-clamp-3">
                  {run.artistStmt}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {run.meta?.artist?.tokens && (
                    <Badge variant="outline">
                      {run.meta.artist.tokens} tokens
                    </Badge>
                  )}
                  <Badge variant="outline">
                    $
                    {(
                      (run.meta?.artist?.costEstimate || 0) +
                      (run.meta?.brush?.costEstimate || 0)
                    ).toFixed(6)}
                  </Badge>
                  <Badge variant="outline">
                    {(run.meta?.totalLatencyMs / 1000).toFixed(1)}s
                  </Badge>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatementComparison({ runs }: { runs: any[] }) {
  const completedRuns = runs.filter((r) => r.status === "done");

  if (completedRuns.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Artist Statements</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {completedRuns.map((run) => (
          <Card key={run._id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {run.artistSlug}
                <Badge variant="outline" className="font-normal">
                  {run.brushSlug}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {run.artistStmt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

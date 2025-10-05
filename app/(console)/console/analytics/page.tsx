"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionHeading } from "@/components/patterns/section-heading";
import { InsightCallout } from "@/components/patterns/insight-callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, Info, Clock3, DollarSign, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted))", "hsl(var(--accent))"];

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "$0.0000";
  return `$${value.toFixed(4)}`;
}

function formatSeconds(value: number) {
  if (!Number.isFinite(value)) return "0.0s";
  return `${value.toFixed(1)}s`;
}

export default function ConsoleAnalyticsPage() {
  const stats = useQuery(api.analytics.getOverallStats);
  const sentiment = useQuery(api.sentiment.compareArtistSentiments);

  const isLoading = !stats || !sentiment;

  // Status breakdown for pie chart
  const statusData = stats
    ? [
        { name: "Done", value: stats.byStatus.done },
        { name: "Failed", value: stats.byStatus.failed },
        { name: "Generating", value: stats.byStatus.generating },
        { name: "Queued", value: stats.byStatus.queued },
      ]
    : [];

  // Artist cost comparison
  const costData = stats
    ? Object.entries(stats.byArtist).map(([slug, data]) => ({
        artist: slug,
        cost: Number((data.cost).toFixed(4)),
        avgLatency: Number((data.avgLatency / 1000).toFixed(2)),
      }))
    : [];

  // Sentiment valence/arousal scatter
  const sentimentData = sentiment
    ? sentiment.map((s) => ({
        artist: s.artistSlug,
        valence: s.avgValence,
        arousal: s.avgArousal,
        count: s.count,
      }))
    : [];

  const totalRuns = stats?.totalRuns ?? 0;
  const failureRate = stats && totalRuns > 0 ? (stats.byStatus.failed / totalRuns) * 100 : 0;
  const throughput = stats?.byStatus.done ?? 0;
  const generating = stats?.byStatus.generating ?? 0;

  const highestCostArtist = useMemo(() => {
    if (!costData.length) return null;
    return costData.reduce((acc, curr) => (curr.cost > acc.cost ? curr : acc));
  }, [costData]);

  const slowestArtist = useMemo(() => {
    if (!costData.length) return null;
    return costData.reduce((acc, curr) => (curr.avgLatency > acc.avgLatency ? curr : acc));
  }, [costData]);

  return (
    <div className="space-y-12">
      <SectionHeading
        title="Analytics studio"
        description="Operational telemetry for the Feeling Machines lab."
        actions={
          stats && (
            <Badge variant="outline" className="gap-1.5">
              <Activity className="h-3 w-3" />
              {totalRuns.toLocaleString()} runs analysed
            </Badge>
          )
        }
      />

      <Separator className="border-border/70" />

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, idx) => (
            <Card key={idx} className="border-border/60 bg-card">
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-6">
            <SectionHeading
              title="Operational highlights"
              description="Use these snapshots to decide whether to launch, pause, or triage batches."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              <InsightCallout
                tone="accent"
                icon={<TrendingUp className="h-5 w-5" />}
                title="Throughput at a glance"
                description="Live run distribution across the pipeline."
                points={[
                  `Completed: ${throughput.toLocaleString()} runs`,
                  `In flight: ${generating.toLocaleString()} runs`,
                  `Failure rate: ${formatPercent(failureRate)}`,
                ]}
                footer="Aim to keep failure rate under 5% for stable reporting."
              />
              <InsightCallout
                icon={<DollarSign className="h-5 w-5" />}
                title="Cost hotspot"
                description="Highest spend per Artist in the current window."
                points={[
                  highestCostArtist
                    ? `${highestCostArtist.artist} · ${formatCurrency(highestCostArtist.cost)}`
                    : "No cost data yet – run a batch to populate this chart.",
                  "Check brush + prompt combos for outliers before scaling.",
                ]}
                footer="Export receipts from Convex if you need raw totals."
              />
              <InsightCallout
                icon={<Clock3 className="h-5 w-5" />}
                title="Latency watchlist"
                description="Slowest Artist → Brush handoff (mean latency)."
                points={[
                  slowestArtist
                    ? `${slowestArtist.artist} · ${formatSeconds(slowestArtist.avgLatency)}`
                    : "Latency waits on cost data – rerun stats after first batch.",
                  "Anything above 12s suggests rate limits or oversized prompts.",
                ]}
                footer="Dial temperatures or chunk prompts if latency creeps up."
              />
            </div>
          </section>

          <Separator className="border-border/70" />

          <section className="space-y-6">
            <SectionHeading
              title="Pipeline diagnostics"
              description="Charts for the operations desk – hover for counts and drill-in context."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Run status distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={90}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Alert className="border-border/60 bg-muted/40">
                    <AlertTitle className="text-sm font-semibold">Interpretation</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Done + Generating should dominate. Rising queued slices usually mean rate limits – consider staggering the next batch.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Total cost by Artist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="artist" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                      <Bar dataKey="cost" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                  <Alert className="border-border/60 bg-muted/40">
                    <AlertTitle className="text-sm font-semibold">Tip</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Watch for sudden spikes after prompt changes. Rotate pricey Artists out of exploratory runs first.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Average latency by Artist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="artist" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(value: number) => `${value.toFixed(1)}s`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatSeconds(Number(value))} />
                      <Bar dataKey="avgLatency" fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                  <Alert className="border-border/60 bg-muted/40">
                    <AlertTitle className="text-sm font-semibold">Latency hygiene</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Stable experiments stay under 10s. If a bar climbs, inspect the raw statements for overly long prompts or API throttling.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="border-border/70" />

          <section className="space-y-6">
            <SectionHeading
              title="Sentiment fingerprints"
              description="Plot model tone by valence (x) and arousal (y) alongside average valence bars."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Valence vs arousal scatter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis type="number" dataKey="valence" domain={[-1, 1]} tick={{ fontSize: 11 }} name="Valence" />
                      <YAxis type="number" dataKey="arousal" domain={[0, 1]} tick={{ fontSize: 11 }} name="Arousal" />
                      <ZAxis type="number" dataKey="count" range={[60, 160]} name="Runs" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: number, name, _entry) => {
                        if (name === "Runs") return [value, name];
                        return [Number(value).toFixed(2), name];
                      }} />
                      <Scatter data={sentimentData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <Alert className="border-border/60 bg-muted/40">
                    <AlertTitle className="text-sm font-semibold">Reading the plot</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Upper-right = energetic & positive. Use lower-right (calm yet positive) for reflective briefs; probe upper-left for dramatic tension.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Average valence by Artist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="artist" tick={{ fontSize: 11 }} />
                      <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => Number(value).toFixed(2)} />
                      <Bar dataKey="valence" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                  <Alert className="border-border/60 bg-muted/40">
                    <AlertTitle className="text-sm font-semibold">Usage</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Sort bars to curate gallery lineups: pair the most positive with a neutral control to emphasise bias.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="border-border/70" />

          <InsightCallout
            tone="muted"
            icon={<Info className="h-5 w-5" />}
            title="Need more detail?"
            description="Export raw metrics from Convex or copy the scripts to run offline notebooks. Reach out if you need additional dashboards."
          />
        </>
      )}
    </div>
  );
}

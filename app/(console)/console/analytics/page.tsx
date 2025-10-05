"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionHeading } from "@/components/patterns/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted))", "hsl(var(--accent))"];

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

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Analytics studio"
        description="Deep-dive charts for sentiment, palette, and materiality trends across batches."
      />

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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status Distribution */}
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle className="text-base">Run Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
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
            </CardContent>
          </Card>

          {/* Artist Cost Comparison */}
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle className="text-base">Total Cost by Artist</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="artist" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Artist Latency Comparison */}
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle className="text-base">Avg Latency by Artist (seconds)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="artist" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgLatency" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sentiment Valence Comparison */}
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle className="text-base">Sentiment Valence by Artist</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="artist" tick={{ fontSize: 11 }} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="valence" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

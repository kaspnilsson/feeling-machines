"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import {
  BarChart3,
  Boxes,
  Heart,
  Palette,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type SentimentRow = {
  artistSlug: string;
  count: number;
  avgValence: number;
  avgArousal: number;
  avgAbstractness: number;
  avgEmotions: Record<string, number>;
};

export default function AnalyticsPage() {
  const sentimentComparison = useQuery(
    api.sentiment.compareArtistSentiments
  ) as SentimentRow[] | undefined;

  const isLoading = sentimentComparison === undefined;
  const hasData = !!sentimentComparison && sentimentComparison.length > 0;

  const summary = useMemo(() => {
    if (!hasData) return null;

    const totalRuns = sentimentComparison.reduce(
      (acc, artist) => acc + artist.count,
      0
    );

    const meanValence = sentimentComparison.reduce((acc, artist) => {
      return acc + artist.avgValence * artist.count;
    }, 0);

    const meanArousal = sentimentComparison.reduce((acc, artist) => {
      return acc + artist.avgArousal * artist.count;
    }, 0);

    const meanAbstractness = sentimentComparison.reduce((acc, artist) => {
      return acc + artist.avgAbstractness * artist.count;
    }, 0);

    return {
      artistCount: sentimentComparison.length,
      runCount: totalRuns,
      avgValence: totalRuns ? meanValence / totalRuns : 0,
      avgArousal: totalRuns ? meanArousal / totalRuns : 0,
      avgAbstractness: totalRuns ? meanAbstractness / totalRuns : 0,
    };
  }, [hasData, sentimentComparison]);

  return (
    <main className="pb-24 pt-16">
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6">
        <PageHeader
          headline={
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Model fingerprints
            </span>
          }
        >
          <div className="space-y-5">
            <PageTitle>Analytics</PageTitle>
            <PageDescription>
              Phase 3 dissects the emotional tone, energy, and abstractness of
              every artist statement. Each batch feeds these aggregates so we can
              compare how models imagine the same brief.
            </PageDescription>
            <Badge variant="outline" className="w-fit text-xs">
              Sentiment analysis alpha
            </Badge>
          </div>
        </PageHeader>

        {isLoading ? (
          <LoadingState />
        ) : hasData && summary ? (
          <>
            <section className="space-y-6">
              <SectionHeading
                title="Overview"
                description="High-level readout across all analysed runs."
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="Runs processed"
                  value={summary.runCount.toLocaleString()}
                />
                <MetricCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Artists tracked"
                  value={summary.artistCount.toString()}
                />
                <MetricCard
                  icon={<Heart className="h-5 w-5" />}
                  label="Mean valence"
                  value={summary.avgValence.toFixed(2)}
                  helper="-1 (negative) → 1 (positive)"
                />
                <MetricCard
                  icon={<Sparkles className="h-5 w-5" />}
                  label="Mean arousal"
                  value={summary.avgArousal.toFixed(2)}
                  helper="0 (calm) → 1 (charged)"
                />
              </div>
            </section>

            <Separator className="border-border/70" />

            <section className="space-y-6">
              <SectionHeading
                title="Sentiment atlas"
                description="Breakdown per artist showing emotional mix, valence, arousal, and abstractness."
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sentimentComparison.map((artist) => (
                  <Card key={artist.artistSlug} className="border-border/60 bg-card">
                    <CardHeader className="gap-2">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-base font-semibold">
                          {artist.artistSlug}
                        </span>
                        <Badge variant="outline">{artist.count} runs</Badge>
                      </CardTitle>
                      <CardDescription>
                        Emotional fingerprint derived from model statements.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <ValenceMeter value={artist.avgValence} />
                      <EmotionChips emotions={artist.avgEmotions} />
                      <GaugeList
                        items={[
                          {
                            label: "Arousal",
                            value: artist.avgArousal,
                            tone: "info",
                          },
                          {
                            label: "Abstractness",
                            value: artist.avgAbstractness,
                            tone: "accent",
                          },
                        ]}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <Separator className="border-border/70" />

            <section className="space-y-6">
              <SectionHeading
                title="Upcoming analyses"
                description="Color palettes, materiality, and cultural reference tracking ship next."
              />
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <PlaceholderCard
                  icon={<Palette className="h-5 w-5" />}
                  title="Color palettes"
                  body="Extract dominant swatches, temperature, and harmony to map each model’s visual language."
                />
                <PlaceholderCard
                  icon={<Boxes className="h-5 w-5" />}
                  title="Materiality"
                  body="Track tangible vs speculative materials plus impossibility scores."
                />
                <PlaceholderCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Cultural references"
                  body="Aggregate motifs and historical references that recur in artist statements."
                />
              </div>
            </section>
          </>
        ) : (
          <EmptyStateCard />
        )}
      </div>
    </main>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-[0.16em]">
            {label}
          </span>
          <div className="text-foreground/70">{icon}</div>
        </div>
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {helper && (
          <span className="text-xs text-muted-foreground">{helper}</span>
        )}
      </CardContent>
    </Card>
  );
}

function ValenceMeter({ value }: { value: number }) {
  const magnitude = Math.min(Math.max(Math.abs(value), 0), 1);
  const width = `${(magnitude * 50).toFixed(2)}%`;
  const sideClass = value >= 0 ? "left-1/2 bg-emerald-500" : "right-1/2 bg-rose-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Valence</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-1/2 w-px bg-border/60" />
        {magnitude > 0 && (
          <div
            className={`absolute inset-y-0 rounded-full ${sideClass} transition-all`}
            style={{ width }}
          />
        )}
      </div>
      <div className="flex justify-between text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>Negative</span>
        <span>Positive</span>
      </div>
    </div>
  );
}

function EmotionChips({ emotions }: { emotions: Record<string, number> }) {
  const topEmotions = Object.entries(emotions)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 4);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Top emotions</p>
      <div className="flex flex-wrap gap-2">
        {topEmotions.map(([emotion, score]) => (
          <Badge key={emotion} variant="secondary" className="text-xs">
            {emotion} · {(score as number).toFixed(2)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function GaugeList({
  items,
}: {
  items: { label: string; value: number; tone: "info" | "accent" }[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{item.label}</span>
            <span className="font-medium text-foreground">
              {item.value.toFixed(2)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${
                item.tone === "info" ? "bg-blue-500" : "bg-purple-500"
              }`}
              style={{ width: `${Math.min(Math.max(item.value, 0), 1) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="border-dashed border-border/50 bg-muted/10">
      <CardContent className="flex h-full flex-col gap-3 p-6">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </div>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-border/40">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-5/6" />
              <Skeleton className="h-2 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyStateCard() {
  return (
    <Card className="border-border/60">
      <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            No analysis data yet
          </h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Queue a few comparison batches to unlock the analytics view. Sentiment
            runs automatically on every completed artist statement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

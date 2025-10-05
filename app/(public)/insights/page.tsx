"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { BarChart3, Heart, Sparkles, TrendingUp, FlaskConical } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/patterns/section-heading";
import { MetricCard } from "@/components/patterns/metric-card";
import { InsightBadge } from "@/components/patterns/insight-badge";
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DescriptiveStatsCard,
} from "@/components/patterns/statistical-insight";
import {
  ConfidenceIntervalChart,
  DistributionBoxPlot,
  SignificanceMatrix,
} from "@/components/patterns/statistical-charts";

type SentimentRow = {
  artistSlug: string;
  count: number;
  avgValence: number;
  avgArousal: number;
  avgAbstractness: number;
  avgEmotions: Record<string, number>;
};

const paletteSpotlights = [
  {
    artistSlug: "gpt-5-mini",
    colors: ["#F8C471", "#F39C12", "#2E86C1", "#1E3D59"],
    temperature: "Warm",
    note: "Leans into golden hour hues with cool accents for contrast.",
  },
  {
    artistSlug: "claude-sonnet-4.5",
    colors: ["#F6F1EB", "#D7CCC8", "#8D6E63", "#5D4037"],
    temperature: "Neutral",
    note: "Prefers soft neutrals and natural materials lighting cues.",
  },
  {
    artistSlug: "gemini-2.5-flash",
    colors: ["#E3F2FD", "#90CAF9", "#42A5F5", "#1A73E8"],
    temperature: "Cool",
    note: "Tends toward luminous blues and atmospheric gradients.",
  },
];

const materialitySpotlights = [
  {
    artistSlug: "gpt-5-mini",
    concrete: ["hand-cast glass", "embroidered metallic thread"],
    speculative: ["phosphorescent silk"],
  },
  {
    artistSlug: "claude-sonnet-4.5",
    concrete: ["paper screens", "oak frames"],
    speculative: ["responsive light membranes"],
  },
  {
    artistSlug: "gemini-2.5-flash",
    concrete: ["mirrored steel"],
    speculative: ["sentient light particles", "synesthetic vapor"],
  },
];

export default function InsightsPage() {
  const sentimentComparison = useQuery(
    api.sentiment.compareArtistSentiments
  ) as SentimentRow[] | undefined;
  const colorComparison = useQuery(api.colors.compareArtistColors);
  const materialityComparison = useQuery(
    api.materiality.compareArtistMateriality
  );

  // Statistical queries (for a specific metric as example)
  const valenceStats = useQuery(api.statistics.getStatsByMetric, {
    metric: "valence",
  });
  const valenceComparisons = useQuery(
    api.statistics.getSignificantComparisons,
    { metric: "valence" }
  );
  const valenceANOVA = useQuery(api.statistics.getANOVAResults, {
    metric: "valence",
  });

  const isLoading = sentimentComparison === undefined;
  const hasData = !!sentimentComparison && sentimentComparison.length > 0;
  const hasColorData = !!colorComparison && colorComparison.length > 0;
  const hasMaterialityData =
    !!materialityComparison && materialityComparison.length > 0;
  const hasStatisticalData = !!valenceStats && valenceStats.length > 0;

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
      <PageShell className="space-y-14">
        <PageHeader
          headline={
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Model fingerprints
            </span>
          }
        >
          <div className="space-y-5">
            <PageTitle>Insights</PageTitle>
            <PageDescription>
              Phase 3 dissects the emotional tone, energy, and abstractness of
              every artist statement. Each batch feeds these aggregates so we
              can compare how models imagine the same brief.
            </PageDescription>
            <InsightBadge>Sentiment analysis alpha</InsightBadge>
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

            {hasStatisticalData && (
              <>
                <Separator className="border-border/70" />

                <section className="space-y-6">
                  <SectionHeading
                    title="Statistical Rigor"
                    description="Confidence intervals, significance testing, and effect sizes with plain-language explanations."
                    actions={
                      <Badge variant="outline" className="gap-1.5">
                        <FlaskConical className="h-3 w-3" />
                        Experimental
                      </Badge>
                    }
                  />

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Valence — Statistical Summary</span>
                          {valenceANOVA && (
                            <Badge
                              variant={
                                valenceANOVA.significant ? "default" : "secondary"
                              }
                            >
                              {valenceANOVA.significant
                                ? `Significant (p = ${valenceANOVA.pValue.toFixed(4)})`
                                : "Not significant"}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {valenceANOVA && (
                          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                            <h4 className="text-sm font-semibold">
                              ANOVA Results (One-way test)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  F-statistic:
                                </span>{" "}
                                <span className="font-medium">
                                  {valenceANOVA.fStatistic.toFixed(3)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  p-value:
                                </span>{" "}
                                <span className="font-medium">
                                  {valenceANOVA.pValue.toFixed(4)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  η² (effect):
                                </span>{" "}
                                <span className="font-medium">
                                  {valenceANOVA.etaSquared.toFixed(3)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">df:</span>{" "}
                                <span className="font-medium">
                                  {valenceANOVA.dfBetween}, {valenceANOVA.dfWithin}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                              {valenceANOVA.significant
                                ? "✓ Models differ significantly on valence (p < 0.05). See pairwise comparisons below."
                                : "Models do not differ significantly on valence (p ≥ 0.05)."}
                            </p>
                          </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                          {valenceStats && valenceStats.length > 0 && (
                            <ConfidenceIntervalChart
                              data={valenceStats.map((s) => ({
                                artistSlug: s.artistSlug,
                                mean: s.mean,
                                ci95Lower: s.ci95Lower,
                                ci95Upper: s.ci95Upper,
                              }))}
                              metric="Valence"
                            />
                          )}

                          {valenceStats && valenceStats.length > 0 && (
                            <DistributionBoxPlot
                              data={valenceStats.map((s) => ({
                                artistSlug: s.artistSlug,
                                min: s.min,
                                q1: s.q1,
                                median: s.median,
                                q3: s.q3,
                                max: s.max,
                              }))}
                              metric="Valence"
                            />
                          )}
                        </div>

                        {valenceComparisons && valenceComparisons.length > 0 && (
                          <SignificanceMatrix
                            comparisons={valenceComparisons}
                            metric="Valence"
                          />
                        )}

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {valenceStats?.map((stats) => (
                            <DescriptiveStatsCard
                              key={stats.artistSlug}
                              artistSlug={stats.artistSlug}
                              metric="valence"
                              n={stats.n}
                              mean={stats.mean}
                              stdDev={stats.stdDev}
                              median={stats.median}
                              q1={stats.q1}
                              q3={stats.q3}
                              ci95Lower={stats.ci95Lower}
                              ci95Upper={stats.ci95Upper}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground">
                      📊 Statistical analysis computed per-batch using{" "}
                      <code className="rounded bg-muted px-1 py-0.5">
                        compute-descriptive-stats.ts
                      </code>{" "}
                      and{" "}
                      <code className="rounded bg-muted px-1 py-0.5">
                        run-statistical-tests.ts
                      </code>
                      . Benjamini-Hochberg correction applied to control false
                      discovery rate.
                    </p>
                  </div>
                </section>
              </>
            )}

            <Separator className="border-border/70" />

            <section className="space-y-6">
              <SectionHeading
                title="Sentiment atlas"
                description="Breakdown per artist showing emotional mix, valence, arousal, and abstractness."
              />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sentimentComparison.map((artist) => (
                  <Card
                    key={artist.artistSlug}
                    className="border-border/60 bg-card"
                  >
                    <CardHeader className="gap-2">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-base font-semibold">
                          {artist.artistSlug}
                        </span>
                        <Badge variant="outline">{artist.count} runs</Badge>
                      </CardTitle>
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
                title="Color palette explorer"
                description={
                  hasColorData
                    ? "Dominant swatches and tonal tendencies extracted from generated images."
                    : "Dominant swatches and tonal tendencies for each Artist — wired to integrate the color analysis pipeline as soon as data lands."
                }
              />
              <div className="grid gap-4 md:grid-cols-3">
                {hasColorData
                  ? colorComparison.map((color) => (
                      <ColorDataCard key={color.artistSlug} data={color} />
                    ))
                  : paletteSpotlights.map((palette) => (
                      <ColorPaletteCard
                        key={palette.artistSlug}
                        palette={palette}
                      />
                    ))}
              </div>
              {!hasColorData && (
                <p className="text-xs text-muted-foreground">
                  📊 Color analysis runs automatically on generated images. Data
                  will appear here as batches complete.
                </p>
              )}
            </section>

            <section className="space-y-6">
              <SectionHeading
                title="Materiality signals"
                description={
                  hasMaterialityData
                    ? "Balance of concrete vs speculative materials across artist statements."
                    : "Compare the balance of concrete vs speculative mediums each Artist gravitates toward."
                }
              />
              <div className="grid gap-4 md:grid-cols-3">
                {hasMaterialityData
                  ? materialityComparison.map((mat) => (
                      <MaterialityDataCard key={mat.artistSlug} data={mat} />
                    ))
                  : materialitySpotlights.map((item) => (
                      <MaterialityCard
                        key={item.artistSlug}
                        materiality={item}
                      />
                    ))}
              </div>
              {!hasMaterialityData && (
                <p className="text-xs text-muted-foreground">
                  📊 Materiality analysis runs automatically on artist
                  statements. Data will appear here as batches complete.
                </p>
              )}
            </section>
          </>
        ) : (
          <EmptyStateCard />
        )}
      </PageShell>
    </main>
  );
}

function ValenceMeter({ value }: { value: number }) {
  const magnitude = Math.min(Math.max(Math.abs(value), 0), 1);
  const width = `${(magnitude * 50).toFixed(2)}%`;
  const sideClass =
    value >= 0 ? "left-1/2 bg-emerald-500" : "right-1/2 bg-rose-500";

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
              style={{
                width: `${Math.min(Math.max(item.value, 0), 1) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorPaletteCard({
  palette,
}: {
  palette: {
    artistSlug: string;
    colors: string[];
    temperature: string;
    note: string;
  };
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            {palette.artistSlug}
          </h3>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {palette.temperature} palette
          </p>
        </div>
        <div className="flex gap-2">
          {palette.colors.map((hex) => (
            <div
              key={hex}
              className="h-12 flex-1 rounded-md border border-border/40"
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{palette.note}</p>
      </CardContent>
    </Card>
  );
}

function MaterialityCard({
  materiality,
}: {
  materiality: {
    artistSlug: string;
    concrete: string[];
    speculative: string[];
  };
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            {materiality.artistSlug}
          </h3>
          <p className="text-xs text-muted-foreground">
            Concrete vs speculative mediums flagged by the pipeline.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Concrete
          </p>
          <ul className="space-y-1 text-sm text-foreground">
            {materiality.concrete.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Speculative
          </p>
          <ul className="space-y-1 text-sm text-foreground">
            {materiality.speculative.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ColorDataCard({
  data,
}: {
  data: {
    artistSlug: string;
    count: number;
    avgTemperature: number;
    avgSaturation: number;
    harmonyCounts: Record<string, number>;
  };
}) {
  const tempLabel =
    data.avgTemperature > 0.3
      ? "Warm"
      : data.avgTemperature < -0.3
        ? "Cool"
        : "Neutral";

  const topHarmony = Object.entries(data.harmonyCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            {data.artistSlug}
          </h3>
          <Badge variant="outline" className="w-fit text-xs">
            {data.count} images analyzed
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Temperature</span>
              <span className="font-medium text-foreground">{tempLabel}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-gray-500 to-orange-500"
                style={{
                  width: `${((data.avgTemperature + 1) / 2) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Saturation</span>
              <span className="font-medium text-foreground">
                {(data.avgSaturation * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${data.avgSaturation * 100}%` }}
              />
            </div>
          </div>
          {topHarmony && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Top harmony</span>
              <span className="font-medium text-foreground capitalize">
                {topHarmony[0]}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MaterialityDataCard({
  data,
}: {
  data: {
    artistSlug: string;
    count: number;
    avgImpossibility: number;
    avgTechnicalDetail: number;
    totalUniqueMaterials: number;
    concreteCount: number;
    speculativeCount: number;
  };
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            {data.artistSlug}
          </h3>
          <Badge variant="outline" className="w-fit text-xs">
            {data.count} statements analyzed
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Impossibility</span>
              <span className="font-medium text-foreground">
                {(data.avgImpossibility * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-purple-500"
                style={{ width: `${data.avgImpossibility * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Technical detail</span>
              <span className="font-medium text-foreground">
                {(data.avgTechnicalDetail * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-accent"
                style={{ width: `${data.avgTechnicalDetail * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Materials</span>
            <span className="font-medium text-foreground">
              {data.concreteCount} concrete / {data.speculativeCount}{" "}
              speculative
            </span>
          </div>
        </div>
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
            Queue a few comparison batches to unlock the analytics view.
            Sentiment runs automatically on every completed artist statement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageTitle, PageDescription } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Heart, Palette, Boxes } from "lucide-react";

export default function AnalyticsPage() {
  const sentimentComparison = useQuery(api.sentiment.compareArtistSentiments);

  const isLoading = sentimentComparison === undefined;
  const hasData = sentimentComparison && sentimentComparison.length > 0;

  return (
    <main className="pb-24 pt-16">
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6">
        <PageHeader>
          <PageTitle>Model Analytics</PageTitle>
          <PageDescription>
            Phase 3: Quantifying aesthetic fingerprints across reasoning models through
            sentiment analysis, color palettes, and materiality patterns.
          </PageDescription>
        </PageHeader>

        {isLoading && (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6).keys()].map((i) => (
              <Card key={i} className="border-border/40">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !hasData && (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">No analysis data yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Generate some model comparisons first. Sentiment analysis runs automatically
                  on each generation.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {hasData && (
          <div className="space-y-12">
            {/* Sentiment Overview */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Emotional Patterns</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sentimentComparison.map((artist) => (
                  <Card key={artist.artistSlug} className="border-border/40 bg-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">{artist.artistSlug}</span>
                        <Badge variant="outline">{artist.count} runs</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Valence meter */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Valence</span>
                          <span>{artist.avgValence.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              artist.avgValence > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.abs(artist.avgValence) * 50 + 50}%`,
                              marginLeft: artist.avgValence < 0 ? '0' : '50%'
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Negative</span>
                          <span>Positive</span>
                        </div>
                      </div>

                      {/* Top emotions */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Top Emotions</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(artist.avgEmotions)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([emotion, score]) => (
                              <Badge key={emotion} variant="secondary" className="text-xs">
                                {emotion}: {(score as number).toFixed(2)}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      {/* Arousal */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Arousal</span>
                          <span className="font-medium">{artist.avgArousal.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${artist.avgArousal * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Abstractness */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Abstractness</span>
                          <span className="font-medium">{artist.avgAbstractness.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 transition-all"
                            style={{ width: `${artist.avgAbstractness * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Placeholder sections for future analysis */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Palette className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Color Palettes</h2>
              </div>
              <Card className="border-border/40 border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">
                    Color palette analysis coming soon. Will extract dominant colors,
                    temperature, and harmony patterns from generated images.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Boxes className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Materiality Analysis</h2>
              </div>
              <Card className="border-border/40 border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">
                    Material classification analysis coming soon. Will track concrete vs
                    speculative materials and impossibility scores.
                  </p>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

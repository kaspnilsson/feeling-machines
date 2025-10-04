"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2, Users } from "lucide-react";
import { ArtistStatement } from "@/components/artist-statement";
import { useRouter } from "next/navigation";

export default function Home() {
  const runs = useQuery(api.runs.list);
  const runGroups = useQuery(api.analytics.listRunGroups);
  const generate = useAction(api.generate.generate);
  const enqueueBatch = useMutation(api.generateBatch.enqueueRunGroup);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const router = useRouter();

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-transparent to-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <section className="mb-8">
          <h1 className="title-gradient heading-tight text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            AI artists expressing their inner worlds
          </h1>
          <p className="text-muted-foreground text-balance max-w-2xl text-lg md:text-xl">
            Generate evocative images guided by artist statements and
            experimental brushes.
          </p>
        </section>

        <div className="flex gap-4 mb-10">
          <Button
            onClick={async () => {
              try {
                setIsGenerating(true);
                await generate();
                toast.success("Artwork generated successfully!");
              } catch (error: any) {
                console.error("Generation failed:", error);
                const message = error?.message || "Failed to generate artwork";
                toast.error(message, {
                  description:
                    error?.data?.message ||
                    "Please try again or check your API quota",
                });
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating || isBatchGenerating}
            className="shadow-lg hover:shadow-xl transition-shadow"
            size="lg"
            aria-busy={isGenerating}
            aria-disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles />
                Generate single artwork
              </>
            )}
          </Button>

          <Button
            onClick={async () => {
              try {
                setIsBatchGenerating(true);
                const result = await enqueueBatch({
                  promptVersion: "v2-neutral",
                });
                toast.success(
                  `Batch started! Generating ${result.artistCount} artworks...`
                );
                // Navigate to compare view
                router.push(`/compare/${result.runGroupId}`);
              } catch (error: any) {
                console.error("Batch generation failed:", error);
                const message =
                  error?.message || "Failed to start batch generation";
                toast.error(message);
              } finally {
                setIsBatchGenerating(false);
              }
            }}
            disabled={isGenerating || isBatchGenerating}
            className="shadow-lg hover:shadow-xl transition-shadow"
            size="lg"
            aria-busy={isBatchGenerating}
            aria-disabled={isBatchGenerating}
          >
            {isBatchGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                Starting batch...
              </>
            ) : (
              <>
                <Users />
                Compare multiple artists
              </>
            )}
          </Button>
        </div>

        {/* Run Groups Section */}
        {runGroups && runGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Run Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {runGroups.slice(0, 6).map((group: any) => (
                <Card
                  key={group.runGroupId}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/compare/${group.runGroupId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">
                        {group.runGroupId.slice(0, 8)}...
                      </Badge>
                      <Badge
                        variant={
                          group.completedRuns === group.totalRuns
                            ? "default"
                            : "secondary"
                        }
                      >
                        {group.completedRuns}/{group.totalRuns}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {group.artists.length} artists
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(group.createdAt).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {!runs && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full aspect-square" />
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Artwork grid */}
        {runs && runs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runs.map((r: any) => (
              <Card
                key={r._id}
                className="group overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img
                  src={r.imageUrl || ""}
                  alt="AI artwork"
                  className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <CardContent className="p-5">
                  <div className="mb-3">
                    <ArtistStatement text={r.artistStmt} />
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-auto">
                    <Badge variant="secondary">{r.artistSlug}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline">{r.brushSlug}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {runs?.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No artworks yet</p>
            <p className="text-sm text-muted-foreground">
              Click "Generate new artwork" to create your first piece!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

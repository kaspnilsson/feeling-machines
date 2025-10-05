import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InsightBadge } from "@/components/patterns/insight-badge";

interface GalleryHeroProps {
  onStartComparison?: () => void;
}

export function GalleryHero({ onStartComparison }: GalleryHeroProps) {
  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <InsightBadge>Phase 3 · Hidden Bias</InsightBadge>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-[3rem]">
              Compare how models imagine the same artwork.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Feeling Machines is a living gallery that stages one creative brief across many
              reasoning models and a shared image brush. Explore their statements, renderings, and
              the research patterns we surface along the way.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onStartComparison}>
              Start a comparison
            </Button>
            <Button asChild variant="ghost" size="lg" className="gap-2">
              <Link href="/insights">View research insights →</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative h-40 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent sm:h-48">
            <div className="absolute inset-0 flex items-end justify-start p-4">
              <p className="text-sm font-medium text-foreground">
                Claude vs GPT · suspended glass sculpture
              </p>
            </div>
          </div>
          <div className="relative h-40 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-indigo-500/20 via-transparent to-emerald-400/20 sm:h-48">
            <div className="absolute inset-0 flex items-end justify-start p-4">
              <p className="text-sm font-medium text-foreground">
                Gemini vs Mistral · architectural daydream
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

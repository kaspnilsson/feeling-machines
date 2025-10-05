import { BookOpen, Sparkles } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/patterns/section-heading";
import { PageHeader, PageTitle, PageDescription } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const roadmap = [
  {
    title: "Phase 3 — Hidden Bias",
    description:
      "Quantifying emotional tone, color palettes, and materiality across Artist statements.",
  },
  {
    title: "Phase 4 — The Introspector",
    description: "Persona prompts that stress-test each Artist's voice.",
  },
  {
    title: "Phase 5 — The Brush Lab",
    description: "Fix the Artist and explore cross-brush stylistic shifts.",
  },
];

export default function ResearchPage() {
  return (
    <main className="pb-24 pt-16">
      <PageShell maxWidth="5xl" className="space-y-14">
        <PageHeader
          headline={
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Research notes
            </span>
          }
        >
          <div className="space-y-6">
            <PageTitle>Inside Feeling Machines</PageTitle>
            <PageDescription>
              Follow the study as we compare reasoning models, log aesthetic fingerprints, and publish open datasets.
            </PageDescription>
          </div>
        </PageHeader>

        <section className="space-y-6">
          <SectionHeading
            title="Current focus"
            description="Phase 3 shifts from pure generation to analytical interpretation — sentiment, palette, and materiality analysis at scale."
          />
          <Card className="border-border/60 bg-card">
            <CardContent className="space-y-4 p-6">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4" />
                Working paper in progress
              </div>
              <p className="text-sm text-muted-foreground">
                We’re drafting the Hidden Bias report now. Expect a deep dive on emotional spectra, palette clustering, and how Artist statements telegraph worldview.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator className="border-border/70" />

        <section className="space-y-4">
          <SectionHeading
            title="Roadmap"
            description="Every phase ends with a shareable artifact — new comparison galleries, public datasets, or formal write-ups."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {roadmap.map((item) => (
              <Card key={item.title} className="border-border bg-card">
                <CardContent className="space-y-2 p-6">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </PageShell>
    </main>
  );
}

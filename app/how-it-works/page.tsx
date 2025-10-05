import Link from "next/link";
import { Metadata } from "next";

import { PageDescription, PageHeader, PageTitle } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Wand2, Layers3, ImageIcon, LineChart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How it works — Feeling Machines",
  description:
    "Understand how Feeling Machines compares reasoning and image models using shared prompts and transparent metadata.",
};

const pipeline = [
  {
    title: "1. Queue reasoning models",
    description:
      "We send the same introspective prompt to every LLM configured for the batch. Each model writes a short statement describing the artwork it would create.",
    badge: "LLM step",
    icon: <Layers3 className="h-5 w-5" />,
  },
  {
    title: "2. Relay to one image model",
    description:
      "The written prompt from every LLM flows to a shared image model (the Brush). Using a single renderer keeps the visuals comparable across models.",
    badge: "Image step",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    title: "3. Collect metadata",
    description:
      "We log completion state, latency, token estimates, and cost for the reasoning and image portions so you understand trade-offs at a glance.",
    badge: "Observability",
    icon: <LineChart className="h-5 w-5" />,
  },
];

const transparency = [
  {
    title: "Prompt versioning",
    body: "Every batch references a named prompt (e.g., v2-neutral). Prompts live in versioned files so you can reproduce them or swap personas later.",
  },
  {
    title: "Model naming",
    body: "Cards label the exact LLM (reasoning model) and image model used, following the format ‘LLM · model-name’ and ‘Image · model-name’.",
  },
  {
    title: "Raw data access",
    body: "Expand any artwork card to inspect the generated statement, the exact prompt sent to the image model, and the pipeline metadata (cost, latency, tokens).",
  },
];

const nextSteps = [
  {
    title: "Start a comparison",
    description: "Kick off a new batch using the default prompt and available models.",
    href: "/",
    icon: <Wand2 className="h-4 w-4" />,
  },
  {
    title: "Review active batches",
    description: "Return to the home page to monitor progress, completion, and costs for each model batch.",
    href: "/",
    icon: <ArrowRight className="h-4 w-4" />,
  },
];

export default function HowItWorksPage() {
  return (
    <main className="pb-24 pt-16">
      <div className="mx-auto max-w-5xl space-y-14 px-4 sm:px-6">
        <PageHeader
          headline={
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Under the hood
            </span>
          }
        >
          <div className="space-y-6">
            <PageTitle>How Feeling Machines works</PageTitle>
            <PageDescription>
              Feeling Machines compares how different reasoning models imagine the same artwork and how a shared image model renders their prompts. This page walks through the pipeline and the transparency guarantees that keep comparisons fair.
            </PageDescription>
          </div>
        </PageHeader>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">The comparison pipeline</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {pipeline.map((step) => (
              <Card key={step.title} className="border-border bg-card">
                <CardContent className="space-y-4 p-6">
                  <Badge variant="outline" className="w-fit bg-card/90 text-xs uppercase tracking-[0.14em]">
                    {step.badge}
                  </Badge>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="border-border/70" />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Transparency principles</h2>
          <p className="text-sm text-muted-foreground">
            Inspired by contemporary museum curation, every comparison foregrounds the process: prompts, models, and metadata stay in view so you can trust what you’re seeing.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {transparency.map((item) => (
              <Card key={item.title} className="border-border bg-card">
                <CardContent className="space-y-3 p-6">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="border-border/70" />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Explore next</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {nextSteps.map((step) => (
              <Card key={step.title} className="border-border bg-card">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                    {step.icon}
                    {step.title}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <Link href={step.href} className="text-sm font-medium text-primary">
                    Go there →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

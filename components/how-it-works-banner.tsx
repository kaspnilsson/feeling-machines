import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Ask every LLM the same brief",
    description:
      "We run the introspection prompt across each selected reasoning model so their statements are comparable.",
  },
  {
    title: "Render with a shared image model",
    description:
      "Their prompts flow into one brush, keeping the visual language consistent while highlighting wording differences.",
  },
  {
    title: "Inspect outputs and metadata",
    description:
      "Every card surfaces the model’s explanation, the exact prompt sent to the brush, plus timing and cost data.",
  },
];

export function HowItWorksBanner({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border/70 bg-card", className)}>
      <CardContent className="flex flex-col gap-8 px-6 py-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4 md:max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Feeling Machines stages each comparison like a contemporary exhibit: one shared brief, multiple reasoning models, and a single image model so the differences stay legible.
          </p>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Learn more about the process →
          </Link>
        </div>

        <ol className="flex-1 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border/70 text-xs font-semibold text-foreground">
                {index + 1}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs leading-5 text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

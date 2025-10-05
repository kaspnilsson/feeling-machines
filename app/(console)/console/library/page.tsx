import { SectionHeading } from "@/components/patterns/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const promptPresets = [
  { name: "v3-introspective", description: "Introspective artist interview prompt." },
  { name: "v2-neutral", description: "Baseline creative brief for quick comparisons." },
];

const brushOptions = [
  { name: "Gemini 2.5 Flash Image", provider: "Google" },
  { name: "GPT Image 1", provider: "OpenAI" },
];

export default function LibraryPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        title="Prompt & model library"
        description="Organize prompt presets, artist sets, and brush configurations."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card">
          <CardContent className="space-y-4 p-6">
            <h3 className="text-sm font-semibold text-foreground">Prompt presets</h3>
            {promptPresets.map((preset) => (
              <div key={preset.name} className="space-y-1">
                <p className="text-sm font-medium text-foreground">{preset.name}</p>
                <p className="text-sm text-muted-foreground">{preset.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardContent className="space-y-4 p-6">
            <h3 className="text-sm font-semibold text-foreground">Available brushes</h3>
            {brushOptions.map((brush) => (
              <div key={brush.name} className="space-y-1">
                <p className="text-sm font-medium text-foreground">{brush.name}</p>
                <p className="text-sm text-muted-foreground">{brush.provider}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Separator className="border-border/70" />

      <Card className="border-border/60 bg-card">
        <CardContent className="space-y-2 p-6">
          <h3 className="text-sm font-semibold text-foreground">Artist sets</h3>
          <p className="text-sm text-muted-foreground">
            Define reusable bundles of reasoning models for common experiments (e.g. “Chorus of Artists”, “Open weight only”).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

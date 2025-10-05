"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ARTISTS, BRUSHES } from "@/convex/artists";

const AVAILABLE_ARTISTS = ARTISTS;
const AVAILABLE_BRUSHES = BRUSHES;

const ITERATION_OPTIONS = [
  { value: 1, label: "1× (Single run)", description: "Quick test" },
  { value: 3, label: "3× iterations", description: "Basic variance" },
  { value: 5, label: "5× iterations", description: "Exploratory" },
  { value: 10, label: "10× iterations", description: "Good sample" },
  { value: 20, label: "20× iterations", description: "Statistical power" },
];

const AVAILABLE_PROMPTS = [
  {
    slug: "v2-neutral",
    name: "V2 Neutral",
    description: "Structured creative reflection",
  },
  {
    slug: "v3-introspective",
    name: "V3 Introspective",
    description: "Open-ended introspection",
  },
];

interface NewComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewComparisonDialog({
  open,
  onOpenChange,
}: NewComparisonDialogProps) {
  const router = useRouter();
  const enqueueBatch = useMutation(api.generateBatch.enqueueRunGroup);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize with all artists selected
  const [selectedArtists, setSelectedArtists] = useState<string[]>(
    AVAILABLE_ARTISTS.map((a) => a.slug)
  );
  const [selectedBrush, setSelectedBrush] = useState<string>(
    "gemini-2.5-flash-image"
  );
  const [selectedPrompt, setSelectedPrompt] =
    useState<string>("v3-introspective");
  const [selectedIterations, setSelectedIterations] = useState<number>(5);

  const toggleArtist = (slug: string) => {
    setSelectedArtists((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleGenerate = async () => {
    if (selectedArtists.length === 0) {
      toast.error("Please select at least one reasoning model");
      return;
    }

    try {
      setIsGenerating(true);

      const result = await enqueueBatch({
        promptVersion: selectedPrompt,
        artistSlugs: selectedArtists,
        brushSlug: selectedBrush,
        iterations: selectedIterations,
      });

      const totalRuns = selectedArtists.length * selectedIterations;
      toast.success(
        `Comparison started! Generating ${totalRuns} total runs (${selectedArtists.length} models × ${selectedIterations} iterations)...`
      );
      onOpenChange(false);
      router.push(`/compare/${result.runGroupId}`);
    } catch (error) {
      console.error("Comparison generation failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to start comparison";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-primary" />
            New model comparison
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Queue a batch that asks multiple reasoning models the same question
            and forwards their image prompts to a shared renderer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-2">
          <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Reasoning models (LLMs)
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select which models to compare
              </p>
            </div>
            <div className="space-y-2">
              {AVAILABLE_ARTISTS.map((artist) => (
                <div key={artist.slug} className="flex items-center space-x-2">
                  <Checkbox
                    id={artist.slug}
                    checked={selectedArtists.includes(artist.slug)}
                    onCheckedChange={() => toggleArtist(artist.slug)}
                  />
                  <Label
                    htmlFor={artist.slug}
                    className="flex flex-1 items-center justify-between text-sm font-normal cursor-pointer"
                  >
                    <span>{artist.displayName}</span>
                    <Badge variant="outline" className="text-xs">
                      {artist.producer}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/10 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Image model (Brush)
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select which image model to render with
              </p>
            </div>
            <div className="space-y-2">
              {AVAILABLE_BRUSHES.map((brush) => (
                <div key={brush.slug} className="flex items-center space-x-2">
                  <Checkbox
                    id={brush.slug}
                    checked={selectedBrush === brush.slug}
                    onCheckedChange={() => setSelectedBrush(brush.slug)}
                  />
                  <Label
                    htmlFor={brush.slug}
                    className="flex flex-1 items-center justify-between text-sm font-normal cursor-pointer"
                  >
                    <span>{brush.displayName}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {brush.provider}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/10 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Prompt preset
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Choose the introspection template
              </p>
            </div>
            <div className="space-y-2">
              {AVAILABLE_PROMPTS.map((prompt) => (
                <div key={prompt.slug} className="flex items-center space-x-2">
                  <Checkbox
                    id={prompt.slug}
                    checked={selectedPrompt === prompt.slug}
                    onCheckedChange={() => setSelectedPrompt(prompt.slug)}
                  />
                  <Label
                    htmlFor={prompt.slug}
                    className="flex flex-1 flex-col space-y-0.5 text-sm font-normal cursor-pointer"
                  >
                    <span>{prompt.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {prompt.description}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/10 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Batch size (iterations)
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Run multiple iterations for statistical analysis
              </p>
            </div>
            <div className="space-y-2">
              {ITERATION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`iter-${option.value}`}
                    checked={selectedIterations === option.value}
                    onCheckedChange={() => setSelectedIterations(option.value)}
                  />
                  <Label
                    htmlFor={`iter-${option.value}`}
                    className="flex flex-1 flex-col space-y-0.5 text-sm font-normal cursor-pointer"
                  >
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="border-border/70 flex-shrink-0" />

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> Start comparison
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

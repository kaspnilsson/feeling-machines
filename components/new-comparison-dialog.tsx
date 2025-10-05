"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const result = await enqueueBatch({
        promptVersion: "v2-neutral",
      });
      toast.success(
        `Comparison started! Generating ${result.artistCount} model outputs...`
      );
      onOpenChange(false);
      router.push(`/compare/${result.runGroupId}`);
    } catch (error: any) {
      console.error("Comparison generation failed:", error);
      const message = error?.message || "Failed to start comparison";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-primary" />
            New model comparison
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Queue a batch that asks multiple reasoning models the same question
            and forwards their image prompts to a shared renderer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Reasoning models (LLMs)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The batch runs every available reasoning model so you can
                  compare how each one interprets the brief.
                </p>
              </div>
              <Badge variant="outline" className="bg-card/90">
                Included
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className="bg-primary/90 text-primary-foreground">
                LLM · GPT-4o mini
              </Badge>
              <Badge variant="default" className="bg-primary/90 text-primary-foreground">
                LLM · GPT-4o
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Image model (Brush)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every prompt from the reasoning models is rendered with the
                  same image model for apples-to-apples visuals.
                </p>
              </div>
              <Badge variant="secondary" className="bg-muted/60">
                Image · gpt-image-1
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Prompt preset
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Each model receives the same introspection template so their
                  differences come from the model, not the instructions.
                </p>
              </div>
              <Badge variant="outline" className="bg-card/90">
                Prompt · v2-neutral
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="border-border/70" />

        <DialogFooter>
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

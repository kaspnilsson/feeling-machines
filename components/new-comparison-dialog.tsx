"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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
        `Comparison started! Generating ${result.artistCount} artworks...`
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Comparison</DialogTitle>
          <DialogDescription>
            Compare how different AI models imagine and express art
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Artists Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Artists (LLMs)</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">GPT-4o Mini</Badge>
              <Badge variant="default">GPT-4o</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Currently comparing all available artists
            </p>
          </div>

          {/* Brush Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Brush (Image Model)</h3>
            <Badge variant="secondary">gpt-image-1</Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Default image generation model
            </p>
          </div>

          {/* Prompt Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Prompt</h3>
            <Badge variant="outline">v2-neutral</Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Creative introspection prompt asking models to imagine artwork
            </p>
          </div>
        </div>

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
              "Generate Comparison"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

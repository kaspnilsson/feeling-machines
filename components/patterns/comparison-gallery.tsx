"use client";

import { ComparisonRun } from "./comparison-viewer";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonGalleryProps {
  runs: ComparisonRun[];
  selectedRunId?: string;
  onRunSelect?: (runId: string) => void;
}

export function ComparisonGallery({ runs, selectedRunId, onRunSelect }: ComparisonGalleryProps) {
  function statusLabel(status: string) {
    if (status === "done") return "Done";
    if (status === "failed") return "Failed";
    if (status === "generating") return "Generating";
    if (status === "queued") return "Queued";
    return status;
  }

  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
      {runs.map((run) => (
        <Card
          key={run._id}
          className={cn(
            "overflow-hidden border-border/60 bg-card transition-transform hover:-translate-y-[2px] cursor-pointer",
            run._id === selectedRunId && "border-primary/60",
            run.status === "failed" && "border-destructive/50"
          )}
        >
          <button
            type="button"
            className="flex w-full flex-col text-left"
            onClick={() => onRunSelect?.(run._id)}
          >
            <div className="relative aspect-square bg-muted">
              {run.imageUrl && run.status === "done" ? (
                <img
                  src={run.imageUrl}
                  alt={`${run.artistSlug} artwork thumbnail`}
                  className="h-full w-full object-cover"
                />
              ) : run.status === "failed" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/5">
                  <div className="rounded-full bg-destructive/10 p-1.5">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="text-[10px] font-medium text-destructive">Failed</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                  {statusLabel(run.status)}
                </div>
              )}
            </div>
            <CardContent className="space-y-0.5 p-2">
              <p className="text-xs font-medium text-foreground truncate">{run.artistSlug}</p>
              <p className="text-[10px] text-muted-foreground truncate">Image · {run.brushSlug}</p>
            </CardContent>
          </button>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { ComparisonRun } from "./comparison-viewer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
  runs: ComparisonRun[];
  onRunSelect?: (runId: string) => void;
  selectedRunId?: string;
}

export function ComparisonTable({ runs, onRunSelect, selectedRunId }: ComparisonTableProps) {
  function ThumbnailCell({ run }: { run: ComparisonRun }) {
    if (run.status === "failed") {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded border border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
      );
    }

    if (run.status === "queued" || run.status === "generating") {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded border border-border bg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!run.imageUrl) {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded border border-border bg-muted">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="relative h-12 w-12 overflow-hidden rounded border border-border">
        <Image
          src={run.imageUrl}
          alt={`${run.artistSlug} output`}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    );
  }

  function getStatusBadge(status: string) {
    if (status === "done") {
      return <Badge variant="default">Done</Badge>;
    }
    if (status === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (status === "generating") {
      return <Badge variant="secondary">Generating</Badge>;
    }
    return <Badge variant="outline">Queued</Badge>;
  }

  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow
                key={run._id}
                className={cn(
                  "cursor-pointer text-sm",
                  selectedRunId === run._id && "bg-muted"
                )}
                onClick={() => onRunSelect?.(run._id)}
              >
                <TableCell>
                  <ThumbnailCell run={run} />
                </TableCell>
                <TableCell className="font-medium">
                  {run.artistSlug}
                </TableCell>
                <TableCell>{getStatusBadge(run.status)}</TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {run.meta?.artist?.costEstimate !== undefined || run.meta?.brush?.costEstimate !== undefined
                    ? `$${((run.meta?.artist?.costEstimate || 0) + (run.meta?.brush?.costEstimate || 0)).toFixed(6)}`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

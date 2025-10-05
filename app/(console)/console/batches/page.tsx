"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { SectionHeading } from "@/components/patterns/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, ExternalLink } from "lucide-react";
import { NewComparisonDialog } from "@/components/new-comparison-dialog";

export default function BatchesPage() {
  const runGroups = useQuery(api.analytics.listRunGroups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isLoading = !runGroups;

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(group: {
    totalRuns: number;
    completedRuns: number;
  }) {
    if (group.completedRuns === group.totalRuns) {
      return <Badge variant="default">Complete</Badge>;
    }
    if (group.completedRuns === 0) {
      return <Badge variant="outline">Queued</Badge>;
    }
    return <Badge variant="secondary">In progress</Badge>;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Batch manager"
        description="Launch new comparisons, monitor progress, and triage failures."
        actions={
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" /> New batch
          </Button>
        }
      />

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : runGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                No batches yet
              </p>
              <p className="text-sm text-muted-foreground">
                Launch your first comparison to get started
              </p>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" /> New batch
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <TableHead className="w-[140px]">Run group</TableHead>
                  <TableHead>Artists</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runGroups.map((group) => (
                  <TableRow key={group.runGroupId} className="text-sm">
                    <TableCell className="font-mono text-xs">
                      {group.runGroupId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.artists.join(", ")}
                    </TableCell>
                    <TableCell>
                      {group.completedRuns}/{group.totalRuns}
                    </TableCell>
                    <TableCell>{getStatusBadge(group)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(group.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/compare/${group.runGroupId}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewComparisonDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

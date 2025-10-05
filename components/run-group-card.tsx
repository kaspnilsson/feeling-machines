import { useMemo } from "react";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RunGroupCardProps {
  runGroupId: string;
  artists: string[];
  totalRuns: number;
  completedRuns: number;
  createdAt: number;
  onClick: () => void;
}

export function RunGroupCard({
  runGroupId,
  artists,
  totalRuns,
  completedRuns,
  createdAt,
  onClick,
}: RunGroupCardProps) {
  const { percentage, statusLabel, statusVariant, createdRelative } = useMemo(
    () => {
      const ratio = totalRuns === 0 ? 0 : completedRuns / totalRuns;
      const isComplete = totalRuns > 0 && completedRuns === totalRuns;
      const isQueued = completedRuns === 0;

      const statusLabel = isComplete
        ? "Completed"
        : isQueued
          ? "Queued"
          : "In progress";
      const statusVariant = isComplete
        ? "default"
        : isQueued
          ? "outline"
          : "secondary";

      const createdRelative = formatRelativeDate(createdAt);

      return {
        percentage: Math.round(ratio * 100),
        statusLabel,
        statusVariant,
        createdRelative,
      };
    },
    [totalRuns, completedRuns, createdAt]
  );

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border bg-card transition-transform duration-300 shadow-sm hover:-translate-y-[2px] hover:border-primary/40 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-7 p-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex flex-wrap gap-2">
            {artists.map((artist) => (
              <Badge key={artist} variant="outline" className="bg-muted/60">
                LLM · {artist}
              </Badge>
            ))}
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>
              {completedRuns}/{totalRuns}
            </span>
          </div>
          <Progress value={percentage} aria-valuetext={`${percentage}% complete`} />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tracking-tight">{createdRelative}</span>
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            View details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeDate(timestamp: number) {
  const now = Date.now();
  const diff = timestamp - now;
  const diffAbs = Math.abs(diff);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, ms] of units) {
    if (diffAbs >= ms || unit === "minute") {
      const value = Math.round(diff / ms);
      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      return rtf.format(value, unit);
    }
  }

  return new Date(timestamp).toLocaleString();
}

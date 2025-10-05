import { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: "default" | "muted";
}

export function MetricCard({
  icon,
  label,
  value,
  helper,
  tone = "default",
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "bg-card",
        tone === "muted" ? "border-border/50" : "border-border/60"
      )}
    >
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-[0.16em]">
            {label}
          </span>
          {icon && <div className="text-foreground/70">{icon}</div>}
        </div>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {helper && <div className="text-xs text-muted-foreground">{helper}</div>}
      </CardContent>
    </Card>
  );
}

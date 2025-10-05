import { SectionHeading } from "@/components/patterns/section-heading";
import { MetricCard } from "@/components/patterns/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Clock3, AlertTriangle } from "lucide-react";

export default function ConsoleDashboardPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow={
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Lab overview
          </span>
        }
        title="Operations dashboard"
        description="Monitor batch throughput, runtime health, and open tasks."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active batches" value="—" helper="Real data wiring TBD" tone="muted" />
        <MetricCard label="Success rate" value="—" helper="Completed vs failed" tone="muted" />
        <MetricCard label="Avg latency" value="—" helper="Prompt → image" tone="muted" />
        <MetricCard label="Spend (24h)" value="—" helper="Artist + brush cost" tone="muted" />
      </div>

      <Separator className="border-border/70" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card">
          <CardContent className="space-y-3 p-6">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock3 className="h-4 w-4" />
              Queue status
            </div>
            <p className="text-sm text-muted-foreground">Hook up Convex queries to show queued vs generating runs.</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="space-y-3 p-6">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Triage log
            </div>
            <p className="text-sm text-muted-foreground">List recent failures and quick actions (retry, edit params).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

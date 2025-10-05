import { SectionHeading } from "@/components/patterns/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConsoleAnalyticsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Analytics studio"
        description="Deep-dive charts for sentiment, palette, and materiality trends across batches."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, idx) => (
          <Card key={idx} className="border-border/60 bg-card">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

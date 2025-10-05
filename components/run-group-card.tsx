import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

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
  return (
    <Card
      className="group cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2">
            {artists.map((artist: string) => (
              <Badge key={artist} variant="default">
                {artist}
              </Badge>
            ))}
          </div>
          <Badge
            variant={completedRuns === totalRuns ? "default" : "secondary"}
          >
            {completedRuns}/{totalRuns}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {new Date(createdAt).toLocaleString()}
          </p>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}

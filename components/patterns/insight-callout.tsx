import { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InsightCalloutProps {
  title: string;
  icon?: ReactNode;
  description?: ReactNode;
  points?: Array<string | ReactNode>;
  footer?: ReactNode;
  tone?: "default" | "accent" | "muted" | "destructive";
  className?: string;
}

const toneStyles: Record<NonNullable<InsightCalloutProps["tone"]>, string> = {
  default: "border-border/80 bg-card/95",
  accent: "border-primary/40 bg-primary/10",
  muted: "border-border/60 bg-muted/40",
  destructive: "border-destructive/40 bg-destructive/10",
};

export function InsightCallout({
  title,
  icon,
  description,
  points,
  footer,
  tone = "default",
  className,
}: InsightCalloutProps) {
  return (
    <Card
      className={cn(
        "h-full overflow-hidden border px-6 py-6 transition-colors",
        toneStyles[tone],
        className
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-0">
        <div className="flex items-start gap-3">
          {icon && <div className="mt-1 text-muted-foreground">{icon}</div>}
          <div className="space-y-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            {description && (
              <div className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </div>
            )}
          </div>
        </div>

        {points && points.length > 0 && (
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {points.map((point, index) => (
              <li key={index} className="flex gap-2 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/70" />
                <span className="flex-1 text-foreground/90">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {footer && <div className="mt-auto text-xs text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
}

import { ReactNode } from "react";

import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsightBadgeProps extends BadgeProps {
  icon?: ReactNode;
  children: ReactNode;
}

export function InsightBadge({ icon, children, className, ...props }: InsightBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-border/60 bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span>{children}</span>
    </Badge>
  );
}

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Align = "left" | "center";

interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  align?: Align;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div
        className={cn(
          "space-y-3",
          align === "center" && "text-center md:text-left"
        )}
      >
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {title}
          </h2>
          {description && (
            <div className="text-sm text-muted-foreground md:text-base">
              {description}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

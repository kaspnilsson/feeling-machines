import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  className?: string;
  align?: "left" | "center" | "right";
  headline?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  className,
  align = "left",
  headline,
  children,
  actions,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-12 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div
        className={cn(
          "space-y-6",
          align === "center" && "text-center md:text-left",
          align === "right" && "text-right md:text-left"
        )}
      >
        {headline && (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {headline}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex items-center justify-start gap-3 md:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "text-[2.5rem] font-semibold tracking-tight text-foreground md:text-[3rem]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function PageDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg", className)}>
      {children}
    </p>
  );
}

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MaxWidth = "full" | "7xl" | "5xl" | "4xl" | "3xl";

const maxWidthClass: Record<MaxWidth, string> = {
  full: "max-w-full",
  "7xl": "max-w-7xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
};

interface PageShellProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
  padded?: boolean;
  className?: string;
}

export function PageShell({
  children,
  maxWidth = "7xl",
  padded = true,
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthClass[maxWidth],
        padded && "px-4 sm:px-6",
        className
      )}
    >
      {children}
    </div>
  );
}

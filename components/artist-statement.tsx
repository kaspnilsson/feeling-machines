"use client";

import { cn } from "@/lib/utils";

export function ArtistStatement({ text }: { text: string }) {
  return (
    <p className={cn("text-sm leading-relaxed text-muted-foreground")}>{text}</p>
  );
}

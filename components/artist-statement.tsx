"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";

export function ArtistStatement({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <p
        id="artist-statement"
        className={cn(
          "text-sm text-muted-foreground transition-all",
          !open && "clamp-3"
        )}
      >
        {text}
      </p>
      <div className="mt-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto text-xs"
            aria-controls="artist-statement"
          >
            {open ? "Show less" : "Show more"}
          </Button>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}

"use client";

import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ComparisonStripItem {
  id: string;
  label: string;
  status?: ReactNode;
  onSelect?: () => void;
  isActive?: boolean;
}

interface ComparisonStripProps {
  items: ComparisonStripItem[];
}

export function ComparisonStrip({ items }: ComparisonStripProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {items.map((item) => (
        <Button
          key={item.id}
          variant={item.isActive ? "default" : "outline"}
          size="sm"
          className={cn(
            "rounded-full",
            item.isActive ? "bg-primary text-primary-foreground" : "bg-background"
          )}
          onClick={item.onSelect}
        >
          <span className="text-sm font-medium">{item.label}</span>
          {item.status && <span className="ml-2 text-xs text-primary-foreground/80">{item.status}</span>}
        </Button>
      ))}
    </div>
  );
}

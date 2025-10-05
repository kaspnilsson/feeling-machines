import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow">
            FM
          </span>
          <div className="leading-tight">
            <span className="block text-base font-semibold tracking-tight text-foreground">
              Feeling Machines
            </span>
            <span className="text-xs text-muted-foreground">
              Compare how models plan and render the same idea
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <Link href="/how-it-works">How it works</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

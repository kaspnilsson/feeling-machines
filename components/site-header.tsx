"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Gallery", href: "/" },
  { label: "Research", href: "/research" },
  { label: "Insights", href: "/insights" },
  { label: "How it works", href: "/how-it-works" },
];

export function SiteHeader() {
  const pathname = usePathname();

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
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-3 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/console"
            className="hidden rounded-md border border-border/80 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground md:inline-flex"
          >
            Lab console
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

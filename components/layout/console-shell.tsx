"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/console", label: "Dashboard" },
  { href: "/console/batches", label: "Batches" },
  { href: "/console/library", label: "Library" },
  { href: "/console/analytics", label: "Analytics" },
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 flex-col border-r border-border/70 bg-card/60 p-6 md:flex">
        <Link href="/" className="mb-8 text-sm font-semibold tracking-tight text-foreground">
          Feeling Machines Lab
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-border/70 bg-card/60 px-6 py-4 md:hidden">
          <nav className="flex flex-wrap gap-3 text-sm">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-6 py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

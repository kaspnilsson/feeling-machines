"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "fm-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Initialize from DOM/localStorage to sync with inline script in layout
  useEffect(() => {
    try {
      const ls = localStorage.getItem(THEME_KEY);
      const mql =
        typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia("(prefers-color-scheme: dark)")
          : null;
      const root = document.documentElement;
      const isDark =
        (ls ? ls === "dark" : !!mql?.matches) ||
        root.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    } catch {}
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      aria-pressed={theme === "dark"}
      onClick={toggle}
      className="relative hover:bg-accent/60"
    >
      <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

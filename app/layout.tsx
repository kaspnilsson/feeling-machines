import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Feeling Machines",
  description: "AI Artists expressing their inner worlds",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Set initial color theme ASAP to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try {
  const k = 'fm-theme';
  const ls = localStorage.getItem(k);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = ls || (prefersDark ? 'dark' : 'light');
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
} catch (_) {} })();`,
          }}
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0a0a0a"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body
        className={`antialiased transition-colors bg-[hsl(var(--background))] text-[hsl(var(--foreground))]`}
      >
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}

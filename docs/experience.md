# Experience Blueprint

## Overview

Feeling Machines now delivers two complementary surfaces:

1. **Gallery (public)** – Editorial storytelling for visitors who want to see the artwork, skim insights, and understand the research narrative.
2. **Lab Console (internal)** – Operational controls and analytics for the research team running experiments.

The same Convex dataset powers both experiences; the UI layer determines how data is composed and narrated.

---

## Gallery Flow

1. **Hero Gallery** – Large-format collage of curated comparisons with quick toggles (`Artist`, `Brush`, `Prompt`). Highlights a striking difference and links to the underlying comparison report.
2. **Featured Comparisons** – Organized as horizontally scrolling rows or mosaics. Hover reveals short insight blurbs, sentiment deltas, and CTAs like `Open comparison report`.
3. **Comparison Report** – Split-screen columns that keep model imagery in sync.
   - Primary area: synchronized viewer (zoom/pan, lightbox).
   - Sidebar: prompt, artist statements, analytics badges (valence, arousal, cost, latency).
   - Footer: related batches, download/export links.
4. **Research Hub** – Summaries for every project phase with imagery, key metrics, methodology callouts, and references back to README roadmap.

### Gallery UI Components

- `GalleryHero` – full-width collage with headline, lead paragraph, and CTA buttons.
- `ComparisonStrip` – synchronized row of model thumbnails with optional annotations.
- `InsightBadge` – pill component conveying metrics (e.g., `Highest valence`), reused across hero and reports.
- `ResearchCard` – narrative card combining image, stat, and link to docs.

---

## Lab Console Flow

1. **Dashboard** – KPIs (active batches, failure rate, spend) plus quick actions.
2. **Batch Manager** – Table view with filters, inline actions (retry, duplicate, archive), progress bars, and navigation into run detail.
3. **Run Detail** – Timeline of attempts, error logs, image previews if available, export options.
4. **Prompt & Model Library** – Editable list of prompt presets, artist sets, and brush configurations with version history.
5. **Analytics Studio** – Charts tracking sentiment trends, palette stats, materiality breakdowns, and correlation matrices.

### Lab UI Components

- `ConsoleShell` – app layout with sidebar navigation and contextual toolbar.
- `BatchTable` – data table with sticky header, status chips, and row actions.
- `RunTimeline` – vertical timeline summarizing generation stages.
- `MetricGrid` – reusable grid for KPI cards shared with the Gallery hero.

---

## Shared Design System Enhancements

- Extend the shadcn token set with layout primitives: `PageShell`, `SectionHeader`, `MetricCard`, `InsightBadge`.
- Add responsive spacing scales (`space-y-14`, `gap-12`) to ensure parity across Gallery and Lab layouts.
- Define color roles for analytics (success/warm/cool/destructive) used by meters and badges.

---

## Next Steps

1. Scaffold shared components in `components/layout/` and `components/patterns/`.
2. Split routing: public pages under `app/(public)/...`, console pages under `app/(console)/...` with authentication gate.
3. Migrate existing pages to the new shells, starting with the gallery landing and comparison detail.
4. Draft wireframes for Comparison Report and Batch Manager to validate layout before implementation.

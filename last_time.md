# Session Summary: Statistical Rigor + JSON Prompts

## What We Did

### 1. JSON-Based Prompt System (Reliability Fix)
**Problem**: Occasional parsing errors from delimited text format (`===SECTION===`)
**Solution**: Switched to JSON-based output with platform-enforced schema

**Changes**:
- Created `createPrompt()` template function in `convex/prompts.ts`
- Converted all 5 prompts (V2-V6) to use JSON format
- Added `response_format: { type: "json_object" }` to OpenRouter adapter
- Updated all artist adapters to parse JSON instead of regex matching

**Result**: Platform-enforced JSON ensures valid, parseable output from all models

---

### 2. Statistical Analysis Infrastructure (Phase 3B)
**Goal**: Add rigorous statistical testing with educational UI for non-experts

#### Database Schema (`convex/schema.ts`)
Added 3 new tables for statistical metadata:

1. **`model_statistics`** - Descriptive stats per artist/metric
   - n, mean, stdDev, median, q1, q3, min, max
   - ci95Lower, ci95Upper (95% confidence intervals)

2. **`statistical_comparisons`** - Pairwise t-test results
   - mean1, mean2, meanDiff
   - tStatistic, pValue, degreesOfFreedom
   - cohensD (effect size)
   - significant (after multiple comparison correction)

3. **`anova_results`** - Overall significance tests
   - fStatistic, pValue
   - dfBetween, dfWithin
   - etaSquared (effect size)

All tables support per-batch analysis via optional `runGroupId` field.

#### Core Statistics Library (`utils/statistics.ts`)
**Approach**: Test-Driven Development (TDD)
- Created 12 tests first (`utils/statistics.test.ts`)
- Implemented functions to make tests pass
- All tests passing ✅

**Functions**:
- Descriptive: `mean()`, `standardDeviation()`, `median()`, `quartiles()`
- Inferential: `confidenceInterval95()`, `welchTTest()`, `cohensD()`, `oneWayANOVA()`
- Corrections: `benjaminiHochberg()`, `bonferroniCorrection()`

#### Analysis Scripts
1. **`scripts/compute-descriptive-stats.ts`**
   - Computes n, mean, SD, median, quartiles, CI95 for all 14 metrics
   - Requires `runGroupId` parameter for per-batch analysis
   - Usage: `npx tsx scripts/compute-descriptive-stats.ts <runGroupId>`

2. **`scripts/run-statistical-tests.ts`**
   - Runs one-way ANOVA for overall differences
   - If significant (p < 0.05): runs pairwise t-tests with Benjamini-Hochberg correction
   - Computes Cohen's d effect sizes
   - Usage: `npx tsx scripts/run-statistical-tests.ts <runGroupId>`

#### Convex Queries/Mutations (`convex/statistics.ts`)
- `saveModelStatistics` / `getDescriptiveStats` / `getStatsByMetric`
- `saveComparison` / `getPairwiseComparison` / `getSignificantComparisons`
- `saveANOVA` / `getANOVAResults` / `listANOVAResults`

All queries support optional `runGroupId` filtering for per-batch analysis.

---

### 3. Statistical Visualization Components (Educational UI)

#### `components/patterns/statistical-insight.tsx` (188 lines)
Educational components with plain-language explanations:

- **`StatisticalInsight`** - Metric with tooltip + interpretation
  - Example: "95% CI" with tooltip "We're 95% confident the true mean falls in this range"

- **`StatisticalExplanation`** - Collapsible "How to read this" sections
  - Uses Info icon + Collapsible from shadcn/ui

- **`DescriptiveStatsCard`** - Complete stats card for one model/metric
  - Grid of 6 metrics with tooltips
  - Collapsible explanation of what the numbers mean

#### `components/patterns/statistical-charts.tsx` (342 lines)
Recharts-based visualizations with educational context:

1. **`ConfidenceIntervalChart`** - Bar chart with error bars
   - Shows mean ± 95% CI
   - Explanation: "If error bars don't overlap → likely genuinely different"

2. **`DistributionBoxPlot`** - Horizontal stacked bar (Q1, median, Q3)
   - Shows spread of values
   - Explanation: "Wider = more variability, Narrower = more consistent"

3. **`SignificanceMatrix`** - Pairwise comparison table
   - Columns: Model 1, Model 2, p-value, Effect Size, Significant?
   - Color-coded effect sizes (negligible/small/medium/large)
   - Explanation of p-values and Cohen's d thresholds

#### `/app/(public)/insights/page.tsx` (+150 lines)
Added new "Statistical Rigor" section:
- ANOVA summary card with F-statistic, p-value, η², df
- Side-by-side: Confidence Interval Chart + Distribution Box Plot
- Significance Matrix for pairwise comparisons
- Grid of Descriptive Stats Cards (one per model)
- Plain-language interpretation throughout
- Currently shows valence metric as example

**Design Philosophy**: "No stats PhD required"
- Every metric has tooltip
- Collapsible "How to read this" sections
- Interpretation text for every visualization
- Educational, not just displaying numbers

---

## Files Changed

### New Files Created:
- `utils/statistics.ts` (12 functions, all tested)
- `utils/statistics.test.ts` (12 tests, all passing)
- `scripts/compute-descriptive-stats.ts` (per-batch descriptive stats)
- `scripts/run-statistical-tests.ts` (per-batch ANOVA + pairwise t-tests)
- `convex/statistics.ts` (queries/mutations for statistical data)
- `components/patterns/statistical-insight.tsx` (educational components)
- `components/patterns/statistical-charts.tsx` (Recharts visualizations)
- `components/ui/tooltip.tsx` (added via shadcn CLI)

### Modified Files:
- `convex/prompts.ts` - JSON template system
- `convex/artistAdapters/openrouter.ts` - JSON parsing + response_format
- `convex/artistAdapters/anthropic.ts` - JSON parsing
- `convex/artistAdapters/google.ts` - JSON parsing
- `convex/artistAdapters/openai.ts` - JSON parsing
- `convex/schema.ts` - 3 new statistical tables
- `app/(public)/insights/page.tsx` - +150 lines for Statistical Rigor section
- `package.json` - Already had recharts installed

---

## Test Coverage

**Current Status** (as of last check):
- 82 tests passing
- Overall coverage: 9.4%
- **Analysis scripts**: 94.67% coverage ✅
  - sentiment.test.ts: 96.36%
  - colors.test.ts: 94.67%
  - materiality.test.ts: 100%
  - statistics.test.ts: 12 tests passing

---

## Errors Fixed

1. **NaN in ANOVA** - Division by zero when all values identical
   - Fix: `fStatistic = msWithin === 0 ? 0 : msBetween / msWithin`

2. **TypeScript: `string | null` vs `v.optional(v.string())`**
   - Fix: Changed all mutation args from `v.union(v.string(), v.null())` to `v.optional(v.string())`

3. **Lint warnings** - Unused variables/imports
   - Fix: Removed unused imports, prefixed with `_` for intentionally unused

---

## Prompt Versions

All prompts now use JSON format:

- **V2 Paint Feelings** - "What are you feeling? Paint that feeling."
- **V3 Introspective** - Philosophical self-reflection
- **V4 Self-Portrait** ⭐ (default) - "A portrait of YOU, not humanity"
- **V5 Paint Your Feelings** - Immediate emotional expression
- **V6 Your Essence** - "If you were a painting, what painting would you be?"

**Hypothesis**: Self-referential prompts should:
- Reduce intra-model variance (more consistent responses per model)
- Increase inter-model differences (clearer model fingerprints)
- Make statistical analysis more effective

---

## Next Steps (Pending)

From todo list:
1. **Run Phase 3B validation batch** (20× per model)
2. **Generate comprehensive statistical report** with all tests and findings
3. **Document methodology** for white paper

---

## Key Technical Decisions

1. **Per-batch analysis only** - All statistical tests scoped to `runGroupId`
   - Rationale: Avoid confounding variables from cross-batch comparisons
   - Scripts require runGroupId parameter

2. **Benjamini-Hochberg correction** - For multiple comparisons
   - Rationale: Controls false discovery rate better than Bonferroni for exploratory analysis

3. **Welch's t-test** - For pairwise comparisons
   - Rationale: Doesn't assume equal variances between models

4. **Educational tooltips everywhere**
   - Rationale: User requested "no stats PhD required" design
   - Every metric has plain-language explanation

5. **Recharts for all visualizations**
   - Rationale: Already installed, React-native, consistent styling

---

## Build Status

✅ All tests passing (82/82)
✅ Lint clean
✅ Build successful
✅ Dev server running on http://localhost:3001

---

## Git Commits Made

1. "Add JSON-based prompt system with createPrompt() template"
2. "Update all artist adapters to parse JSON responses"
3. "Add statistical analysis schema with 3 new tables"
4. "Implement statistics library with TDD (12 tests passing)"
5. "Create compute-descriptive-stats.ts script"
6. "Create run-statistical-tests.ts script with ANOVA + pairwise t-tests"
7. "Add Convex queries/mutations for statistical data"
8. "Add statistical visualization components with educational tooltips"
9. "Integrate statistical analysis into /insights page"
10. "Fix TypeScript errors in statistics mutations (v.optional vs v.union)"

---

## Usage Example

```bash
# 1. Run a batch with the new default prompt (V4 Self-Portrait)
# (via UI at /comparisons/new)

# 2. Compute descriptive statistics
npx tsx scripts/compute-descriptive-stats.ts <runGroupId>

# 3. Run statistical tests
npx tsx scripts/run-statistical-tests.ts <runGroupId>

# 4. View results at /insights
# - Statistical Rigor section shows ANOVA, charts, pairwise comparisons
```

---

## Architecture Notes

**Statistical Analysis Pipeline**:
```
Batch Complete
    ↓
Sentiment/Color/Materiality analysis (automatic)
    ↓
compute-descriptive-stats.ts (manual, per-batch)
    → Saves to model_statistics table
    ↓
run-statistical-tests.ts (manual, per-batch)
    → Runs ANOVA
    → If significant: Pairwise t-tests + BH correction
    → Saves to statistical_comparisons + anova_results
    ↓
/insights page queries statistical data
    → Displays charts with educational tooltips
```

**Data Flow**:
- Runs → Sentiment/Color/Materiality → Raw metrics
- Scripts → Statistics library → Statistical metadata
- UI → Convex queries → Recharts visualizations

---

## Design Philosophy

**Educational First**:
- Every metric has a tooltip explaining what it means
- Every chart has a "How to read this" explanation
- Plain-language interpretations throughout
- No jargon without explanation

**Example tooltip**:
> **95% Confidence Interval**: We're 95% confident the true population mean falls in this range. Narrower intervals = more precise estimates. Need larger n for precision.

**Example interpretation**:
> ✓ Models differ significantly on valence (p < 0.05). See pairwise comparisons below.

This makes statistical rigor accessible to non-statisticians while maintaining scientific accuracy.

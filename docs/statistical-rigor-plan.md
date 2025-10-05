# Statistical Rigor Enhancement Plan for Phase 3

## 🎯 Goal

Transform Phase 3 analytics from "interesting observations" to "statistically defensible findings" by implementing proper statistical analysis with distributions, confidence intervals, significance testing, and effect sizes.

---

## 📊 Current State Assessment

### What We Have ✅
- Sentiment analysis (emotions, valence, arousal, abstractness)
- Color analysis (palettes, temperature, saturation, harmony)
- Materiality analysis (concrete vs speculative, impossibility score)
- Basic aggregation (averages per model)
- Simple visualizations showing means

### What We're Missing ❌
- **Distributions**: No visualization of spread/variance
- **Confidence intervals**: No uncertainty quantification
- **Significance testing**: No determination if differences are meaningful
- **Effect sizes**: No measure of practical significance
- **Sample size planning**: No power analysis
- **Multiple comparison correction**: Risk of false positives
- **Assumption validation**: No checking of normality, homoscedasticity

---

## 🧪 Statistical Framework

### Core Statistical Concepts to Implement

#### 1. Descriptive Statistics (Beyond Means)
- **Mean** - central tendency
- **Median** - robust central tendency
- **Standard deviation** - spread
- **Quartiles (Q1, Q3)** - distribution shape
- **Interquartile range (IQR)** - robust spread
- **Min/Max** - range
- **Skewness** - distribution asymmetry
- **Kurtosis** - tail heaviness

#### 2. Inferential Statistics
- **Confidence intervals** (95% CI) - uncertainty bounds
- **ANOVA** - comparing means across multiple groups
- **Post-hoc tests** (Tukey HSD) - pairwise comparisons after ANOVA
- **t-tests** - comparing two groups
- **Cohen's d** - effect size for mean differences
- **Bootstrapping** - non-parametric confidence intervals

#### 3. Sample Size & Power
- **Power analysis** - determine required sample size
- **Target power**: 0.80 (80% chance to detect real effect)
- **Alpha level**: 0.05 (5% false positive rate)
- **Minimum detectable effect size**: Cohen's d = 0.5 (medium effect)

#### 4. Multiple Comparison Correction
- **Bonferroni correction** - conservative adjustment
- **Benjamini-Hochberg** - false discovery rate control
- **Problem**: Testing many hypotheses inflates false positive rate

---

## 🏗️ Implementation Architecture

### Data Layer

#### Extended Schema for Statistical Metadata

```typescript
// Add to existing analysis tables
interface StatisticalMetadata {
  sampleSize: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  confidenceInterval95: [number, number];
  computedAt: number;
}

// New table for aggregated statistics per model
model_statistics: defineTable({
  artistSlug: v.string(),
  metric: v.string(), // e.g., "sentiment.valence", "color.temperature"
  statistics: v.object({
    sampleSize: v.number(),
    mean: v.number(),
    median: v.number(),
    stdDev: v.number(),
    q1: v.number(),
    q3: v.number(),
    min: v.number(),
    max: v.number(),
    skewness: v.number(),
    kurtosis: v.number(),
    confidenceInterval95: v.array(v.number()),
  }),
  computedAt: v.number(),
})
  .index("by_artist_metric", ["artistSlug", "metric"]);

// New table for pairwise comparisons
statistical_comparisons: defineTable({
  metric: v.string(),
  artistA: v.string(),
  artistB: v.string(),
  testType: v.string(), // "t-test", "mann-whitney", etc.
  testStatistic: v.number(),
  pValue: v.number(),
  adjustedPValue: v.number(), // after multiple comparison correction
  effectSize: v.number(), // Cohen's d or similar
  significant: v.boolean(), // p < 0.05 after correction
  confidenceInterval: v.array(v.number()),
  interpretation: v.string(), // "small", "medium", "large" effect
  computedAt: v.number(),
})
  .index("by_metric", ["metric"])
  .index("by_artists", ["artistA", "artistB"]);

// New table for ANOVA results
anova_results: defineTable({
  metric: v.string(),
  testStatistic: v.number(), // F-statistic
  pValue: v.number(),
  degreesOfFreedom: v.array(v.number()), // [between, within]
  significant: v.boolean(),
  etaSquared: v.number(), // effect size
  interpretation: v.string(),
  postHocTests: v.array(v.object({
    artistA: v.string(),
    artistB: v.string(),
    pValue: v.number(),
    significant: v.boolean(),
  })),
  computedAt: v.number(),
})
  .index("by_metric", ["metric"]);
```

### Analysis Scripts

#### New Scripts to Create

```bash
scripts/
  statistical/
    compute-descriptive-stats.ts    # Calculate full descriptive stats
    compute-confidence-intervals.ts # Bootstrap CIs for all metrics
    run-anova-analysis.ts          # Cross-model ANOVAs
    run-pairwise-tests.ts          # Post-hoc comparisons
    calculate-effect-sizes.ts       # Cohen's d, eta-squared
    validate-assumptions.ts         # Test normality, homoscedasticity
    correct-multiple-comparisons.ts # Bonferroni/BH adjustment
    power-analysis.ts              # Sample size recommendations
    generate-statistical-report.ts  # Comprehensive findings report
```

### Convex Queries

#### New Analytics Queries

```typescript
// convex/statistics.ts

export const getDescriptiveStats = query(
  async ({ db }, { artistSlug, metric }: { artistSlug: string; metric: string }) => {
    // Return full descriptive statistics for a model on a metric
    return await db
      .query("model_statistics")
      .withIndex("by_artist_metric", (q) =>
        q.eq("artistSlug", artistSlug).eq("metric", metric)
      )
      .first();
  }
);

export const getDistribution = query(
  async ({ db }, { artistSlug, metric }: { artistSlug: string; metric: string }) => {
    // Return raw values for distribution visualization
    const runs = await getRuns(db, artistSlug);
    return runs.map(extractMetric(metric));
  }
);

export const getPairwiseComparison = query(
  async (
    { db },
    {
      metric,
      artistA,
      artistB,
    }: { metric: string; artistA: string; artistB: string }
  ) => {
    return await db
      .query("statistical_comparisons")
      .withIndex("by_artists", (q) => q.eq("artistA", artistA).eq("artistB", artistB))
      .filter((q) => q.eq(q.field("metric"), metric))
      .first();
  }
);

export const getANOVAResults = query(
  async ({ db }, { metric }: { metric: string }) => {
    return await db
      .query("anova_results")
      .withIndex("by_metric", (q) => q.eq("metric", metric))
      .first();
  }
);

export const getAllComparisonsForMetric = query(
  async ({ db }, { metric }: { metric: string }) => {
    return await db
      .query("statistical_comparisons")
      .withIndex("by_metric", (q) => q.eq("metric", metric))
      .collect();
  }
);
```

### Visualization Components

#### New Chart Components

```typescript
// components/statistical/
  DistributionPlot.tsx        // Box plot or violin plot showing distributions
  ConfidenceIntervalChart.tsx // Error bars or CI bands
  SignificanceMatrix.tsx      // Heatmap of p-values between models
  EffectSizeChart.tsx         // Visualization of Cohen's d
  QQPlot.tsx                  // Diagnostic for normality assumption
  PowerCurve.tsx              // Sample size vs statistical power
```

---

## 📐 Statistical Analysis Workflow

### Phase 3B Workflow

```
1. Collect Data (20× per model)
   ↓
2. Compute Descriptive Statistics
   - Mean, SD, quartiles for each model×metric
   - Store in model_statistics table
   ↓
3. Validate Assumptions
   - Test normality (Shapiro-Wilk)
   - Test homoscedasticity (Levene's test)
   - Choose parametric vs non-parametric tests
   ↓
4. Run ANOVAs
   - One ANOVA per metric (sentiment.valence, color.temperature, etc.)
   - Store F-statistic, p-value, eta-squared
   ↓
5. Run Post-Hoc Tests (if ANOVA significant)
   - Tukey HSD for all pairwise comparisons
   - Bonferroni correction for multiple comparisons
   ↓
6. Calculate Effect Sizes
   - Cohen's d for all significant pairwise comparisons
   - Interpret: small (0.2), medium (0.5), large (0.8)
   ↓
7. Generate Statistical Report
   - Formatted findings with interpretation
   - Export for white paper
   ↓
8. Update Visualizations
   - Show distributions, CIs, significance markers
```

### Example Output

```json
{
  "metric": "sentiment.valence",
  "anova": {
    "fStatistic": 12.34,
    "pValue": 0.0001,
    "degreesOfFreedom": [5, 114],
    "significant": true,
    "etaSquared": 0.35,
    "interpretation": "Large effect - models differ substantially in valence"
  },
  "pairwiseComparisons": [
    {
      "artistA": "claude-sonnet-4.5",
      "artistB": "gpt-5-mini",
      "meanDifference": 0.23,
      "tStatistic": 3.45,
      "pValue": 0.0008,
      "adjustedPValue": 0.012,
      "significant": true,
      "cohensD": 0.72,
      "interpretation": "Medium-large effect: Claude significantly more positive",
      "confidenceInterval95": [0.11, 0.35]
    }
  ],
  "descriptiveStats": {
    "claude-sonnet-4.5": {
      "n": 20,
      "mean": 0.68,
      "median": 0.71,
      "sd": 0.14,
      "ci95": [0.61, 0.75]
    },
    "gpt-5-mini": {
      "n": 20,
      "mean": 0.45,
      "median": 0.43,
      "sd": 0.16,
      "ci95": [0.37, 0.53]
    }
  }
}
```

---

## 🎨 Visualization Enhancements

### Current vs Enhanced Visualizations

#### Sentiment Comparison
**Before:** Bar chart with mean values
**After:**
- Box plots showing Q1/median/Q3/outliers
- Error bars showing 95% CI
- Significance stars (* p<0.05, ** p<0.01, *** p<0.001)
- Violin plots showing full distribution shape

#### Color Temperature
**Before:** Single average temperature per model
**After:**
- Distribution plot with overlaid density curves
- Confidence bands around means
- Pairwise comparison matrix showing which models differ significantly
- Effect size visualization (Cohen's d heatmap)

#### Materiality
**Before:** Average impossibility score
**After:**
- Cumulative distribution functions (CDFs) overlaid
- Quantile-quantile plots for distribution comparison
- Bootstrap confidence intervals for differences
- Statistical power curve for sample size justification

### Example Enhanced Visualization Component

```typescript
// components/statistical/DistributionComparison.tsx

interface DistributionComparisonProps {
  metric: string; // e.g., "sentiment.valence"
  models: string[];
  data: {
    [model: string]: {
      values: number[];
      stats: DescriptiveStats;
      comparisons: PairwiseComparison[];
    };
  };
}

export function DistributionComparison({ metric, models, data }: DistributionComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{metric} Distribution Comparison</CardTitle>
        <ANOVASummary metric={metric} />
      </CardHeader>
      <CardContent>
        {/* Box plots with confidence intervals */}
        <BoxPlotChart data={data} />

        {/* Pairwise comparison matrix */}
        <SignificanceMatrix comparisons={getAllComparisons(data)} />

        {/* Effect size heatmap */}
        <EffectSizeHeatmap comparisons={getAllComparisons(data)} />

        {/* Interpretation */}
        <StatisticalInterpretation metric={metric} data={data} />
      </CardContent>
    </Card>
  );
}
```

---

## 📦 Dependencies

### NPM Packages to Add

```json
{
  "simple-statistics": "^7.8.3",
  "jstat": "^1.9.6",
  "@stdlib/stats": "^0.2.2",
  "d3-random": "^3.0.1",
  "d3-scale": "^4.0.2"
}
```

### Statistical Functions Needed

```typescript
// utils/statistics.ts

export function descriptiveStats(values: number[]): DescriptiveStats;
export function confidenceInterval(values: number[], confidence: number): [number, number];
export function tTest(groupA: number[], groupB: number[]): TTestResult;
export function anova(groups: number[][]): ANOVAResult;
export function tukeyHSD(groups: number[][], labels: string[]): PostHocResult[];
export function cohensD(groupA: number[], groupB: number[]): number;
export function bonferroniCorrection(pValues: number[]): number[];
export function benjaminiHochberg(pValues: number[]): number[];
export function testNormality(values: number[]): NormalityTest;
export function testHomoscedasticity(groups: number[][]): HomoscedasticityTest;
export function bootstrapCI(
  values: number[],
  statistic: (v: number[]) => number,
  iterations: number,
  confidence: number
): [number, number];
export function powerAnalysis(
  effectSize: number,
  alpha: number,
  power: number
): number; // returns required sample size
```

---

## 🗓️ Implementation Timeline

### Week 1: Statistical Infrastructure
- [ ] Add statistical metadata to schema
- [ ] Create `utils/statistics.ts` with core functions
- [ ] Write `compute-descriptive-stats.ts` script
- [ ] Test on existing Phase 3A data

### Week 2: Statistical Testing
- [ ] Implement ANOVA pipeline
- [ ] Implement pairwise t-tests with corrections
- [ ] Calculate effect sizes
- [ ] Validate assumptions (normality, etc.)

### Week 3: Data Collection & Analysis
- [ ] Run Phase 3B batch (20× per model)
- [ ] Compute all statistical comparisons
- [ ] Store results in new tables
- [ ] Generate statistical report

### Week 4: Visualization & Documentation
- [ ] Build enhanced visualization components
- [ ] Update `/insights` page with distributions/CIs
- [ ] Create statistical findings document
- [ ] Update Phase 3 docs with methodology

---

## 🎯 Success Criteria

### Technical Deliverables
- [ ] Full descriptive statistics for all metrics
- [ ] 95% confidence intervals computed and displayed
- [ ] ANOVA results for all cross-model comparisons
- [ ] Effect sizes (Cohen's d) for all significant differences
- [ ] Multiple comparison correction applied
- [ ] Distribution visualizations (box plots, violin plots)
- [ ] Significance testing integrated into insights page

### Research Deliverables
- [ ] Statistical methodology section in white paper
- [ ] Assumptions validation documented
- [ ] Power analysis justifying sample sizes
- [ ] Effect size interpretations for all findings
- [ ] Limitations section addressing statistical constraints

### Quality Gates
- Minimum 20 samples per model for validation claims
- p-values < 0.05 after Bonferroni correction
- Effect sizes > 0.5 for "practically significant" claims
- Confidence intervals displayed on all point estimates
- Assumptions tested and documented

---

## 📚 Statistical Reporting Template

### Findings Document Structure

```markdown
## Finding: [Model X has higher valence than Model Y]

### Descriptive Statistics
- Model X: M = 0.68, SD = 0.14, 95% CI [0.61, 0.75], n = 20
- Model Y: M = 0.45, SD = 0.16, 95% CI [0.37, 0.53], n = 20

### Statistical Test
- Independent samples t-test: t(38) = 3.45, p = 0.0008 (two-tailed)
- Adjusted p-value (Bonferroni): p = 0.012
- Effect size: Cohen's d = 0.72 (medium-large effect)

### Interpretation
Model X shows significantly higher positive valence in artist statements
compared to Model Y. The effect size is medium-to-large (d = 0.72),
indicating a practically meaningful difference. This difference remains
significant after correcting for multiple comparisons (p = 0.012).

### Assumptions
- Normality: Shapiro-Wilk test non-significant for both groups (W = 0.94, p = 0.23)
- Homogeneity of variance: Levene's test non-significant (F = 0.45, p = 0.51)
- Independence: Each run is independent

### Visualization
[Box plot showing distributions with CI error bars]
```

---

## ⚠️ Limitations to Document

1. **Sample Size** - Even 20× may be underpowered for small effects
2. **Model Confounds** - Model updates during study could shift results
3. **Brush Effects** - Visual metrics conflate Artist and Brush
4. **Prompt Specificity** - Findings may not generalize to other prompts
5. **Multiple Testing** - Many comparisons increase false positive risk
6. **Assumption Violations** - Some metrics may not meet parametric assumptions
7. **Generalizability** - Findings specific to tested models and prompt version

---

## 🔮 Future Enhancements

### Beyond Phase 3B
- **Bayesian analysis** - Posterior distributions instead of p-values
- **Mixed-effects models** - Account for nested structure (runs within models)
- **Time series analysis** - Track how fingerprints evolve
- **Cluster analysis** - Data-driven grouping of similar models
- **Dimensionality reduction** - PCA/t-SNE for high-dimensional comparison
- **Cross-validation** - Train/test split for predictive claims

---

## 📖 References

### Statistical Methods
- Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences
- Tukey, J. W. (1977). Exploratory Data Analysis
- Efron, B. (1979). Bootstrap Methods: Another Look at the Jackknife

### Visualization
- Tufte, E. R. (2001). The Visual Display of Quantitative Information
- Few, S. (2012). Show Me the Numbers: Designing Tables and Graphs

### Research Design
- Field, A. (2013). Discovering Statistics Using IBM SPSS Statistics
- Cumming, G. (2013). Understanding The New Statistics: Effect Sizes, CIs, and Meta-Analysis

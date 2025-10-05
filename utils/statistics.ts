/**
 * Statistical utility functions for Phase 3 analysis
 * Uses jStat library for exact statistical calculations
 */

import jStat from "jstat";

// ============================================================================
// Descriptive Statistics
// ============================================================================

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function quartiles(values: number[]): {
  q1: number;
  q2: number;
  q3: number;
} {
  if (values.length === 0) return { q1: 0, q2: 0, q3: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const q2 = median(sorted);

  // Split data at median
  const mid = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf =
    sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);

  const q1 = median(lowerHalf);
  const q3 = median(upperHalf);

  return { q1, q2, q3 };
}

export function confidenceInterval95(values: number[]): {
  lower: number;
  upper: number;
} {
  if (values.length === 0) return { lower: 0, upper: 0 };

  const avg = mean(values);
  const stdDev = standardDeviation(values);
  const n = values.length;

  // t-value for 95% CI (approximation for large n, exact for small n would use t-table)
  // Using 1.96 for large samples (z-score), for small samples should use t-distribution
  const tValue = n > 30 ? 1.96 : getTValue(n - 1, 0.05);
  const marginOfError = tValue * (stdDev / Math.sqrt(n));

  return {
    lower: avg - marginOfError,
    upper: avg + marginOfError,
  };
}

// Approximate t-values for small samples (df, alpha=0.05 two-tailed)
function getTValue(df: number, _alpha: number): number {
  // Simplified t-table for 95% CI
  const tTable: Record<number, number> = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    15: 2.131,
    20: 2.086,
    25: 2.06,
    30: 2.042,
  };

  if (df in tTable) return tTable[df];
  if (df > 30) return 1.96; // Approximate with z-score
  // Linear interpolation for in-between values
  const keys = Object.keys(tTable)
    .map(Number)
    .sort((a, b) => a - b);
  const lower = keys.filter((k) => k < df).pop() || 1;
  const _upper = keys.filter((k) => k > df)[0] || 30;
  return tTable[lower]; // Conservative estimate
}

// ============================================================================
// Inferential Statistics - t-tests
// ============================================================================

export interface TTestResult {
  tStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
}

export function tTest(group1: number[], group2: number[]): TTestResult {
  const n1 = group1.length;
  const n2 = group2.length;
  const mean1 = mean(group1);
  const mean2 = mean(group2);
  const var1 = Math.pow(standardDeviation(group1), 2);
  const var2 = Math.pow(standardDeviation(group2), 2);

  // Pooled variance
  const pooledVariance =
    ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);

  // t-statistic
  const tStatistic =
    (mean1 - mean2) / Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));

  const df = n1 + n2 - 2;
  const pValue = tTestPValue(Math.abs(tStatistic), df);

  return {
    tStatistic,
    pValue,
    degreesOfFreedom: df,
  };
}

export function welchTTest(group1: number[], group2: number[]): TTestResult {
  const n1 = group1.length;
  const n2 = group2.length;
  const mean1 = mean(group1);
  const mean2 = mean(group2);
  const var1 = Math.pow(standardDeviation(group1), 2);
  const var2 = Math.pow(standardDeviation(group2), 2);

  // Welch's t-statistic
  const tStatistic = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

  // Welch-Satterthwaite degrees of freedom
  const df =
    Math.pow(var1 / n1 + var2 / n2, 2) /
    (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

  const pValue = tTestPValue(Math.abs(tStatistic), df);

  return {
    tStatistic,
    pValue,
    degreesOfFreedom: df,
  };
}

// Exact p-value from t-statistic (two-tailed) using jStat
function tTestPValue(tAbs: number, df: number): number {
  // Use jStat for exact t-distribution CDF
  // P(|T| > t) = 2 * P(T > t) for two-tailed test
  const pOneTailed = 1 - jStat.studentt.cdf(tAbs, df);
  return 2 * pOneTailed;
}

export function cohensD(group1: number[], group2: number[]): number {
  const mean1 = mean(group1);
  const mean2 = mean(group2);
  const n1 = group1.length;
  const n2 = group2.length;
  const var1 = Math.pow(standardDeviation(group1), 2);
  const var2 = Math.pow(standardDeviation(group2), 2);

  // Pooled standard deviation
  const pooledStdDev = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));

  return (mean1 - mean2) / pooledStdDev;
}

// ============================================================================
// Inferential Statistics - ANOVA
// ============================================================================

export interface ANOVAResult {
  fStatistic: number;
  pValue: number;
  dfBetween: number;
  dfWithin: number;
  etaSquared: number;
}

export function oneWayANOVA(groups: number[][]): ANOVAResult {
  // Flatten all data
  const allData = groups.flat();
  const grandMean = mean(allData);
  const k = groups.length; // number of groups
  const n = allData.length; // total sample size

  // Between-group sum of squares
  let ssBetween = 0;
  for (const group of groups) {
    const groupMean = mean(group);
    ssBetween += group.length * Math.pow(groupMean - grandMean, 2);
  }

  // Within-group sum of squares
  let ssWithin = 0;
  for (const group of groups) {
    const groupMean = mean(group);
    for (const value of group) {
      ssWithin += Math.pow(value - groupMean, 2);
    }
  }

  const dfBetween = k - 1;
  const dfWithin = n - k;

  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;

  // Handle case where all values are identical (msWithin = 0)
  const fStatistic = msWithin === 0 ? 0 : msBetween / msWithin;

  // Effect size (eta-squared)
  const ssTotal = ssBetween + ssWithin;
  const etaSquared = ssBetween / ssTotal;

  // Exact p-value using F-distribution from jStat
  const pValue = fTestPValue(fStatistic, dfBetween, dfWithin);

  return {
    fStatistic,
    pValue,
    dfBetween,
    dfWithin,
    etaSquared,
  };
}

// Exact p-value from F-statistic using jStat
function fTestPValue(f: number, df1: number, df2: number): number {
  // Use jStat for exact F-distribution CDF
  // P(F > f) = 1 - CDF(f)
  if (f < 0.001) return 1; // Handle edge case
  return 1 - jStat.centralF.cdf(f, df1, df2);
}

// ============================================================================
// Multiple Comparison Correction
// ============================================================================

export function bonferroniCorrection(
  pValues: number[],
  alpha: number
): boolean[] {
  const adjustedAlpha = alpha / pValues.length;
  return pValues.map((p) => p <= adjustedAlpha);
}

export function benjaminiHochberg(
  pValues: number[],
  alpha: number
): boolean[] {
  // Sort p-values with their original indices
  const indexed = pValues.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => a.p - b.p);

  const m = pValues.length;
  const significant = new Array(m).fill(false);

  // Find largest i where P(i) <= (i/m) * alpha
  let maxI = -1;
  for (let i = 0; i < m; i++) {
    if (indexed[i].p <= ((i + 1) / m) * alpha) {
      maxI = i;
    }
  }

  // Mark all p-values up to maxI as significant
  for (let i = 0; i <= maxI; i++) {
    significant[indexed[i].i] = true;
  }

  return significant;
}

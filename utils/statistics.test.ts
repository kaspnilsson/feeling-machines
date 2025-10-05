import { describe, it, expect } from "vitest";
import {
  mean,
  standardDeviation,
  median,
  quartiles,
  confidenceInterval95,
  tTest,
  welchTTest,
  cohensD,
  oneWayANOVA,
  bonferroniCorrection,
  benjaminiHochberg,
} from "./statistics";

describe("Descriptive Statistics", () => {
  it("calculates mean correctly", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10, 20, 30])).toBe(20);
    expect(mean([1])).toBe(1);
  });

  it("calculates standard deviation correctly", () => {
    // Population stddev of [2,4,4,4,5,5,7,9]
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    const result = standardDeviation(data);
    expect(result).toBeCloseTo(2.0, 1);
  });

  it("calculates median correctly", () => {
    expect(median([1, 2, 3, 4, 5])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([5, 1, 3, 2, 4])).toBe(3);
  });

  it("calculates quartiles correctly", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const { q1, q2, q3 } = quartiles(data);
    expect(q2).toBe(5); // median
    expect(q1).toBeCloseTo(2.5, 1);
    expect(q3).toBeCloseTo(7.5, 1);
  });

  it("calculates 95% confidence interval correctly", () => {
    const data = [10, 12, 14, 16, 18, 20];
    const { lower, upper } = confidenceInterval95(data);

    // Mean is 15, should have CI around it
    expect(lower).toBeLessThan(15);
    expect(upper).toBeGreaterThan(15);
    expect(upper - lower).toBeGreaterThan(0);
  });
});

describe("Inferential Statistics - t-tests", () => {
  it("performs independent samples t-test", () => {
    const group1 = [1, 2, 3, 4, 5];
    const group2 = [6, 7, 8, 9, 10];

    const result = tTest(group1, group2);

    expect(result.tStatistic).toBeLessThan(0); // group1 < group2
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.pValue).toBeLessThan(1);
    expect(result.degreesOfFreedom).toBe(8);
  });

  it("performs Welch's t-test for unequal variances", () => {
    const group1 = [1, 2, 3];
    const group2 = [10, 20, 30, 40, 50];

    const result = welchTTest(group1, group2);

    expect(result.tStatistic).toBeLessThan(0);
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.degreesOfFreedom).toBeGreaterThan(0);
  });

  it("calculates Cohen's d effect size", () => {
    const group1 = [1, 2, 3, 4, 5];
    const group2 = [6, 7, 8, 9, 10];

    const d = cohensD(group1, group2);

    // Large effect expected
    expect(Math.abs(d)).toBeGreaterThan(1);
  });
});

describe("Inferential Statistics - ANOVA", () => {
  it("performs one-way ANOVA", () => {
    const groups = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];

    const result = oneWayANOVA(groups);

    expect(result.fStatistic).toBeGreaterThan(0);
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.pValue).toBeLessThan(1);
    expect(result.dfBetween).toBe(2); // 3 groups - 1
    expect(result.dfWithin).toBe(6); // 9 total - 3 groups
    expect(result.etaSquared).toBeGreaterThan(0);
    expect(result.etaSquared).toBeLessThan(1);
  });

  it("returns high p-value for identical groups", () => {
    const groups = [
      [5, 5, 5],
      [5, 5, 5],
      [5, 5, 5],
    ];

    const result = oneWayANOVA(groups);

    expect(result.fStatistic).toBeCloseTo(0, 5);
    expect(result.pValue).toBeGreaterThan(0.9);
  });
});

describe("Multiple Comparison Correction", () => {
  it("applies Bonferroni correction", () => {
    const pValues = [0.01, 0.02, 0.03, 0.04, 0.05];
    const corrected = bonferroniCorrection(pValues, 0.05);

    expect(corrected.length).toBe(5);
    // With 5 tests, alpha becomes 0.05/5 = 0.01
    expect(corrected[0]).toBe(true); // 0.01 <= 0.01
    expect(corrected[1]).toBe(false); // 0.02 > 0.01
    expect(corrected[4]).toBe(false); // 0.05 > 0.01
  });

  it("applies Benjamini-Hochberg correction", () => {
    const pValues = [0.001, 0.008, 0.02, 0.04, 0.1];
    const corrected = benjaminiHochberg(pValues, 0.05);

    expect(corrected.length).toBe(5);
    // BH is less conservative than Bonferroni
    expect(corrected[0]).toBe(true);
    expect(corrected[1]).toBe(true);
  });
});

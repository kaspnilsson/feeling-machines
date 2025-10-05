"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticalExplanation } from "./statistical-insight";

interface ConfidenceIntervalChartProps {
  data: {
    artistSlug: string;
    mean: number;
    ci95Lower: number;
    ci95Upper: number;
  }[];
  metric: string;
}

/**
 * Bar chart with error bars showing 95% confidence intervals
 */
export function ConfidenceIntervalChart({
  data,
  metric,
}: ConfidenceIntervalChartProps) {
  const chartData = data.map((d) => ({
    name: d.artistSlug,
    mean: d.mean,
    errorRange: [d.mean - d.ci95Lower, d.ci95Upper - d.mean],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{metric} – Confidence Intervals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Bar dataKey="mean" fill="hsl(var(--primary))" name="Mean">
              <ErrorBar
                dataKey="errorRange"
                width={4}
                strokeWidth={2}
                stroke="hsl(var(--primary))"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <StatisticalExplanation title="How to read this chart">
          <p>
            Each bar shows the <strong>average (mean)</strong> value for that model.
          </p>
          <p>
            The <strong>error bars</strong> (lines extending above/below) show the{" "}
            <strong>95% confidence interval</strong>. We&apos;re 95% confident the
            true average falls somewhere in that range.
          </p>
          <p>
            <strong>Key insight:</strong> If the error bars of two models don&apos;t
            overlap, they&apos;re likely genuinely different (not just random chance).
          </p>
        </StatisticalExplanation>
      </CardContent>
    </Card>
  );
}

interface BoxPlotData {
  artistSlug: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

/**
 * Visual box plot showing distribution
 * Note: Recharts doesn't have built-in box plots, so we use a custom implementation
 */
export function DistributionBoxPlot({
  data,
  metric,
}: {
  data: BoxPlotData[];
  metric: string;
}) {
  // Transform data for visualization
  const chartData = data.map((d, idx) => ({
    name: d.artistSlug,
    index: idx,
    range: [d.min, d.max],
    q1: d.q1,
    median: d.median,
    q3: d.q3,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{metric} – Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs"
              tick={{ fontSize: 12 }}
              width={120}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number) => value.toFixed(3)}
            />
            <Bar dataKey="q1" stackId="box" fill="hsl(var(--muted))" name="Q1-Q2" />
            <Bar
              dataKey={(d) => d.median - d.q1}
              stackId="box"
              fill="hsl(var(--primary))"
              name="Q2 (Median)"
            />
            <Bar
              dataKey={(d) => d.q3 - d.median}
              stackId="box"
              fill="hsl(var(--muted))"
              name="Q3-Q2"
            />
          </BarChart>
        </ResponsiveContainer>

        <StatisticalExplanation title="How to read this chart">
          <p>
            Each bar is divided into segments showing the distribution of values:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Left 25%:</strong> Q1 (first quartile)
            </li>
            <li>
              <strong>Middle line:</strong> Median (50th percentile)
            </li>
            <li>
              <strong>Right 25%:</strong> Q3 (third quartile)
            </li>
          </ul>
          <p className="mt-2">
            <strong>Wider bars</strong> = more variability in the model&apos;s output.{" "}
            <strong>Narrower bars</strong> = more consistent behavior.
          </p>
        </StatisticalExplanation>
      </CardContent>
    </Card>
  );
}

interface SignificanceMatrixProps {
  comparisons: {
    artist1: string;
    artist2: string;
    pValue: number;
    cohensD: number;
    significant: boolean;
  }[];
  metric: string;
}

/**
 * Heatmap showing which models differ significantly
 */
export function SignificanceMatrix({
  comparisons,
  metric,
}: SignificanceMatrixProps) {
  // Get unique artists
  const artists = Array.from(
    new Set(comparisons.flatMap((c) => [c.artist1, c.artist2]))
  ).sort();

  // Create matrix data
  const matrixData: {
    artist1: string;
    artist2: string;
    pValue: number;
    significant: boolean;
    effectSize: string;
  }[] = [];

  for (const artist1 of artists) {
    for (const artist2 of artists) {
      if (artist1 === artist2) continue;

      const comp = comparisons.find(
        (c) =>
          (c.artist1 === artist1 && c.artist2 === artist2) ||
          (c.artist1 === artist2 && c.artist2 === artist1)
      );

      if (comp) {
        const effectSize =
          Math.abs(comp.cohensD) < 0.2
            ? "negligible"
            : Math.abs(comp.cohensD) < 0.5
              ? "small"
              : Math.abs(comp.cohensD) < 0.8
                ? "medium"
                : "large";

        matrixData.push({
          artist1,
          artist2,
          pValue: comp.pValue,
          significant: comp.significant,
          effectSize,
        });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {metric} – Pairwise Significance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium">Model 1</th>
                <th className="text-left p-2 font-medium">Model 2</th>
                <th className="text-center p-2 font-medium">p-value</th>
                <th className="text-center p-2 font-medium">Effect Size</th>
                <th className="text-center p-2 font-medium">Significant?</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-t ${row.significant ? "bg-primary/5" : ""}`}
                >
                  <td className="p-2 font-mono text-xs">{row.artist1}</td>
                  <td className="p-2 font-mono text-xs">{row.artist2}</td>
                  <td className="p-2 text-center font-mono text-xs">
                    {row.pValue.toFixed(4)}
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        row.effectSize === "large"
                          ? "bg-red-500/20 text-red-700 dark:text-red-300"
                          : row.effectSize === "medium"
                            ? "bg-orange-500/20 text-orange-700 dark:text-orange-300"
                            : row.effectSize === "small"
                              ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                              : "bg-gray-500/20 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {row.effectSize}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {row.significant ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <StatisticalExplanation title="How to read this table">
          <p>
            Each row compares two models on the <strong>{metric}</strong> metric.
          </p>
          <p>
            <strong>p-value:</strong> Probability the difference is due to random
            chance. Lower = more confident the difference is real. Threshold: 0.05.
          </p>
          <p>
            <strong>Effect size (Cohen&apos;s d):</strong> How large the difference
            is:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Negligible: d &lt; 0.2</li>
            <li>Small: 0.2 ≤ d &lt; 0.5</li>
            <li>Medium: 0.5 ≤ d &lt; 0.8</li>
            <li>Large: d ≥ 0.8</li>
          </ul>
          <p className="mt-2">
            <strong>✓ = Significant:</strong> We&apos;re confident this difference is
            real (p &lt; 0.05 after correction for multiple comparisons).
          </p>
        </StatisticalExplanation>
      </CardContent>
    </Card>
  );
}

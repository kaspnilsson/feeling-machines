"use client";

import { HelpCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface StatisticalInsightProps {
  title: string;
  value: string | number;
  tooltip: string;
  interpretation?: string;
  className?: string;
}

/**
 * Display a statistical value with an educational tooltip
 */
export function StatisticalInsight({
  title,
  value,
  tooltip,
  interpretation,
  className = "",
}: StatisticalInsightProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium">{title}:</span>
      <span className="text-sm">{value}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
            {interpretation && (
              <p className="mt-2 text-xs text-muted-foreground italic">
                {interpretation}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

interface StatisticalExplanationProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Collapsible explanation section for statistical concepts
 */
export function StatisticalExplanation({
  title,
  children,
  defaultOpen = false,
}: StatisticalExplanationProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Info className="h-4 w-4" />
        <span>{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 text-sm text-muted-foreground">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface DescriptiveStatsCardProps {
  artistSlug: string;
  metric: string;
  n: number;
  mean: number;
  stdDev: number;
  median: number;
  q1: number;
  q3: number;
  ci95Lower: number;
  ci95Upper: number;
}

/**
 * Display descriptive statistics with educational context
 */
export function DescriptiveStatsCard({
  artistSlug,
  metric,
  n,
  mean,
  stdDev,
  median,
  q1,
  q3,
  ci95Lower,
  ci95Upper,
}: DescriptiveStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {artistSlug} – {metric}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatisticalInsight
            title="n"
            value={n}
            tooltip="Sample size: the number of runs analyzed. Larger samples give more reliable estimates."
            interpretation="Need at least 3-5 for basic stats, 20+ for reliable significance testing."
          />

          <StatisticalInsight
            title="Mean"
            value={mean.toFixed(3)}
            tooltip="Average value across all runs. The central tendency of the data."
            interpretation="Most commonly reported measure of 'typical' value."
          />

          <StatisticalInsight
            title="Median"
            value={median.toFixed(3)}
            tooltip="Middle value when sorted. Less affected by extreme outliers than the mean."
            interpretation="If mean and median differ a lot, the data may be skewed."
          />

          <StatisticalInsight
            title="Std Dev"
            value={stdDev.toFixed(3)}
            tooltip="Standard deviation: how spread out the values are. Higher = more variability."
            interpretation="~68% of values fall within ±1 SD of the mean."
          />

          <StatisticalInsight
            title="Q1 - Q3"
            value={`${q1.toFixed(2)} - ${q3.toFixed(2)}`}
            tooltip="Interquartile range: the middle 50% of values fall in this range."
            interpretation="The 'box' in a box plot shows this range."
          />

          <StatisticalInsight
            title="95% CI"
            value={`[${ci95Lower.toFixed(2)}, ${ci95Upper.toFixed(2)}]`}
            tooltip="95% Confidence Interval: we're 95% confident the true population mean falls in this range."
            interpretation="Narrower intervals = more precise estimates. Need larger n for precision."
          />
        </div>

        <StatisticalExplanation title="What do these numbers mean?">
          <p>
            These statistics summarize the <strong>{n} runs</strong> for{" "}
            <strong>{artistSlug}</strong> on the <strong>{metric}</strong> metric.
          </p>
          <p>
            The <strong>mean ({mean.toFixed(3)})</strong> is the average, but the{" "}
            <strong>standard deviation ({stdDev.toFixed(3)})</strong> tells you how
            consistent the model is. Lower SD = more consistent behavior.
          </p>
          <p>
            The <strong>95% confidence interval</strong> gives you a range where the
            &quot;true&quot; average probably lies. If two models&apos; CIs don&apos;t
            overlap, they&apos;re likely genuinely different.
          </p>
        </StatisticalExplanation>
      </CardContent>
    </Card>
  );
}

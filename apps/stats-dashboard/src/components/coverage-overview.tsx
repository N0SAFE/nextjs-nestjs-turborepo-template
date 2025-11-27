"use client";

import { Badge } from "@repo/ui/components/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Progress } from "@repo/ui/components/shadcn/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/shadcn/chart";
import { CalendarClock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

interface CoverageData {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface CoverageResponse {
  overall: CoverageData;
  packages: unknown[];
  timestamp: string;
}

interface CoverageState {
  metrics: CoverageData;
  timestamp?: string;
}

const chartConfig = {
  statements: {
    label: "Statements",
    color: "hsl(var(--chart-1))",
  },
  branches: {
    label: "Branches",
    color: "hsl(var(--chart-2))",
  },
  functions: {
    label: "Functions",
    color: "hsl(var(--chart-3))",
  },
  lines: {
    label: "Lines",
    color: "hsl(var(--chart-4))",
  },
} as const;

export function CoverageOverview() {
  const [state, setState] = useState<CoverageState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const response = await fetch("/api/coverage");
        if (response.ok) {
          const data = (await response.json()) as CoverageResponse;
          setState({ metrics: data.overall, timestamp: data.timestamp });
        }
      } catch (error) {
        console.error("Failed to fetch coverage data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchCoverage();
  }, []);

  const coverageMetrics = useMemo(
    () =>
      state?.metrics ?? {
        statements: 57.43,
        branches: 45.12,
        functions: 62.34,
        lines: 58.21,
      },
    [state?.metrics]
  );

  const chartData = useMemo(
    () =>
      [
        { segment: "statements", value: coverageMetrics.statements },
        { segment: "branches", value: coverageMetrics.branches },
        { segment: "functions", value: coverageMetrics.functions },
        { segment: "lines", value: coverageMetrics.lines },
      ].map((entry) => ({
        ...entry,
        fill: `var(--color-${entry.segment})`,
      })),
    [coverageMetrics]
  );

  const averageCoverage = useMemo(() => {
    const total =
      coverageMetrics.statements +
      coverageMetrics.branches +
      coverageMetrics.functions +
      coverageMetrics.lines;
    return total / 4;
  }, [coverageMetrics]);

  const coverageStatus = averageCoverage >= 75 ? "Healthy" : averageCoverage >= 60 ? "Watchlist" : "Action required";

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Coverage Overview</CardTitle>
          <CardDescription>Loading coverage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-[220px] animate-pulse rounded-xl bg-muted" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-2 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Coverage Overview</CardTitle>
          <CardDescription>Overall test coverage metrics across the monorepo</CardDescription>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" />
          Updated {state?.timestamp ? new Date(state.timestamp).toLocaleString() : "recently"}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-between gap-6">
          <ChartContainer
            className="mx-auto h-[260px] w-full max-w-[320px]"
            config={chartConfig}
          >
            <RadialBarChart
              data={chartData}
              innerRadius="20%"
              outerRadius="100%"
              startAngle={90}
              endAngle={450}
            >
              <RadialBar minAngle={12} background cornerRadius={24} dataKey="value" />
              <PolarAngleAxis tick={false} type="number" domain={[0, 100]} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-semibold"
              >
                {averageCoverage.toFixed(1)}%
              </text>
              <text
                x="50%"
                y="62%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                Average coverage
              </text>
            </RadialBarChart>
          </ChartContainer>

          <div className="rounded-xl border border-emerald-200/50 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:border-emerald-900/40 dark:text-emerald-200">
            <p className="font-medium">Coverage Status: {coverageStatus}</p>
            <p className="mt-1 text-muted-foreground dark:text-emerald-100/80">
              {coverageStatus === "Healthy"
                ? "Great job! Coverage is trending in the target range."
                : coverageStatus === "Watchlist"
                  ? "Coverage is stable but keep an eye on branch coverage."
                  : "Focus on improving branch and line coverage to reach the target."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {chartData.map((metric) => (
            <div key={metric.segment} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {chartConfig[metric.segment as keyof typeof chartConfig].label}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  {metric.value.toFixed(1)}%
                </span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

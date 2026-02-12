"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Progress } from "@repo/ui/components/shadcn/progress";
import { ScrollArea } from "@repo/ui/components/shadcn/scroll-area";
import { cn } from "@repo/ui/lib/utils";
import { ArrowDownRight, ArrowUpRight, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface PackageCoverage {
  name: string;
  coverage: number;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface CoverageResponse {
  overall: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  packages: PackageCoverage[];
  timestamp: string;
}

export function CoverageByPackage() {
  const [packages, setPackages] = useState<PackageCoverage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const response = await fetch("/api/coverage");
        if (response.ok) {
          const data = (await response.json()) as CoverageResponse;
          setPackages(Array.isArray(data.packages) ? data.packages : []);
        }
      } catch (error) {
        console.error("Failed to fetch coverage data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchCoverage();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coverage by Package</CardTitle>
          <CardDescription>Loading package data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCoverageBadge = (coverage: number) => {
    if (coverage >= 85) {
      return {
        label: "Excellent",
        className: "bg-emerald-500/15 text-emerald-500",
        trendIcon: ArrowUpRight,
      };
    }
    if (coverage >= 70) {
      return {
        label: "Stable",
        className: "bg-amber-500/15 text-amber-500",
        trendIcon: ArrowUpRight,
      };
    }
    if (coverage >= 55) {
      return {
        label: "Needs love",
        className: "bg-orange-500/15 text-orange-500",
        trendIcon: ArrowDownRight,
      };
    }
    return {
      label: "Critical",
      className: "bg-red-500/15 text-red-500",
      trendIcon: ArrowDownRight,
    };
  };

  const displayPackages = (packages.length > 0
    ? packages
    : [
        { name: "declarative-routing", coverage: 94.32, statements: 94.32, branches: 88.5, functions: 96.1, lines: 95.2 },
        { name: "@repo/ui", coverage: 100, statements: 100, branches: 100, functions: 100, lines: 100 },
        { name: "@repo/types", coverage: 100, statements: 100, branches: 100, functions: 100, lines: 100 },
        { name: "apps/web", coverage: 82.6, statements: 84.5, branches: 74.2, functions: 80.3, lines: 83.1 },
        { name: "apps/api", coverage: 75.5, statements: 75.5, branches: 68.2, functions: 80.3, lines: 76.8 },
        { name: "runthenkill", coverage: 20.25, statements: 20.25, branches: 15.5, functions: 25.0, lines: 22.1 },
      ]).sort((a, b) => b.coverage - a.coverage);

  const [featured, ...rest] = displayPackages;
  const featuredStatus = getCoverageBadge(featured.coverage);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Coverage by Package</CardTitle>
        <CardDescription>Test coverage breakdown per package</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="relative overflow-hidden rounded-xl border border-emerald-200/60 bg-linear-to-br from-emerald-500/20 via-emerald-500/10 to-transparent p-5 text-sm shadow-sm dark:border-emerald-900/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600">Top performing package</p>
              <h3 className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                {featured.name}
              </h3>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-100/80">
                Branch coverage strength at {featured.branches.toFixed(1)}% with consistent line coverage.
              </p>
            </div>
            <Badge className={cn("gap-1", featuredStatus.className)}>
              <Star className="h-3.5 w-3.5" />
              {featuredStatus.label}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 text-xs text-emerald-900/90 dark:text-emerald-100">
            <div className="flex items-center justify-between font-medium">
              <span>Overall coverage</span>
              <span className="font-mono text-base">{featured.coverage}%</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-emerald-700/70 dark:text-emerald-200/80">Statements</p>
                <p className="font-semibold">{featured.statements.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-emerald-700/70 dark:text-emerald-200/80">Functions</p>
                <p className="font-semibold">{featured.functions.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-emerald-700/70 dark:text-emerald-200/80">Branches</p>
                <p className="font-semibold">{featured.branches.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-emerald-700/70 dark:text-emerald-200/80">Lines</p>
                <p className="font-semibold">{featured.lines.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[260px] pr-1">
          <div className="space-y-3">
            {rest.map((pkg) => {
              const status = getCoverageBadge(pkg.coverage);
              const TrendIcon = status.trendIcon;

              return (
                <div
                  key={pkg.name}
                  className="group rounded-xl border border-border/60 bg-background/60 p-3 shadow-sm transition-colors hover:border-border hover:bg-background"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">
                        S: {pkg.statements.toFixed(1)}% · B: {pkg.branches.toFixed(1)}% · F: {pkg.functions.toFixed(1)}% · L: {pkg.lines.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">{pkg.coverage}%</span>
                      <Badge className={cn("gap-1", status.className)}>
                        <TrendIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={pkg.coverage} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

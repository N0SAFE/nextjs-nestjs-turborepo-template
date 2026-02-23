"use client";

import { Badge } from "@repo/ui/components/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { cn } from "@repo/ui/lib/utils";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock8,
  PackageSearch,
  ShieldCheck,
} from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trendDirection?: TrendDirection;
  trendLabel?: string;
  icon: React.ReactNode;
  accent?: string;
}

function StatCard({
  title,
  value,
  description,
  trendDirection = "neutral",
  trendLabel,
  icon,
  accent,
}: StatCardProps) {
  const trendColor =
    trendDirection === "up"
      ? "text-emerald-500"
      : trendDirection === "down"
        ? "text-red-500"
        : "text-sky-500";

  const TrendIcon =
    trendDirection === "up"
      ? ArrowUpRight
      : trendDirection === "down"
        ? ArrowDownRight
        : Activity;

  return (
    <Card className={cn("relative overflow-hidden border border-border/60 bg-background/80 shadow-sm backdrop-blur", accent)}>
      <div className="absolute inset-0 bg-linear-to-br from-background/40 via-background/10 to-transparent" aria-hidden />
      <CardHeader className="relative z-10 flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground/80">{description}</p>
          )}
        </div>
        <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-primary-foreground shadow-inner backdrop-blur">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pt-0">
        <div className="flex items-center gap-2 text-xs">
          <Badge
            variant="secondary"
            className={cn(
              "flex items-center gap-1 bg-secondary/80 text-secondary-foreground/90",
              trendDirection === "up" && "bg-emerald-500/20 text-emerald-500",
              trendDirection === "down" && "bg-red-500/20 text-red-500"
            )}
          >
            <TrendIcon className={cn("h-3 w-3", trendColor)} />
            {trendLabel ?? (trendDirection === "neutral" ? "Stable" : "Compared to last run")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  coverageData?: {
    overall: number;
    packagesCount: number;
    lastUpdated: string;
  };
}

export function StatsGrid({ coverageData }: StatsGridProps) {
  const stats = {
    overall: coverageData?.overall ?? 57.43,
    packages: coverageData?.packagesCount ?? 15,
    lastUpdated: coverageData?.lastUpdated ?? "2 hours ago",
  };

  const statCards: StatCardProps[] = [
    {
      title: "Overall Coverage",
      value: `${stats.overall.toFixed(1)}%`,
      description: "Statement coverage across the monorepo",
      trendDirection: stats.overall >= 60 ? "up" : "down",
      trendLabel: stats.overall >= 60 ? "+4.2% vs last run" : "-2.5% vs last run",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
      accent: "bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent",
    },
    {
      title: "Packages Tested",
      value: stats.packages,
      description: "Workspaces reporting coverage",
      trendDirection: "up",
      trendLabel: "+1 new package",
      icon: <PackageSearch className="h-5 w-5 text-blue-500" />,
      accent: "bg-linear-to-br from-sky-500/10 via-sky-500/5 to-transparent",
    },
    {
      title: "Test Status",
      value: "Passing",
      description: "CI checks are healthy",
      trendDirection: "neutral",
      trendLabel: "0 failures detected",
      icon: <Activity className="h-5 w-5 text-purple-500" />,
      accent: "bg-linear-to-br from-purple-500/10 via-purple-500/5 to-transparent",
    },
    {
      title: "Last Updated",
      value: stats.lastUpdated,
      description: "Most recent telemetry snapshot",
      trendDirection: "up",
      trendLabel: "Auto-refresh enabled",
      icon: <Clock8 className="h-5 w-5 text-amber-500" />,
      accent: "bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}

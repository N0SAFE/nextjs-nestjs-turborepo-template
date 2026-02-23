"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Progress } from "@repo/ui/components/shadcn/progress"
import { cn } from "@repo/ui/lib/utils"
import { Activity, Clock, Gauge, Rocket, Timer, TrendingUp } from "lucide-react"

const metricCards = [
  {
    title: "Average build",
    value: "2m 18s",
    caption: "Across 12 workspaces",
    change: "5.3% faster than last week",
    trend: "up" as const,
    accent: "from-sky-500/20 via-sky-500/10 to-transparent",
    icon: Timer,
  },
  {
    title: "Fastest run",
    value: "57s",
    caption: "@repo/ui package",
    change: "Lean pipeline",
    trend: "neutral" as const,
    accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    icon: Rocket,
  },
  {
    title: "Slowest build",
    value: "5m 41s",
    caption: "apps/web production",
    change: "Needs bundle trimming",
    trend: "down" as const,
    accent: "from-amber-500/20 via-amber-500/10 to-transparent",
    icon: Gauge,
  },
  {
    title: "Concurrent jobs",
    value: "6",
    caption: "Turbo pipeline slots",
    change: "Auto-scaled at peak",
    trend: "up" as const,
    accent: "from-purple-500/20 via-purple-500/10 to-transparent",
    icon: Activity,
  },
]

const environmentInsights = [
  {
    name: "CI - main",
    duration: 68,
    trend: "Stable",
    description: "Standard pipeline with cache hit rate at 92%",
  },
  {
    name: "Local dev",
    duration: 42,
    trend: "Improving",
    description: "Bun hot reload keeps iterations fast",
  },
  {
    name: "Preview deployments",
    duration: 78,
    trend: "Watch cache",
    description: "Bundle uploads add 18% overhead",
  },
]

const recentBuilds = [
  {
    id: "#2481",
    target: "apps/web",
    duration: "2m 34s",
    triggeredBy: "turbo run build",
    status: "success" as const,
    completedAt: "Today, 08:12",
  },
  {
    id: "#2478",
    target: "apps/api",
    duration: "1m 48s",
    triggeredBy: "pull_request",
    status: "success" as const,
    completedAt: "Yesterday, 17:26",
  },
  {
    id: "#2471",
    target: "apps/web",
    duration: "5m 41s",
    triggeredBy: "main pipeline",
    status: "warning" as const,
    completedAt: "Yesterday, 11:04",
  },
  {
    id: "#2464",
    target: "packages/ui",
    duration: "1m 05s",
    triggeredBy: "release",
    status: "success" as const,
    completedAt: "Tue, 21:37",
  },
]

export default function BuildTimesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100/60 bg-linear-to-br from-sky-500/15 via-white to-white p-6 shadow-sm dark:border-sky-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-sky-600 dark:text-sky-400">Build pipeline health</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Build Times</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Track compilation performance across workspaces, spot regressions quickly, and keep the Turbo cache humming for every deployment pipeline.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">Healthy cadence</Badge>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Last audit • {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          const trendColor =
            metric.trend === "up"
              ? "text-emerald-500"
              : metric.trend === "down"
              ? "text-rose-500"
              : "text-slate-500"

          return (
            <Card key={metric.title} className="h-full overflow-hidden">
              <CardHeader className="relative space-y-0 pb-2">
                <div className={cn("absolute inset-0 -z-10 opacity-80", `bg-linear-to-br ${metric.accent}`)} />
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-100/90">
                    {metric.title}
                  </CardTitle>
                  <div className="rounded-full bg-white/80 p-2 text-sky-500 shadow-sm dark:bg-slate-900/70">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.caption}</p>
                </div>
                <p className={cn("text-xs font-medium", trendColor)}>{metric.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Environment insights</CardTitle>
            <CardDescription>Compare build durations across key environments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {environmentInsights.map((env) => (
              <div key={env.name} className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{env.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{env.description}</p>
                  </div>
                  <Badge className="bg-slate-500/10 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300">
                    {env.trend}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Build duration</span>
                    <span className="font-mono text-sm text-foreground">{env.duration}s</span>
                  </div>
                  <Progress value={Math.min(100, (env.duration / 120) * 100)} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent builds</CardTitle>
            <CardDescription>Snapshot of the latest pipeline activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentBuilds.map((build) => (
              <div
                key={build.id}
                className="rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{build.target}</p>
                    <p className="text-xs text-muted-foreground">
                      {build.id} • {build.triggeredBy}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-xs capitalize",
                      build.status === "success"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-amber-500/15 text-amber-600"
                    )}
                  >
                    {build.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {build.duration}
                  </span>
                  <span>{build.completedAt}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Optimization radar</CardTitle>
          <CardDescription>Quick wins to keep build times predictable</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {["Warm cache check", "Bundle budgets", "Dependency pruning", "CI parallelism"].map((item) => (
            <div key={item} className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm shadow-sm">
              <div className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                <span className="font-semibold">{item}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Monitor deltas after each release to keep the pipeline nimble and the cache performing at its best.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

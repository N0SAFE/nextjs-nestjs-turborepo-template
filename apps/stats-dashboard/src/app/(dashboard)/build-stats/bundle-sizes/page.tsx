"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Progress } from "@repo/ui/components/shadcn/progress"
import { cn } from "@repo/ui/lib/utils"
import { ArrowDownRight, ArrowUpRight, BarChart3, FolderArchive, Layers, PackageSearch, Shrink } from "lucide-react"

const bundleHighlights = [
  {
    title: "Total footprint",
    value: "1.82 MB",
    caption: "All client bundles",
    change: "↓ 6.4% this release",
    trend: "up" as const,
    accent: "from-amber-500/20 via-amber-500/10 to-transparent",
    icon: Layers,
  },
  {
    title: "Largest chunk",
    value: "642 KB",
    caption: "app/(marketing)/page",
    change: "Critical watchlist",
    trend: "down" as const,
    accent: "from-rose-500/20 via-rose-500/10 to-transparent",
    icon: FolderArchive,
  },
  {
    title: "Average module",
    value: "41 KB",
    caption: "Across 28 entrypoints",
    change: "Optimized with code-splitting",
    trend: "up" as const,
    accent: "from-sky-500/20 via-sky-500/10 to-transparent",
    icon: PackageSearch,
  },
  {
    title: "Tree-shaken gain",
    value: "312 KB",
    caption: "Removed non-critical imports",
    change: "Last 7 days",
    trend: "up" as const,
    accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    icon: Shrink,
  },
]

const artifactBreakdown = [
  {
    name: "main-app.js",
    size: 642,
    delta: "+3.1%",
    status: "warning" as const,
    description: "Marketing hero media adds 20 KB",
  },
  {
    name: "vendors-node.js",
    size: 488,
    delta: "-1.8%",
    status: "success" as const,
    description: "Emotion dependencies trimmed",
  },
  {
    name: "dashboard-routes.js",
    size: 256,
    delta: "-4.5%",
    status: "success" as const,
    description: "Static imports converted to dynamic",
  },
  {
    name: "auth-modal.js",
    size: 94,
    delta: "+0.4%",
    status: "neutral" as const,
    description: "Shared icons reused",
  },
]

const optimizationTargets = [
  {
    label: "Image assets",
    insight: "Enable AVIF for marketing hero",
  },
  {
    label: "Date libraries",
    insight: "Swap moment.js with dayjs-lite",
  },
  {
    label: "Analytics",
    insight: "Defer experimental dashboard heatmap",
  },
  {
    label: "Component sharing",
    insight: "Promote ModalSheet to @repo/ui",
  },
]

const eventLog = [
  {
    title: "Lazy chunk split",
    detail: "Auth flows separated from homepage bundle",
    timestamp: "Today, 09:40",
    status: "positive" as const,
  },
  {
    title: "Static asset cleanup",
    detail: "Removed unused illustrations",
    timestamp: "Yesterday, 18:12",
    status: "positive" as const,
  },
  {
    title: "Third-party SDK spike",
    detail: "Introduced analytics experiment (+52 KB)",
    timestamp: "Mon, 14:55",
    status: "warning" as const,
  },
]

export default function BundleSizesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-100/60 bg-linear-to-br from-amber-500/15 via-white to-white p-6 shadow-sm dark:border-amber-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400">Bundle intelligence</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bundle Sizes</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Keep production payloads lean, surface risky bundle inflations instantly, and share optimization wins with the broader platform team.
            </p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            Net reduction this week
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {bundleHighlights.map((highlight) => {
          const Icon = highlight.icon
          const TrendIcon = highlight.trend === "down" ? ArrowDownRight : ArrowUpRight
          const trendColor =
            highlight.trend === "down" ? "text-rose-500" : "text-emerald-500"

          return (
            <Card key={highlight.title} className="overflow-hidden">
              <CardHeader className="relative space-y-0 pb-2">
                <div className={cn("absolute inset-0 -z-10 opacity-80", `bg-linear-to-br ${highlight.accent}`)} />
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-100/90">
                    {highlight.title}
                  </CardTitle>
                  <div className="rounded-full bg-white/80 p-2 text-amber-500 shadow-sm dark:bg-slate-900/70">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {highlight.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{highlight.caption}</p>
                </div>
                <p className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {highlight.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Artifact breakdown</CardTitle>
            <CardDescription>Top bundles by size with deltas since last deploy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {artifactBreakdown.map((artifact) => (
              <div key={artifact.name} className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{artifact.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{artifact.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-foreground">{artifact.size} KB</p>
                    <p
                      className={cn(
                        "text-xs",
                        artifact.status === "success"
                          ? "text-emerald-500"
                          : artifact.status === "warning"
                          ? "text-amber-500"
                          : "text-slate-500"
                      )}
                    >
                      {artifact.delta}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={Math.min(100, (artifact.size / 800) * 100)} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Optimization tracker</CardTitle>
            <CardDescription>Opportunities ready for next release</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {optimizationTargets.map((target) => (
              <div
                key={target.label}
                className="rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-border"
              >
                <div className="flex items-center gap-3 text-foreground">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold">{target.label}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{target.insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bundle events</CardTitle>
          <CardDescription>Recent milestones impacting production payload</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {eventLog.map((event) => (
            <div key={event.title} className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{event.timestamp}</span>
                <Badge
                  className={cn(
                    "text-xs capitalize",
                    event.status === "positive"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-amber-500/15 text-amber-600"
                  )}
                >
                  {event.status}
                </Badge>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{event.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">{event.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

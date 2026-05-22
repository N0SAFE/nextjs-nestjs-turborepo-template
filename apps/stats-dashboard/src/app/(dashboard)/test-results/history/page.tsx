import type { HistoryEntry } from "../data"

import { Badge } from "@repo/ui/components/shadcn/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { cn } from "@repo/ui/lib/utils"
import { Activity, BarChart3, CalendarRange, Clock, Flame, LineChart, ListChecks, PauseCircle, PlayCircle, RefreshCcw, Timer, TrendingDown, TrendingUp, Trophy } from "lucide-react"

import { fetchTestResults } from "../data"

export default async function TestHistoryPage() {
  const data = await fetchTestResults()
  const history = data?.history ?? []

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-200/50 via-white to-white p-6 shadow-sm dark:border-slate-800/60 dark:via-slate-950 dark:to-slate-950">
          <div className="flex flex-col gap-3">
            <Badge className="self-start bg-slate-500/10 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300">No history</Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Test history</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                We haven&apos;t captured any historical runs yet. Kick off a full test suite to populate rolling analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const chronological = [...history].reverse()
  const passRates = chronological.map((entry) => getPassRate(entry))
  const recentRuns = history.slice(0, 8)
  const rollingWindow = history.slice(0, 14)

  const averagePassRate = average(passRates)
  const previousAverage = average(passRates.slice(0, Math.max(passRates.length - 7, 0)))
  const avgDuration = rollingWindow.length > 0 ? average(rollingWindow.map((run) => run.duration)) : 0
  const bestStreak = computeSuccessStreak(history)
  const failureBurndown = history.slice(0, 7).reduce((acc, run) => acc + run.failed, 0)
  const trendDelta = averagePassRate - (previousAverage || averagePassRate)
  const sparklineShape = buildSparkline(passRates)
  const readinessThresholdLabel = Math.round(averagePassRate).toLocaleString()

  const metrics = [
    {
      title: "Reliability curve",
      value: formatPercent(averagePassRate),
      detail: describeDelta(trendDelta),
      icon: LineChart,
      tone: trendDelta >= 0 ? "positive" : "warning",
      accent: "from-sky-500/20 via-sky-500/10 to-transparent",
    },
    {
      title: "Success streak",
      value: `${bestStreak.toLocaleString()} runs`,
      detail: bestStreak > 0 ? "Consecutive green pipelines" : "Awaiting next green run",
      icon: Trophy,
      tone: bestStreak > 0 ? "positive" : "warning",
      accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    },
    {
      title: "Median runtime",
      value: `${median(rollingWindow.map((run) => run.duration)).toFixed(1)}s`,
      detail: `Avg ${avgDuration.toFixed(1)}s over 14 runs`,
      icon: Timer,
      tone: "neutral" as const,
      accent: "from-purple-500/20 via-purple-500/10 to-transparent",
    },
    {
      title: "Failure burndown",
      value: failureBurndown.toLocaleString(),
      detail: "Seven-day aggregate of failing assertions",
      icon: Flame,
      tone: failureBurndown <= 10 ? "positive" : "warning",
      accent: "from-rose-500/20 via-rose-500/10 to-transparent",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100/60 bg-linear-to-br from-sky-500/15 via-white to-white p-6 shadow-sm dark:border-sky-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-sky-600 dark:text-sky-400">Longitudinal signal</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Test history</h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Explore how reliability evolves over time, understand where failures cluster, and surface the cadence of green pipelines to forecast release readiness.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            <Badge className="bg-sky-500/15 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">{history.length.toLocaleString()} recorded runs</Badge>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Updated • {formatTimestamp(history[0]?.date)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const toneClass =
            metric.tone === "positive"
              ? "text-emerald-500"
              : metric.tone === "warning"
              ? "text-amber-500"
              : "text-slate-500"

          return (
            <Card key={metric.title} className="h-full overflow-hidden">
              <CardHeader className="relative space-y-0 pb-2">
                <div className={cn("absolute inset-0 -z-10 opacity-80", `bg-linear-to-br ${metric.accent}`)} />
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-100/90">
                    {metric.title}
                  </CardTitle>
                  <div className="rounded-full bg-white/80 p-2 shadow-sm dark:bg-slate-900/70">
                    <Icon className="h-4 w-4 text-sky-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {metric.value}
                  </p>
                  <p className={cn("text-xs font-medium", toneClass)}>{metric.detail}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Reliability sparkline</CardTitle>
            <CardDescription>Rolling pass rate trajectory across the full history window</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Min {Math.min(...passRates).toFixed(1)}% • Max {Math.max(...passRates).toFixed(1)}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-sky-100/80 bg-sky-500/5 p-6 dark:border-sky-900/40 dark:bg-slate-950">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Stability momentum</p>
                <p className="max-w-sm text-xs text-slate-600 dark:text-slate-300">
                  Visual sparkline of pass-rate confidence. Each point represents a daily pipeline run, highlighting inflection points for retros.
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {trendDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
                  <span>{describeDelta(trendDelta)}</span>
                </div>
              </div>
              <div className="h-32 w-full md:w-80">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                  <defs>
                    <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>
                  <path d={sparklineShape.path} fill="none" stroke="url(#sparklineGradient)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  <polyline points={sparklineShape.areaPoints} fill="url(#sparklineGradient)" opacity="0.15" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Run timeline</CardTitle>
            <CardDescription>Eight most recent pipelines with context for retro triage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRuns.map((run, index) => {
              const status = classifyRun(run)
              return (
                <div key={run.date} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold",
                        status.badge
                      )}
                    >
                      {index + 1}
                    </span>
                    {index < recentRuns.length - 1 && <span className={cn("mt-1 h-full w-0.5 flex-1", status.connector)} />}
                  </div>
                  <div className="flex-1 rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatTimestamp(run.date)}</p>
                        <p className="text-xs text-muted-foreground">{status.label}</p>
                      </div>
                      <Badge className={cn("text-xs", status.highlight)}>{status.status}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                      <InfoPill icon={PlayCircle} label="Pass rate" value={formatPercent(getPassRate(run))} tone="positive" />
                      <InfoPill
                        icon={run.failed === 0 ? ListChecks : Activity}
                        label={run.failed === 0 ? "Failures" : "Regression"}
                        value={run.failed === 0 ? "Zero" : `${run.failed.toLocaleString()} issues`}
                        tone={run.failed === 0 ? "positive" : "warning"}
                      />
                      <InfoPill icon={Clock} label="Duration" value={`${run.duration.toFixed(1)}s`} tone="neutral" />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Release rhythm</CardTitle>
            <CardDescription>Align production pushes with quality telemetry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChecklistItem
              icon={RefreshCcw}
              title="Weekly release readiness"
              detail={`Maintain ≥${readinessThresholdLabel}% pass rate before cutting a promotion.`}
            />
            <ChecklistItem
              icon={CalendarRange}
              title="Warm-up window"
              detail="Use the first green run after Monday to unblock cherry-picks."
            />
            <ChecklistItem
              icon={PauseCircle}
              title="Freeze protocol"
              detail="If two consecutive runs fail, pause deploys and swarm the failures."
            />
            <ChecklistItem
              icon={BarChart3}
              title="Retro highlights"
              detail="Celebrate longest success streak each Friday to reinforce quality habits."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getPassRate(entry: HistoryEntry): number {
  return entry.total > 0 ? (entry.passed / entry.total) * 100 : 0
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  const sum = values.reduce((acc, value) => acc + value, 0)
  return sum / values.length
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

function computeSuccessStreak(history: HistoryEntry[]): number {
  let streak = 0
  for (const entry of history) {
    if (entry.failed === 0) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

interface SparklineShape {
  path: string
  areaPoints: string
}

function buildSparkline(values: number[]): SparklineShape {
  if (values.length === 0) {
    return { path: "", areaPoints: "" }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  const horizontalStep = values.length > 1 ? 100 / (values.length - 1) : 100

  const points = values.map((value, index) => {
    const x = index * horizontalStep
    const normalized = (value - min) / range
    const y = 100 - normalized * 100
    return {
      x: x.toFixed(2),
      y: y.toFixed(2),
    }
  })

  return {
    path: points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" "),
    areaPoints: points.map((point) => `${point.x},${point.y}`).join(" "),
  }
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function describeDelta(delta: number): string {
  if (delta > 0.1) {
    return `+${delta.toFixed(1)}% vs prior window`
  }
  if (delta < -0.1) {
    return `${delta.toFixed(1)}% vs prior window`
  }
  return "Flat trend vs prior window"
}

function formatTimestamp(dateString?: string): string {
  if (!dateString) {
    return "Unknown"
  }
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) {
    return dateString
  }
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function classifyRun(run: HistoryEntry) {
  const passRate = getPassRate(run)
  if (run.failed === 0 && passRate >= 90) {
    return {
      status: "Green",
      label: "Full pass",
      highlight: "bg-emerald-500/15 text-emerald-600",
      badge: "border-emerald-500/60 text-emerald-600",
      connector: "bg-emerald-500/30",
    }
  }
  if (run.failed <= 5) {
    return {
      status: "Watch",
      label: "Minor regressions",
      highlight: "bg-amber-500/15 text-amber-600",
      badge: "border-amber-500/60 text-amber-600",
      connector: "bg-amber-500/30",
    }
  }
  return {
    status: "Focus",
    label: "Blocking failures",
    highlight: "bg-rose-500/15 text-rose-600",
    badge: "border-rose-500/60 text-rose-600",
    connector: "bg-rose-500/30",
  }
}

function InfoPill({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: "positive" | "warning" | "neutral" }) {
  const toneColor = tone === "positive" ? "text-emerald-500" : tone === "warning" ? "text-amber-500" : "text-slate-500"
  const toneBg = tone === "positive" ? "bg-emerald-500/10" : tone === "warning" ? "bg-amber-500/10" : "bg-slate-500/10"
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3">
      <span className={cn("rounded-full p-2", toneBg)}>
        <Icon className={cn("h-4 w-4", toneColor)} />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function ChecklistItem({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
      <span className="rounded-full bg-sky-500/10 p-2 text-sky-500 dark:bg-sky-500/15 dark:text-sky-300">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

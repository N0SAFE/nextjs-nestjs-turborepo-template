import type { ComponentType } from "react"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Progress } from "@repo/ui/components/shadcn/progress"
import { cn } from "@repo/ui/lib/utils"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  LineChart,
  ShieldCheck,
  Timer,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react"

import { fetchTestResults, FailureDetail, LatestTestRun, PackageResult } from "../data"

function formatPercent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`
}

function computePassRate(summary: LatestTestRun["summary"]): number {
  if (summary.total <= 0) {
    return 0
  }
  return (summary.passed / summary.total) * 100
}

function getPackageStatus(pkg: PackageResult) {
  const rate = pkg.total > 0 ? (pkg.passed / pkg.total) * 100 : 0
  if (pkg.failed > 0) {
    return {
      label: "Attention",
      className: "bg-rose-500/15 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
      rate,
    }
  }
  if (rate >= 97) {
    return {
      label: "Stable",
      className: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
      rate,
    }
  }
  return {
    label: "Monitor",
    className: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    rate,
  }
}

function buildQualityChecklist(latest: LatestTestRun): { title: string; detail: string; icon: ComponentType<{ className?: string }>; tone: "info" | "warning" | "positive" }[] {
  const { summary, failures, byPackage } = latest
  const flakyCandidates = byPackage.filter((pkg) => pkg.failed > 0).map((pkg) => pkg.name)
  const checklist: { title: string; detail: string; icon: ComponentType<{ className?: string }>; tone: "info" | "warning" | "positive" }[] = [
    {
      title: "Coverage guardrail aligned",
      detail: `${summary.passed.toLocaleString()} of ${summary.total.toLocaleString()} assertions green in the last pipeline run.`,
      icon: ShieldCheck,
      tone: "positive",
    },
  ]

  if (flakyCandidates.length > 0) {
    checklist.push({
      title: "Investigate flaky modules",
      detail: `${flakyCandidates.slice(0, 3).join(", ")}${flakyCandidates.length > 3 ? " and others" : ""} show unstable suites.`,
      icon: Wrench,
      tone: "warning",
    })
  }

  if (failures.length > 0) {
    checklist.push({
      title: "Capture failure artifacts",
      detail: `${failures.length.toLocaleString()} failing expectations documented for review before the next release window.`,
      icon: AlertTriangle,
      tone: "warning",
    })
  } else {
    checklist.push({
      title: "Stabilized failure backlog",
      detail: "No regressions detected in the most recent run.",
      icon: Activity,
      tone: "positive",
    })
  }

  checklist.push({
    title: "Share highlights",
    detail: "Broadcast test health updates in the team channel to keep the feedback loop tight.",
    icon: ArrowUpRight,
    tone: "info",
  })

  return checklist
}

function classifyTrend(delta: number) {
  if (delta > 0.1) {
    return { label: `+${delta.toFixed(1)}% vs last week`, icon: TrendingUp, tone: "positive" as const }
  }
  if (delta < -0.1) {
    return { label: `${delta.toFixed(1)}% vs last week`, icon: TrendingDown, tone: "warning" as const }
  }
  return { label: "Flat week-over-week", icon: LineChart, tone: "neutral" as const }
}

export default async function LatestTestRunPage() {
  const data = await fetchTestResults()
  const latest = data?.latest

  if (!latest) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200/70 bg-linear-to-br from-amber-100 via-white to-white p-6 shadow-sm dark:border-amber-900/30 dark:from-amber-500/10 dark:via-slate-950 dark:to-slate-950">
          <div className="flex flex-col gap-3">
            <Badge className="self-start bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              Data unavailable
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Latest test run</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                We couldn&apos;t retrieve the latest pipeline snapshot. Re-run the tests or verify the reporting endpoint configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { summary, byPackage, failures } = latest
  const passRate = computePassRate(summary)
  const failureRate = summary.total > 0 ? (summary.failed / summary.total) * 100 : 0
  const historyWindow = data && data.history ? data.history : []
  const recentHistory = historyWindow.slice(0, 7)
  const previousHistory = historyWindow.slice(7, 14)

  const averagePassRateRecent =
    recentHistory.length > 0
      ? recentHistory.reduce((acc, item) => acc + (item.passed / Math.max(item.total, 1)) * 100, 0) /
        recentHistory.length
      : passRate
  const averagePassRatePrevious =
    previousHistory.length > 0
      ? previousHistory.reduce((acc, item) => acc + (item.passed / Math.max(item.total, 1)) * 100, 0) /
        previousHistory.length
      : averagePassRateRecent
  const passRateDelta = averagePassRateRecent - averagePassRatePrevious

  const averageDurationRecent =
    recentHistory.length > 0
      ? recentHistory.reduce((acc, item) => acc + item.duration, 0) / recentHistory.length
      : summary.duration

  const { label: deltaLabel, tone: deltaTone } = classifyTrend(passRateDelta)

  const metricCards = [
    {
      title: "Pass rate",
      value: formatPercent(passRate),
      caption: deltaLabel,
      trend: deltaTone,
      accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      icon: ShieldCheck,
    },
    {
      title: "Failures",
      value: summary.failed.toLocaleString(),
      caption: failures.length > 0 ? `${failures.length.toLocaleString()} suites require attention` : "No failing suites",
      trend: failures.length > 0 ? "warning" : "positive",
      accent: "from-rose-500/20 via-rose-500/10 to-transparent",
      icon: AlertTriangle,
    },
    {
      title: "Runtime",
      value: `${summary.duration.toFixed(1)}s`,
      caption: `Avg ${averageDurationRecent.toFixed(1)}s across last 7 runs`,
      trend: summary.duration <= averageDurationRecent ? "positive" : "warning",
      accent: "from-sky-500/20 via-sky-500/10 to-transparent",
      icon: Timer,
    },
    {
      title: "Active suites",
      value: summary.total.toLocaleString(),
      caption: `${byPackage.length.toLocaleString()} workspaces reporting`,
      trend: "neutral" as const,
      accent: "from-purple-500/20 via-purple-500/10 to-transparent",
      icon: Layers,
    },
  ]

  const checklist = buildQualityChecklist(latest)

  const sortedPackages = [...byPackage].sort((a, b) => b.failed - a.failed || b.passed - a.passed)
  const failRateText = failureRate > 0 ? formatPercent(failureRate) : "0%"

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100/60 bg-linear-to-br from-emerald-500/15 via-white to-white p-6 shadow-sm dark:border-emerald-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Test pipeline health</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Latest test run</h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Fresh results from the CI matrix with focused insights on pass rates, runtime, and suites that need a bit of love before the next deploy train.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              {formatPercent(passRate, 1)} success
            </Badge>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Updated • {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(latest.timestamp))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          const toneClass =
            metric.trend === "positive"
              ? "text-emerald-500"
              : metric.trend === "warning"
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
                  <div className="rounded-full bg-white/80 p-2 text-emerald-500 shadow-sm dark:bg-slate-900/70">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {metric.value}
                  </p>
                  <p className={cn("text-xs font-medium", toneClass)}>{metric.caption}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Suite performance</CardTitle>
            <CardDescription>Package-level reliability across the latest pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedPackages.map((pkg) => {
              const status = getPackageStatus(pkg)
              const total = Math.max(pkg.total, 1)
              const passPercentage = (pkg.passed / total) * 100
              const runtimeLabel = `${pkg.duration.toFixed(1)}s`

              return (
                <div key={pkg.name} className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pkg.passed}/{pkg.total} assertions green • {runtimeLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-xs", status.className)}>{status.label}</Badge>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          pkg.failed > 0 ? "text-rose-500" : pkg.passed === pkg.total ? "text-emerald-500" : "text-amber-500"
                        )}
                      >
                        {formatPercent(passPercentage, 0)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Pass share</span>
                      <span className="font-mono text-sm text-foreground">{formatPercent(passPercentage, 0)}</span>
                    </div>
                    <Progress value={passPercentage} className="h-2" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Quality checklist</CardTitle>
            <CardDescription>Keep momentum by clearing these quick follow-ups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklist.map((item) => {
              const Icon = item.icon
              const toneClass =
                item.tone === "positive"
                  ? "text-emerald-500"
                  : item.tone === "warning"
                  ? "text-amber-500"
                  : "text-sky-500"
              const badgeClass =
                item.tone === "positive"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : item.tone === "warning"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-sky-500/10 text-sky-600"

              return (
                <div key={item.title} className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className={cn("rounded-full p-2", badgeClass)}>
                      <Icon className={cn("h-4 w-4", toneClass)} />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className={cn(failures.length > 0 ? "border-rose-200 dark:border-rose-900" : "")}> 
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className={cn("h-5 w-5", failures.length > 0 ? "text-rose-500" : "text-slate-400")}
            />
            Failure snapshot {failures.length > 0 ? `(${failures.length.toLocaleString()})` : ""}
          </CardTitle>
          <CardDescription>
            {failures.length > 0
              ? "Review failing expectations and capture repro steps before they become flake debt."
              : "Zero regressions detected in the latest run—keep the discipline!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failures.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-6 text-center dark:border-emerald-900/40 dark:bg-emerald-500/5">
              <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">All suites are passing</p>
              <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-300/80">
                Keep an eye on slow builders to prevent future regressions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {failures.map((failure) => (
                <FailureItem key={`${failure.package}-${failure.test}`} failure={failure} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline recap</CardTitle>
          <CardDescription>High-level stats distilled from the last 14 automation runs</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickStat
            icon={BarChart3}
            title="Average pass rate"
            value={formatPercent(averagePassRateRecent)}
            detail={deltaLabel}
            tone={deltaTone}
          />
          <QuickStat
            icon={Clock}
            title="Median runtime"
            value={`${averageDurationRecent.toFixed(1)}s`}
            detail="Computed from the last seven runs"
            tone={summary.duration <= averageDurationRecent ? "positive" : "warning"}
          />
          <QuickStat
            icon={AlertTriangle}
            title="Failure share"
            value={failRateText}
            detail={failures.length > 0 ? "Investigate failing assertions" : "No blocking failures"}
            tone={failures.length > 0 ? "warning" : "positive"}
          />
          <QuickStat
            icon={LineChart}
            title="Historical coverage"
            value={recentHistory.length > 0 ? `${recentHistory.length.toLocaleString()} runs` : "N/A"}
            detail="Rolling reliability cohort"
            tone="neutral"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function FailureItem({ failure }: { failure: FailureDetail }) {
  return (
    <div className="rounded-xl border border-rose-200/70 bg-rose-50/60 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-500/5">
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-rose-600 dark:text-rose-300">{failure.test}</p>
            <p className="text-xs text-rose-500/80 dark:text-rose-300/80">
              {failure.package} • {failure.file}:{failure.line}
            </p>
          </div>
        </div>
        <p className="rounded-md bg-white/70 p-3 font-mono text-xs text-rose-700 shadow-sm dark:bg-slate-950/60 dark:text-rose-300">
          {failure.error}
        </p>
      </div>
    </div>
  )
}

function QuickStat({
  icon: Icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  value: string
  detail: string
  tone: "positive" | "warning" | "neutral"
}) {
  const toneColor = tone === "positive" ? "text-emerald-500" : tone === "warning" ? "text-amber-500" : "text-sky-500"
  const toneBg = tone === "positive" ? "bg-emerald-500/10" : tone === "warning" ? "bg-amber-500/10" : "bg-sky-500/10"
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className={cn("rounded-full p-2", toneBg)}>
          <Icon className={cn("h-4 w-4", toneColor)} />
        </span>
      </div>
    </div>
  )
}

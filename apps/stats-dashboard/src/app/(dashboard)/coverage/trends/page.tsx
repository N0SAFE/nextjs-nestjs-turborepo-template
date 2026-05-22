"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Progress } from "@repo/ui/components/shadcn/progress"
import { cn } from "@repo/ui/lib/utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  Layers,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

const summaryMetrics = [
  {
    label: "Overall coverage",
    value: "92.4%",
    delta: "+1.8% vs last sprint",
    tone: "positive" as const,
    accent: "from-sky-500/20 via-sky-500/10 to-transparent",
    icon: ShieldCheck,
  },
  {
    label: "Branch health",
    value: "87.3%",
    delta: "+3.1% after refactor",
    tone: "positive" as const,
    accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    icon: BarChart3,
  },
  {
    label: "Hotspot modules",
    value: "4",
    delta: "Focused suites in review",
    tone: "warning" as const,
    accent: "from-amber-500/20 via-amber-500/10 to-transparent",
    icon: AlertTriangle,
  },
  {
    label: "Confidence score",
    value: "96%",
    delta: "Meets release policy",
    tone: "neutral" as const,
    accent: "from-purple-500/20 via-purple-500/10 to-transparent",
    icon: Layers,
  },
]

const coverageHistory = [
  { week: "Mar 03", overall: 88.4, statements: 90.2, branches: 81.5 },
  { week: "Mar 10", overall: 89.6, statements: 91.1, branches: 82.8 },
  { week: "Mar 17", overall: 90.3, statements: 92.4, branches: 83.9 },
  { week: "Mar 24", overall: 90.8, statements: 93.2, branches: 84.6 },
  { week: "Mar 31", overall: 91.2, statements: 93.8, branches: 85.1 },
  { week: "Apr 07", overall: 91.8, statements: 94.1, branches: 86.2 },
  { week: "Apr 14", overall: 92.1, statements: 94.6, branches: 86.9 },
  { week: "Apr 21", overall: 92.3, statements: 94.8, branches: 87.2 },
  { week: "Apr 28", overall: 92.4, statements: 95.0, branches: 87.3 },
]

const focusModules = [
  {
    name: "apps/web",
    area: "App Router surfaces",
    coverage: 93.8,
    delta: "+1.2",
    health: "Stable",
    accent: "bg-sky-500/15 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  },
  {
    name: "apps/api",
    area: "ORM + auth guards",
    coverage: 90.4,
    delta: "+2.5",
    health: "Improving",
    accent: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    name: "packages/ui",
    area: "Shadcn atoms",
    coverage: 88.1,
    delta: "-0.6",
    health: "Watch",
    accent: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  },
  {
    name: "packages/types",
    area: "Utility inference",
    coverage: 95.6,
    delta: "+0.8",
    health: "Strong",
    accent: "bg-purple-500/15 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
  },
]

const recentFindings = [
  {
    title: "Storybook suite expansion",
    detail: "68 new visual assertions covering regression scenarios",
    mood: "improvement" as const,
  },
  {
    title: "Edge middleware coverage dip",
    detail: "Rate-limiting branches missing multi-tenant path tests",
    mood: "warning" as const,
  },
  {
    title: "Contract tests stabilized",
    detail: "ORPC interactions validated against latest schema",
    mood: "improvement" as const,
  },
]

const releaseWindows = [
  {
    name: "Release 2025.05",
    window: "May 6 – May 8",
    focus: "Accessibility hardening + doc polish",
    readiness: "On track",
    tone: "positive" as const,
  },
  {
    name: "Patch channel",
    window: "Rolling",
    focus: "Hotfix validation & regression net",
    readiness: "Requires watch",
    tone: "warning" as const,
  },
]

export default function CoverageTrendsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100/60 bg-linear-to-br from-sky-500/15 via-white to-white p-6 shadow-sm dark:border-sky-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-sky-600 dark:text-sky-400">Quality signal</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Coverage trends</h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Visualize how automated tests protect the platform across weeks, pinpoint branch health regressions, and celebrate suites that keep our release cadence ship-ready.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            <Badge className="bg-sky-500/15 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">Coverage uplift</Badge>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Updated • {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon
          const tone =
            metric.tone === "positive"
              ? "text-emerald-500"
              : metric.tone === "warning"
              ? "text-amber-500"
              : "text-slate-500"

          return (
            <Card key={metric.label} className="h-full overflow-hidden">
              <CardHeader className="relative space-y-0 pb-2">
                <div className={cn("absolute inset-0 -z-10 opacity-80", `bg-linear-to-br ${metric.accent}`)} />
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-100/90">
                    {metric.label}
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
                  <p className={cn("text-xs font-medium", tone)}>{metric.delta}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coverage velocity</CardTitle>
          <CardDescription>Last nine weekly snapshots across key suites</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={coverageHistory} margin={{ top: 12, right: 24, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="coverageOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="coverageBranches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" strokeDasharray="4 4" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: "rgb(100 116 139)", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgb(100 116 139)", fontSize: 12 }}
                tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                domain={[80, 100]}
              />
              <RechartsTooltip
                cursor={{ stroke: "#0ea5e9", strokeWidth: 1, strokeDasharray: "4 2" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="overall" stroke="#0ea5e9" strokeWidth={2.2} fill="url(#coverageOverall)" />
              <Area type="monotone" dataKey="branches" stroke="#f97316" strokeWidth={1.8} fill="url(#coverageBranches)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Focus modules</CardTitle>
            <CardDescription>Where incremental coverage drives the biggest confidence lift</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {focusModules.map((module) => (
              <div key={module.name} className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{module.area}</p>
                  </div>
                  <Badge className={cn("text-xs", module.accent)}>{module.health}</Badge>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Coverage</span>
                    <span className="font-mono text-sm text-foreground">{module.coverage.toFixed(1)}%</span>
                  </div>
                  <Progress value={module.coverage} className="mt-2 h-2" />
                  <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Delta • {module.delta}%
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent findings</CardTitle>
            <CardDescription>Highlights from the latest coverage reviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentFindings.map((finding) => (
              <div key={finding.title} className="rounded-xl border border-border/60 bg-background p-4">
                <div className="flex items-start gap-3">
                  {finding.mood === "improvement" ? (
                    <TrendingUp className="mt-0.5 h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="mt-0.5 h-4 w-4 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{finding.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{finding.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Release readiness</CardTitle>
          <CardDescription>Align coverage posture with upcoming delivery windows</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {releaseWindows.map((release) => (
            <div key={release.name} className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{release.name}</span>
                <Badge
                  className={cn(
                    "text-xs",
                    release.tone === "positive"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-amber-500/15 text-amber-600"
                  )}
                >
                  {release.readiness}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5" />
                <span>{release.window}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{release.focus}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

import { Activity, AlertTriangle, ArrowUpRight, Blocks, Box, Cable, ChartLine, Layers, Map, PackageCheck, PackageSearch } from 'lucide-react'
import type { ComponentType } from 'react'

import { Badge } from '@repo/ui/components/shadcn/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Progress } from '@repo/ui/components/shadcn/progress'

interface DependencySnapshot {
  title: string
  value: string
  delta: string
  icon: ComponentType<{ className?: string }>
  tone: 'positive' | 'neutral' | 'warning'
  caption: string
}

interface PackageSurface {
  name: string
  version: string
  dependents: number
  status: 'healthy' | 'watch' | 'action'
  impact: string
}

interface ServiceLink {
  name: string
  icon: ComponentType<{ className?: string }>
  description: string
  action: string
  tone: 'primary' | 'neutral'
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const dependencySnapshots: DependencySnapshot[] = [
  {
    title: 'Workspace packages',
    value: '28',
    delta: '+3 new modules',
    icon: Layers,
    tone: 'positive',
    caption: `Coverage strengthened ${relativeTimeFormatter.format(-2, 'week')}`,
  },
  {
    title: 'External dependencies',
    value: '142',
    delta: '+6 additions',
    icon: Box,
    tone: 'neutral',
    caption: 'Curated through the shared catalog registry',
  },
  {
    title: 'Outdated packages',
    value: '11',
    delta: '4 critical',
    icon: AlertTriangle,
    tone: 'warning',
    caption: `Risk profile improved ${relativeTimeFormatter.format(-5, 'day')}`,
  },
  {
    title: 'Duplicated versions',
    value: '7',
    delta: 'React, Zod, ESLint',
    icon: Cable,
    tone: 'warning',
    caption: 'Targeted for dedupe in the next release train',
  },
]

const surfaces: PackageSurface[] = [
  {
    name: '@repo/ui',
    version: '1.12.0',
    dependents: 6,
    status: 'healthy',
    impact: 'Shared primitives across dashboard, marketing, and onboarding flows.',
  },
  {
    name: '@repo/api-contracts',
    version: '0.9.3',
    dependents: 4,
    status: 'watch',
    impact: 'Requires validation against upcoming ORPC schema changes.',
  },
  {
    name: 'lucide-react',
    version: '0.460.0',
    dependents: 5,
    status: 'action',
    impact: 'Pinned until icon tree-shaking regression in latest major is resolved.',
  },
]

const serviceLinks: ServiceLink[] = [
  {
    name: 'Catalog insights',
    icon: PackageSearch,
    description: 'Audit usage and consolidate dependencies across workspaces.',
    action: 'Open package dashboard',
    tone: 'primary',
  },
  {
    name: 'Upgrade planner',
    icon: ChartLine,
    description: 'Sequence patch rollouts with automated canary builds.',
    action: 'Launch upgrade board',
    tone: 'neutral',
  },
  {
    name: 'Graph explorer',
    icon: Map,
    description: 'Visualise dependency edges to understand cascade impact.',
    action: 'View graph map',
    tone: 'neutral',
  },
]

export default function DependenciesPage() {
  const maturity = 76
  const riskCoverage = 64

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100/60 bg-linear-to-br from-blue-500/20 via-white to-white p-6 shadow-sm dark:border-blue-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit bg-blue-500/15 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">Dependency intelligence</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Package dependencies</h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Align dependency posture across workspaces and fast-track remediation work that impacts runtime stability.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Current posture</span>
            <div className="flex items-baseline gap-2 text-slate-900 dark:text-slate-100">
              <span className="text-2xl font-semibold">{maturity.toLocaleString()}%</span>
              <span className="text-xs text-muted-foreground">maturity index</span>
            </div>
            <p className="text-xs text-muted-foreground">Monitored across 4 workspaces</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dependencySnapshots.map((snapshot) => {
          const Icon = snapshot.icon
          const toneColor = snapshot.tone === 'positive' ? 'text-emerald-500' : snapshot.tone === 'warning' ? 'text-amber-500' : 'text-slate-500'
          const accentBg = snapshot.tone === 'positive' ? 'bg-emerald-500/10' : snapshot.tone === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'

          return (
            <Card key={snapshot.title} className="h-full">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-100/90">{snapshot.title}</CardTitle>
                  <CardDescription>{snapshot.caption}</CardDescription>
                </div>
                <span className={`rounded-full p-2 ${accentBg}`}>
                  <Icon className={`h-4 w-4 ${toneColor}`} />
                </span>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{snapshot.value}</span>
                  <ArrowUpRight className={`h-4 w-4 ${toneColor}`} />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{snapshot.delta}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Dependency risk coverage</CardTitle>
              <CardDescription>Track remediations across security, upgrade, and duplication categories.</CardDescription>
            </div>
            <Badge className="bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900">{riskCoverage.toLocaleString()}% coverage</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Upgrade readiness</span>
                <span>82%</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Security coverage</span>
                <span>68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>License compliance</span>
                <span>74%</span>
              </div>
              <Progress value={74} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dependency velocity</CardTitle>
            <CardDescription>Releases and patch cadence across the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <Blocks className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Weekly release train</p>
                  <p className="text-xs text-muted-foreground">Last push {relativeTimeFormatter.format(-2, 'day')}</p>
                </div>
              </div>
              <Badge variant="outline">4 releases</Badge>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                <span>89% of packages updated within the past 45 days.</span>
              </div>
              <div className="flex items-center gap-2">
                <PackageCheck className="h-3.5 w-3.5 text-blue-500" />
                <span>Catalog sync job runs nightly with automated canary validation.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dependency surfaces</CardTitle>
          <CardDescription>High-impact packages and their dependent footprint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {surfaces.map((surface) => {
            const statusTone = surface.status === 'healthy' ? 'text-emerald-500' : surface.status === 'watch' ? 'text-amber-500' : 'text-rose-500'
            const statusBg = surface.status === 'healthy' ? 'bg-emerald-500/10' : surface.status === 'watch' ? 'bg-amber-500/10' : 'bg-rose-500/10'
            const statusLabel = surface.status === 'healthy' ? 'Healthy' : surface.status === 'watch' ? 'Watch' : 'Action required'

            return (
              <div key={surface.name} className="space-y-2 rounded-xl border border-border/70 bg-card/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{surface.name}</p>
                    <p className="text-xs text-muted-foreground">Version {surface.version}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-slate-500/10 px-2 py-1 font-medium">{surface.dependents.toLocaleString()} dependents</span>
                    <span className={`rounded-full px-2 py-1 font-medium ${statusBg} ${statusTone}`}>{statusLabel}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{surface.impact}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational shortcuts</CardTitle>
          <CardDescription>Jump into workflows that accelerate dependency management.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {serviceLinks.map((link) => {
            const Icon = link.icon
            const toneClasses = link.tone === 'primary' ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:border-blue-500/40 dark:text-blue-300' : 'border-slate-200/70 bg-slate-50/60 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300'

            return (
              <div key={link.name} className={`flex flex-col gap-3 rounded-xl border p-4 ${toneClasses}`}>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <p className="text-sm font-semibold">{link.name}</p>
                </div>
                <p className="text-xs text-muted-foreground dark:text-slate-300">{link.description}</p>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-300">{link.action}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

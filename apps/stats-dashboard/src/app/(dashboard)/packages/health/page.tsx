import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ShieldAlert, ShieldCheck, TimerReset, Wrench } from 'lucide-react'
import type { ComponentType } from 'react'

import { Badge } from '@repo/ui/components/shadcn/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Progress } from '@repo/ui/components/shadcn/progress'

interface HealthSnapshot {
  label: string
  value: number
  suffix?: string
  trend: string
  tone: 'positive' | 'warning' | 'neutral'
  description: string
  icon: ComponentType<{ className?: string }>
}

interface QualityGate {
  name: string
  owner: string
  status: 'passing' | 'watching' | 'failing'
  details: string
}

interface RemediationStream {
  name: string
  progress: number
  eta: string
  lead: string
}

const healthSnapshots: HealthSnapshot[] = [
  {
    label: 'Overall health score',
    value: 82,
    suffix: '%',
    trend: '+4.2 vs last sprint',
    tone: 'positive',
    description: 'Aggregates quality gates across security, maintenance, and documentation.',
    icon: ShieldCheck,
  },
  {
    label: 'Security findings',
    value: 3,
    trend: '1 new advisory',
    tone: 'warning',
    description: 'Across @repo/api and NestJS adapters. Highest severity: medium.',
    icon: ShieldAlert,
  },
  {
    label: 'License exceptions',
    value: 1,
    trend: '0 resolved this week',
    tone: 'warning',
    description: 'Awaiting legal review for transitive dependency in analytics bundle.',
    icon: AlertTriangle,
  },
  {
    label: 'Maintenance SLAs',
    value: 92,
    suffix: '%',
    trend: 'Stable',
    tone: 'positive',
    description: 'Critical packages updated within agreed cadence windows.',
    icon: CheckCircle2,
  },
]

const qualityGates: QualityGate[] = [
  {
    name: 'Security baseline',
    owner: 'Platform security',
    status: 'watching',
    details: 'Pending remediation on ORPC client bundle high severity advisory.',
  },
  {
    name: 'Documentation parity',
    owner: 'DX guild',
    status: 'passing',
    details: 'Most recent component updates documented within 48h SLA.',
  },
  {
    name: 'Runtime compatibility',
    owner: 'Release engineering',
    status: 'passing',
    details: 'Node 20 and Bun runtime tests green across priority packages.',
  },
  {
    name: 'Design tokens alignment',
    owner: 'Design systems',
    status: 'failing',
    details: 'Waiting for @repo/ui token sync with new Tailwind primitives.',
  },
]

const remediationStreams: RemediationStream[] = [
  {
    name: 'Storybook accessibility audit',
    progress: 68,
    eta: 'Due in 4 days',
    lead: 'DX guild',
  },
  {
    name: 'ORPC client security review',
    progress: 46,
    eta: 'Due in 7 days',
    lead: 'Platform security',
  },
  {
    name: 'License policy cleanup',
    progress: 32,
    eta: 'Drafting new policy',
    lead: 'Legal ops',
  },
]

export default function PackageHealthPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100/70 bg-linear-to-br from-emerald-500/15 via-white to-white p-6 shadow-sm dark:border-emerald-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">Health posture</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Package health overview</h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Stay ahead of regressions across your shared packages with live quality gates, security insights, and remediation tracking.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active remediation streams</span>
            <div className="flex items-baseline gap-2 text-slate-900 dark:text-slate-100">
              <span className="text-2xl font-semibold">3</span>
              <span className="text-xs text-muted-foreground">in motion</span>
            </div>
            <p className="text-xs text-muted-foreground">Coordinated across platform, DX, and legal squads</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {healthSnapshots.map((snapshot) => {
          const Icon = snapshot.icon
          const toneText = snapshot.tone === 'positive' ? 'text-emerald-500' : snapshot.tone === 'warning' ? 'text-amber-500' : 'text-slate-500'
          const toneBg = snapshot.tone === 'positive' ? 'bg-emerald-500/10' : snapshot.tone === 'warning' ? 'bg-amber-500/10' : 'bg-slate-500/10'

          return (
            <Card key={snapshot.label} className="h-full">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-100/90">{snapshot.label}</CardTitle>
                  <CardDescription>{snapshot.description}</CardDescription>
                </div>
                <span className={`rounded-full p-2 ${toneBg}`}>
                  <Icon className={`h-4 w-4 ${toneText}`} />
                </span>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {snapshot.value}
                    {snapshot.suffix ? <span className="text-base font-medium text-muted-foreground">{snapshot.suffix}</span> : null}
                  </span>
                  <ArrowUpRight className={`h-4 w-4 ${toneText}`} />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{snapshot.trend}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Quality gate status</CardTitle>
              <CardDescription>Teams responsible for each gate and their current signal.</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs uppercase tracking-wide">Weekly review</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {qualityGates.map((gate) => {
              const statusTone = gate.status === 'passing' ? 'bg-emerald-500/10 text-emerald-600' : gate.status === 'watching' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
              const statusLabel = gate.status === 'passing' ? 'Passing' : gate.status === 'watching' ? 'Watch' : 'Failing'

              return (
                <div key={gate.name} className="rounded-xl border border-border/60 bg-card/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{gate.name}</p>
                      <p className="text-xs text-muted-foreground">Owned by {gate.owner}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>{statusLabel}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{gate.details}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Remediation streams</CardTitle>
            <CardDescription>Progress across active quality initiatives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {remediationStreams.map((stream) => (
              <div key={stream.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{stream.name}</p>
                    <p className="text-xs text-muted-foreground">Lead: {stream.lead}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{stream.eta}</span>
                </div>
                <Progress value={stream.progress} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>{stream.progress}% complete</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anomalies watchlist</CardTitle>
          <CardDescription>Signals that may require engineering intervention.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">Dependency drift</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pinned versions in analytics bundle diverging from workspace baseline by two majors.
            </p>
            <span className="text-xs font-medium text-amber-600">Escalate to release engineering</span>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <TimerReset className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-semibold text-foreground">Stale contribution streak</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              @repo/api-contracts has not shipped updates in the last 28 days. Verify alignment with backend changes.
            </p>
            <span className="text-xs font-medium text-blue-600">Assign pairing session</span>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-rose-500" />
              <p className="text-sm font-semibold text-foreground">Failed smoke tests</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              E2E smoke suite flagged regressions in docs site integration for new UI primitives.
            </p>
            <span className="text-xs font-medium text-rose-600">Track in quality review</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

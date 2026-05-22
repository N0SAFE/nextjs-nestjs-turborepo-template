import { BellRing, CheckCircle2, Cloud, Cpu, Database, Globe, MonitorSmartphone, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import type { ComponentType } from 'react'

import { Badge } from '@repo/ui/components/shadcn/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'

interface PreferenceCard {
  title: string
  description: string
  value: string
  helper: string
  icon: ComponentType<{ className?: string }>
}

interface AutomationRule {
  name: string
  summary: string
  cadence: string
  status: 'enabled' | 'paused'
  owner: string
}

interface IntegrationStatus {
  name: string
  endpoint: string
  status: 'connected' | 'degraded' | 'offline'
  description: string
}

const preferenceCards: PreferenceCard[] = [
  {
    title: 'Theme & appearance',
    description: 'Sync dashboard theme with your OS or lock to a specific palette.',
    value: 'System default',
    helper: 'Switches automatically between light and dark at sunset.',
    icon: MonitorSmartphone,
  },
  {
    title: 'Density mode',
    description: 'Choose how compact lists and data tables should render.',
    value: 'Comfortable',
    helper: 'Applies across release metrics, coverage, and package tables.',
    icon: Sparkles,
  },
  {
    title: 'Accessibility overlays',
    description: 'Enable high contrast primitives and larger tap targets.',
    value: 'Adaptive',
    helper: 'Auto-enables for users flagged in SSO accessibility claims.',
    icon: ShieldCheck,
  },
]

const automationRules: AutomationRule[] = [
  {
    name: 'Coverage drift alerts',
    summary: 'Notify platform leads when coverage falls below 75% on main.',
    cadence: 'Checks every 30 minutes',
    status: 'enabled',
    owner: 'Quality guild',
  },
  {
    name: 'Nightly dependency audit',
    summary: 'Runs OSV scan and posts to #release-readiness when new advisories appear.',
    cadence: '1:00 AM UTC daily',
    status: 'enabled',
    owner: 'Platform engineering',
  },
  {
    name: 'Release readiness digest',
    summary: 'Creates Monday morning summary covering FlakySpecs, coverage, and incident hotlist.',
    cadence: 'Mondays at 8 AM local',
    status: 'paused',
    owner: 'Release managers',
  },
]

const integrationStatuses: IntegrationStatus[] = [
  {
    name: 'Coverage source',
    endpoint: '../../coverage/coverage-final.json',
    status: 'connected',
    description: 'Last synced 12 minutes ago from CI pipeline run #4823.',
  },
  {
    name: 'Deployment telemetry',
    endpoint: 'https://api.internal/deploy-metrics',
    status: 'degraded',
    description: 'Latency exceeding 2s median; retrying with exponential backoff.',
  },
  {
    name: 'Slack workspace',
    endpoint: 'slack://release-readiness',
    status: 'connected',
    description: 'Notifications delivered to #release-readiness and #ops-incidents.',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-purple-100/70 bg-linear-to-br from-purple-500/15 via-white to-white p-6 shadow-sm dark:border-purple-900/40 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit bg-purple-500/15 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">Control centre</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard settings</h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Personalise the analytics cockpit, fine-tune refresh cadences, and manage automation rules that keep your team ahead of regressions.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Environment</span>
            <div className="flex items-baseline gap-2 text-slate-900 dark:text-slate-100">
              <span className="text-2xl font-semibold">Production</span>
              <span className="text-xs text-muted-foreground">Auto-provisioned</span>
            </div>
            <p className="text-xs text-muted-foreground">SSO enforced · Audit logging retained for 90 days</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {preferenceCards.map((preference) => {
          const Icon = preference.icon

          return (
            <Card key={preference.title} className="h-full">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-100/90">{preference.title}</CardTitle>
                  <CardDescription>{preference.description}</CardDescription>
                </div>
                <span className="rounded-full bg-purple-500/10 p-2 text-purple-600 dark:text-purple-300">
                  <Icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-semibold text-foreground">{preference.value}</p>
                <p className="text-xs text-muted-foreground">{preference.helper}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Automation & notifications</CardTitle>
              <CardDescription>Orchestrate alerts, digests, and scheduled tasks that keep signal flowing.</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs uppercase tracking-wide">3 workflows</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {automationRules.map((rule) => {
              const isEnabled = rule.status === 'enabled'
              const tone = isEnabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'
              const statusLabel = isEnabled ? 'Enabled' : 'Paused'

              return (
                <div key={rule.name} className="rounded-xl border border-border/60 bg-card/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">Owner: {rule.owner}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{statusLabel}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{rule.summary}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <BellRing className="h-3.5 w-3.5" />
                    <span>{rule.cadence}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Guided setup</CardTitle>
            <CardDescription>Quick actions to help teams land on best-practice defaults.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <Workflow className="h-5 w-5 text-blue-500" />
                <p className="text-sm font-semibold text-foreground">Create incident channel</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">Spin up a Slack triage channel with on-call rotation and default incident roles.</p>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-300">Run guided flow</span>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="text-sm font-semibold text-foreground">Enable Uptime sync</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">Connect status page analytics to correlate incidents with release windows.</p>
              <span className="text-xs font-medium text-emerald-600">Configure uptime bridge</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data sources & integrations</CardTitle>
          <CardDescription>Review connection health for systems powering your analytics.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {integrationStatuses.map((integration) => {
            const statusTone = integration.status === 'connected' ? 'text-emerald-600' : integration.status === 'degraded' ? 'text-amber-600' : 'text-rose-600'
            const statusLabel = integration.status === 'connected' ? 'Connected' : integration.status === 'degraded' ? 'Degraded' : 'Offline'
            const Icon = integration.status === 'connected' ? Cloud : integration.status === 'degraded' ? Globe : Database

            return (
              <div key={integration.name} className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.endpoint}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{integration.description}</p>
                <span className={`text-xs font-medium ${statusTone}`}>{statusLabel}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Execution environment</CardTitle>
          <CardDescription>Snapshot of how the dashboard is currently deployed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-foreground">Runtime</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Next.js 16 · React 19 · running on Bun runtime with Docker orchestrated services.</p>
            <span className="mt-3 text-xs font-medium text-emerald-600">Healthy</span>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-semibold text-foreground">Data retention</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Metrics data retained for 180 days with snapshots archived nightly to cold storage.</p>
            <span className="mt-3 text-xs font-medium text-blue-600">Auto-rotating backups enabled</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

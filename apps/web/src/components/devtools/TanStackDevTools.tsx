'use client'

import React, { useState } from 'react'
import {
    TanStackDevtools,
    type TanStackDevtoolsReactPlugin,
} from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { orpc } from '@/lib/orpc'
import { useQuery } from '@tanstack/react-query'
import { authClient, useSession } from '@/lib/auth'
import MasterTokenProvider, { useMasterToken } from '@/lib/auth/plugins/masterToken/components/provider'
import { hasMasterTokenPlugin } from '@/lib/auth/plugins/guards'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@repo/ui/components/shadcn/dropdown-menu'
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@repo/ui/components/shadcn/popover'
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@repo/ui/components/shadcn/command'
import { Button } from '@repo/ui/components/shadcn/button'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { Switch } from '@repo/ui/components/shadcn/switch'

// Plugin Components
const ReactQueryPlugin: TanStackDevtoolsReactPlugin = {
    id: 'react-query',
    name: 'React Query',
    render: () => (
        <ReactQueryDevtoolsPanel style={{ height: '100%', width: '100%' }} />
    ),
}

// Routes Plugin Component
const RoutesPluginComponent = () => {
    const [loading, setLoading] = useState(false)
    const [routesList, setRoutesList] = useState<{
        path: string
        name: string
        type: 'API' | 'Page' | 'Unknown'
        link?: React.ReactNode
    }[]>([])
    const [routeStats, setRouteStats] = useState<{
        totalRoutes: number
        apiRoutes: number
        pageRoutes: number
        staticRoutes: number
    }>({ totalRoutes: 0, apiRoutes: 0, pageRoutes: 0, staticRoutes: 0 })

    const fetchRoutesData = async () => {
        setLoading(true)
        try {
            const routesModule = await import('@/routes')

            const entries = Object.entries(routesModule) as [string, unknown][]

            const list = await Promise.all(
                entries.map(async ([name, fnOrValue]) => {
                    let path = ''
                    let link: React.ReactNode | undefined

                    if (typeof fnOrValue === 'function') {
                        try {
                            const res = fnOrValue()
                            let awaited: unknown = res
                            if (res && typeof (res as { then: (...args: unknown[]) => Promise<unknown> }).then === 'function') {
                                awaited = await res
                            }

                            // If the helper returned a string, use it
                            if (typeof awaited === 'string') {
                                path = awaited
                            } else if (typeof awaited === 'object' && awaited !== null) {
                                const obj = awaited as Record<string, unknown>
                                // Common shapes: { path }, { url }, { href }, { to }, or a function getPath()
                                if ('path' in obj && typeof obj.path === 'string') {
                                    path = obj.path as string
                                } else if ('url' in obj && typeof obj.url === 'string') {
                                    path = obj.url as string
                                } else if ('href' in obj && typeof obj.href === 'string') {
                                    path = obj.href as string
                                } else if ('to' in obj && typeof obj.to === 'string') {
                                    path = obj.to as string
                                } else if ('getPath' in obj && typeof obj.getPath === 'function') {
                                    try {
                                        const getPath = obj.getPath as () => string | Promise<string>
                                        const p = getPath()
                                        path = typeof p === 'string' ? p : await p
                                    } catch (er) {
                                        console.error('getPath error:', er)
                                    }
                                } else {
                                    const str = String(awaited)
                                    // avoid default [object Object] if possible
                                    path = str && str !== '[object Object]' ? str : name
                                }
                            } else {
                                path = name
                            }
                        } catch (e) {
                            console.error('Route inspection error:', e)
                            path = name
                        }

                        // Check for Link property
                        const fnWithProps = fnOrValue as { Link?: React.FunctionComponent<Record<string, unknown>> }
                        if (fnWithProps.Link) {
                            link = React.createElement(fnWithProps.Link, {}, name)
                        }
                    } else if (typeof fnOrValue === 'string') {
                        path = fnOrValue
                    } else {
                        path = name
                    }

                    const type: 'API' | 'Page' | 'Unknown' =
                        name.toLowerCase().startsWith('getapi') ||
                        name.toLowerCase().startsWith('api') ||
                        String(path).startsWith('/api')
                            ? 'API'
                            : String(path).startsWith('/')
                            ? 'Page'
                            : 'Unknown'

                    return {
                        name,
                        path,
                        type,
                        link,
                    }
                })
            )

            const filtered = list.filter((r) => !r.name.startsWith('__'))
            filtered.sort((a, b) => a.path.localeCompare(b.path))

            const stats = {
                totalRoutes: filtered.length,
                apiRoutes: filtered.filter((r) => r.type === 'API').length,
                pageRoutes: filtered.filter((r) => r.type === 'Page').length,
                staticRoutes: filtered.filter((r) => r.type === 'Unknown').length,
            }

            setRoutesList(filtered)
            setRouteStats(stats)
        } catch (error) {
            console.error('Failed to load routes module:', error)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        void fetchRoutesData()
    }, [])

    return (
        <div className="space-y-4 p-4">
            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">Route Statistics</h3>
                {loading ? (
                    <div>Loading route statistics...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium">
                                Total Routes:
                            </span>
                            <span className="ml-2">{routeStats.totalRoutes}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">API Routes:</span>
                            <span className="ml-2">{routeStats.apiRoutes}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">Page Routes:</span>
                            <span className="ml-2">{routeStats.pageRoutes}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">Static Routes:</span>
                            <span className="ml-2">{routeStats.staticRoutes || 0}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">All Routes</h3>
                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div>Loading routes...</div>
                    ) : routesList && routesList.length ? (
                        <div className="space-y-2">
                            {routesList.map((route, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800"
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className="font-mono text-sm">{route.path}</span>
                                        <span className="text-xs text-gray-400">{route.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {route.link}
                                        <span className="rounded bg-blue-100 px-2 py-1 text-xs dark:bg-blue-900">{route.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>No routes available</div>
                    )}
                </div>
            </div>

            <button
                onClick={fetchRoutesData}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                disabled={loading}
            >
                {loading ? 'Refreshing...' : 'Refresh Routes'}
            </button>
        </div>
    )
}

const RoutesPlugin: TanStackDevtoolsReactPlugin = {
    id: 'routes',
    name: '🗺️ Routes',
    render: () => <RoutesPluginComponent />,
}

// Bundles Plugin Component
const BundlesPluginComponent = () => {
    const [bundleInfo, setBundleInfo] = useState<{
        buildTime: string
        environment: 'development' | 'production' | 'test'
        nextjsVersion: string
        nodeVersion: string
    }>({
        buildTime: '',
        environment: 'development',
        nextjsVersion: '',
        nodeVersion: '',
    })
    const [loading, setLoading] = useState(false)

    const fetchBundleInfo = async () => {
        setLoading(true)
        try {
            // Mock data for now - will be replaced with actual API calls
            const mockBundleInfo = {
                buildTime: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                nextjsVersion: '15.4.0',
                nodeVersion: process.version || '18.0.0',
            }

            setTimeout(() => {
                setBundleInfo(mockBundleInfo)
                setLoading(false)
            }, 800)
        } catch (error) {
            console.error('Failed to fetch bundle info:', error)
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchBundleInfo()
    }, [])

    return (
        <div className="space-y-4 p-4">
            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">
                    Bundle Information
                </h3>
                {loading ? (
                    <div>Loading bundle information...</div>
                ) : bundleInfo ? (
                    <div className="space-y-2">
                        <div>
                            <span className="text-sm font-medium">
                                Build Time:
                            </span>
                            <span className="ml-2">
                                {new Date(
                                    bundleInfo.buildTime
                                ).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Environment:
                            </span>
                            <span className="ml-2">
                                {bundleInfo.environment}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Next.js Version:
                            </span>
                            <span className="ml-2">
                                {bundleInfo.nextjsVersion}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Node Version:
                            </span>
                            <span className="ml-2">
                                {bundleInfo.nodeVersion}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>No bundle information available</div>
                )}
            </div>

            <button
                onClick={fetchBundleInfo}
                className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                disabled={loading}
            >
                {loading ? 'Refreshing...' : 'Refresh Bundle Info'}
            </button>
        </div>
    )
}

const BundlesPlugin: TanStackDevtoolsReactPlugin = {
    id: 'bundles',
    name: '📦 Bundles',
    render: () => <BundlesPluginComponent />,
}

// CLI Plugin Component
const CLIPluginComponent = () => {
    const [envInfo, setEnvInfo] = useState<{
        platform: 'MacIntel' | 'Win32' | 'Linux x86_64'
        arch: string
        nodeVersion: string
        cpuUsage: number
        uptime: number
    }>({
        platform: 'MacIntel',
        arch: 'x64',
        nodeVersion: '14.17.0',
        cpuUsage: 0,
        uptime: 0,
    })
    const [loading, setLoading] = useState(false)

    const fetchEnvInfo = async () => {
        setLoading(true)
        try {
            // Get actual browser environment info
            const mockEnvInfo = {
                platform: navigator.platform || 'Unknown',
                arch: 'Browser',
                nodeVersion: 'N/A (Browser)',
                cpuUsage: Math.random() * 20, // Mock CPU usage
                uptime: performance.now() / 1000, // Uptime in seconds
            }

            setTimeout(() => {
                setEnvInfo(mockEnvInfo)
                setLoading(false)
            }, 600)
        } catch (error) {
            console.error('Failed to fetch environment info:', error)
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchEnvInfo()
    }, [])

    return (
        <div className="space-y-4 p-4">
            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">
                    Environment Information
                </h3>
                {loading ? (
                    <div>Loading environment information...</div>
                ) : envInfo ? (
                    <div className="space-y-2">
                        <div>
                            <span className="text-sm font-medium">
                                Platform:
                            </span>
                            <span className="ml-2">{envInfo.platform}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Architecture:
                            </span>
                            <span className="ml-2">{envInfo.arch}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Node Version:
                            </span>
                            <span className="ml-2">{envInfo.nodeVersion}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                CPU Usage:
                            </span>
                            <span className="ml-2">
                                {envInfo.cpuUsage?.toFixed(2)}%
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">Uptime:</span>
                            <span className="ml-2">
                                {Math.round(envInfo.uptime / 60)} minutes
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>No environment information available</div>
                )}
            </div>

            <button
                onClick={fetchEnvInfo}
                className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                disabled={loading}
            >
                {loading ? 'Refreshing...' : 'Refresh Environment'}
            </button>
        </div>
    )
}

const CLIPlugin: TanStackDevtoolsReactPlugin = {
    id: 'cli',
    name: '⚡ CLI',
    render: () => <CLIPluginComponent />,
}

// Auth Plugin Component
const AuthPluginComponent = () => {
    return (
        <div className="space-y-4 p-4">
            {hasMasterTokenPlugin(authClient) ? (
                <ConfiguredAuth />
            ) : (
                <div className="p-4">Auth client not configured</div>
            )}
        </div>
    )
}

const ConfiguredAuth = () => {
    const { enabled: devAuthEnabled, setEnabled } = useMasterToken()
    const [authConfig, setAuthConfig] = useState<{
        databaseUrl: string
        baseUrl: string
        secret: string
        trustHost: boolean
    }>({
        databaseUrl: 'Not configured',
        baseUrl:
            typeof window !== 'undefined'
                ? window.location.origin
                : 'http://localhost:3000',
        secret: 'configured',
        trustHost: true,
    })
    const [loading, setLoading] = useState(false)

    // Search term for filtering users (driven by the UserSelector's Command input)
    const [userSearch, setUserSearch] = useState('')
    // Debounced setter to avoid querying on every keystroke
    const debouncedSetUserSearch = React.useRef<NodeJS.Timeout | null>(null)

    // Use TanStack Query for user data
    const usersQuery = useQuery(
        orpc.user.list.queryOptions({
            input: {
                pagination: {
                    limit: 20,
                    offset: 0,
                },
                sort: {
                    direction: 'asc',
                    field: 'email',
                },
                // Server-side filter, only include when non-empty
                filter: userSearch ? { name: userSearch } : undefined,
            },
            context: {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEV_AUTH_KEY}`,
                },
                noRedirectOnUnauthorized: true,
            },
        })
    )

    const {
        data: usersData,
        isLoading: usersLoading,
        refetch: refetchUsers,
    } = usersQuery

    const fetchAuthConfig = async () => {
        setLoading(true)
        try {
            // Mock auth configuration
            const mockAuthConfig = {
                databaseUrl: process.env.DATABASE_URL || 'Not configured',
                baseUrl:
                    typeof window !== 'undefined'
                        ? window.location.origin
                        : 'http://localhost:3000',
                secret: 'configured', // Never expose actual secret
                trustHost: true,
            }

            setTimeout(() => {
                setAuthConfig(mockAuthConfig)
                setLoading(false)
            }, 500)
        } catch (error) {
            console.error('Failed to fetch auth config:', error)
            setLoading(false)
        }
    }

    const { data: session, refetch } = useSession()

    // placeholder; actual toggle handled inside AuthPluginComponent via context

    return (
        <>
            {/* Dev Auth Status Banner */}
            {devAuthEnabled && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                    <div className="flex items-center space-x-2">
                        <span className="text-orange-600 dark:text-orange-400">
                            🔑
                        </span>
                        <div>
                            <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                Dev Auth Token Mode Active
                            </h4>
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                All API requests are using Bearer token
                                authentication with admin privileges
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">
                    Authentication Configuration
                </h3>
                {loading ? (
                    <div>Loading authentication configuration...</div>
                ) : authConfig ? (
                    <div className="space-y-2">
                        <div>
                            <span className="text-sm font-medium">
                                Database URL:
                            </span>
                            <span className="ml-2 font-mono text-xs">
                                {authConfig.databaseUrl !== 'Not configured'
                                    ? '***' + authConfig.databaseUrl.slice(-10)
                                    : 'Not configured'}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Base URL:
                            </span>
                            <span className="ml-2">{authConfig.baseUrl}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">Secret:</span>
                            <span className="ml-2">
                                {authConfig.secret === 'configured'
                                    ? '*** (configured)'
                                    : 'Not configured'}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Trust Host:
                            </span>
                            <span className="ml-2">
                                {authConfig.trustHost ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>No authentication configuration available</div>
                )}
            </div>

            {/* Dev Auth Token Toggle */}
            <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium">
                            Dev Auth Token Mode
                        </h4>
                        <p className="text-xs text-gray-500">
                            Use Bearer token for all API requests (bypasses
                            normal auth)
                        </p>
                        {devAuthEnabled && (
                            <p className="mt-1 text-xs text-orange-600">
                                ⚠️ Active: All requests use admin Bearer token
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="flex items-center space-x-3">
                            <Switch
                                checked={devAuthEnabled}
                                onCheckedChange={(val: boolean) =>
                                    setEnabled(Boolean(val))
                                }
                                aria-label="Enable Dev Auth"
                            />
                            <span className="text-sm">Enable Dev Auth</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* User selector (autocomplete) */}
            <div className="rounded-lg border p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Login As</h4>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => refetchUsers()}
                            className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600"
                            disabled={usersLoading}
                        >
                            {usersLoading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">
                        Select user
                    </label>
                    <div>
                        {/* Popover + Command based combobox */}
                        <UserSelector
                                onSearchChange={(v) => {
                                    if (debouncedSetUserSearch.current)
                                        clearTimeout(debouncedSetUserSearch.current)
                                    debouncedSetUserSearch.current = setTimeout(
                                        () => setUserSearch(v),
                                        300
                                    )
                                }}
                                    users={usersData?.users || []}
                                    loading={usersLoading}
                                    selectedUserId={session?.user?.id}
                                    selectedUserName={session?.user?.name || session?.user?.email}
                                    onSelect={async (userId: string) => {
                                try {
                                    if (authClient?.loginAs) {
                                        await authClient.loginAs(
                                            { userId },
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEV_AUTH_KEY}`,
                                                },
                                            }
                                        )
                                        await refetch()
                                        return
                                    }

                                    const apiBase =
                                        process.env.NEXT_PUBLIC_API_URL || ''
                                    const url =
                                        (apiBase.replace(/\/$/, '') || '') +
                                        '/api/auth/dev/login-as'

                                    const resp = await fetch(url, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEV_AUTH_KEY}`,
                                        },
                                        body: JSON.stringify({ userId }),
                                    })

                                    if (!resp.ok) {
                                        console.error(
                                            'Login as failed',
                                            resp.statusText
                                        )
                                        alert(
                                            'Login as failed: ' +
                                                resp.statusText
                                        )
                                        return
                                    }

                                    const data = await resp.json()
                                    alert(
                                        `Logged as ${data.user?.id} - session: ${data.session?.id}`
                                    )
                                } catch (err) {
                                    console.error('Login as error', err)
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={fetchAuthConfig}
                className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
                disabled={loading}
            >
                {loading ? 'Refreshing...' : 'Refresh Auth Config'}
            </button>
        </>
    )
}

const AuthPlugin: TanStackDevtoolsReactPlugin = {
    id: 'auth',
    name: '🔐 Auth',
    render: () => <AuthPluginComponent />,
}

// UserSelector component: Popover + Command based combobox
function UserSelector({
    users,
    loading,
    selectedUserId,
    selectedUserName,
    onSelect,
    onSearchChange,
}: {
    users: Array<{ id: string; name?: string; email: string }>
    loading: boolean
    selectedUserId?: string | null
    selectedUserName?: string | null
    onSelect: (userId: string) => void | Promise<void>
    onSearchChange?: (v: string) => void
}) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState('')
    const [query, setQuery] = React.useState('')

    React.useEffect(() => {
        if (selectedUserId) setValue(selectedUserId)
    }, [selectedUserId])

    const frameworks = users.map((u) => ({
        value: u.id,
        label: u.name || u.email,
    }))

    // Ensure the selected user is always present in the list, even if the
    // server filter excluded them. This keeps the selected value visible.
    if (selectedUserId) {
        const exists = frameworks.find((f) => f.value === selectedUserId)
        if (!exists) {
            frameworks.unshift({ value: selectedUserId, label: selectedUserName || selectedUserId })
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <style>
                {`
                [data-radix-popper-content-wrapper] > ._devtool-user-popover {
                    z-index: 100000 !important;
                }
                `}
            </style>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between"
                >
                    {value
                        ? frameworks.find((f) => f.value === value)?.label
                        : 'Select user...'}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="_devtool-user-popover w-[300px] p-0">
                <Command>
                    <CommandInput
                        placeholder={
                            loading ? 'Loading users...' : 'Search users...'
                        }
                        onValueChange={(v: string) => {
                            setQuery(v)
                            if (onSearchChange) onSearchChange(v)
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                            {frameworks
                                .filter((f) =>
                                    f.label
                                        .toLowerCase()
                                        .includes(query.toLowerCase())
                                )
                                .map((framework) => (
                                    <CommandItem
                                        key={framework.value}
                                        value={framework.value}
                                        onSelect={(currentValue) => {
                                            const selected =
                                                currentValue as string
                                            setValue(
                                                selected === value
                                                    ? ''
                                                    : selected
                                            )
                                            setOpen(false)
                                            void onSelect(selected)
                                        }}
                                    >
                                        <CheckIcon
                                            className={
                                                'mr-2 h-4 w-4 ' +
                                                (value === framework.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0')
                                            }
                                        />
                                        {framework.label}
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// Drizzle Studio Plugin Component
const DrizzleStudioPluginComponent = () => {
    const studioUrl = `https://local.drizzle.studio`

    const openStudio = () => {
        if (typeof window !== 'undefined') window.open(studioUrl, '_blank')
    }

    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(studioUrl)
        } catch (err) {
            console.error('Copy failed', err)
        }
    }

    const reloadIframe = (iframeId: string) => {
        const el = document.getElementById(iframeId) as HTMLIFrameElement | null
        if (el) el.src = el.src
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-3">
                <div>
                    <h3 className="text-lg font-semibold">Drizzle Studio</h3>
                    <p className="text-sm text-gray-500">
                        Embedded Drizzle Studio for database exploration
                    </p>
                </div>

                <style>
                    {`
                        [data-radix-popper-content-wrapper] > ._devtool-studio-popover {
                            z-index: 100000 !important;
                        }
                    `}
                </style>

                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="_devtool-studio-popover">
                            <DropdownMenuItem onClick={openStudio}>
                                Open in new tab
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={copyUrl}>
                                Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    reloadIframe('drizzle-studio-iframe')
                                }
                            >
                                Reload
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="min-h-0 flex-1 p-2">
                <iframe
                    id="drizzle-studio-iframe"
                    title="Drizzle Studio"
                    src={studioUrl}
                    className="h-full w-full border-0"
                />
            </div>
        </div>
    )
}

const DrizzleStudioPlugin: TanStackDevtoolsReactPlugin = {
    id: 'drizzle-studio',
    name: '🧭 Drizzle Studio',
    render: () => <DrizzleStudioPluginComponent />,
}

// API URL Reference Plugin Component
const ApiUrlPluginComponent = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || ''
    const referenceUrl = apiUrl ? `${apiUrl.replace(/\/$/, '')}/reference` : ''
    const [status, setStatus] = useState<string>('unknown')
    const [checking, setChecking] = useState(false)

    const copyApiUrl = async () => {
        try {
            await navigator.clipboard.writeText(apiUrl)
        } catch (err) {
            console.error('Copy failed', err)
        }
    }

    const openApiUrl = () => {
        if (!apiUrl) return
        if (typeof window !== 'undefined') window.open(apiUrl, '_blank')
    }

    const reloadIframe = (iframeId: string) => {
        const el = document.getElementById(iframeId) as HTMLIFrameElement | null
        if (el) el.src = el.src
    }

    const checkHealth = async () => {
        if (!apiUrl) return
        setChecking(true)
        try {
            const resp = await fetch(apiUrl + '/health', { method: 'GET' })
            setStatus(
                resp.ok ? `OK (${resp.status})` : `Error (${resp.status})`
            )
        } catch (err) {
            console.error('Health check error:', err)
            setStatus('unreachable')
        } finally {
            setChecking(false)
        }
    }

    React.useEffect(() => {
        if (apiUrl) checkHealth()
    }, [apiUrl])

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-3">
                <div>
                    <h3 className="text-lg font-semibold">API URL Reference</h3>
                    <p className="text-sm text-gray-500">
                        API endpoint and interactive reference
                    </p>
                </div>

                <style>
                    {`
                        [data-radix-popper-content-wrapper] > ._devtool-studio-popover {
                            z-index: 100000 !important;
                        }
                    `}
                </style>

                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="_devtool-studio-popover">
                            <DropdownMenuItem onClick={openApiUrl}>
                                Open API Root
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={copyApiUrl}>
                                Copy API URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    reloadIframe('api-reference-iframe')
                                }
                            >
                                Reload Reference
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={checkHealth}>
                                {checking ? 'Checking...' : 'Check Health'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="min-h-0 flex-1 p-2">
                {referenceUrl ? (
                    <iframe
                        id="api-reference-iframe"
                        title="API Reference"
                        src={referenceUrl}
                        className="h-full w-full border-0"
                    />
                ) : (
                    <div className="rounded-lg border p-4">
                        <div className="text-sm">API URL not configured</div>
                    </div>
                )}
            </div>

            <div className="p-2">
                <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">
                        {apiUrl || 'Not configured'}
                    </span>
                    <span className="text-sm text-gray-500">
                        Health: {status}
                    </span>
                </div>
            </div>
        </div>
    )
}

const ApiUrlPlugin: TanStackDevtoolsReactPlugin = {
    id: 'api-url',
    name: '🔗 API URL',
    render: () => <ApiUrlPluginComponent />,
}

// Define all plugins
const plugins: TanStackDevtoolsReactPlugin[] = [
    ReactQueryPlugin,
    RoutesPlugin,
    BundlesPlugin,
    CLIPlugin,
    AuthPlugin,
    DrizzleStudioPlugin,
    ApiUrlPlugin,
]

export interface TanStackDevToolsProps {
    /**
     * Whether to show the devtools in production
     * @default false
     */
    showInProduction?: boolean
}

export const TanStackDevTools: React.FC<TanStackDevToolsProps> = ({
    showInProduction = false,
}) => {
    // Only show in development by default, unless explicitly enabled for production
    if (process.env.NODE_ENV === 'production' && !showInProduction) {
        return null
    }

    const providers: React.FC<{ children: React.ReactNode }>[] = []
    if (hasMasterTokenPlugin(authClient)) {
        providers.push(({ children }) => (
            <MasterTokenProvider>{children}</MasterTokenProvider>
        ))
    }

    const handleProvider = (
        children: React.ReactNode,
        index: number = 0
    ): React.ReactNode => {
        const Provider = providers[index]
        if (!Provider) return children
        return <Provider>{handleProvider(children, index + 1)}</Provider>
    }

    return handleProvider(
        <TanStackDevtools
            plugins={plugins}
            config={{
                position: 'bottom-right',
                panelLocation: 'bottom',
            }}
        />
    )
}

export default TanStackDevTools

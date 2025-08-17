'use client'

import React, { useState } from 'react'
import {
    TanStackDevtools,
    type TanStackDevtoolsReactPlugin,
} from '@tanstack/react-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Plugin Components
const ReactQueryPlugin: TanStackDevtoolsReactPlugin = {
    id: 'react-query',
    name: 'React Query',
    render: () => (
        <div style={{ height: '100%', width: '100%' }}>
            <ReactQueryDevtools
                initialIsOpen={false}
                buttonPosition="bottom-left"
                position="bottom"
            />
        </div>
    ),
}

// Routes Plugin Component
const RoutesPluginComponent = () => {
    const [loading, setLoading] = useState(false)
    const [routes, setRoutes] = useState<{
        routes: { path: string; type: string }[]
    }>({ routes: [] })
    const [routeStats, setRouteStats] = useState<{
        totalRoutes: number
        apiRoutes: number
        pageRoutes: number
        staticRoutes: number
    }>({ totalRoutes: 0, apiRoutes: 0, pageRoutes: 0, staticRoutes: 0 })

    const fetchRoutesData = async () => {
        setLoading(true)
        try {
            // Mock data for now - will be replaced with actual API calls
            const mockRoutes = {
                routes: [
                    { path: '/api/auth/signin', type: 'API' },
                    { path: '/api/auth/signout', type: 'API' },
                    { path: '/dashboard', type: 'Page' },
                    { path: '/profile', type: 'Page' },
                    { path: '/', type: 'Page' },
                ],
            }
            const mockStats = {
                totalRoutes: 5,
                apiRoutes: 2,
                pageRoutes: 3,
                staticRoutes: 0,
            }

            setTimeout(() => {
                setRoutes(mockRoutes)
                setRouteStats(mockStats)
                setLoading(false)
            }, 1000)
        } catch (error) {
            console.error('Failed to fetch routes:', error)
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchRoutesData()
    }, [])

    return (
        <div className="space-y-4 p-4">
            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">Route Statistics</h3>
                {loading ? (
                    <div>Loading route statistics...</div>
                ) : routeStats ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium">
                                Total Routes:
                            </span>
                            <span className="ml-2">
                                {routeStats.totalRoutes}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                API Routes:
                            </span>
                            <span className="ml-2">{routeStats.apiRoutes}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Page Routes:
                            </span>
                            <span className="ml-2">
                                {routeStats.pageRoutes}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Static Routes:
                            </span>
                            <span className="ml-2">
                                {routeStats.staticRoutes || 0}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>No route data available</div>
                )}
            </div>

            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">All Routes</h3>
                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div>Loading routes...</div>
                    ) : routes && routes.routes ? (
                        <div className="space-y-2">
                            {routes.routes.map(
                                (
                                    route: { path: string; type: string },
                                    index: number
                                ) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800"
                                    >
                                        <span className="font-mono text-sm">
                                            {route.path}
                                        </span>
                                        <span className="rounded bg-blue-100 px-2 py-1 text-xs dark:bg-blue-900">
                                            {route.type}
                                        </span>
                                    </div>
                                )
                            )}
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

    React.useEffect(() => {
        fetchAuthConfig()
    }, [])

    return (
        <div className="space-y-4 p-4">
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

            <button
                onClick={fetchAuthConfig}
                className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
                disabled={loading}
            >
                {loading ? 'Refreshing...' : 'Refresh Auth Config'}
            </button>
        </div>
    )
}

const AuthPlugin: TanStackDevtoolsReactPlugin = {
    id: 'auth',
    name: '🔐 Auth',
    render: () => <AuthPluginComponent />,
}

// Logs Plugin Component
const LogsPluginComponent = () => {
    const [logStats, setLogStats] = useState<{
        totalLogs: number
        errorLogs: number
        warningLogs: number
        infoLogs: number
    }>({
        totalLogs: 0,
        errorLogs: 0,
        warningLogs: 0,
        infoLogs: 0,
    })
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<
        {
            level: string
            message: string
            timestamp: string
        }[]
    >([])

    const fetchLogStats = async () => {
        setLoading(true)
        try {
            // Mock log statistics
            const mockLogStats = {
                totalLogs: Math.floor(Math.random() * 1000) + 100,
                errorLogs: Math.floor(Math.random() * 50) + 5,
                warningLogs: Math.floor(Math.random() * 100) + 10,
                infoLogs: Math.floor(Math.random() * 500) + 50,
            }

            // Mock recent logs
            const mockLogs = [
                {
                    level: 'info',
                    message: 'Application started',
                    timestamp: new Date().toISOString(),
                },
                {
                    level: 'warning',
                    message: 'Deprecated API usage detected',
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                },
                {
                    level: 'error',
                    message: 'Failed to connect to database',
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                },
                {
                    level: 'info',
                    message: 'User authenticated successfully',
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                },
            ]

            setTimeout(() => {
                setLogStats(mockLogStats)
                setLogs(mockLogs)
                setLoading(false)
            }, 700)
        } catch (error) {
            console.error('Failed to fetch log stats:', error)
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchLogStats()
    }, [])

    const getLogLevelColor = (level: string) => {
        switch (level) {
            case 'error':
                return 'text-red-600'
            case 'warning':
                return 'text-yellow-600'
            case 'info':
                return 'text-blue-600'
            default:
                return 'text-gray-600'
        }
    }

    return (
        <div className="space-y-4 p-4">
            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">Log Statistics</h3>
                {loading ? (
                    <div>Loading log statistics...</div>
                ) : logStats ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium">
                                Total Logs:
                            </span>
                            <span className="ml-2">{logStats.totalLogs}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Error Logs:
                            </span>
                            <span className="ml-2 text-red-600">
                                {logStats.errorLogs}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Warning Logs:
                            </span>
                            <span className="ml-2 text-yellow-600">
                                {logStats.warningLogs}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium">
                                Info Logs:
                            </span>
                            <span className="ml-2 text-blue-600">
                                {logStats.infoLogs}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>No log statistics available</div>
                )}
            </div>

            <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-semibold">Recent Logs</h3>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            className="rounded bg-gray-50 p-2 text-sm dark:bg-gray-800"
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={`font-medium ${getLogLevelColor(log.level)}`}
                                >
                                    [{log.level.toUpperCase()}]
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(
                                        log.timestamp
                                    ).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="mt-1">{log.message}</div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={fetchLogStats}
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                disabled={loading}
            >
                {loading ? 'Refreshing...' : 'Refresh Logs'}
            </button>
        </div>
    )
}

const LogsPlugin: TanStackDevtoolsReactPlugin = {
    id: 'logs',
    name: '📝 Logs',
    render: () => <LogsPluginComponent />,
}

// Define all plugins
const plugins: TanStackDevtoolsReactPlugin[] = [
    ReactQueryPlugin,
    RoutesPlugin,
    BundlesPlugin,
    CLIPlugin,
    AuthPlugin,
    LogsPlugin,
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

    return (
        <TanStackDevtools
            plugins={plugins}
            config={{
                defaultOpen: false,
                position: 'bottom-right',
                panelLocation: 'bottom',
                hideUntilHover: false,
                openHotkey: ['Shift', 'D'], // Changed from default Shift+A to Shift+D for DevTools
                requireUrlFlag: false,
            }}
        />
    )
}

export default TanStackDevTools

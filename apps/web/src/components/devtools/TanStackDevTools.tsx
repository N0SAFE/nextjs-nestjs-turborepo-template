'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
    TanStackDevtools,
    type TanStackDevtoolsReactPlugin,
} from '@tanstack/react-devtools'
import {
    ReactQueryDevtoolsPanel,
} from '@tanstack/react-query-devtools'
import { orpc } from '@/lib/orpc'
import { getDevAuthEnabled, setDevAuthEnabled, clearDevAuth } from '@/lib/dev-auth-cookie'
import { useQuery } from '@tanstack/react-query'

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
    const [devAuthEnabled, setDevAuthEnabledState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return getDevAuthEnabled()
        }
        return false
    })

    // User datatable state - simplified for useQuery
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    })
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'updatedAt'>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Use TanStack Query for user data
    const usersQuery = useQuery(
        orpc.user.list.queryOptions({
            input: {
                pagination: {
                    limit: pagination.limit,
                    offset: (pagination.page - 1) * pagination.limit,
                },
                sort: {
                    field: sortBy,
                    direction: sortOrder,
                },
            }
        })
    )

    const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = usersQuery

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

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleSort = (field: 'name' | 'email' | 'createdAt' | 'updatedAt') => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
        setSortBy(field)
        setSortOrder(newOrder)
    }

    const toggleDevAuth = () => {
        const newValue = !devAuthEnabled
        setDevAuthEnabledState(newValue)
        setDevAuthEnabled(newValue)
        
        if (newValue) {
            console.log('🔑 Dev auth token mode enabled - future requests will use Bearer token authentication')
        } else {
            console.log('🔓 Dev auth token mode disabled - using normal cookie authentication')
        }
    }

    React.useEffect(() => {
        fetchAuthConfig()
        
        // Log dev auth configuration status
        if (process.env.NODE_ENV === 'development') {
            const hasDevAuthKey = !!process.env.NEXT_PUBLIC_DEV_AUTH_KEY;
            console.log('🔧 DevTools Auth Plugin initialized:', {
                devAuthEnabled: devAuthEnabled,
                hasDevAuthKey: hasDevAuthKey,
                devAuthKey: hasDevAuthKey ? `${process.env.NEXT_PUBLIC_DEV_AUTH_KEY?.slice(0, 8)}...` : 'Not configured'
            });
        }
    }, [])

    return (
        <div className="space-y-4 p-4">
            {/* Dev Auth Status Banner */}
            {devAuthEnabled && (
                <div className="rounded-lg border-orange-200 bg-orange-50 border p-4 dark:bg-orange-900/20 dark:border-orange-800">
                    <div className="flex items-center space-x-2">
                        <span className="text-orange-600 dark:text-orange-400">🔑</span>
                        <div>
                            <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                Dev Auth Token Mode Active
                            </h4>
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                All API requests are using Bearer token authentication with admin privileges
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
                        <h4 className="text-sm font-medium">Dev Auth Token Mode</h4>
                        <p className="text-xs text-gray-500">
                            Use Bearer token for all API requests (bypasses normal auth)
                        </p>
                        {devAuthEnabled && (
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Active: All requests use admin Bearer token
                            </p>
                        )}
                    </div>
                    <button
                        onClick={toggleDevAuth}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            devAuthEnabled ? 'bg-orange-600' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                devAuthEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* User Datatable */}
            <div className="rounded-lg border p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Users</h4>
                    <div className="flex items-center space-x-2">
                        <select
                            value={pagination.limit}
                            onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                            className="rounded border px-2 py-1 text-sm"
                        >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                        </select>
                        <button
                            onClick={() => refetchUsers()}
                            className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600"
                            disabled={usersLoading}
                        >
                            {usersLoading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center space-x-1 hover:text-blue-600"
                                    >
                                        <span>Name</span>
                                        {sortBy === 'name' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="p-2 text-left">
                                    <button
                                        onClick={() => handleSort('email')}
                                        className="flex items-center space-x-1 hover:text-blue-600"
                                    >
                                        <span>Email</span>
                                        {sortBy === 'email' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="p-2 text-left">
                                    <button
                                        onClick={() => handleSort('createdAt')}
                                        className="flex items-center space-x-1 hover:text-blue-600"
                                    >
                                        <span>Created</span>
                                        {sortBy === 'createdAt' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                                <th className="p-2 text-left">
                                    <button
                                        onClick={() => handleSort('updatedAt')}
                                        className="flex items-center space-x-1 hover:text-blue-600"
                                    >
                                        <span>Updated</span>
                                        {sortBy === 'updatedAt' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : usersData?.users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                usersData?.users.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-2">
                                            <div className="flex items-center space-x-2">
                                                {user.image && (
                                                    <Image
                                                        src={user.image}
                                                        alt={user.name}
                                                        width={24}
                                                        height={24}
                                                        className="h-6 w-6 rounded-full"
                                                    />
                                                )}
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {user.email}
                                            </span>
                                            {user.emailVerified && (
                                                <span className="ml-2 text-green-600">✓</span>
                                            )}
                                        </td>
                                        <td className="p-2 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-2 text-sm text-gray-500">
                                            {new Date(user.updatedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {usersData && usersData.meta.pagination.total > pagination.limit && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, usersData.meta.pagination.total)} of {usersData.meta.pagination.total} users
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="rounded border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm">
                                Page {pagination.page} of {Math.ceil(usersData.meta.pagination.total / pagination.limit)}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= Math.ceil(usersData.meta.pagination.total / pagination.limit)}
                                className="rounded border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
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

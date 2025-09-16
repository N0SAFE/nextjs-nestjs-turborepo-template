import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'
import React from 'react'

// Setup for Next.js components testing
beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
})

// Mock Next.js router
vi.mock('next/router', () => ({
    useRouter() {
        return {
            route: '/',
            pathname: '/',
            query: {},
            asPath: '/',
            push: vi.fn(),
            pop: vi.fn(),
            reload: vi.fn(),
            back: vi.fn(),
            prefetch: vi.fn(),
            beforePopState: vi.fn(),
            events: {
                on: vi.fn(),
                off: vi.fn(),
                emit: vi.fn(),
            },
            isFallback: false,
        }
    },
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: vi.fn(),
            replace: vi.fn(),
            prefetch: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
            refresh: vi.fn(),
        }
    },
    useSearchParams() {
        return new URLSearchParams()
    },
    usePathname() {
        return '/'
    },
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        return React.createElement('img', props)
    },
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
    default: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
        return React.createElement('a', props, children)
    },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock environment variables using vi.stubEnv
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001')

// Mock the #/env module (generated at runtime)
vi.mock('#/env', () => ({
    envSchema: {
        parse: vi.fn().mockReturnValue({
            NODE_ENV: 'test',
            NEXT_PUBLIC_API_URL: 'http://localhost:3001',
            NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
            API_URL: 'http://localhost:3001',
            NEXT_PUBLIC_DEBUG: { patterns: [], enableAll: false },
        }),
        safeParse: vi.fn().mockReturnValue({
            success: true,
            data: {
                NODE_ENV: 'test',
                NEXT_PUBLIC_API_URL: 'http://localhost:3001',
                NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
                API_URL: 'http://localhost:3001',
                NEXT_PUBLIC_DEBUG: { patterns: [], enableAll: false },
            },
        }),
        shape: {
            NODE_ENV: {
                parse: vi.fn().mockReturnValue('test'),
            },
            NEXT_PUBLIC_API_URL: {
                parse: vi.fn().mockReturnValue('http://localhost:3001'),
            },
            NEXT_PUBLIC_APP_URL: {
                parse: vi.fn().mockReturnValue('http://localhost:3000'),
            },
            API_URL: {
                parse: vi.fn().mockReturnValue('http://localhost:3001'),
            },
            NEXT_PUBLIC_DEBUG: {
                parse: vi.fn().mockReturnValue({ patterns: [], enableAll: false }),
            },
        },
    },
    validateEnvSafe: vi.fn().mockReturnValue({
        success: true,
        data: {
            NODE_ENV: 'test',
            NEXT_PUBLIC_API_URL: 'http://localhost:3001',
            NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
            API_URL: 'http://localhost:3001',
            NEXT_PUBLIC_DEBUG: { patterns: [], enableAll: false },
        },
    }),
    envIsValid: vi.fn().mockReturnValue(true),
    validateEnv: vi.fn().mockReturnValue({
        NODE_ENV: 'test',
        NEXT_PUBLIC_API_URL: 'http://localhost:3001',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        API_URL: 'http://localhost:3001',
        NEXT_PUBLIC_DEBUG: { patterns: [], enableAll: false },
    }),
    validateEnvPath: vi.fn().mockImplementation((input, path) => {
        const mockEnv: Record<string, string> = {
            NODE_ENV: 'test',
            NEXT_PUBLIC_API_URL: 'http://localhost:3001',
            NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
            API_URL: 'http://localhost:3001',
            NEXT_PUBLIC_DEBUG: '{ patterns: [], enableAll: false }',
        }
        return mockEnv[path] || input
    }),
}))

// Mock the @/routes module (declarative routes generated at runtime)
vi.mock('@/routes', () => {
    // Create a mock function that behaves like the actual route functions
    const createRouteMock = (defaultPath: string) => {
        const routeFunction = vi.fn().mockImplementation((params = {}, search = {}) => {
            // Handle parameters in the path
            let path = defaultPath
            Object.entries(params).forEach(([key, value]) => {
                path = path.replace(`[${key}]`, String(value))
            })
            
            // Handle search parameters
            const searchParams = new URLSearchParams()
            Object.entries(search).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value))
                }
            })
            
            const searchString = searchParams.toString()
            return searchString ? `${path}?${searchString}` : path
        })

        // Add Link property for Next.js Link compatibility
        Object.defineProperty(routeFunction, 'Link', {
            value: vi.fn().mockImplementation(({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
                return React.createElement('a', { ...props, href: defaultPath }, children)
            }),
            writable: true,
            enumerable: true,
            configurable: true
        })

        return routeFunction
    }

    return {
        // Route functions from the actual routes/index.ts
        Middlewareerrorenv: createRouteMock('/middleware/error/env'),
        MiddlewareerrorhealthCheck: createRouteMock('/middleware/error/healthCheck'),
        Autherror: createRouteMock('/auth/error'),
        Authme: createRouteMock('/auth/me'),
        Authsignin: createRouteMock('/auth/signin'),
        Authsignup: createRouteMock('/auth/signup'),
        Dashboard: createRouteMock('/dashboard'),
        DashboardProjects: createRouteMock('/dashboard/projects'),
        DashboardProjectsId: createRouteMock('/dashboard/projects/[id]'),
        Profile: createRouteMock('/profile'),
        Home: createRouteMock('/'), // Assuming there's a home route
        
        // API route functions
        getApiServerHealth: vi.fn().mockReturnValue('/api/server/health'),
        getApiServerPing: vi.fn().mockReturnValue('/api/server/ping'),
    }
})

// Mock @/routes/index for specific imports (in case some modules import from index specifically)
vi.mock('@/routes/index', () => {
    // Create a mock function that behaves like the actual route functions
    const createRouteMock = (defaultPath: string) => {
        const routeFunction = vi.fn().mockImplementation((params = {}, search = {}) => {
            // Handle parameters in the path
            let path = defaultPath
            Object.entries(params).forEach(([key, value]) => {
                path = path.replace(`[${key}]`, String(value))
            })
            
            // Handle search parameters
            const searchParams = new URLSearchParams()
            Object.entries(search).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value))
                }
            })
            
            const searchString = searchParams.toString()
            return searchString ? `${path}?${searchString}` : path
        })

        // Add Link property for Next.js Link compatibility
        Object.defineProperty(routeFunction, 'Link', {
            value: vi.fn().mockImplementation(({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
                return React.createElement('a', { ...props, href: defaultPath }, children)
            }),
            writable: true,
            enumerable: true,
            configurable: true
        })

        return routeFunction
    }

    return {
        // Route functions from the actual routes/index.ts
        Middlewareerrorenv: createRouteMock('/middleware/error/env'),
        MiddlewareerrorhealthCheck: createRouteMock('/middleware/error/healthCheck'),
        Autherror: createRouteMock('/auth/error'),
        Authme: createRouteMock('/auth/me'),
        Authsignin: createRouteMock('/auth/signin'),
        Authsignup: createRouteMock('/auth/signup'),
        Dashboard: createRouteMock('/dashboard'),
        DashboardProjects: createRouteMock('/dashboard/projects'),
        DashboardProjectsId: createRouteMock('/dashboard/projects/[id]'),
        Profile: createRouteMock('/profile'),
        Home: createRouteMock('/'), // Assuming there's a home route
        
        // API route functions
        getApiServerHealth: vi.fn().mockReturnValue('/api/server/health'),
        getApiServerPing: vi.fn().mockReturnValue('/api/server/ping'),
    }
})

// Mock @/routes/hooks for route hooks
vi.mock('@/routes/hooks', () => ({
    useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
    usePush: vi.fn().mockReturnValue(vi.fn()),
    useParams: vi.fn().mockReturnValue({}),
}))

import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'
import React from 'react'

beforeEach(() => {
    vi.clearAllMocks()
})

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

vi.mock('next/image', () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        return React.createElement('img', props)
    },
}))

vi.mock('next/link', () => ({
    default: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => {
        return React.createElement('a', props, children)
    },
}))

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('NEXT_PUBLIC_STATS_PORT', '3002')

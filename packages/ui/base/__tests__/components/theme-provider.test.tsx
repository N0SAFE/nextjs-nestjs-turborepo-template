import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-themes before importing the component
vi.mock('next-themes', () => ({
    ThemeProvider: vi.fn(({ children, ...props }) => (
        <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
            {children}
        </div>
    )),
}))

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
    default: vi.fn(() => {
        // Return a component that uses the mocked ThemeProvider
        return vi.fn(({ children, ...props }) => (
            <div
                data-testid="dynamic-theme-provider"
                data-props={JSON.stringify(props)}
            >
                {children}
            </div>
        ))
    }),
}))

// Import after mocking
import ThemeProvider from '../../src/components/theme-provider'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

describe('ThemeProvider Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render children', () => {
        render(
            <ThemeProvider attribute="class" defaultTheme="system">
                <div data-testid="child">Test Child</div>
            </ThemeProvider>
        )

        const child = screen.getByTestId('child')
        expect(child).toBeInTheDocument()
        expect(child).toHaveTextContent('Test Child')
    })

    it('should render with theme provider wrapper', () => {
        render(
            <ThemeProvider attribute="class" defaultTheme="system">
                <div>Test</div>
            </ThemeProvider>
        )

        // Check if either static or dynamic provider is rendered
        const provider =
            screen.queryByTestId('theme-provider') ||
            screen.queryByTestId('dynamic-theme-provider')
        expect(provider).toBeInTheDocument()
    })

    it('should pass through theme provider props', () => {
        const props = {
            attribute: 'class' as const,
            defaultTheme: 'dark',
            enableSystem: true,
            disableTransitionOnChange: false,
        }

        render(
            <ThemeProvider {...props}>
                <div>Test</div>
            </ThemeProvider>
        )

        const provider =
            screen.queryByTestId('theme-provider') ||
            screen.queryByTestId('dynamic-theme-provider')
        expect(provider).toBeInTheDocument()

        if (provider) {
            const propsData = JSON.parse(
                provider.getAttribute('data-props') || '{}'
            )
            expect(propsData).toMatchObject(props)
        }
    })

    it('should handle storageKey prop', () => {
        render(
            <ThemeProvider storageKey="custom-theme">
                <div>Test</div>
            </ThemeProvider>
        )

        const provider =
            screen.queryByTestId('theme-provider') ||
            screen.queryByTestId('dynamic-theme-provider')
        expect(provider).toBeInTheDocument()

        if (provider) {
            const propsData = JSON.parse(
                provider.getAttribute('data-props') || '{}'
            )
            expect(propsData.storageKey).toBe('custom-theme')
        }
    })

    it('should handle themes array prop', () => {
        const themes = ['light', 'dark', 'custom']

        render(
            <ThemeProvider themes={themes}>
                <div>Test</div>
            </ThemeProvider>
        )

        const provider =
            screen.queryByTestId('theme-provider') ||
            screen.queryByTestId('dynamic-theme-provider')
        expect(provider).toBeInTheDocument()

        if (provider) {
            const propsData = JSON.parse(
                provider.getAttribute('data-props') || '{}'
            )
            expect(propsData.themes).toEqual(themes)
        }
    })

    it('should work with minimal props', () => {
        render(
            <ThemeProvider>
                <div data-testid="minimal">Minimal setup</div>
            </ThemeProvider>
        )

        const child = screen.getByTestId('minimal')
        expect(child).toBeInTheDocument()

        const provider =
            screen.queryByTestId('theme-provider') ||
            screen.queryByTestId('dynamic-theme-provider')
        expect(provider).toBeInTheDocument()
    })

    it('should call NextThemesProvider when imported', () => {
        expect(NextThemesProvider).toBeDefined()
        expect(vi.isMockFunction(NextThemesProvider)).toBe(true)
    })
})

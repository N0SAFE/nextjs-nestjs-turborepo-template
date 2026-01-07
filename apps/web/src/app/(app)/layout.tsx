import { Suspense, type JSX } from 'react'
import MainNavigation from '@/components/navigation/MainNavigation'
import { SessionHydrationProvider } from '@/utils/providers/SessionHydrationProvider'
import Loader from '@repo/ui/components/atomics/atoms/Loader'

// Performance timing helper
const startTimer = () => performance.now()
const elapsed = (start: number) => (performance.now() - start).toFixed(2)

/**
 * App Route Group Layout
 * 
 * This layout is for public/general pages that use the main navigation bar:
 * - Home page (/)
 * - Showcase (/showcase)
 * - Any other pages that should have the top navbar
 * 
 * The dashboard has its own separate route group with sidebar navigation.
 * 
 * Note: No Suspense around SessionHydrationProvider + MainNavigation.
 * This ensures the server waits for session fetch before sending HTML,
 * so the client receives the page with session already hydrated.
 * Result: No loading flash in the navigation.
 */
export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}): JSX.Element {
    const layoutStart = startTimer()
    console.log(`📱 AppLayout: START`)
    console.log(`📱 AppLayout: Rendering SessionHydrationProvider + MainNavigation... (setup took ${elapsed(layoutStart)}ms)`)
    
    const jsxStart = startTimer()
    const jsx = (
        <>
            <SessionHydrationProvider>
                <MainNavigation />
            </SessionHydrationProvider>
            <Suspense
                fallback={
                    <div className="flex h-screen w-screen items-center justify-center">
                        <Loader />
                    </div>
                }
            >
                <main className="flex flex-1 flex-col overflow-y-auto">
                    {children}
                </main>
            </Suspense>
        </>
    )
    
    console.log(`📱 AppLayout: JSX created in ${elapsed(jsxStart)}ms`)
    console.log(`📱 AppLayout: END - Total: ${elapsed(layoutStart)}ms`)
    return jsx
}

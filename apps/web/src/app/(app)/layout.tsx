import { Suspense, type JSX } from 'react'
import MainNavigation from '@/components/navigation/MainNavigation'
import { SessionHydrationProvider } from '@/utils/providers/SessionHydrationProvider'
import Loader from '@repo/ui/components/atomics/atoms/Loader'

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
    return (
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
}

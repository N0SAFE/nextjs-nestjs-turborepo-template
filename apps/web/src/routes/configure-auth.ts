/**
 * Server-side auth configuration for declarative routing.
 * 
 * This file configures the auth adapter used by SessionPage and SessionLayout wrappers.
 * It must be imported before any SessionPage or SessionLayout is used.
 * 
 * IMPORTANT: This file has server-side side effects.
 * The configuration is triggered when this module is first imported.
 */
import 'server-only'

import { configureServerAuth } from '@repo/declarative-routing/page-wrappers'
import { configureLayoutAuth } from '@repo/declarative-routing/layout-wrappers/server'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { getSessionFromCookie, hasSessionCookie } from '@/lib/auth/cookie-session'
import type { ReactNode, ComponentType } from 'react'

// Shared session fetcher for both pages and layouts
// Uses cookie-based session retrieval for fast performance (~5ms vs ~1500ms HTTP call)
async function getServerSession() {
    const session = await getSessionFromCookie()
    return { data: session }
}

// Shared React Query config
const reactQueryConfig = {
    HydrationBoundary: HydrationBoundary as ComponentType<{ state: unknown; children: ReactNode }>,
    createQueryClient: () => new QueryClient(),
    dehydrate: dehydrate as (client: unknown) => unknown,
}

// Configure the server auth adapter for PAGES
// This runs when the module is first imported
configureServerAuth(
    { getSession: getServerSession },
    reactQueryConfig
)

// Configure the layout auth adapter for LAYOUTS
// Uses the same session fetcher and React Query integration
configureLayoutAuth(
    { getSession: getServerSession },
    reactQueryConfig,
    hasSessionCookie
)

/**
 * Check if the auth cookie exists.
 * Used to skip session fetch when user is definitely not logged in.
 */
export const hasAuthCookie = hasSessionCookie

// Export a marker to confirm configuration is loaded
export const serverAuthConfigured = true

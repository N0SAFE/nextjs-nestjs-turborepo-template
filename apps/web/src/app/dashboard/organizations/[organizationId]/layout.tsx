/**
 * Organization Dynamic Route Layout
 * 
 * This layout provides a placeholder value for `generateStaticParams` to satisfy
 * Next.js's requirement that dynamic routes return at least one value when
 * `cacheComponents` is enabled.
 * 
 * Why this is needed:
 * 1. Organization IDs are dynamic and not known at build time
 * 2. These pages require authentication (cookies)
 * 3. With Cache Components enabled, `generateStaticParams` must return at least one result
 * 4. Route segment configs (dynamic, dynamicParams) are not allowed with cacheComponents
 * 
 * Solution: Return a placeholder organization ID for prerendering. During the actual prerender:
 * - The session fetch will fail (no cookies during build) and return null
 * - The page will render an unauthenticated state (which is fine for prerendering)
 * - At runtime, real organization IDs and authentication will work normally
 */
import { connection } from 'next/server'

/**
 * Provide a placeholder organization ID for prerendering.
 * This satisfies the cacheComponents requirement while allowing dynamic rendering at runtime.
 */
export function generateStaticParams() {
    // Return a placeholder for prerendering
    // The actual page will handle authentication and show appropriate UI
    return [{ organizationId: '__prerender_placeholder__' }]
}

/**
 * Layout that wraps organization-specific pages.
 * Uses connection() to ensure dynamic data access is handled correctly.
 */
export default async function OrganizationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Mark this route as requiring a connection for proper dynamic rendering
    await connection()
    
    return children
}

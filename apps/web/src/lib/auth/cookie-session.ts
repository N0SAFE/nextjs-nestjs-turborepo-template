/**
 * Cookie-based Session Retrieval
 * 
 * This module provides functions to read the Better Auth session directly from cookies
 * without making an HTTP request to the API. This is much faster for server-side rendering
 * since it avoids the network round-trip.
 * 
 * The session is encrypted in the cookie using the BETTER_AUTH_SECRET, and this module
 * decrypts it locally using the getCookieCache function from better-auth/cookies.
 * 
 * Requirements:
 * - Cookie cache must be enabled in the API's Better Auth config
 * - BETTER_AUTH_SECRET environment variable must be set
 * 
 * Note: This module uses unstable_rethrow() to properly handle Next.js internal errors.
 * With PPR enabled, cookies() throws a special error that Next.js uses to determine
 * which parts of a page can be statically generated. If we catch that error in a try/catch,
 * the build fails. By calling unstable_rethrow(error) as the first line in our catch block,
 * we re-throw any Next.js internal errors (like PPR bailouts) so they propagate correctly,
 * while still catching and handling application-level errors.
 */
import 'server-only'

import { getCookieCache, getSessionCookie } from 'better-auth/cookies'
import { cookies } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import { validateEnvSafe } from '#/env'
import type { Session } from '@repo/auth'

// Validate environment variables
const env = validateEnvSafe(process.env).data

/**
 * Cached session type from Better Auth cookie
 * The cookie cache stores session with additional metadata
 */
export type CachedSession = Session & {
    updatedAt: number
}

/**
 * Check if a session cookie exists.
 * This is a fast check that doesn't decrypt the cookie.
 * 
 * @returns true if the session cookie exists
 */
export async function hasSessionCookie(): Promise<boolean> {
    return (await getRawSessionCookie()) !== null
}

/**
 * Get the raw session cookie value (without decryption).
 * This is primarily useful for forwarding cookies to API calls.
 * 
 * @returns The session cookie value or null
 */
export async function getRawSessionCookie(): Promise<string | null> {
    try {
        return getSessionCookie(new Headers({
            cookie: (await cookies()).toString(),
        }))
    } catch (error) {
        // Re-throw internal Next.js errors (PPR bailout, redirects, etc.)
        unstable_rethrow(error)
        console.error('🍪 getRawSessionCookie: ERROR', error)
        return null
    }
}

/**
 * Get session from cookie cache without making an HTTP request.
 * 
 * This function:
 * 1. Checks if the session cookie exists
 * 2. If it exists, decrypts and parses the cached session from the cookie
 * 3. Returns the session data or null
 * 
 * This is MUCH faster than getSession() which makes an HTTP call to the API.
 * The typical improvement is from ~1500ms to <5ms.
 * 
 * @returns The session if authenticated, null otherwise
 * @throws If BETTER_AUTH_SECRET is not configured
 * 
 * @example
 * ```tsx
 * // Server component
 * import { getSessionFromCookie } from '@/lib/auth/cookie-session'
 * 
 * export default async function Page() {
 *   const session = await getSessionFromCookie()
 *   if (!session) return <LoginPrompt />
 *   return <div>Hello {session.user.name}</div>
 * }
 * ```
 */
export async function getSessionFromCookie(): Promise<Session | null> {
    if (!env?.BETTER_AUTH_SECRET) {
        console.warn(`🍪 getSessionFromCookie: BETTER_AUTH_SECRET not configured`)
        return null
    }

    try {
        const cookiesList = await cookies()
        const cookieString = cookiesList.toString()
        const headersObj = new Headers({ cookie: cookieString })

        const cachedSession = await getCookieCache<CachedSession>(headersObj, {
            secret: env.BETTER_AUTH_SECRET,
            // Match the cookie security setting from the API
            // In Docker without HTTPS termination, use non-secure cookies
            isSecure: env.NEXT_PUBLIC_API_URL.startsWith('https://'),
        })
        return cachedSession ?? null
    } catch (error) {
        // Re-throw internal Next.js errors (PPR bailout, redirects, etc.)
        unstable_rethrow(error)
        console.error(`🍪 getSessionFromCookie: ERROR`, error)
        return null
    }
}

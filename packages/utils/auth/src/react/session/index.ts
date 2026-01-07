/**
 * Session management utilities for React.
 * 
 * This module provides isomorphic session management:
 * - Import from './client' for client-side hooks (useSession)
 * - Import from './server' for server-side utilities (getSession, prefetch)
 * - Import from './shared' or this index for types and constants
 * 
 * @example
 * ```ts
 * // Client-side usage
 * import { createUseSession } from '@repo/auth/react/session/client'
 * 
 * // Server-side usage
 * import { createGetSession, createPrefetchSession } from '@repo/auth/react/session/server'
 * 
 * // Shared types (isomorphic)
 * import { DEFAULT_SESSION_QUERY_KEY, type SessionResult } from '@repo/auth/react/session'
 * ```
 */

// Re-export shared types and constants (isomorphic)
export {
    DEFAULT_SESSION_QUERY_KEY,
    type SessionResult,
    type CreateUseSessionOptions,
    type CreateGetSessionOptions,
    type PrefetchSessionOptions,
} from './shared'

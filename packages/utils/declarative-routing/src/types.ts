/**
 * @repo/declarative-routing - Types and Interfaces
 * 
 * This file defines all the types used by the declarative routing system,
 * including the auth adapter interfaces for dependency injection.
 */
import * as React from 'react'
import { z } from 'zod'

// Re-export Session type from @repo/auth for consistency across the monorepo
export type { Session, User } from '@repo/auth'
import type { Session } from '@repo/auth'

// ============================================================================
// Auth Adapter Interfaces (Dependency Injection)
// ============================================================================

/**
 * Server-side auth adapter interface.
 * Must be implemented by the consuming application to provide server-side auth.
 * 
 * @template S - The session type used by your auth system
 */
export type ServerAuthAdapter<S = unknown> = {
    /**
     * Get the current session on the server.
     * Called by SessionPage wrapper.
     */
    getSession: () => Promise<{ data: S | null }>
}

/**
 * Client-side auth adapter interface.
 * Must be implemented by the consuming application to provide client-side auth.
 * 
 * @template S - The session type used by your auth system
 */
export type ClientAuthAdapter<S = unknown> = {
    /**
     * React hook to get the current session on the client.
     * Should integrate with React Query or similar for caching.
     */
    useSession: () => {
        data: S | null | undefined
        isPending?: boolean
        isLoading?: boolean
        refetch: () => Promise<unknown> | undefined
    }
}

/**
 * Combined auth adapter for components that need both.
 * 
 * @template S - The session type used by your auth system
 */
export type AuthAdapter<S = unknown> = ServerAuthAdapter<S> & ClientAuthAdapter<S>

/**
 * Client session props provided to wrapped components.
 */
export type ClientSessionProps<S extends Session = Session> = {
    session: S | null | undefined
    isLoading: boolean
    refetch: () => void
}

// ============================================================================
// Page Props Types
// ============================================================================

/**
 * Base page props that all pages receive.
 */
export type BasePageProps = {
    children?: React.ReactNode
}

/**
 * Next.js page props (Promise-based params/searchParams)
 */
export type NextPageProps = {
    params: Promise<Record<string, string | string[]>>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Typed page props including params and search (Promise-wrapped)
 */
export type PageProps<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    params: Promise<z.output<Params>>
    searchParams: Promise<z.output<Search>>
} & BasePageProps

/**
 * Unwrapped page props (what components receive after wrappers unwrap promises)
 */
export type UnwrappedPageProps<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    params: z.output<Params>
    searchParams: z.output<Search>
} & BasePageProps

/**
 * Page wrapper component type (receives Promise-wrapped props from Next.js)
 */
export type PageComponent<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
> = React.FC<PageProps<Params, Search> & AdditionalProps>

/**
 * Unwrapped page component type (what developers write)
 */
export type UnwrappedPageComponent<
    Params extends z.ZodType,
    Search extends z.ZodType,
    AdditionalProps extends object = object,
> = React.ComponentType<UnwrappedPageProps<Params, Search> & AdditionalProps>

// ============================================================================
// Route Builder Types
// ============================================================================

/**
 * Route info configuration.
 */
export type RouteInfo<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    name: string
    params: Params
    search: Search
    description?: string
    [key: string]: unknown
}

/**
 * GET route info.
 */
export type GetInfo<Result extends z.ZodType> = {
    result: Result
}

/**
 * POST route info.
 */
export type PostInfo<Body extends z.ZodType, Result extends z.ZodType> = {
    body: Body
    result: Result
    description?: string
}

/**
 * PUT route info.
 */
export type PutInfo<Body extends z.ZodType, Result extends z.ZodType> = {
    body: Body
    result: Result
    description?: string
}

/**
 * Core route elements shared by all route builders.
 */
export type CoreRouteElements<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    params: z.output<Params>
    paramsSchema: Params
    search: z.output<Search>
    searchSchema: Search
}

/**
 * Session options for session-aware wrappers.
 */
export type SessionOptions = {
    checkCookie?: boolean
    sessionCookie?: string
}

/**
 * Schemas configuration for page wrappers.
 */
export type SchemasConfig<
    Params extends z.ZodType,
    Search extends z.ZodType,
> = {
    params: Params
    search: Search
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * When Params is an empty z.object({}), z.input<Params> can resolve to Record<string, never>,
 * which poisons intersections. This conditional removes the index-signature.
 */
export type ParamProps<P extends z.ZodType> = z.input<P> extends Record<string, never>
    ? object
    : z.input<P>

/**
 * Extract params type from RouteBuilder.
 */
export type RouteBuilderParams<T extends { paramsSchema: z.ZodType }> = 
    z.output<T['paramsSchema']>

/**
 * Extract search type from RouteBuilder.
 */
export type RouteBuilderSearch<T extends { searchSchema: z.ZodType }> = 
    z.output<T['searchSchema']>

/**
 * Parsed data result type.
 */
export type ParsedData<T> = {
    error?: string
    data?: T
}

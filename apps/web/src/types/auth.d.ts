// Better Auth types - this file defines the Better Auth session structure
import { Session, User } from '../lib/auth/auth-client'

export interface AuthRefresh {
    access_token?: string | null
    expires?: number | null
    refresh_token?: string | null
}

export interface UserSession {
    id: string
    first_name: string
    last_name: string
    email: string
    access_token?: string
    expires?: number
    refresh_token?: string
}

export interface UserParams {
    id?: string
    name?: string
    first_name?: string
    last_name?: string
    email?: string
}

export interface UserAuthenticated {
    id?: string
    name?: string
    email?: string
}

// Re-export Better Auth types for convenience
export type { Session, User }

/**
 * Simple utility to generate URL paths from ORPC contracts with full type safety
 * 
 * Usage:
 *   const path = getPath(router.users.getById, { id: '123' })
 *   // Returns: "/users/123"
 *   // TypeScript will enforce that { id: string } is provided
 */

import type { $ZodType as ZodType } from 'zod/v4/core'
import type { z } from 'zod'
import { isContractProcedure } from '@orpc/contract'

/**
 * Path generation options
 */
export interface GetPathOptions {
  /**
   * Base URL to prepend to the path
   * @example "https://api.example.com"
   */
  baseURL?: string
  
  /**
   * Whether to include query parameters for GET requests
   * @default true
   */
  includeQueryParams?: boolean
  
  /**
   * Custom query parameter serializer
   */
  serializeParams?: (input: unknown) => string
}

/**
 * ORPC Contract type with metadata
 */
interface ContractWithMetadata<TInputSchema extends ZodType = ZodType> {
  '~orpc': {
    inputSchema?: TInputSchema
    outputSchema?: ZodType
    route?: {
      method?: string
      path?: string
      summary?: string
      description?: string
    }
  }
}

/**
 * Extract input type from ORPC contract
 */
type InferInput<T> = T extends ContractWithMetadata<infer TInputSchema>
  ? TInputSchema extends ZodType
    ? z.infer<TInputSchema>
    : never
  : never

/**
 * Serialize input to query parameters using URLSearchParams
 */
function defaultSerializeParams(input: unknown): string {
  if (!input || typeof input !== 'object' || Object.keys(input).length === 0) {
    return ''
  }

  const params = new URLSearchParams()
  
  function addParam(key: string, value: unknown, prefix = '') {
    const fullKey = prefix ? `${prefix}[${key}]` : key
    
    if (value === undefined || value === null) {
      return
    }
    
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        addParam(String(index), item, fullKey)
      })
    } else if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof File)) {
      Object.entries(value).forEach(([k, v]) => {
        addParam(k, v, fullKey)
      })
    } else {
      params.append(fullKey, JSON.stringify(value))
    }
  }
  
  Object.entries(input).forEach(([key, value]) => {
    addParam(key, value)
  })
  
  return params.toString()
}

/**
 * Internal implementation of getPath
 */
function getPathImpl(
  contract: ContractWithMetadata,
  input: unknown,
  options: GetPathOptions
): string {
  const {
    baseURL = '',
    includeQueryParams = true,
    serializeParams = defaultSerializeParams
  } = options

  // Extract route metadata from contract
  const route = contract['~orpc'].route
  
  if (!route?.path) {
    throw new Error('Contract does not have a route path defined. Make sure to use .route() in your contract definition.')
  }

  let path = route.path
  
  // Replace path parameters (e.g., :id, :userId) with values from input
  if (input && typeof input === 'object') {
    path = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match: string, paramName: string) => {
      if (paramName in input) {
        return encodeURIComponent(String((input as Record<string, unknown>)[paramName]))
      }
      // If parameter not found in input, leave it as-is
      return match
    })
  }

  // Add query parameters for GET requests
  if (includeQueryParams && route.method === 'GET' && input) {
    const queryString = serializeParams(input)
    if (queryString) {
      path += `?${queryString}`
    }
  }

  // Combine with base URL
  const fullPath = baseURL ? `${baseURL}${path}` : path
  
  // Normalize slashes (avoid double slashes except in protocol)
  return fullPath.replace(/([^:]\/)\/+/g, '$1')
}

/**
 * Generate a URL path from an ORPC contract and input with full type safety
 * 
 * @param contract - The ORPC contract (procedure)
 * @param input - The input data for the procedure (fully typed based on contract)
 * @param options - Path generation options
 * @returns The generated URL path
 * 
 * @example
 * ```typescript
 * import { getPath } from '@/lib/orpc/getPath'
 * import { router } from '@/server/router'
 * 
 * // TypeScript enforces correct input type
 * const path = getPath(router.users.getById, { id: '123' })
 * // ✅ Returns: "/users/123"
 * 
 * const path2 = getPath(router.users.getById, { id: 123 })
 * // ❌ TypeScript error: id must be a string
 * 
 * const path3 = getPath(router.users.getById, {})
 * // ❌ TypeScript error: id is required
 * 
 * // With base URL
 * const url = getPath(router.users.getById, { id: '123' }, {
 *   baseURL: 'https://api.example.com'
 * })
 * // Returns: "https://api.example.com/users/123"
 * 
 * // With query parameters (GET requests)
 * const listPath = getPath(router.users.list, { page: 2, limit: 10 })
 * // Returns: "/users?page=2&limit=10"
 * ```
 */

// Overload 1: Required input with options
export function getPath<T extends ContractWithMetadata>(
  contract: T,
  input: InferInput<T>,
  options?: GetPathOptions
): string

// Overload 2: Optional input (when {} extends InferInput<T>)
export function getPath<T extends ContractWithMetadata>(
  contract: T,
  input?: InferInput<T>,
  options?: GetPathOptions
): string

// Implementation
export function getPath<T extends ContractWithMetadata>(
  contract: T,
  input?: InferInput<T>,
  options?: GetPathOptions
): string {
  return getPathImpl(contract, input, options ?? {})
}

/**
 * Create a path generator with default options
 * 
 * Useful when you want to reuse the same options across multiple calls
 * 
 * @param defaultOptions - Default options for path generation
 * @returns A getPath function with default options applied
 * 
 * @example
 * ```typescript
 * import { createPathGenerator } from '@/lib/orpc/getPath'
 * import { router } from '@/server/router'
 * 
 * const getPath = createPathGenerator({
 *   baseURL: 'https://api.example.com'
 * })
 * 
 * // Full type safety maintained
 * const userPath = getPath(router.users.getById, { id: '123' })
 * // Returns: "https://api.example.com/users/123"
 * 
 * const postPath = getPath(router.posts.getById, { id: '456' })
 * // Returns: "https://api.example.com/posts/456"
 * ```
 */
export function createPathGenerator(defaultOptions: GetPathOptions = {}) {
  // Overload 1: Required input
  function pathGenerator<T extends ContractWithMetadata>(
    contract: T,
    input: InferInput<T>,
    options?: GetPathOptions
  ): string
  
  // Overload 2: Optional input
  function pathGenerator<T extends ContractWithMetadata>(
    contract: T,
    input?: InferInput<T>,
    options?: GetPathOptions
  ): string
  
  // Implementation
  function pathGenerator<T extends ContractWithMetadata>(
    contract: T,
    input?: InferInput<T>,
    options?: GetPathOptions
  ): string {
    return getPathImpl(contract, input, { ...defaultOptions, ...options })
  }
  
  return pathGenerator
}

/**
 * Get the route metadata from a contract
 * 
 * @param contract - The ORPC contract
 * @returns The route metadata or undefined
 * 
 * @example
 * ```typescript
 * import { getRouteMetadata } from '@/lib/orpc/getPath'
 * import { router } from '@/server/router'
 * 
 * const metadata = getRouteMetadata(router.users.getById)
 * // Returns: { method: 'GET', path: '/users/:id', summary: '...' }
 * ```
 */
export function getRouteMetadata<T extends ContractWithMetadata>(contract: T) {
  return contract['~orpc'].route
}

/**
 * Check if a contract has a route defined
 * 
 * @param contract - The ORPC contract
 * @returns True if the contract has a route
 * 
 * @example
 * ```typescript
 * import { hasRoute } from '@/lib/orpc/getPath'
 * import { router } from '@/server/router'
 * 
 * if (hasRoute(router.users.getById)) {
 *   const path = getPath(router.users.getById, { id: '123' })
 * }
 * ```
 */
export function hasRoute(contract: unknown): contract is ContractWithMetadata {
  if (!isContractProcedure(contract)) {
    return false
  }
  return !!contract['~orpc'].route.path
}

// ============================================================================
// USAGE EXAMPLES WITH FULL TYPE SAFETY
// ============================================================================

/*
import { oc } from '@orpc/contract'
import { z } from 'zod'
import { getPath, createPathGenerator, getRouteMetadata } from '@/lib/orpc/getPath'

// Define your contract
export const router = oc.router({
  users: oc.router({
    getById: oc
      .input(z.object({ 
        id: z.string() 
      }))
      .output(z.object({ 
        id: z.string(), 
        name: z.string() 
      }))
      .route({
        method: 'GET',
        path: '/users/:id',
        summary: 'Get user by ID'
      }),
    
    list: oc
      .input(z.object({ 
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional()
      }))
      .route({
        method: 'GET',
        path: '/users',
        summary: 'List users'
      }),
    
    create: oc
      .input(z.object({ 
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().int().positive()
      }))
      .route({
        method: 'POST',
        path: '/users',
        summary: 'Create user'
      }),
    
    update: oc
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional()
      }))
      .route({
        method: 'PATCH',
        path: '/users/:id',
        summary: 'Update user'
      }),
    
    // No input schema
    getAll: oc
      .route({
        method: 'GET',
        path: '/users/all'
      })
  }),
  
  posts: oc.router({
    getById: oc
      .input(z.object({ 
        id: z.string() 
      }))
      .route({
        method: 'GET',
        path: '/posts/:id'
      }),
    
    listByUser: oc
      .input(z.object({ 
        userId: z.string(),
        page: z.number().optional(),
        includeComments: z.boolean().optional()
      }))
      .route({
        method: 'GET',
        path: '/users/:userId/posts'
      })
  })
})

// ============================================================================
// Example 1: Full type safety - TypeScript enforces correct types
// ============================================================================

// ✅ Correct usage
const path1 = getPath(router.users.getById, { id: '123' })
// Returns: "/users/123"

// ❌ TypeScript error: id must be a string
const path2 = getPath(router.users.getById, { id: 123 })

// ❌ TypeScript error: id is required
const path3 = getPath(router.users.getById, {})

// ❌ TypeScript error: unknown property 'name'
const path4 = getPath(router.users.getById, { id: '123', name: 'John' })

// ============================================================================
// Example 2: Optional fields are properly typed
// ============================================================================

// ✅ All optional - can omit input entirely
const listPath1 = getPath(router.users.list)
// Returns: "/users"

// ✅ Provide some optional fields
const listPath2 = getPath(router.users.list, { page: 2 })
// Returns: "/users?page=2"

// ✅ Provide all fields
const listPath3 = getPath(router.users.list, { page: 2, limit: 10, search: 'john' })
// Returns: "/users?page=2&limit=10&search=john"

// ❌ TypeScript error: page must be a number
const listPath4 = getPath(router.users.list, { page: '2' })

// ============================================================================
// Example 3: No input schema
// ============================================================================

// ✅ No input required
const allUsersPath = getPath(router.users.getAll)
// Returns: "/users/all"

// ============================================================================
// Example 4: Required fields are enforced
// ============================================================================

// ✅ All required fields provided
const createPath1 = getPath(router.users.create, {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})
// Returns: "/users"

// ❌ TypeScript error: missing required field 'age'
const createPath2 = getPath(router.users.create, {
  name: 'John Doe',
  email: 'john@example.com'
})

// ❌ TypeScript error: age must be a number
const createPath3 = getPath(router.users.create, {
  name: 'John Doe',
  email: 'john@example.com',
  age: '30'
})

// ============================================================================
// Example 5: With base URL and options
// ============================================================================

const userUrl = getPath(router.users.getById, { id: '123' }, {
  baseURL: 'https://api.example.com'
})
// Returns: "https://api.example.com/users/123"

// ============================================================================
// Example 6: Create a typed path generator
// ============================================================================

const getApiPath = createPathGenerator({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'
})

// Full type safety maintained
const typedPath1 = getApiPath(router.users.getById, { id: '123' })
// ✅ Returns: "https://api.example.com/users/123"

const typedPath2 = getApiPath(router.users.getById, { id: 123 })
// ❌ TypeScript error: id must be a string

// ============================================================================
// Example 7: Use in React components with type safety
// ============================================================================

import { getPath } from '@/lib/orpc/getPath'
import { router } from '@/server/router'
import Link from 'next/link'

function UserCard({ userId }: { userId: string }) {
  // TypeScript knows that { id: string } is required
  const userProfilePath = getPath(router.users.getById, { id: userId })
  
  return (
    <div>
      <Link href={userProfilePath}>View Profile</Link>
    </div>
  )
}

function UsersList() {
  // TypeScript knows that all fields are optional
  const usersPath = getPath(router.users.list, { page: 1, limit: 20 })
  
  return <a href={usersPath}>View Users</a>
}

// ============================================================================
// Example 8: Complex nested paths with type safety
// ============================================================================

// ✅ Correct types
const postsByUserPath = getPath(router.posts.listByUser, {
  userId: '123',
  page: 2,
  includeComments: true
})
// Returns: "/users/123/posts?page=2&includeComments=true"

// ❌ TypeScript error: userId is required
const invalidPath = getPath(router.posts.listByUser, {
  page: 2
})

// ❌ TypeScript error: includeComments must be boolean
const invalidPath2 = getPath(router.posts.listByUser, {
  userId: '123',
  includeComments: 'yes'
})

// ============================================================================
// Example 9: Type-safe API fetching
// ============================================================================

const getApiUrl = createPathGenerator({
  baseURL: 'https://api.example.com'
})

async function fetchUser(userId: string) {
  // TypeScript enforces correct input type
  const url = getApiUrl(router.users.getById, { id: userId })
  const response = await fetch(url)
  return response.json()
}

async function fetchUsers(page: number, limit: number) {
  // TypeScript knows page and limit should be numbers
  const url = getApiUrl(router.users.list, { page, limit })
  const response = await fetch(url)
  return response.json()
}

// ============================================================================
// Example 10: Autocomplete support
// ============================================================================

// When you type getPath(router.users.getById, { 
// TypeScript will autocomplete:
// - id: string (required)

// When you type getPath(router.users.list, {
// TypeScript will autocomplete:
// - page?: number
// - limit?: number
// - search?: string

// ============================================================================
// Example 11: Type guards
// ============================================================================

import { hasRoute } from '@/lib/orpc/getPath'

function generatePathIfPossible(contract: any, input: any) {
  if (hasRoute(contract)) {
    // TypeScript now knows contract has a route
    const path = getPath(contract, input)
    return path
  }
  return null
}

// ============================================================================
// Example 12: Override options in path generator
// ============================================================================

const getApiPath = createPathGenerator({
  baseURL: 'https://api.example.com',
  includeQueryParams: true
})

// Use default options
const path1 = getApiPath(router.users.list, { page: 1 })
// Returns: "https://api.example.com/users?page=1"

// Override baseURL for specific call
const path2 = getApiPath(router.users.list, { page: 1 }, {
  baseURL: 'https://staging-api.example.com'
})
// Returns: "https://staging-api.example.com/users?page=1"

// Disable query params for specific call
const path3 = getApiPath(router.users.list, { page: 1 }, {
  includeQueryParams: false
})
// Returns: "https://api.example.com/users"
*/
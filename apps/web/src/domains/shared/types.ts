/**
 * Shared TypeScript types for domain endpoints
 */

import type { QueryKey } from '@tanstack/react-query'

/**
 * Base endpoint configuration (legacy - prefer factory functions)
 */
export interface BaseEndpointConfig {
  staleTime?: number
  gcTime?: number
  retry?: number
  onError?: (error: Error) => void
}

/**
 * ORPC endpoint type
 * @legacy - use orpcEndpoint() instead
 */
export interface ORPCEndpoint extends BaseEndpointConfig {
  type: 'orpc'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any
}

/**
 * Custom endpoint type (legacy - use customEndpoint() instead)
 */
export interface CustomEndpoint extends BaseEndpointConfig {
  type: 'custom'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryKey: (...args: any[]) => QueryKey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: (...args: any[]) => Promise<any>
}

export type EndpointConfig = ORPCEndpoint | CustomEndpoint

/**
 * @fileoverview Query Error Boundary Component
 * 
 * Specialized error boundary for TanStack Query errors.
 * Provides query-specific error handling with automatic retry capabilities.
 */

'use client'

import React, { ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from './ErrorBoundary'
import { QueryErrorFallback } from './QueryErrorFallback'
import { logger } from '@repo/logger'

interface QueryErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Custom fallback UI */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Callback when query error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Optional identifier for logging context */
  context?: string
}

/**
 * Error boundary specialized for TanStack Query errors
 * 
 * Features:
 * - Automatic integration with React Query's reset mechanism
 * - Query-specific error fallback UI
 * - Retry functionality that resets query cache
 * 
 * @example Basic usage
 * ```tsx
 * <QueryErrorBoundary>
 *   <UserProfile />
 * </QueryErrorBoundary>
 * ```
 * 
 * @example With custom fallback
 * ```tsx
 * <QueryErrorBoundary
 *   context="UserDashboard"
 *   fallback={(error, reset) => <CustomQueryError error={error} onRetry={reset} />}
 * >
 *   <UserDashboard />
 * </QueryErrorBoundary>
 * ```
 * 
 * @example In layout for entire section
 * ```tsx
 * // apps/web/src/app/dashboard/layout.tsx
 * <QueryErrorBoundary context="Dashboard">
 *   {children}
 * </QueryErrorBoundary>
 * ```
 */
export function QueryErrorBoundary({
  children,
  fallback,
  onError,
  context = 'Query',
}: QueryErrorBoundaryProps): ReactNode {
  const handleError = (error: Error, errorInfo: React.ErrorInfo): void => {
    // Log query error with context
    logger.error(error, {
      boundary: 'QueryErrorBoundary',
      context,
      componentStack: errorInfo.componentStack,
      isQueryError: true,
    })

    // Call custom error handler
    onError?.(error, errorInfo)
  }

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          context={`${context} (Query)`}
          onError={handleError}
          fallback={(error, resetBoundary) => {
            // Custom fallback or default QueryErrorFallback
            if (fallback) {
              return fallback(error, () => {
                reset()
                resetBoundary()
              })
            }

            return (
              <QueryErrorFallback
                error={error}
                onReset={() => {
                  reset()
                  resetBoundary()
                }}
              />
            )
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

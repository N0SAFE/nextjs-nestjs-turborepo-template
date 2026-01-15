/**
 * @fileoverview Default Error Fallback Component
 * 
 * Generic error fallback UI for any React error.
 * Used by base ErrorBoundary when no custom fallback is provided.
 */

'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DefaultErrorFallbackProps {
  /** The error that was caught */
  error: Error
  /** Function to reset the error boundary */
  onReset?: () => void
}

/**
 * Default fallback UI for error boundaries
 * 
 * Features:
 * - Clean, user-friendly error message
 * - Error details in development mode
 * - Reset button to recover
 * - Accessible design
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={(error, reset) => <DefaultErrorFallback error={error} onReset={reset} />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps): React.ReactElement {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-100 flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="rounded-md bg-gray-100 p-4 text-left">
            <p className="mb-2 text-sm font-semibold text-gray-700">Error Details (Development):</p>
            <p className="text-xs text-gray-600">{error.message}</p>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  Stack Trace
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-gray-500">{error.stack}</pre>
              </details>
            )}
          </div>
        )}

        {/* Reset Button */}
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

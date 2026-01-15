/**
 * @fileoverview Query Error Fallback Component
 * 
 * Specialized fallback UI for TanStack Query errors.
 * Provides query-specific messaging and retry functionality.
 */

'use client'

import React from 'react'
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'

interface QueryErrorFallbackProps {
  /** The error that was caught */
  error: Error
  /** Function to reset and retry the query */
  onReset?: () => void
}

/**
 * Fallback UI specifically designed for query errors
 * 
 * Features:
 * - Distinguishes network errors from other errors
 * - Clear retry action for users
 * - Helpful troubleshooting tips
 * - Accessible design
 * 
 * @example
 * ```tsx
 * <QueryErrorBoundary fallback={(error, reset) => <QueryErrorFallback error={error} onReset={reset} />}>
 *   <DataFetchingComponent />
 * </QueryErrorBoundary>
 * ```
 */
export function QueryErrorFallback({ error, onReset }: QueryErrorFallbackProps): React.ReactElement {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Detect network errors
  const isNetworkError = error.message.toLowerCase().includes('network') || 
                        error.message.toLowerCase().includes('fetch')

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className={`rounded-full p-4 ${isNetworkError ? 'bg-orange-100' : 'bg-red-100'}`}>
            {isNetworkError ? (
              <WifiOff className="h-12 w-12 text-orange-600" />
            ) : (
              <AlertCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {isNetworkError ? 'Connection Problem' : 'Failed to Load Data'}
          </h2>
          <p className="text-gray-600">
            {isNetworkError
              ? 'Unable to connect to the server. Please check your internet connection and try again.'
              : 'We had trouble loading the data. This might be a temporary issue.'}
          </p>
        </div>

        {/* Troubleshooting Tips */}
        <div className="rounded-md bg-blue-50 p-4 text-left">
          <p className="mb-2 text-sm font-semibold text-blue-900">What you can try:</p>
          <ul className="space-y-1 text-sm text-blue-800">
            {isNetworkError ? (
              <>
                <li>• Check your internet connection</li>
                <li>• Disable VPN if you&apos;re using one</li>
                <li>• Try refreshing the page</li>
              </>
            ) : (
              <>
                <li>• Click &quot;Retry&quot; below</li>
                <li>• Refresh the page</li>
                <li>• Contact support if the problem persists</li>
              </>
            )}
          </ul>
        </div>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="rounded-md bg-gray-100 p-4 text-left">
            <p className="mb-2 text-sm font-semibold text-gray-700">Error Details (Development):</p>
            <p className="text-xs text-gray-600">{error.message}</p>
          </div>
        )}

        {/* Retry Button */}
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

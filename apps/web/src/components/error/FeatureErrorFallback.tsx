/**
 * @fileoverview Feature Error Fallback Component
 * 
 * Specialized fallback UI for feature-specific errors.
 * Provides contextual error messages based on the feature that failed.
 */

'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FeatureErrorFallbackProps {
  /** The error that was caught */
  error: Error
  /** Feature/domain name for context */
  feature: string
  /** Function to reset the error boundary */
  onReset?: () => void
}

/**
 * Fallback UI with feature-specific context and actions
 * 
 * Features:
 * - Feature-specific error messages
 * - Contextual recovery suggestions
 * - Navigation options (reset or go home)
 * - Development error details
 * 
 * @example
 * ```tsx
 * <FeatureErrorBoundary
 *   feature="UserProfile"
 *   fallback={(error, reset, feature) => (
 *     <FeatureErrorFallback error={error} feature={feature} onReset={reset} />
 *   )}
 * >
 *   <UserProfile />
 * </FeatureErrorBoundary>
 * ```
 */
export function FeatureErrorFallback({
  error,
  feature,
  onReset,
}: FeatureErrorFallbackProps): React.ReactElement {
  const router = useRouter()
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Feature-specific error messages
  const getFeatureMessage = (): string => {
    const lowerFeature = feature.toLowerCase()
    
    if (lowerFeature.includes('user') || lowerFeature.includes('profile')) {
      return 'We had trouble loading your profile. Your data is safe.'
    }
    if (lowerFeature.includes('organization') || lowerFeature.includes('org')) {
      return 'We had trouble loading organization data. Please try again.'
    }
    if (lowerFeature.includes('admin') || lowerFeature.includes('dashboard')) {
      return 'We had trouble loading the admin dashboard. Please try again.'
    }
    if (lowerFeature.includes('settings')) {
      return 'We had trouble loading settings. Your changes are still saved.'
    }
    
    return `We had trouble loading ${feature}. Please try again.`
  }

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
          <h2 className="text-2xl font-bold text-gray-900">{feature} Error</h2>
          <p className="text-gray-600">{getFeatureMessage()}</p>
        </div>

        {/* Feature Context */}
        <div className="rounded-md bg-blue-50 p-4 text-left">
          <p className="mb-2 text-sm font-semibold text-blue-900">What happened:</p>
          <p className="text-sm text-blue-800">
            The <span className="font-medium">{feature}</span> feature encountered an error. 
            This is isolated to this feature - other parts of the application are still working.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="rounded-md bg-gray-100 p-4 text-left">
            <p className="mb-2 text-sm font-semibold text-gray-700">Error Details (Development):</p>
            <p className="mb-1 text-xs font-medium text-gray-600">Feature: {feature}</p>
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

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
          <button
            onClick={() => {
              router.push('/')
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

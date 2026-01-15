/**
 * @fileoverview Feature Error Boundary Component
 * 
 * Specialized error boundary for specific features/domains.
 * Provides feature-specific error handling, logging, and recovery strategies.
 */

'use client'

import React, { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { FeatureErrorFallback } from './FeatureErrorFallback'
import { logger } from '@repo/logger'

interface FeatureErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Feature/domain name for context (e.g., 'UserProfile', 'AdminDashboard') */
  feature: string
  /** Custom fallback UI */
  fallback?: (error: Error, reset: () => void, feature: string) => ReactNode
  /** Callback when feature error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo, feature: string) => void
  /** Optional additional context */
  metadata?: Record<string, unknown>
}

/**
 * Error boundary with feature-specific context and logging
 * 
 * Features:
 * - Feature/domain identification in logs
 * - Custom metadata for debugging
 * - Feature-specific error messages
 * - Structured error logging
 * 
 * @example User feature
 * ```tsx
 * <FeatureErrorBoundary
 *   feature="UserProfile"
 *   metadata={{ userId: user.id }}
 * >
 *   <UserProfile />
 * </FeatureErrorBoundary>
 * ```
 * 
 * @example Admin feature with custom error handler
 * ```tsx
 * <FeatureErrorBoundary
 *   feature="AdminDashboard"
 *   metadata={{ adminId: admin.id, section: 'users' }}
 *   onError={(error, info, feature) => {
 *     trackError(`admin.${feature}`, error)
 *     notifyAdmins(error)
 *   }}
 * >
 *   <AdminUserManagement />
 * </FeatureErrorBoundary>
 * ```
 * 
 * @example Organization feature
 * ```tsx
 * <FeatureErrorBoundary
 *   feature="OrganizationSettings"
 *   metadata={{ orgId: org.id }}
 *   fallback={(error, reset, feature) => (
 *     <CustomOrgError error={error} feature={feature} onReset={reset} />
 *   )}
 * >
 *   <OrgSettings />
 * </FeatureErrorBoundary>
 * ```
 */
export function FeatureErrorBoundary({
  children,
  feature,
  fallback,
  onError,
  metadata = {},
}: FeatureErrorBoundaryProps): ReactNode {
  const handleError = (error: Error, errorInfo: React.ErrorInfo): void => {
    // Structured logging with feature context
    logger.error(error, {
      boundary: 'FeatureErrorBoundary',
      feature,
      componentStack: errorInfo.componentStack,
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      ...metadata,
    })

    // Call custom error handler with feature context
    onError?.(error, errorInfo, feature)
  }

  return (
    <ErrorBoundary
      context={`Feature: ${feature}`}
      onError={handleError}
      fallback={(error, reset) => {
        // Custom fallback with feature context
        if (fallback) {
          return fallback(error, reset, feature)
        }

        // Default feature error fallback
        return <FeatureErrorFallback error={error} feature={feature} onReset={reset} />
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * @fileoverview Error Boundary Components Exports
 * 
 * Centralized exports for all error boundary components and fallbacks.
 */

// Error Boundaries
export { ErrorBoundary } from './ErrorBoundary'
export { QueryErrorBoundary } from './QueryErrorBoundary'
export { FeatureErrorBoundary } from './FeatureErrorBoundary'

// Fallback Components
export { DefaultErrorFallback } from './DefaultErrorFallback'
export { QueryErrorFallback } from './QueryErrorFallback'
export { FeatureErrorFallback } from './FeatureErrorFallback'

/**
 * @example Basic error boundary
 * ```tsx
 * import { ErrorBoundary, DefaultErrorFallback } from '@/components/error'
 * 
 * <ErrorBoundary fallback={(error, reset) => <DefaultErrorFallback error={error} onReset={reset} />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @example Query error boundary
 * ```tsx
 * import { QueryErrorBoundary } from '@/components/error'
 * 
 * <QueryErrorBoundary context="UserDashboard">
 *   <UserDashboard />
 * </QueryErrorBoundary>
 * ```
 * 
 * @example Feature error boundary
 * ```tsx
 * import { FeatureErrorBoundary } from '@/components/error'
 * 
 * <FeatureErrorBoundary
 *   feature="UserProfile"
 *   metadata={{ userId: user.id }}
 * >
 *   <UserProfile />
 * </FeatureErrorBoundary>
 * ```
 */

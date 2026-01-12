/**
 * Page Performance Timing Utilities
 * 
 * Utilities for measuring and logging page load times.
 * Helps identify slow pages and performance bottlenecks.
 * 
 * Usage:
 * - Server: Use `serverTiming` to wrap async operations
 * - Client: Use `<PageTimingLogger />` component
 * - Both: Use `<TimingProvider>` in layouts
 */

// ============================================================================
// Server-Side Timing
// ============================================================================

/**
 * Measure the execution time of an async operation on the server
 */
export async function serverTiming<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - start
    
    console.log(
      `⏱️  [Server] ${label}: ${duration.toFixed(2)}ms`
    )
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(
      `⏱️  [Server] ${label}: FAILED after ${duration.toFixed(2)}ms`
    )
    throw error
  }
}

/**
 * Create a timing context for a page/layout
 * Logs total server render time
 */
export function createPageTimer(pageName: string) {
  const start = performance.now()
  
  return {
    /**
     * Mark an intermediate step
     */
    mark(label: string) {
      const elapsed = performance.now() - start
      console.log(
        `⏱️  [${pageName}] ${label}: +${elapsed.toFixed(2)}ms`
      )
    },
    
    /**
     * End timing and log total duration
     */
    end() {
      const duration = performance.now() - start
      const icon = duration > 1000 ? '🐢' : duration > 500 ? '⚠️' : '✅'
      console.log(
        `${icon} [${pageName}] Total server time: ${duration.toFixed(2)}ms`
      )
      return duration
    }
  }
}

/**
 * Higher-order function to wrap a page component with timing
 */
export function withServerTiming<P extends Record<string, unknown>>(
  pageName: string,
  PageComponent: (props: P) => Promise<React.ReactNode> | React.ReactNode
) {
  return async function TimedPage(props: P) {
    const timer = createPageTimer(pageName)
    const result = await PageComponent(props)
    timer.end()
    return result
  }
}

// ============================================================================
// Timing Logger Component (for marking render complete)
// ============================================================================

/**
 * Props for timing components
 */
export interface TimingProps {
  pageName: string
  /** Optional metadata to include in logs */
  meta?: Record<string, string | number | boolean>
}

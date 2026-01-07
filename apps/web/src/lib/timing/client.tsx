'use client'

/**
 * Client-Side Page Timing Components
 * 
 * Components that measure and log client-side performance metrics:
 * - Hydration time
 * - Time to interactive
 * - Navigation timing
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// ============================================================================
// Types
// ============================================================================

interface TimingEntry {
  pageName: string
  pathname: string
  timestamp: number
  hydrationTime?: number
  navigationTime?: number
  meta?: Record<string, string | number | boolean>
}

// ============================================================================
// Timing Store (in-memory for dev)
// ============================================================================

const timingHistory: TimingEntry[] = []
const MAX_HISTORY = 50

function addTimingEntry(entry: TimingEntry) {
  timingHistory.push(entry)
  if (timingHistory.length > MAX_HISTORY) {
    timingHistory.shift()
  }
}

/**
 * Get timing history for debugging
 */
export function getTimingHistory(): TimingEntry[] {
  return [...timingHistory]
}

/**
 * Clear timing history
 */
export function clearTimingHistory(): void {
  timingHistory.length = 0
}

// ============================================================================
// Performance Logging
// ============================================================================

function formatDuration(ms: number): string {
  if (ms < 100) return `${ms.toFixed(0)}ms`
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function getPerformanceIcon(ms: number): string {
  if (ms < 100) return '🚀'
  if (ms < 300) return '✅'
  if (ms < 500) return '⚡'
  if (ms < 1000) return '⚠️'
  return '🐢'
}

function logTiming(
  type: 'hydration' | 'navigation' | 'render',
  pageName: string,
  duration: number,
  meta?: Record<string, string | number | boolean>
) {
  const icon = getPerformanceIcon(duration)
  const metaStr = meta 
    ? ` | ${Object.entries(meta).map(([k, v]) => `${k}=${String(v)}`).join(', ')}`
    : ''
  
  console.log(
    `${icon} [Client/${type}] ${pageName}: ${formatDuration(duration)}${metaStr}`
  )
}

// ============================================================================
// Timing Components
// ============================================================================

interface PageTimingLoggerProps {
  /** Name of the page for logging */
  pageName: string
  /** Optional metadata to include in logs */
  meta?: Record<string, string | number | boolean>
}

/**
 * Component that logs timing when mounted (hydration complete)
 * Place this at the end of your page component
 */
export function PageTimingLogger({ pageName, meta }: PageTimingLoggerProps) {
  const pathname = usePathname()
  const mountTimeRef = useRef<number | null>(null)
  const hasLoggedRef = useRef(false)

  // Initialize mount time in effect to avoid impure function during render
  useEffect(() => {
    mountTimeRef.current ??= performance.now()
  }, [])

  useEffect(() => {
    // Only log once per mount
    if (hasLoggedRef.current) return
    hasLoggedRef.current = true

    const mountTime = mountTimeRef.current ?? performance.now()
    const hydrationTime = performance.now() - mountTime
    
    // Try to get navigation timing if available
    let navigationTime: number | undefined
    const navEntries = performance.getEntriesByType('navigation')
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming
      navigationTime = navEntry.domContentLoadedEventEnd - navEntry.startTime
    }

    logTiming('hydration', pageName, hydrationTime, meta)
    
    if (navigationTime) {
      logTiming('navigation', pageName, navigationTime)
    }

    // Store timing entry
    addTimingEntry({
      pageName,
      pathname,
      timestamp: Date.now(),
      hydrationTime,
      navigationTime,
      meta,
    })
  }, [pageName, pathname, meta])

  return null
}

/**
 * Hook to measure component render time
 */
export function useRenderTiming(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef<number | null>(null)

  useEffect(() => {
    // Initialize on first effect
    if (lastRenderTime.current === null) {
      lastRenderTime.current = performance.now()
      return
    }
    
    renderCount.current++
    const renderTime = performance.now() - lastRenderTime.current
    
    if (renderCount.current > 0) {
      // Only log re-renders, not initial mount
      const icon = renderTime > 16 ? '⚠️' : '✅'
      console.log(
        `${icon} [Re-render] ${componentName}: ${formatDuration(renderTime)} (render #${String(renderCount.current)})`
      )
    }
    
    lastRenderTime.current = performance.now()
  })
}

/**
 * Hook to track route changes and their timing
 */
export function useNavigationTiming() {
  const pathname = usePathname()
  const navigationStartRef = useRef<number | null>(null)
  const lastPathnameRef = useRef<string>(pathname)

  useEffect(() => {
    // Initialize on first effect
    navigationStartRef.current ??= performance.now()
    
    if (lastPathnameRef.current !== pathname) {
      const navigationTime = performance.now() - navigationStartRef.current
      
      logTiming(
        'navigation',
        `${lastPathnameRef.current} → ${pathname}`,
        navigationTime
      )
      
      lastPathnameRef.current = pathname
    }
    
    navigationStartRef.current = performance.now()
  }, [pathname])
}

/**
 * Provider component that tracks all navigation timing
 * Place this in your root layout
 */
export function NavigationTimingProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useNavigationTiming()
  return <>{children}</>
}

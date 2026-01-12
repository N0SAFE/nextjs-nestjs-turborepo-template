/**
 * Performance Timing Library
 * Tracks page render times for development debugging
 */

'use client'

import { useEffect } from 'react'

export interface TimingEntry {
  id: string
  name: string
  pageName: string
  duration: number
  timestamp: number
  metadata?: Record<string, unknown>
}

// In-memory storage for timing history
const timingHistory: TimingEntry[] = []
const MAX_HISTORY_SIZE = 100

/**
 * Add a timing entry to the history
 */
export function addTimingEntry(entry: Omit<TimingEntry, 'id' | 'timestamp'>): TimingEntry {
  const newEntry: TimingEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  
  timingHistory.push(newEntry)
  
  // Keep history size manageable
  if (timingHistory.length > MAX_HISTORY_SIZE) {
    timingHistory.shift()
  }
  
  return newEntry
}

/**
 * Get all timing entries
 */
export function getTimingHistory(): TimingEntry[] {
  return [...timingHistory]
}

/**
 * Clear all timing history
 */
export function clearTimingHistory(): void {
  timingHistory.length = 0
}

/**
 * Get statistics for timing entries
 */
export function getTimingStats() {
  if (timingHistory.length === 0) {
    return {
      count: 0,
      avg: 0,
      min: 0,
      max: 0,
      total: 0,
    }
  }
  
  const durations = timingHistory.map(e => e.duration)
  const total = durations.reduce((sum, d) => sum + d, 0)
  
  return {
    count: timingHistory.length,
    avg: total / timingHistory.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    total,
  }
}

// Navigation Timing Hook (simplified non-JSX version)
let globalStartTime: number | null = null

export function setNavigationStartTime(time: number): void {
  globalStartTime = time
}

export function getNavigationStartTime(): number | null {
  return globalStartTime
}

// Page Timing Logger Hook
export function usePageTiming(pageName: string): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const endTime = performance.now()
    const startTime = globalStartTime
    const duration = startTime ? endTime - startTime : 0
    
    if (duration > 0) {
      addTimingEntry({
        name: 'page-render',
        pageName,
        duration,
        metadata: { 
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        },
      })
    }
    
    // Reset for next navigation
    globalStartTime = performance.now()
  }, [pageName])
}

// Page Timing Logger Component (for JSX usage)
interface PageTimingLoggerProps {
  pageName: string
}

export function PageTimingLogger({ pageName }: PageTimingLoggerProps) {
  usePageTiming(pageName)
  return null
}

/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import React, { useState, useEffect } from 'react'
import { getTimingHistory, clearTimingHistory, type TimingEntry } from '@/lib/timing'
import { Button } from '@repo/ui/components/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/shadcn/card'
import { X, Trash2, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

function getPerformanceColor(duration: number): string {
  if (duration < 100) return 'text-green-500'
  if (duration < 300) return 'text-emerald-500'
  if (duration < 500) return 'text-yellow-500'
  if (duration < 1000) return 'text-orange-500'
  return 'text-red-500'
}

function getPerformanceBg(duration: number): string {
  if (duration < 100) return 'bg-green-500/10'
  if (duration < 300) return 'bg-emerald-500/10'
  if (duration < 500) return 'bg-yellow-500/10'
  if (duration < 1000) return 'bg-orange-500/10'
  return 'bg-red-500/10'
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${String(Math.round(ms))}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

interface PerformancePanelProps {
  /** Whether the panel is open */
  isOpen?: boolean
  /** Callback when panel is closed */
  onClose?: () => void
}

/**
 * Performance Panel - Shows timing history for all tracked pages
 * 
 * Only renders in development mode.
 * Shows page render times with color-coded performance indicators.
 */
export function PerformancePanel({ isOpen = true, onClose }: PerformancePanelProps) {
  const [history, setHistory] = useState<TimingEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isOpen) return

    // Initial load
    setHistory(getTimingHistory())

    // Poll for updates
    const interval = setInterval(() => {
      setHistory(getTimingHistory())
    }, 1000)

    return () => { clearInterval(interval); }
  }, [mounted, isOpen])

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !mounted || !isOpen) {
    return null
  }

  const handleClear = () => {
    clearTimingHistory()
    setHistory([])
  }

  // Calculate stats
  const avgDuration = history.length > 0
    ? history.reduce((sum, entry) => sum + entry.duration, 0) / history.length
    : 0
  
  const slowestPage = history.length > 0
    ? history.reduce((max, entry) => entry.duration > (max?.duration ?? 0) ? entry : max, history[0])
    : null

  const fastestPage = history.length > 0
    ? history.reduce((min, entry) => entry.duration < (min?.duration ?? Infinity) ? entry : min, history[0])
    : null

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Performance</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Page render timing logs (dev only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted rounded-lg p-2 text-center">
              <div className="text-muted-foreground">Average</div>
              <div className={`font-mono font-semibold ${getPerformanceColor(avgDuration)}`}>
                {formatDuration(avgDuration)}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-2 text-center">
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Fastest
              </div>
              <div className="font-mono font-semibold text-green-500">
                {fastestPage ? formatDuration(fastestPage.duration) : '-'}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-2 text-center">
              <div className="text-muted-foreground flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Slowest
              </div>
              <div className="font-mono font-semibold text-red-500">
                {slowestPage ? formatDuration(slowestPage.duration) : '-'}
              </div>
            </div>
          </div>
        )}

        {/* Timing List */}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No timing data yet. Navigate between pages to see performance metrics.
            </p>
          ) : (
            history.slice().reverse().map((entry, index) => (
              <div
                key={`${entry.pageName}-${String(entry.timestamp)}-${String(index)}`}
                className={`flex items-center justify-between rounded-md px-3 py-2 ${getPerformanceBg(entry.duration)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{entry.pageName}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className={`font-mono text-sm font-semibold ${getPerformanceColor(entry.duration)}`}>
                  {formatDuration(entry.duration)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="border-t pt-3">
          <div className="text-muted-foreground mb-2 text-xs">Performance Legend:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-green-500">🚀 &lt;100ms</span>
            <span className="text-emerald-500">✅ &lt;300ms</span>
            <span className="text-yellow-500">⚡ &lt;500ms</span>
            <span className="text-orange-500">⚠️ &lt;1s</span>
            <span className="text-red-500">🐢 &gt;1s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Performance Toggle Button - Shows a floating button to open the performance panel
 */
export function PerformanceToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !mounted) {
    return null
  }

  if (isOpen) {
    return <PerformancePanel isOpen={isOpen} onClose={() => { setIsOpen(false); }} />
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
      onClick={() => { setIsOpen(true); }}
      title="Open Performance Panel"
    >
      <Clock className="h-5 w-5" />
    </Button>
  )
}

export default PerformancePanel

/**
 * DevToolContainer - Main Container with Reduced/Expanded Mode Management
 * 
 * Provides the main container that manages both reduced and expanded modes
 * of the DevTool interface with positioning and state management.
 */

'use client'

import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { DevToolReducedBar } from './DevToolReducedBar'
import { DevToolExpandedPanel } from './DevToolExpandedPanel'
import { useDevTool } from './DevToolProvider'
import type { DevToolMode, DevToolPosition } from '../types'

/**
 * DevTool Container Props
 */
interface DevToolContainerProps {
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly defaultMode?: DevToolMode
  readonly defaultPosition?: DevToolPosition
  readonly enableKeyboardShortcuts?: boolean
}

/**
 * Default position configuration
 */
const defaultPosition: DevToolPosition = {
  side: 'bottom',
  size: 4, // 4rem for reduced mode
  offset: { x: 0, y: 0 }
}

/**
 * Main DevTool Container Component
 */
export const DevToolContainer = ({
  className = '',
  style = {},
  defaultMode = 'none',
  defaultPosition = defaultPosition,
  enableKeyboardShortcuts = true,
}: DevToolContainerProps) => {
  const { initialized } = useDevTool()
  
  const [mode, setMode] = useState<DevToolMode>(defaultMode)
  const [position, setPosition] = useState<DevToolPosition>(defaultPosition)
  const [isVisible, setIsVisible] = useState(false)

  // Toggle between modes
  const toggleMode = useCallback(() => {
    setMode(current => {
      switch (current) {
        case 'none':
          return 'normal'
        case 'normal':
          return 'expanded'
        case 'expanded':
          return 'none'
        default:
          return 'normal'
      }
    })
  }, [])

  // Set specific mode
  const setSpecificMode = useCallback((newMode: DevToolMode) => {
    setMode(newMode)
  }, [])

  // Update position
  const updatePosition = useCallback((newPosition: Partial<DevToolPosition>) => {
    setPosition(current => ({
      ...current,
      ...newPosition,
    }))
  }, [])

  // Handle reduced mode to expanded mode transition
  const expandFromReduced = useCallback(() => {
    setMode('expanded')
  }, [])

  // Handle expanded mode to reduced mode transition
  const collapseToReduced = useCallback(() => {
    setMode('normal')
  }, [])

  // Handle complete close
  const close = useCallback(() => {
    setMode('none')
    setIsVisible(false)
  }, [])

  // Show DevTool
  const show = useCallback(() => {
    setIsVisible(true)
    if (mode === 'none') {
      setMode('normal')
    }
  }, [mode])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle DevTools
      if (event.key === 'D' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault()
        if (mode === 'none') {
          show()
        } else {
          toggleMode()
        }
      }

      // Escape to close DevTools
      if (event.key === 'Escape' && mode !== 'none') {
        event.preventDefault()
        close()
      }

      // Ctrl/Cmd + E to expand to sidebar mode
      if (event.key === 'E' && (event.ctrlKey || event.metaKey) && mode === 'normal') {
        event.preventDefault()
        expandFromReduced()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, mode, toggleMode, show, close, expandFromReduced])

  // Don't render if not initialized
  if (!initialized) {
    return null
  }

  // Render floating button when DevTool is not visible
  if (mode === 'none' || !isVisible) {
    return (
      <button
        onClick={show}
        className={`
          fixed bottom-4 left-4 p-3 bg-blue-600 text-white rounded-full 
          shadow-lg hover:bg-blue-700 z-50 transition-all duration-200
          hover:scale-110 active:scale-95 ${className}
        `}
        style={style}
        aria-label="Open DevTools"
        title="Open DevTools (Ctrl+Shift+D)"
      >
        🛠️
      </button>
    )
  }

  return (
    <>
      {/* Reduced Mode Bar */}
      {mode === 'normal' && (
        <DevToolReducedBar
          position={position}
          onExpand={expandFromReduced}
          onClose={close}
          onPositionChange={updatePosition}
        />
      )}

      {/* Expanded Mode Panel */}
      {mode === 'expanded' && (
        <DevToolExpandedPanel
          onCollapse={collapseToReduced}
          onClose={close}
        />
      )}
    </>
  )
}

/**
 * DevTool Floating Trigger Button
 * 
 * Alternative trigger button that can be placed anywhere
 */
export const DevToolTrigger = ({ 
  onToggle,
  className = '',
  children = '🛠️',
  ...props
}: {
  onToggle?: () => void
  className?: string
  children?: ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) => {
  const { initialized } = useDevTool()

  if (!initialized) {
    return null
  }

  return (
    <button
      onClick={onToggle}
      className={`
        p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 
        transition-all duration-200 hover:scale-105 active:scale-95 ${className}
      `}
      aria-label="Toggle DevTools"
      {...props}
    >
      {children}
    </button>
  )
}

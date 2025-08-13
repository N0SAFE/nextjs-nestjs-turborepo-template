/**
 * DevToolProvider - Main Context Provider Component
 * 
 * Provides the DevTool context and initializes the plugin system.
 * This component should wrap the application to enable DevTool functionality.
 * 
 * Zero-Any Policy: Maintains complete type safety throughout initialization.
 */

'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { usePluginRegistry } from '../runtime/pluginRegistry'
import { corePlugins } from '../core/router'
import type { DevToolPlugin, DevToolSettings } from '../types'

/**
 * DevTool Context Interface
 */
interface DevToolContextType {
  readonly initialized: boolean
  readonly plugins: readonly DevToolPlugin[]
  readonly settings: DevToolSettings
}

/**
 * Default context value with type safety
 */
const defaultContextValue: DevToolContextType = {
  initialized: false,
  plugins: [],
  settings: {
    theme: 'system',
    keyboardShortcuts: true,
    notifications: true,
    autoCollapse: false,
    persistState: true,
    compactMode: false,
    customShortcuts: {},
    pluginSettings: {},
  },
} as const

/**
 * DevTool React Context
 */
const DevToolContext = createContext<DevToolContextType>(defaultContextValue)

/**
 * DevToolProvider Props
 */
interface DevToolProviderProps {
  readonly children: ReactNode
  readonly autoStart?: boolean
  readonly enableInProduction?: boolean
  readonly customPlugins?: readonly DevToolPlugin[]
}

/**
 * DevToolProvider Component
 * 
 * Initializes the plugin system and provides context to child components.
 * Only renders in development mode unless explicitly enabled for production.
 */
export const DevToolProvider = ({
  children,
  autoStart = false,
  enableInProduction = false,
  customPlugins = [],
}: DevToolProviderProps) => {
  const pluginRegistry = usePluginRegistry()

  // Only enable DevTools in development or when explicitly enabled
  const shouldEnable = process.env.NODE_ENV === 'development' || enableInProduction

  useEffect(() => {
    if (!shouldEnable) {
      return
    }

    // Initialize core plugins
    Object.values(corePlugins).forEach((plugin) => {
      pluginRegistry.register(plugin)
    })

    // Initialize custom plugins
    customPlugins.forEach((plugin) => {
      pluginRegistry.register(plugin)
    })

    // Auto-activate plugins if autoStart is enabled
    if (autoStart) {
      Object.values(corePlugins).forEach((plugin) => {
        pluginRegistry.activate(plugin.name)
      })
      
      customPlugins.forEach((plugin) => {
        pluginRegistry.activate(plugin.name)
      })
    }
  }, [shouldEnable, autoStart, customPlugins, pluginRegistry])

  // Don't render context if DevTools are disabled
  if (!shouldEnable) {
    return <>{children}</>
  }

  const contextValue: DevToolContextType = {
    initialized: true,
    plugins: [...Object.values(corePlugins), ...customPlugins],
    settings: {
      theme: 'system',
      keyboardShortcuts: true,
      notifications: true,
      autoCollapse: false,
      persistState: true,
      compactMode: false,
      customShortcuts: {},
      pluginSettings: {},
    },
  }

  return (
    <DevToolContext.Provider value={contextValue}>
      {children}
    </DevToolContext.Provider>
  )
}

/**
 * Hook to access DevTool context
 */
export const useDevTool = (): DevToolContextType => {
  const context = useContext(DevToolContext)
  
  if (!context.initialized) {
    throw new Error(
      'useDevTool must be used within a DevToolProvider. ' +
      'Make sure to wrap your app with <DevToolProvider>.'
    )
  }
  
  return context
}

/**
 * Hook to check if DevTools are enabled
 */
export const useDevToolEnabled = (): boolean => {
  try {
    const context = useContext(DevToolContext)
    return context.initialized
  } catch {
    return false
  }
}

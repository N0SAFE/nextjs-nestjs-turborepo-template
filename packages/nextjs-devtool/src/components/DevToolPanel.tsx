/**
 * DevToolPanel - Main Floating UI Panel Component
 * 
 * @deprecated Use DevToolContainer instead for the new reduced/expanded mode interface
 * 
 * Provides the main floating DevTool panel that displays active plugins
 * with a tabbed interface and plugin management functionality.
 * 
 * Zero-Any Policy: Maintains complete type safety throughout the UI.
 */

'use client'

import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { X, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { usePluginRegistry } from '../runtime/pluginRegistry'
import { useDevTool } from './DevToolProvider'
import type { DevToolPlugin, PluginComponentContext } from '../types'

/**
 * DevToolPanel Props
 */
interface DevToolPanelProps {
  readonly plugins?: readonly DevToolPlugin[]
  readonly className?: string
  readonly style?: React.CSSProperties
}

/**
 * Plugin Tab Component
 */
interface PluginTabProps {
  readonly plugin: DevToolPlugin
  readonly isActive: boolean
  readonly onClick: () => void
  readonly onClose: () => void
}

const PluginTab = ({ plugin, isActive, onClick, onClose }: PluginTabProps) => {
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }, [onClose])

  return (
    <div
      className={`
        flex items-center px-3 py-2 text-sm font-medium cursor-pointer
        border-b-2 transition-colors
        ${isActive 
          ? 'border-blue-500 bg-blue-50 text-blue-700' 
          : 'border-transparent hover:bg-gray-50 text-gray-600'
        }
      `}
      onClick={onClick}
    >
      {plugin.meta?.icon && (
        <span className="mr-2">{plugin.meta.icon}</span>
      )}
      <span>{plugin.meta?.displayName || plugin.name}</span>
      <button
        className="ml-2 p-1 rounded hover:bg-gray-200"
        onClick={handleClose}
        aria-label={`Close ${plugin.meta?.displayName || plugin.name}`}
      >
        <X size={12} />
      </button>
    </div>
  )
}

/**
 * Panel Header Component
 */
interface PanelHeaderProps {
  readonly isCollapsed: boolean
  readonly onToggleCollapse: () => void
  readonly onClose: () => void
  readonly onOpenSettings: () => void
}

const PanelHeader = ({ 
  isCollapsed, 
  onToggleCollapse, 
  onClose, 
  onOpenSettings 
}: PanelHeaderProps) => (
  <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
    <div className="flex items-center">
      <button
        onClick={onToggleCollapse}
        className="p-1 rounded hover:bg-gray-200"
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <span className="ml-2 text-sm font-medium text-gray-700">
        DevTools
      </span>
    </div>
    <div className="flex items-center gap-1">
      <button
        onClick={onOpenSettings}
        className="p-1 rounded hover:bg-gray-200"
        aria-label="Open settings"
      >
        <Settings size={16} />
      </button>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-gray-200"
        aria-label="Close DevTools"
      >
        <X size={16} />
      </button>
    </div>
  </div>
)

/**
 * Plugin Content Component
 */
interface PluginContentProps {
  readonly plugin: DevToolPlugin
  readonly context: PluginComponentContext
}

const PluginContent = ({ plugin, context }: PluginContentProps) => {
  const [PluginComponent, setPluginComponent] = useState<React.ComponentType<{ context: PluginComponentContext }> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if plugin has a main component
        if (plugin.kind === 'core' && plugin.exports?.components?.DevToolPanel) {
          const component = await plugin.exports.components.DevToolPanel()
          setPluginComponent(() => component)
        } else if (plugin.kind === 'module' && plugin.exports?.components?.DevToolPanel) {
          const component = await plugin.exports.components.DevToolPanel()
          setPluginComponent(() => component)
        } else {
          // Fallback: render plugin info
          setPluginComponent(() => ({ context }: { context: PluginComponentContext }) => (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">{plugin.meta?.displayName || plugin.name}</h3>
              <p className="text-gray-600 mb-4">{plugin.meta?.description || 'No description available'}</p>
              <div className="text-sm text-gray-500">
                <p><strong>Name:</strong> {plugin.name}</p>
                <p><strong>Version:</strong> {plugin.version}</p>
                <p><strong>Kind:</strong> {plugin.kind}</p>
              </div>
            </div>
          ))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plugin component')
      } finally {
        setLoading(false)
      }
    }

    loadComponent()
  }, [plugin])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading {plugin.meta?.displayName || plugin.name}...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-red-800 font-medium mb-2">Plugin Error</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!PluginComponent) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">No component available for this plugin</p>
      </div>
    )
  }

  return <PluginComponent context={context} />
}

/**
 * Main DevToolPanel Component
 */
export const DevToolPanel = ({ 
  plugins: customPlugins = [], 
  className = '',
  style = {} 
}: DevToolPanelProps) => {
  // Deprecation warning
  useEffect(() => {
    console.warn(
      '⚠️ DevToolPanel is deprecated. Use DevToolContainer instead for the new reduced/expanded mode interface.\n' +
      'Migration: Replace <DevToolPanel /> with <DevToolContainer />'
    )
  }, [])

  const { initialized, plugins: corePlugins } = useDevTool()
  const pluginRegistry = usePluginRegistry()
  
  const [activePluginId, setActivePluginId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Combine core plugins with custom plugins
  const allPlugins = [...corePlugins, ...customPlugins]
  const activePlugins = allPlugins.filter(plugin => 
    pluginRegistry.activePlugins.has(plugin.name)
  )

  // Get the currently active plugin
  const activePlugin = activePluginId 
    ? allPlugins.find(p => p.name === activePluginId) 
    : activePlugins[0]

  // Don't render if not initialized or no active plugins
  if (!initialized || activePlugins.length === 0) {
    return null
  }

  // Ensure we have an active plugin selected
  if (!activePluginId && activePlugins.length > 0) {
    setActivePluginId(activePlugins[0]?.name ?? null)
  }

  const handlePluginSelect = useCallback((pluginId: string) => {
    setActivePluginId(pluginId)
  }, [])

  const handlePluginClose = useCallback((pluginId: string) => {
    pluginRegistry.deactivate(pluginId)
    if (activePluginId === pluginId) {
      // Switch to another active plugin or close
      const remainingPlugins = activePlugins.filter(p => p.name !== pluginId)
      setActivePluginId(remainingPlugins.length > 0 ? remainingPlugins[0]?.name ?? null : null)
    }
  }, [activePluginId, activePlugins, pluginRegistry])

  const handleClose = useCallback(() => {
    // Deactivate all plugins
    activePlugins.forEach(plugin => {
      pluginRegistry.deactivate(plugin.name)
    })
    setActivePluginId(null)
  }, [activePlugins, pluginRegistry])

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  // Create plugin context
  const pluginContext: PluginComponentContext = {
    pluginId: activePlugin?.name ?? '',
    isActive: true,
    isCollapsed,
    onClose: () => handlePluginClose(activePlugin?.name ?? ''),
    onNavigate: (pageId: string) => {
      // Handle navigation if plugin supports pages
      console.log('Navigate to page:', pageId)
    },
    settings: {},
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 w-96 max-w-[90vw] bg-white border border-gray-300 
        rounded-lg shadow-lg z-50 ${className}
      `}
      style={style}
    >
      <PanelHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onClose={handleClose}
        onOpenSettings={handleOpenSettings}
      />
      
      {!isCollapsed && (
        <>
          {/* Plugin Tabs */}
          {activePlugins.length > 1 && (
            <div className="flex border-b bg-gray-50 overflow-x-auto">
              {activePlugins.map(plugin => (
                <PluginTab
                  key={plugin.name}
                  plugin={plugin}
                  isActive={activePluginId === plugin.name}
                  onClick={() => handlePluginSelect(plugin.name)}
                  onClose={() => handlePluginClose(plugin.name)}
                />
              ))}
            </div>
          )}
          
          {/* Plugin Content */}
          <div className="max-h-96 overflow-y-auto">
            {activePlugin ? (
              <PluginContent
                plugin={activePlugin}
                context={pluginContext}
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                No active plugins
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Floating DevTool Button Component
 * 
 * @deprecated Use DevToolContainer instead for the new reduced/expanded mode interface
 * 
 * Provides a floating button to toggle the DevTool panel
 */
export const DevToolFloatingButton = () => {
  // Deprecation warning
  useEffect(() => {
    console.warn(
      '⚠️ DevToolFloatingButton is deprecated. Use DevToolContainer instead for the new reduced/expanded mode interface.\n' +
      'Migration: Replace <DevToolFloatingButton /> with <DevToolContainer />'
    )
  }, [])

  const { initialized } = useDevTool()
  const pluginRegistry = usePluginRegistry()
  const [isVisible, setIsVisible] = useState(false)

  const hasActivePlugins = pluginRegistry.activePlugins.size > 0

  if (!initialized) {
    return null
  }

  const handleToggle = () => {
    if (hasActivePlugins) {
      setIsVisible(prev => !prev)
    } else {
      // Activate a default plugin (routes)
      pluginRegistry.activate('core.routes')
      setIsVisible(true)
    }
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-4 left-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-40"
        aria-label="Toggle DevTools"
      >
        🛠️
      </button>
      {isVisible && hasActivePlugins && <DevToolPanel />}
    </>
  )
}

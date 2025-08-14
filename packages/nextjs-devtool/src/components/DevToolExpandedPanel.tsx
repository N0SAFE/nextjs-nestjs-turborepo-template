/**
 * DevToolExpandedPanel - Expanded Mode with Sidebar
 * 
 * Provides an expanded panel interface with a shadcn sidebar for plugin navigation
 * positioned at the bottom center of the screen.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Settings, ChevronDown, ChevronUp, Home, Layers, Monitor, Zap } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Separator } from '@repo/ui/components/shadcn/separator'
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarProvider,
  useSidebar,
} from '@repo/ui/components/shadcn/sidebar'
import { usePluginRegistry } from '../runtime/pluginRegistry'
import { useDevTool } from './DevToolProvider'
import type { DevToolPlugin, PluginComponentContext } from '../types'

/**
 * Expanded Panel Props
 */
interface DevToolExpandedPanelProps {
  readonly onCollapse: () => void
  readonly onClose: () => void
}

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
          setPluginComponent(() => ({ context: ctx }) => (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {plugin.meta?.icon && (
                  <span className="text-2xl">{plugin.meta.icon}</span>
                )}
                <h2 className="text-xl font-semibold">{plugin.meta?.displayName || plugin.name}</h2>
              </div>
              <p className="text-gray-600 mb-6">{plugin.meta?.description || 'DevTool Plugin'}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Plugin Name</p>
                  <p className="text-gray-600">{plugin.name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Version</p>
                  <p className="text-gray-600">{plugin.version}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Namespace</p>
                  <p className="text-gray-600">{plugin.namespace}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Type</p>
                  <p className="text-gray-600 capitalize">{plugin.kind}</p>
                </div>
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
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Loading {plugin.meta?.displayName || plugin.name}...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg mx-6 my-4">
        <h3 className="text-red-800 font-medium mb-2 flex items-center gap-2">
          <X size={16} />
          Plugin Error
        </h3>
        <p className="text-red-600 text-sm">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    )
  }

  if (!PluginComponent) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mx-6 my-4">
        <p className="text-yellow-800">No component available for this plugin</p>
      </div>
    )
  }

  return <PluginComponent context={context} />
}

/**
 * Sidebar Navigation Component
 */
interface SidebarNavigationProps {
  readonly activePluginId: string | null
  readonly onPluginSelect: (pluginId: string) => void
  readonly onPluginClose: (pluginId: string) => void
}

const SidebarNavigation = ({ 
  activePluginId, 
  onPluginSelect, 
  onPluginClose 
}: SidebarNavigationProps) => {
  const { plugins } = useDevTool()
  const pluginRegistry = usePluginRegistry()

  // Separate core and module plugins
  const corePlugins = plugins.filter(plugin => plugin.kind === 'core')
  const modulePlugins = plugins.filter(plugin => plugin.kind === 'module')
  
  // Filter active plugins
  const activeCorePlugins = corePlugins.filter(plugin => 
    pluginRegistry.activePlugins.has(plugin.name)
  )
  const activeModulePlugins = modulePlugins.filter(plugin => 
    pluginRegistry.activePlugins.has(plugin.name)
  )

  const handlePluginToggle = useCallback((pluginId: string) => {
    if (pluginRegistry.activePlugins.has(pluginId)) {
      onPluginClose(pluginId)
    } else {
      pluginRegistry.activate(pluginId)
      onPluginSelect(pluginId)
    }
  }, [pluginRegistry, onPluginSelect, onPluginClose])

  // Get icon for plugin type
  const getPluginIcon = (plugin: DevToolPlugin) => {
    if (plugin.meta?.icon) return plugin.meta.icon
    
    // Default icons based on plugin name/type
    if (plugin.name.includes('route')) return <Monitor size={16} />
    if (plugin.name.includes('performance')) return <Zap size={16} />
    if (plugin.name.includes('layer')) return <Layers size={16} />
    return <Home size={16} />
  }

  return (
    <SidebarContent>
      {/* Core Plugins */}
      {activeCorePlugins.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Core Plugins</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeCorePlugins.map(plugin => (
                <SidebarMenuItem key={plugin.name}>
                  <SidebarMenuButton
                    isActive={activePluginId === plugin.name}
                    onClick={() => onPluginSelect(plugin.name)}
                    className="flex items-center gap-2"
                  >
                    {getPluginIcon(plugin)}
                    <span>{plugin.meta?.displayName || plugin.name}</span>
                    <SidebarMenuBadge>•</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Module Plugins */}
      {activeModulePlugins.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Module Plugins</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeModulePlugins.map(plugin => (
                <SidebarMenuItem key={plugin.name}>
                  <SidebarMenuButton
                    isActive={activePluginId === plugin.name}
                    onClick={() => onPluginSelect(plugin.name)}
                    className="flex items-center gap-2"
                  >
                    {getPluginIcon(plugin)}
                    <span>{plugin.meta?.displayName || plugin.name}</span>
                    <SidebarMenuBadge>•</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Available Plugins */}
      <SidebarGroup>
        <SidebarGroupLabel>Available Plugins</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {plugins
              .filter(plugin => !pluginRegistry.activePlugins.has(plugin.name))
              .map(plugin => (
                <SidebarMenuItem key={plugin.name}>
                  <SidebarMenuButton
                    onClick={() => handlePluginToggle(plugin.name)}
                    className="flex items-center gap-2 opacity-60 hover:opacity-100"
                  >
                    {getPluginIcon(plugin)}
                    <span>{plugin.meta?.displayName || plugin.name}</span>
                    <Badge variant="secondary" className="text-xs">Add</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}

/**
 * Main Expanded Panel Component
 */
export const DevToolExpandedPanel = ({
  onCollapse,
  onClose,
}: DevToolExpandedPanelProps) => {
  const { plugins } = useDevTool()
  const pluginRegistry = usePluginRegistry()
  
  const [activePluginId, setActivePluginId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Get active plugins
  const activePlugins = plugins.filter(plugin => 
    pluginRegistry.activePlugins.has(plugin.name)
  )

  // Get the currently active plugin
  const activePlugin = activePluginId 
    ? plugins.find(p => p.name === activePluginId) 
    : activePlugins[0]

  // Ensure we have an active plugin selected
  useEffect(() => {
    if (!activePluginId && activePlugins.length > 0) {
      setActivePluginId(activePlugins[0]?.name ?? null)
    }
  }, [activePluginId, activePlugins])

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

  // Create plugin context
  const pluginContext: PluginComponentContext = {
    pluginId: activePlugin?.name ?? '',
    isActive: true,
    isCollapsed: !sidebarOpen,
    onClose: () => handlePluginClose(activePlugin?.name ?? ''),
    onNavigate: (pageId: string) => {
      // Handle navigation if plugin supports pages
      console.log('Navigate to page:', pageId)
    },
    settings: {},
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90vw] max-w-6xl">
      {/* Nuxt-style Card Container */}
      <div className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-95">
        <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="flex h-[32rem] max-h-[80vh]">
            {/* Sidebar */}
            <Sidebar side="left" variant="inset" className="border-r min-w-64 max-w-80">
              <SidebarHeader className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h2 className="font-semibold text-base">DevTool Plugins</h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                      {sidebarOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </Button>
                  </div>
                </div>
              </SidebarHeader>

              <SidebarNavigation
                activePluginId={activePluginId}
                onPluginSelect={handlePluginSelect}
                onPluginClose={handlePluginClose}
              />

              <SidebarFooter className="border-t p-3">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={onCollapse} className="text-xs">
                    <ChevronDown size={14} />
                    <span className="ml-1">Minimize</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-red-600 hover:text-red-700">
                    <X size={14} />
                    <span className="ml-1">Close</span>
                  </Button>
                </div>
              </SidebarFooter>
            </Sidebar>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="border-b px-4 py-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activePlugin && (
                      <>
                        {activePlugin.meta.icon && (
                          <span className="text-xl">{activePlugin.meta.icon}</span>
                        )}
                        <div>
                          <h3 className="font-semibold text-base">{activePlugin.meta?.displayName || activePlugin.name}</h3>
                          <p className="text-xs text-muted-foreground">{activePlugin.meta?.description || 'DevTool Plugin'}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Settings size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onCollapse} className="h-7 w-7 p-0">
                      <ChevronDown size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-red-600 hover:text-red-700">
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Plugin Content */}
              <div className="flex-1 overflow-y-auto">
                {activePlugin ? (
                  <PluginContent
                    plugin={activePlugin}
                    context={pluginContext}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <Layers size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Active Plugins</p>
                      <p className="text-sm">
                        Activate a plugin from the sidebar to get started
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  )
}
